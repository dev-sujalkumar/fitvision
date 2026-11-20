"""
FitVision AI - VLM Food Inference Engine (Gemini Vision)
Primary engine: Google Gemini Vision API (multimodal VLM)
Fallback engine: Vision Transformer nateraw/food (offline cached)
Ultra-fallback: EfficientNet-B2 PyTorch checkpoint
"""

import os
import sys
import io
import json
import re
import base64
import difflib
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional

from PIL import Image
import numpy as np

# ── Path setup ────────────────────────────────────────────────────────────────
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from nutrition_db import FOOD101_CLASSES, get_nutrition_for_class

# ── Gemini SDK (optional) ──────────────────────────────────────────────────────
try:
    import google.generativeai as genai
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False

# ── PyTorch / Transformers (optional, for fallback) ────────────────────────────
try:
    import torch
    import torch.nn.functional as F
    import torchvision.transforms.v2 as T
    _TORCH_AVAILABLE = True
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
except ImportError:
    _TORCH_AVAILABLE = False
    DEVICE = "cpu"

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

# ── Food-101 class list as a compact string for the prompt ─────────────────────
_FOOD101_SLUG = ", ".join(FOOD101_CLASSES)

GEMINI_SYSTEM_PROMPT = f"""You are a professional food recognition and nutrition expert AI.
Analyze the food image provided and return ONLY valid JSON — no markdown, no explanation text, just the raw JSON object.

Food categories available (Food-101 dataset slugs):
{_FOOD101_SLUG}

Return exactly this JSON schema:
{{
  "primary_food": "<best matching Food-101 slug from the list above>",
  "display_name": "<human readable dish name, e.g. Chocolate Ice Cream>",
  "confidence": <float 0.0-1.0>,
  "explanation": "<one sentence: what you see, key visual features>",
  "top_predictions": [
    {{"food": "<Food-101 slug>", "name": "<human name>", "confidence": <float>}},
    {{"food": "<Food-101 slug>", "name": "<human name>", "confidence": <float>}},
    {{"food": "<Food-101 slug>", "name": "<human name>", "confidence": <float>}}
  ]
}}

Rules:
- primary_food MUST be one of the Food-101 slugs listed above.
- confidence must be between 0.0 and 1.0.
- top_predictions must have 3-5 entries ordered by decreasing confidence.
- If the image is not food, set primary_food to the closest edible item or "ice_cream" as fallback.
- Never include any text outside the JSON object.
"""


# ══════════════════════════════════════════════════════════════════════════════
# Utility helpers
# ══════════════════════════════════════════════════════════════════════════════

def _load_pil(image_input) -> Image.Image:
    """Accept filepath / base64-data-URL / raw-base64 / bytes / PIL → RGB PIL."""
    if isinstance(image_input, Image.Image):
        return image_input.convert("RGB")
    if isinstance(image_input, bytes):
        return Image.open(io.BytesIO(image_input)).convert("RGB")
    if isinstance(image_input, str):
        if image_input.startswith("data:image"):
            b64 = image_input.split(",", 1)[1]
            return Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
        if os.path.exists(image_input):
            return Image.open(image_input).convert("RGB")
        return Image.open(io.BytesIO(base64.b64decode(image_input))).convert("RGB")
    raise ValueError(f"Unsupported image input type: {type(image_input)}")


def _fuzzy_match_food101(name: str) -> str:
    """Find the best Food-101 slug matching a free-form food name."""
    name_lower = name.lower().replace(" ", "_").replace("-", "_")
    # Exact match first
    if name_lower in FOOD101_CLASSES:
        return name_lower
    # Substring match
    for cls in FOOD101_CLASSES:
        if cls in name_lower or name_lower in cls:
            return cls
    # Difflib fuzzy
    matches = difflib.get_close_matches(name_lower, FOOD101_CLASSES, n=1, cutoff=0.4)
    return matches[0] if matches else "ice_cream"


def _extract_json(text: str) -> dict:
    """Strip markdown fences and parse JSON from VLM response text."""
    text = text.strip()
    # Remove ```json ... ``` fences
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    # Find the first {...} block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)


def _pil_to_jpeg_bytes(pil_img: Image.Image, quality: int = 85) -> bytes:
    buf = io.BytesIO()
    pil_img.convert("RGB").save(buf, format="JPEG", quality=quality)
    return buf.getvalue()


