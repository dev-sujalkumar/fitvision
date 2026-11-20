"""
FitVision AI - Modular Vision-Language Model (VLM) Architecture
Supports:
  1. Google Gemini Vision (Cloud VLM - Gemini 1.5 Flash)
  2. Ollama Moondream (Local VLM - lightweight, fast on CPU/Edge)
  3. Offline Vision Transformer (ViT fallback)
Provides seamless switching between local and cloud providers with structured JSON outputs.
"""

import os
import sys
import io
import json
import re
import time
import base64
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image

# ------------------------------------------------------------------------------
# Structured System Prompt for VLM Recognition
# ------------------------------------------------------------------------------
VLM_SYSTEM_PROMPT = """You are an elite Computer Vision and Food Recognition AI Specialist.
Analyze the uploaded meal photo. Accurately identify all distinct food items present in the plate/image.

You MUST recognize both international and authentic Indian foods, including but not limited to:
- Paneer Butter Masala, Shahi Paneer, Palak Paneer, Matar Paneer
- Dal Makhani, Dal Tadka, Chana Dal, Sambar
- Rajma Chawal, Chole Bhature, Chole Kulche
- Aloo Paratha, Gobi Paratha, Paneer Paratha
- Masala Dosa, Plain Dosa, Idli, Medu Vada, Uttapam
- Pav Bhaji, Misal Pav, Vada Pav
- Chicken Biryani, Mutton Biryani, Veg Biryani
- Butter Chicken, Chicken Curry, Tandoori Chicken
- Samosa, Kachori, Dhokla, Khandvi
- Poha, Upma, Sheera
- Litti Chokha, Baingan Bharta
- Khichdi, Pongal
- Roti, Chapati, Phulka, Naan, Butter Naan, Tandoori Roti
- Pizza, Pasta, Sushi, Ramen, Burger, Tacos, Salads, etc.

Return ONLY a valid JSON object (no markdown formatting, no text before or after).
Schema:
{
  "plate_name": "<Descriptive title for the overall meal, e.g. 'Royal North Indian Thali' or 'Paneer Butter Masala with Roti'>",
  "overall_cuisine": "<e.g. Indian (Punjabi), South Indian, Italian, Japanese, American>",
  "explanation": "<Brief 1-2 sentence description of visual cues and identified items>",
  "dishes": [
    {
      "name": "<Food Name, e.g. Paneer Butter Masala>",
      "food_category": "<e.g. Curry / Gravy, Bread, Rice Dish, Snack, Dessert, Salad>",
      "cuisine": "<e.g. Indian (North Indian)>",
      "visible_ingredients": ["<ingredient 1>", "<ingredient 2>", "..."],
      "cooking_method": "<e.g. Simmered in rich tomato butter gravy / Clay tandoor roasted>",
      "confidence": <float between 0.70 and 0.99>,
      "box": {
        "x": <percent 0-100 from left edge>,
        "y": <percent 0-100 from top edge>,
        "width": <percent 0-100 of total width>,
        "height": <percent 0-100 of total height>
      },
      "estimated_weight_g": <plausible portion in grams, e.g. 180>,
      "calories_per_100g": <approx kcal per 100g>,
      "protein_per_100g": <approx protein g per 100g>,
      "carbs_per_100g": <approx carbs g per 100g>,
      "fat_per_100g": <approx fat g per 100g>
    }
  ]
}
"""

def _clean_json_response(raw_text: str) -> dict:
    """Extract and parse clean JSON from VLM responses that might have markdown or backticks."""
    text = raw_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)

def _pil_to_base64_jpeg(pil_img: Image.Image, quality: int = 85, max_dim: int = 768) -> str:
    """Resize image and convert to JPEG base64 string for efficient network transfer."""
    w, h = pil_img.size
    if max(w, h) > max_dim:
        scale = max_dim / float(max(w, h))
        pil_img = pil_img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    pil_img.convert("RGB").save(buf, format="JPEG", quality=quality)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


# ==============================================================================
# BASE VLM PROVIDER (Abstract Interface)
# ==============================================================================
class VLMProvider(ABC):
    """Abstract Base Class for all Vision-Language Model Providers."""

    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass

    @abstractmethod
    def analyze_food(self, pil_img: Image.Image) -> Optional[Dict[str, Any]]:
        pass


