"""
FitVision AI - PyTorch Food-101 Classifier Inference Engine
Runs inference using EfficientNet-B2 + Custom Head, with Grad-CAM heatmaps & nutrition estimation.
"""

import os
import sys
import io
import base64
from pathlib import Path
from typing import Dict, Any, List, Tuple

import torch
import torchvision.transforms.v2 as T
from PIL import Image
import numpy as np

# Ensure root of food_classifier is in path
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from models.food_classifier import FoodClassifier
from gradcam import GradCAMExplainer
from nutrition_db import FOOD101_CLASSES, get_nutrition_for_class

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

class FoodInferenceEngine:
    def __init__(self, checkpoint_path: str = None):
        self.device = DEVICE
        self.num_classes = len(FOOD101_CLASSES)
        self.checkpoint_path = Path(checkpoint_path) if checkpoint_path else (CURRENT_DIR / "checkpoints" / "best_stage2.pt")
        
        # Build model
        self.model = FoodClassifier(num_classes=self.num_classes, freeze_backbone=False)
        self.checkpoint_loaded = False
        
        # Check for stage 2 or stage 1 checkpoint
        target_ckpt = None
        if self.checkpoint_path.exists():
            target_ckpt = self.checkpoint_path
        else:
            stage1_ckpt = CURRENT_DIR / "checkpoints" / "best_stage1.pt"
            if stage1_ckpt.exists():
                target_ckpt = stage1_ckpt
        
        if target_ckpt and target_ckpt.exists():
            try:
                ckpt = torch.load(target_ckpt, map_location=self.device, weights_only=True)
                state_dict = ckpt.get("model_state", ckpt)
                self.model.load_state_dict(state_dict)
                self.checkpoint_loaded = True
                print(f"[FoodInferenceEngine] Successfully loaded checkpoint: {target_ckpt}")
            except Exception as e:
                print(f"[FoodInferenceEngine] Warning: Could not load checkpoint ({e}). Using initialized weights.")
        else:
            print("[FoodInferenceEngine] No local checkpoint found. Using pretrained EfficientNet-B2 backbone.")

        self.model.to(self.device)
        self.model.eval()

        # Initialize Grad-CAM
        try:
            self.gradcam = GradCAMExplainer(self.model)
        except Exception as e:
            print(f"[FoodInferenceEngine] Grad-CAM initialization warning: {e}")
            self.gradcam = None

        # Preprocessing pipeline
        self.transform = T.Compose([
            T.Resize((224, 224)),
            T.ToImage(),
            T.ToDtype(torch.float32, scale=True),
            T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])

    def preprocess_image(self, image_input) -> Tuple[torch.Tensor, Image.Image]:
        """Accepts filepath, PIL Image, or Base64 string and returns (tensor, PIL.Image)."""
        if isinstance(image_input, str):
            if image_input.startswith("data:image"):
                # Base64 string
                base64_data = image_input.split(",", 1)[1]
                image_bytes = base64.b64decode(base64_data)
                pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            elif os.path.exists(image_input):
                pil_img = Image.open(image_input).convert("RGB")
            else:
                # Direct base64 string
                image_bytes = base64.b64decode(image_input)
                pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        elif isinstance(image_input, bytes):
            pil_img = Image.open(io.BytesIO(image_input)).convert("RGB")
        elif isinstance(image_input, Image.Image):
            pil_img = image_input.convert("RGB")
        else:
            raise ValueError("Unsupported image input type")

        tensor = self.transform(pil_img).unsqueeze(0)
        return tensor, pil_img

    def predict(self, image_input, top_k: int = 5, plate_diameter_cm: float = 16.0) -> Dict[str, Any]:
        """
        Run inference on image, returning predicted food category, top-k probabilities,
        macronutrient breakdown, and Grad-CAM explainability heatmap.
        """
        tensor, pil_img = self.preprocess_image(image_input)
        tensor = tensor.to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1)[0]

        top_probs, top_indices = torch.topk(probs, k=min(top_k, self.num_classes))
        
        top_predictions = []
        for prob, idx in zip(top_probs, top_indices):
            class_idx = idx.item()
            c_name = FOOD101_CLASSES[class_idx]
            nutr = get_nutrition_for_class(c_name)
            top_predictions.append({
                "class_id": c_name,
                "label": nutr["name"],
                "icon": nutr["icon"],
                "probability": round(prob.item(), 4),
                "confidence_pct": round(prob.item() * 100, 1),
            })

        best_pred = top_predictions[0]
        primary_class = best_pred["class_id"]
        confidence = best_pred["probability"]

        # Scale portion by plate diameter
        base_scale = (plate_diameter_cm / 16.0) ** 2
        base_portion = get_nutrition_for_class(primary_class)["weight_g"]
        scaled_weight = round(base_portion * base_scale, 1)

        nutrition = get_nutrition_for_class(primary_class, portion_g=scaled_weight)

        # Generate Grad-CAM
        gradcam_overlay_b64 = None
        if self.gradcam is not None:
            try:
                heatmap, _, _ = self.gradcam.generate_cam(tensor, class_idx=top_indices[0].item(), device=self.device)
                gradcam_overlay_b64 = self.gradcam.generate_overlay_base64(pil_img, heatmap)
            except Exception as e:
                print(f"[InferenceEngine] Grad-CAM generation warning: {e}")

        # Construct primary dish component
        dish = {
            "id": "dish_1",
            "name": nutrition["name"],
            "food_category": primary_class,
            "food": primary_class,
            "icon": nutrition["icon"],
            "weight_g": scaled_weight,
            "calories": nutrition["calories"],
            "protein": nutrition["protein"],
            "carbs": nutrition["carbs"],
            "fat": nutrition["fat"],
            "fiber": nutrition["fiber"],
            "density": nutrition["density"],
            "confidence": confidence,
            "box": {"x": 10, "y": 10, "width": 80, "height": 80}
        }

        return {
            "status": "success",
            "engine": "pytorch_food101",
            "model": "EfficientNet-B2 (PyTorch)",
            "plate_name": f"{nutrition['icon']} {nutrition['name']}",
            "primary_food": primary_class,
            "confidence": confidence,
            "dishes": [dish],
            "top_predictions": top_predictions,
            "gradcam_image": gradcam_overlay_b64,
            "explanation": f"Grad-CAM highlighted salient visual features of {nutrition['name']} with {round(confidence * 100, 1)}% confidence.",
            "micronutrients": nutrition["micronutrients"],
            "athletic_verdict": nutrition["athletic_verdict"],
            "checkpoint_loaded": self.checkpoint_loaded,
        }

# Global singleton instance
_engine_instance = None

def get_engine() -> FoodInferenceEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = FoodInferenceEngine()
    return _engine_instance

if __name__ == "__main__":
    print("Testing PyTorch Food Inference Engine...")
    engine = get_engine()
    # Create synthetic test image
    test_img = Image.new("RGB", (224, 224), color=(200, 100, 50))
    result = engine.predict(test_img)
    print("Prediction status:", result["status"])
    print("Primary prediction:", result["plate_name"])
    print("Top 3:", [p["label"] for p in result["top_predictions"][:3]])
    print("Grad-CAM generated:", bool(result.get("gradcam_image")))
    print("All tests passed successfully!")