# ══════════════════════════════════════════════════════════════════════════════
# Gemini VLM Engine
# ══════════════════════════════════════════════════════════════════════════════

class GeminiVLMEngine:
    """Primary food analysis engine using Google Gemini Vision."""

    def __init__(self):
        self.ready = False
        self.model_name = "gemini-1.5-flash"

        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not _GENAI_AVAILABLE:
            print("[GeminiVLM] google-generativeai not installed — skipping.")
            return
        if not api_key:
            print("[GeminiVLM] GEMINI_API_KEY not set — skipping Gemini VLM engine.")
            return

        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=GEMINI_SYSTEM_PROMPT,
            )
            self.ready = True
            print(f"[GeminiVLM] ✅ Gemini Vision ({self.model_name}) engine ready.")
        except Exception as e:
            print(f"[GeminiVLM] Initialization failed: {e}")

    def predict(self, pil_img: Image.Image, top_k: int = 5) -> Optional[Dict]:
        """Call Gemini Vision and return parsed prediction dict, or None on failure."""
        if not self.ready:
            return None
        try:
            img_bytes = _pil_to_jpeg_bytes(pil_img)
            # Build a simple content list: [inline image, text prompt]
            response = self.model.generate_content(
                contents=[
                    {"mime_type": "image/jpeg", "data": img_bytes},
                    "Analyze this food image and return the JSON as instructed."
                ]
            )
            raw_text = response.text.strip()
            parsed = _extract_json(raw_text)

            # Sanitize & fuzzy-match the primary food slug
            primary_food = parsed.get("primary_food", "")
            if primary_food not in FOOD101_CLASSES:
                primary_food = _fuzzy_match_food101(primary_food)
            parsed["primary_food"] = primary_food

            # Sanitize top_predictions
            top_preds = parsed.get("top_predictions", [])
            sanitized_preds = []
            for p in top_preds[:top_k]:
                slug = p.get("food", "")
                if slug not in FOOD101_CLASSES:
                    slug = _fuzzy_match_food101(slug)
                sanitized_preds.append({
                    "food": slug,
                    "name": p.get("name", slug.replace("_", " ").title()),
                    "confidence": float(p.get("confidence", 0.0)),
                })

            # Ensure primary food is #1
            if not sanitized_preds or sanitized_preds[0]["food"] != primary_food:
                primary_conf = float(parsed.get("confidence", 0.9))
                sanitized_preds.insert(0, {
                    "food": primary_food,
                    "name": parsed.get("display_name", primary_food.replace("_", " ").title()),
                    "confidence": primary_conf,
                })

            parsed["top_predictions"] = sanitized_preds[:top_k]
            parsed["confidence"] = float(parsed.get("confidence", sanitized_preds[0]["confidence"]))
            return parsed

        except Exception as e:
            print(f"[GeminiVLM] Inference error: {e}")
            return None


# ══════════════════════════════════════════════════════════════════════════════
# ViT Fallback Engine (nateraw/food, cached offline)
# ══════════════════════════════════════════════════════════════════════════════