# ==============================================================================
# PROVIDER 1: Google Gemini Vision (Cloud VLM)
# ==============================================================================
class GeminiVisionProvider(VLMProvider):
    """Cloud-based Vision-Language Model using Google Gemini 1.5 Flash."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (api_key or os.environ.get("GEMINI_API_KEY", "")).strip()
        self.model_name = "gemini-1.5-flash"
        self._genai = None
        self._init_sdk()

    def _init_sdk(self):
        if not self.api_key:
            return
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self._genai = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=VLM_SYSTEM_PROMPT
            )
            print(f"[GeminiVisionProvider] Initialized model: {self.model_name}")
        except Exception as e:
            print(f"[GeminiVisionProvider] Init notice: {e}")
            self._genai = None

    def update_api_key(self, new_key: str):
        self.api_key = new_key.strip()
        self._init_sdk()

    def name(self) -> str:
        return "Gemini Vision (Cloud VLM)"

    def is_available(self) -> bool:
        return bool(self.api_key and self._genai is not None)

    def analyze_food(self, pil_img: Image.Image) -> Optional[Dict[str, Any]]:
        if not self.is_available():
            return None

        try:
            # Prepare image payload
            buf = io.BytesIO()
            pil_img.convert("RGB").save(buf, format="JPEG", quality=85)
            img_bytes = buf.getvalue()

            response = self._genai.generate_content(
                contents=[
                    {"mime_type": "image/jpeg", "data": img_bytes},
                    "Analyze this food image. Return strictly the required JSON object identifying all dishes, ingredients, cuisine, and bounding boxes."
                ],
                generation_config={"temperature": 0.2, "response_mime_type": "application/json"}
            )

            raw_text = response.text.strip()
            parsed = _clean_json_response(raw_text)
            parsed["vlm_provider"] = "gemini_vision"
            parsed["model_name"] = self.model_name
            return parsed

        except Exception as e:
            print(f"[GeminiVisionProvider] Analysis error: {e}")
            return None


# ==============================================================================
# PROVIDER 2: Ollama Moondream (Local VLM)
# ==============================================================================
class OllamaMoondreamProvider(VLMProvider):
    """
    Local Vision-Language Model using Moondream running via Ollama.
    Enables 100% offline edge inference on CPU / local hardware.
    """

    def __init__(self, endpoint: str = "http://127.0.0.1:11434", model: str = "moondream"):
        self.endpoint = endpoint.rstrip("/")
        self.model = model
        self.timeout_sec = 20.0

    def name(self) -> str:
        return f"Ollama Moondream (Local VLM: {self.model})"

    def is_available(self) -> bool:
        """Check if local Ollama server is running and reachable."""
        try:
            import urllib.request
            req = urllib.request.Request(f"{self.endpoint}/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    models = [m.get("name", "").split(":")[0] for m in data.get("models", [])]
                    return any(self.model in m for m in models) or len(models) > 0
        except Exception:
            return False
        return False

    def analyze_food(self, pil_img: Image.Image) -> Optional[Dict[str, Any]]:
        """Query local Ollama server with image and prompt."""
        try:
            import urllib.request
            b64_img = _pil_to_base64_jpeg(pil_img, max_dim=512)

            prompt = (
                "Describe this food image in detail. Identify the dish names, cuisine, and visible ingredients. "
                "Is it Indian food such as Paneer, Dal, Samosa, Biryani, Roti, or international food? "
                "Return a JSON with 'plate_name', 'overall_cuisine', 'dishes': [{'name': '...', 'category': '...', 'cuisine': '...'}]"
            )

            payload = json.dumps({
                "model": self.model,
                "prompt": prompt,
                "images": [b64_img],
                "stream": False,
                "format": "json"
            }).encode("utf-8")

            req = urllib.request.Request(
                f"{self.endpoint}/api/generate",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=self.timeout_sec) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                response_text = res_data.get("response", "")
                parsed = _clean_json_response(response_text)
                parsed["vlm_provider"] = "ollama_moondream"
                parsed["model_name"] = self.model
                return parsed

        except Exception as e:
            print(f"[OllamaMoondreamProvider] Local inference notice: {e}")
            return None


# ==============================================================================
# PROVIDER 3: Vision Transformer (Local ViT Fallback)
# ==============================================================================
class ViTOfflineProvider(VLMProvider):
    """Local offline Vision Transformer (nateraw/food) as guaranteed fallback."""

    def __init__(self):
        self.model = None
        self.transform = None
        self._initialized = False

    def _ensure_loaded(self) -> bool:
        if self._initialized:
            return self.model is not None
        self._initialized = True
        try:
            os.environ["HF_HUB_OFFLINE"] = "1"
            import torch
            from transformers import ViTForImageClassification
            import torchvision.transforms.v2 as T2

            self.model = ViTForImageClassification.from_pretrained(
                "nateraw/food",
                local_files_only=True,
                attn_implementation="eager"
            )
            self.model.eval()
            self.transform = T2.Compose([
                T2.Resize((224, 224)),
                T2.ToImage(),
                T2.ToDtype(torch.float32, scale=True),
                T2.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
            ])
            print("[ViTOfflineProvider] Offline Vision Transformer (nateraw/food) ready.")
            return True
        except Exception as e:
            print(f"[ViTOfflineProvider] ViT unavailable: {e}")
            self.model = None
            return False

    def name(self) -> str:
        return "Vision Transformer (nateraw/food, Local)"

    def is_available(self) -> bool:
        # Check if cached files exist without loading full model into RAM
        hf_cache = Path.home() / ".cache" / "huggingface" / "hub"
        vit_cache = hf_cache / "models--nateraw--food"
        return vit_cache.exists() or self.model is not None

    def analyze_food(self, pil_img: Image.Image) -> Optional[Dict[str, Any]]:
        if not self._ensure_loaded():
            return None
        try:
            import torch
            tensor = self.transform(pil_img).unsqueeze(0)
            with torch.no_grad():
                out = self.model(tensor)
                probs = torch.softmax(out.logits, dim=-1)[0]
                topk = torch.topk(probs, k=3)

            dishes = []
            for i in range(len(topk.indices)):
                idx = topk.indices[i].item()
                conf = float(topk.values[i].item())
                label = self.model.config.id2label.get(idx, "food")
                clean_name = label.replace("_", " ").title()
                dishes.append({
                    "name": clean_name,
                    "food_category": "Food-101 Category",
                    "cuisine": "Global / Food-101",
                    "confidence": round(conf, 4),
                    "visible_ingredients": [clean_name],
                    "cooking_method": "Classification Model Recognition",
                    "box": {"x": 10, "y": 10, "width": 80, "height": 80}
                })

            primary = dishes[0]
            return {
                "plate_name": primary["name"],
                "overall_cuisine": "Global",
                "explanation": f"Vision Transformer identified {primary['name']} with {round(primary['confidence']*100, 1)}% confidence.",
                "dishes": dishes,
                "vlm_provider": "vit_offline",
                "model_name": "nateraw/food",
            }
        except Exception as e:
            print(f"[ViTOfflineProvider] Inference error: {e}")
            return None


# ==============================================================================
# UNIFIED VLM ORCHESTRATOR
# ==============================================================================
class VLMEngine:
    """
    Central VLM orchestrator that coordinates:
      - Preferred provider selection ('gemini' vs 'ollama_moondream' vs 'auto')
      - Graceful fallback chain
      - Result normalization and caching
    """

    def __init__(self):
        self.gemini = GeminiVisionProvider()
        self.ollama = OllamaMoondreamProvider()
        self.vit = ViTOfflineProvider()
        self.preferred_mode = "auto"  # 'auto' | 'gemini' | 'ollama'
        self.cache: Dict[str, Dict[str, Any]] = {}

    def get_status(self) -> Dict[str, Any]:
        """Return live health and configuration of all VLM providers."""
        gemini_ok = self.gemini.is_available()
        ollama_ok = self.ollama.is_available()
        vit_ok = self.vit.is_available()

        active = "none"
        if self.preferred_mode == "gemini" and gemini_ok:
            active = "gemini"
        elif self.preferred_mode == "ollama" and ollama_ok:
            active = "ollama_moondream"
        elif gemini_ok:
            active = "gemini"
        elif ollama_ok:
            active = "ollama_moondream"
        elif vit_ok:
            active = "vit_offline"

        return {
            "preferred_mode": self.preferred_mode,
            "active_provider": active,
            "gemini_available": gemini_ok,
            "gemini_has_key": bool(self.gemini.api_key),
            "ollama_moondream_available": ollama_ok,
            "vit_offline_available": vit_ok,
            "providers": [
                {"id": "gemini", "name": self.gemini.name(), "ready": gemini_ok},
                {"id": "ollama", "name": self.ollama.name(), "ready": ollama_ok},
                {"id": "vit", "name": self.vit.name(), "ready": vit_ok},
            ]
        }

    def set_config(self, mode: Optional[str] = None, gemini_key: Optional[str] = None):
        if mode in ("auto", "gemini", "ollama"):
            self.preferred_mode = mode
        if gemini_key is not None:
            self.gemini.update_api_key(gemini_key)

    def analyze(self, pil_img: Image.Image) -> Optional[Dict[str, Any]]:
        """
        Analyze image using the fallback chain:
        1. Preferred provider (if configured)
        2. Gemini Vision (if key available)
        3. Ollama Moondream (if local daemon running)
        4. ViT Offline
        """
        providers_to_try = []

        if self.preferred_mode == "ollama":
            providers_to_try = [self.ollama, self.gemini, self.vit]
        elif self.preferred_mode == "gemini":
            providers_to_try = [self.gemini, self.ollama, self.vit]
        else:  # auto
            providers_to_try = [self.gemini, self.ollama, self.vit]

        for provider in providers_to_try:
            if provider.is_available():
                print(f"[VLMEngine] Attempting analysis with {provider.name()}...")
                result = provider.analyze_food(pil_img)
                if result and result.get("dishes"):
                    print(f"[VLMEngine] Successfully recognized with {provider.name()}")
                    return result

        print("[VLMEngine] All VLM providers exhausted.")
        return None


# Global singleton instance
_vlm_engine_instance: Optional[VLMEngine] = None

def get_vlm_engine() -> VLMEngine:
    global _vlm_engine_instance
    if _vlm_engine_instance is None:
        _vlm_engine_instance = VLMEngine()
    return _vlm_engine_instance