class ViTFallbackEngine:
    """Offline ViT Food-101 engine — used when Gemini is unavailable."""

    def __init__(self):
        self.ready = False
        self.model = None
        self.transform = None
        if not _TORCH_AVAILABLE:
            return
        try:
            os.environ["HF_HUB_OFFLINE"] = "1"
            from transformers import ViTForImageClassification
            import torchvision.transforms.v2 as T2
            self.model = ViTForImageClassification.from_pretrained(
                "nateraw/food",
                local_files_only=True,
                attn_implementation="eager",
            ).to(DEVICE)
            self.model.eval()
            self.transform = T2.Compose([
                T2.Resize((224, 224)),
                T2.ToImage(),
                T2.ToDtype(torch.float32, scale=True),
                T2.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
            ])
            self.ready = True
            print("[ViTFallback] ✅ Vision Transformer (nateraw/food, offline) ready.")
        except Exception as e:
            print(f"[ViTFallback] Not available: {e}")

    def predict(self, pil_img: Image.Image, top_k: int = 5) -> Optional[Dict]:
        if not self.ready:
            return None
        try:
            tensor = self.transform(pil_img).unsqueeze(0).to(DEVICE)
            with torch.no_grad():
                out = self.model(tensor, output_attentions=True)
                probs = torch.softmax(out.logits, dim=-1)[0]

            top_probs, top_indices = torch.topk(probs, k=min(top_k, 101))
            preds = []
            for prob, idx in zip(top_probs, top_indices):
                slug = self.model.config.id2label[idx.item()]
                if slug not in FOOD101_CLASSES:
                    slug = _fuzzy_match_food101(slug)
                preds.append({"food": slug, "name": slug.replace("_", " ").title(), "confidence": round(prob.item(), 4)})

            primary_food = preds[0]["food"]
            confidence = preds[0]["confidence"]

            # Attention heatmap
            attn_map = None
            if out.attentions:
                try:
                    last_attn = out.attentions[-1]
                    cls_attn = last_attn[0].mean(dim=0)[0, 1:].reshape(14, 14)
                    attn_map = F.interpolate(cls_attn.unsqueeze(0).unsqueeze(0), size=(224, 224), mode="bilinear").squeeze().cpu().numpy()
                    attn_map = (attn_map - attn_map.min()) / (attn_map.max() - attn_map.min() + 1e-8)
                except Exception:
                    pass

            return {
                "primary_food": primary_food,
                "display_name": primary_food.replace("_", " ").title(),
                "confidence": confidence,
                "explanation": f"Vision Transformer identified {primary_food.replace('_', ' ')} with {round(confidence*100,1)}% confidence using attention-based feature extraction.",
                "top_predictions": preds,
                "_attn_map": attn_map,
            }
        except Exception as e:
            print(f"[ViTFallback] Inference error: {e}")
            return None


# ══════════════════════════════════════════════════════════════════════════════
# EfficientNet Ultra-Fallback Engine
# ══════════════════════════════════════════════════════════════════════════════

class EfficientNetFallbackEngine:
    """Last-resort EfficientNet-B2 checkpoint engine."""

    def __init__(self):
        self.ready = False
        self.model = None
        self.gradcam = None
        if not _TORCH_AVAILABLE:
            return
        try:
            from models.food_classifier import FoodClassifier
            ckpt_path = CURRENT_DIR / "checkpoints" / "best_stage2.pt"
            if not ckpt_path.exists():
                ckpt_path = CURRENT_DIR.parent / "checkpoints" / "best_stage2.pt"
            self.model = FoodClassifier(num_classes=len(FOOD101_CLASSES), freeze_backbone=False)
            if ckpt_path.exists():
                ckpt = torch.load(ckpt_path, map_location=DEVICE, weights_only=True)
                self.model.load_state_dict(ckpt.get("model_state", ckpt))
            self.model.to(DEVICE).eval()
            self.transform = T.Compose([
                T.Resize((224, 224)),
                T.ToImage(),
                T.ToDtype(torch.float32, scale=True),
                T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
            ])
            try:
                from gradcam import GradCAMExplainer
                self.gradcam = GradCAMExplainer(self.model)
            except Exception:
                pass
            self.ready = True
            print("[EfficientNetFallback] ✅ EfficientNet-B2 ultra-fallback engine ready.")
        except Exception as e:
            print(f"[EfficientNetFallback] Not available: {e}")

    def predict(self, pil_img: Image.Image, top_k: int = 5) -> Optional[Dict]:
        if not self.ready:
            return None
        try:
            tensor = self.transform(pil_img).unsqueeze(0).to(DEVICE)
            with torch.no_grad():
                logits = self.model(tensor)
                probs = torch.softmax(logits, dim=1)[0]
            top_probs, top_indices = torch.topk(probs, k=min(top_k, len(FOOD101_CLASSES)))
            preds = []
            for prob, idx in zip(top_probs, top_indices):
                slug = FOOD101_CLASSES[idx.item()]
                preds.append({"food": slug, "name": slug.replace("_", " ").title(), "confidence": round(prob.item(), 4)})
            primary_food = preds[0]["food"]
            confidence = preds[0]["confidence"]

            gradcam_b64 = None
            if self.gradcam is not None:
                try:
                    heatmap, _, _ = self.gradcam.generate_cam(tensor, class_idx=top_indices[0].item(), device=DEVICE)
                    gradcam_b64 = self.gradcam.generate_overlay_base64(pil_img, heatmap)
                except Exception:
                    pass

            return {
                "primary_food": primary_food,
                "display_name": primary_food.replace("_", " ").title(),
                "confidence": confidence,
                "explanation": f"EfficientNet-B2 classified {primary_food.replace('_', ' ')} with {round(confidence*100,1)}% confidence using CNN feature maps.",
                "top_predictions": preds,
                "_gradcam_b64": gradcam_b64,
            }
        except Exception as e:
            print(f"[EfficientNetFallback] Inference error: {e}")
            return None


# ══════════════════════════════════════════════════════════════════════════════
# Main Orchestrating Engine
# ══════════════════════════════════════════════════════════════════════════════

class FoodInferenceEngine:
    """
    VLM-first food inference engine.
    Priority: Gemini Vision → ViT (offline) → EfficientNet-B2
    """

    def __init__(self, checkpoint_path: str = None):
        print("[FoodInferenceEngine] Initializing VLM-first food analysis pipeline...")

        # Gradcam overlay helper (shared)
        self._gradcam_helper = None
        try:
            if _TORCH_AVAILABLE:
                # Lightweight dummy model for overlay utility only
                from gradcam import GradCAMExplainer
                # We won't attach to any real model here — only use overlay method
                self._gradcam_helper = GradCAMExplainer.__new__(GradCAMExplainer)
        except Exception:
            pass

        # Initialize engines
        self.gemini = GeminiVLMEngine()
        self.vit = ViTFallbackEngine()
        self.efficientnet = EfficientNetFallbackEngine()

        # Report active engine
        if self.gemini.ready:
            self.active_engine = "gemini_vlm"
            self.model_label = f"Gemini Vision VLM ({self.gemini.model_name})"
        elif self.vit.ready:
            self.active_engine = "vit_food101"
            self.model_label = "Vision Transformer (nateraw/food, offline)"
        elif self.efficientnet.ready:
            self.active_engine = "efficientnet_b2"
            self.model_label = "EfficientNet-B2 (PyTorch)"
        else:
            self.active_engine = "none"
            self.model_label = "No engine available"

        # Legacy compat attributes
        self.device = DEVICE
        self.checkpoint_loaded = self.efficientnet.ready
        self.gradcam = None  # Grad-CAM handled internally now

        print(f"[FoodInferenceEngine] 🚀 Active engine: {self.model_label}")

    def preprocess_image(self, image_input) -> Tuple["torch.Tensor", Image.Image]:
        """Legacy compatibility — returns (None, PIL) since VLM uses PIL directly."""
        pil_img = _load_pil(image_input)
        return None, pil_img

    def _make_gradcam_overlay(self, pil_img: Image.Image, heatmap: np.ndarray) -> Optional[str]:
        """Generate a Grad-CAM style overlay base64 string from a heatmap array."""
        try:
            import cv2
            heatmap_uint8 = (heatmap * 255).astype(np.uint8)
            colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
            colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
            overlay_img = Image.fromarray(colored_rgb).resize(pil_img.size)
            original_arr = np.array(pil_img.convert("RGB"))
            overlay_arr = np.array(overlay_img)
            blended = (0.55 * original_arr + 0.45 * overlay_arr).astype(np.uint8)
            buf = io.BytesIO()
            Image.fromarray(blended).save(buf, format="JPEG", quality=85)
            return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
        except Exception as e:
            print(f"[GradCAM overlay] {e}")
            return None

    def predict(self, image_input, top_k: int = 5, plate_diameter_cm: float = 16.0) -> Dict[str, Any]:
        """
        Run VLM inference and return full response dict compatible with the frontend.
        Falls back through ViT → EfficientNet if Gemini is unavailable.
        """
        pil_img = _load_pil(image_input)
        result_raw = None
        engine_used = "none"
        gradcam_b64 = None

        # --- Try Gemini Vision first ---
        if self.gemini.ready:
            result_raw = self.gemini.predict(pil_img, top_k=top_k)
            if result_raw:
                engine_used = "gemini_vlm"

        # --- Fallback: ViT ---
        if result_raw is None and self.vit.ready:
            result_raw = self.vit.predict(pil_img, top_k=top_k)
            if result_raw:
                engine_used = "vit_food101"
                attn_map = result_raw.pop("_attn_map", None)
                if attn_map is not None:
                    gradcam_b64 = self._make_gradcam_overlay(pil_img, attn_map)

        # --- Ultra-fallback: EfficientNet-B2 ---
        if result_raw is None and self.efficientnet.ready:
            result_raw = self.efficientnet.predict(pil_img, top_k=top_k)
            if result_raw:
                engine_used = "efficientnet_b2"
                gradcam_b64 = result_raw.pop("_gradcam_b64", None)

        # --- Last resort: empty result ---
        if result_raw is None:
            result_raw = {
                "primary_food": "pizza",
                "display_name": "Unknown Food",
                "confidence": 0.0,
                "explanation": "All inference engines unavailable. Set GEMINI_API_KEY environment variable for VLM analysis.",
                "top_predictions": [],
            }
            engine_used = "none"

        # ── Build structured response ─────────────────────────────────────────
        primary_food = result_raw["primary_food"]
        confidence   = float(result_raw["confidence"])

        # Scale portion by plate diameter
        base_scale    = (plate_diameter_cm / 16.0) ** 2
        base_portion  = get_nutrition_for_class(primary_food)["weight_g"]
        scaled_weight = round(base_portion * base_scale, 1)

        nutrition = get_nutrition_for_class(primary_food, portion_g=scaled_weight)

        # Build top_predictions in the shape the frontend expects
        top_predictions = []
        for p in result_raw.get("top_predictions", [])[:top_k]:
            slug  = p.get("food", primary_food)
            conf  = float(p.get("confidence", 0.0))
            nutr  = get_nutrition_for_class(slug)
            top_predictions.append({
                "class_id":       slug,
                "label":          nutr["name"],
                "icon":           nutr["icon"],
                "probability":    round(conf, 4),
                "confidence_pct": round(conf * 100, 1),
            })

        # Ensure at least one entry
        if not top_predictions:
            top_predictions.append({
                "class_id":       primary_food,
                "label":          nutrition["name"],
                "icon":           nutrition["icon"],
                "probability":    round(confidence, 4),
                "confidence_pct": round(confidence * 100, 1),
            })

        # Map engine used to human label
        engine_labels = {
            "gemini_vlm":      "Gemini Vision VLM",
            "vit_food101":     "Vision Transformer (nateraw/food)",
            "efficientnet_b2": "EfficientNet-B2 (PyTorch)",
            "none":            "No engine",
        }

        dish = {
            "id":            "dish_1",
            "name":          nutrition["name"],
            "food_category": primary_food,
            "food":          primary_food,
            "icon":          nutrition["icon"],
            "weight_g":      scaled_weight,
            "calories":      nutrition["calories"],
            "protein":       nutrition["protein"],
            "carbs":         nutrition["carbs"],
            "fat":           nutrition["fat"],
            "fiber":         nutrition["fiber"],
            "density":       nutrition["density"],
            "confidence":    confidence,
            "box":           {"x": 10, "y": 10, "width": 80, "height": 80},
        }

        return {
            "status":           "success",
            "engine":           engine_used,
            "model":            engine_labels.get(engine_used, engine_used),
            "plate_name":       f"{nutrition['icon']} {nutrition['name']}",
            "primary_food":     primary_food,
            "confidence":       confidence,
            "dishes":           [dish],
            "top_predictions":  top_predictions,
            "gradcam_image":    gradcam_b64,
            "explanation":      result_raw.get("explanation", ""),
            "micronutrients":   nutrition["micronutrients"],
            "athletic_verdict": nutrition["athletic_verdict"],
            "checkpoint_loaded": self.checkpoint_loaded,
            "vlm_powered":      engine_used == "gemini_vlm",
        }


# ── Global singleton ───────────────────────────────────────────────────────────
_engine_instance: Optional[FoodInferenceEngine] = None

def get_engine() -> FoodInferenceEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = FoodInferenceEngine()
    return _engine_instance


# ── CLI test ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("  FitVision AI — VLM Food Inference Engine Test")
    print("=" * 60)
    engine = get_engine()
    print(f"\nActive engine : {engine.model_label}")
    print(f"VLM (Gemini)  : {'✅ Ready' if engine.gemini.ready else '❌ Not configured'}")
    print(f"ViT fallback  : {'✅ Ready' if engine.vit.ready else '❌ Offline cache missing'}")
    print(f"EfficientNet  : {'✅ Ready' if engine.efficientnet.ready else '❌ Checkpoint missing'}")

    test_imgs = [
        "sample_test_images/11_ice_cream.jpg",
        "sample_test_images/user_rice_test.jpg",
    ]
    for path in test_imgs:
        if os.path.exists(path):
            res = engine.predict(path)
            print(f"\n[{path}] → {res['plate_name']}  ({res['confidence']*100:.1f}%)  via {res['model']}")
        else:
            print(f"\n[{path}] — file not found, skipping.")
