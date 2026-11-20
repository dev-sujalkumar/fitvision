"""
FitVision AI - Intelligent Model Routing & Hybrid Fusion Engine
Orchestrates:
  1. Primary Model: YOLOv8m (trained on UEC-256 food classes)
  2. Intelligent Routing Decision Matrix:
     - High confidence (>= threshold) & supported class -> YOLO Fast Path
     - Low confidence (< threshold), zero detections, or unsupported classes -> VLM Fallback
     - Multi-component mixed plate -> Hybrid Fusion with spatial IoU deduplication
  3. Nutrition Engine Integration (Exact scientific scaling)
  4. Portion Engine Calibration
"""

import os
import math
import threading
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
YOLO_CFG_DIR = CURRENT_DIR / ".ultralytics"
YOLO_CFG_DIR.mkdir(parents=True, exist_ok=True)
os.environ["YOLO_CONFIG_DIR"] = str(YOLO_CFG_DIR)
os.environ["ULTRALYTICS_SETTINGS"] = "False"

from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from PIL import Image

from nutrition_engine import get_nutrition_engine
from vlm_engine import get_vlm_engine
from portion_engine import get_portion_engine

WEIGHTS_PATH = CURRENT_DIR / "food256_yv8m_ddp_640" / "weights" / "best.pt"

# Configurable thresholds
YOLO_CONF_THRESHOLD = 0.50       # Predictions below this trigger VLM fallback
IOU_DEDUPLICATION_THRESHOLD = 0.40 # Overlap threshold to prevent double counting

_YOLO_MODEL = None
_YOLO_LOCK = threading.RLock()

def get_yolo_model():
    """Lazy-load YOLOv8m weights only once."""
    global _YOLO_MODEL
    with _YOLO_LOCK:
        if _YOLO_MODEL is None and WEIGHTS_PATH.exists():
            try:
                from ultralytics import YOLO
                _YOLO_MODEL = YOLO(str(WEIGHTS_PATH))
                print(f"[Router] Successfully loaded YOLOv8m from {WEIGHTS_PATH}")
            except Exception as e:
                print(f"[Router] YOLOv8m load warning: {e}")
                _YOLO_MODEL = None
        return _YOLO_MODEL


def calculate_iou(boxA: Dict[str, float], boxB: Dict[str, float]) -> float:
    """Calculate Intersection over Union (IoU) of two bounding boxes in percentage coordinates."""
    xA = max(boxA["x"], boxB["x"])
    yA = max(boxA["y"], boxB["y"])
    xB = min(boxA["x"] + boxA["width"], boxB["x"] + boxB["width"])
    yB = min(boxA["y"] + boxA["height"], boxB["y"] + boxB["height"])

    interArea = max(0.0, xB - xA) * max(0.0, yB - yA)
    boxAArea = boxA["width"] * boxA["height"]
    boxBArea = boxB["width"] * boxB["height"]
    unionArea = boxAArea + boxBArea - interArea

    return interArea / max(1e-6, unionArea)


def calculate_nutri_score(calories: float, protein: float, carbs: float, fat: float) -> Dict[str, str]:
    """Nutri-Score classification based on macro density."""
    ratio = protein / max(1.0, (carbs * 0.4 + fat * 0.9))
    if ratio > 0.45 and calories < 350:
        return {"grade": "A", "color": "#10b981", "label": "Athletic Clean"}
    elif ratio > 0.30 and calories < 500:
        return {"grade": "B", "color": "#38bdf8", "label": "Balanced Fuel"}
    elif ratio > 0.20 and calories < 650:
        return {"grade": "C", "color": "#f59e0b", "label": "Refeed Energy"}
    elif calories < 800:
        return {"grade": "D", "color": "#f97316", "label": "Calorie Dense"}
    else:
        return {"grade": "E", "color": "#ef4444", "label": "Indulgence"}


def generate_athletic_verdict(plate_name: str, cal: float, pro: float, carb: float, fat: float, cuisine: str = "") -> str:
    """Personalized athletic coach recommendation."""
    if pro >= 30:
        return f"Outstanding anabolic meal ({pro}g protein). Optimal for post-workout muscle protein synthesis and recovery."
    elif carb >= 60 and pro >= 15:
        return f"Exceptional sustained-release glycogen reload ({carb}g carbs, {pro}g protein). Best consumed 2 hours pre-workout or post-endurance training."
    elif fat >= 25 and carb < 30:
        return f"Ketogenic / sustained-lipid energy profile ({fat}g healthy fats). Excellent for long duration low-intensity stamina."
    elif cal <= 250:
        return f"Clean, nutrient-dense cutting plate ({cal} kcal, {pro}g protein). Keeps caloric deficit optimal while preserving lean mass."
    return f"Balanced macronutrient distribution ({pro}g protein, {carb}g carbs, {fat}g fat). Meets complete daily energetic requirements."


class HybridFoodRouter:
    """
    Intelligent routing system combining YOLOv8m and Vision-Language Models.
    """

    def __init__(self):
        self.nutrition_engine = get_nutrition_engine()
        self.portion_engine = get_portion_engine()
        self.vlm_engine = get_vlm_engine()

    def run_yolo_detection(self, pil_img: Image.Image, plate_diameter_cm: float = 16.0) -> List[Dict[str, Any]]:
        """Run YOLOv8m detection on image."""
        model = get_yolo_model()
        if model is None:
            return []

        w, h = pil_img.size
        img_rgb = np.asarray(pil_img.convert("RGB"))

        try:
            with _YOLO_LOCK:
                results = model.predict(
                    source=img_rgb,
                    imgsz=640,
                    conf=0.20,
                    iou=0.45,
                    max_det=15,
                    verbose=False
                )[0]

            if results.boxes is None or len(results.boxes) == 0:
                return []

            yolo_dishes = []
            for box in results.boxes:
                cls_id = int(box.cls.item())
                raw_name = str(results.names[cls_id]).strip()
                confidence = float(box.conf.item())

                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]
                box_dict = {
                    "x": round(max(0.0, min(100.0, (x1 / w) * 100)), 1),
                    "y": round(max(0.0, min(100.0, (y1 / h) * 100)), 1),
                    "width": round(max(5.0, min(100.0, ((x2 - x1) / w) * 100)), 1),
                    "height": round(max(5.0, min(100.0, ((y2 - y1) / h) * 100)), 1),
                }

                # Resolve nutrition
                match = self.nutrition_engine.find_food_match(raw_name)
                density = 0.85
                base_portion = 180.0
                if match:
                    _, profile, _ = match
                    density = profile.get("density", 0.85)
                    base_portion = profile.get("portion_g", 180.0)

                estimated_weight = self.portion_engine.estimate_dish_weight(
                    box_dict, w, h, density=density, plate_diameter_cm=plate_diameter_cm, base_portion_g=base_portion
                )

                nutr = self.nutrition_engine.calculate_dish_nutrition(raw_name, estimated_weight)
                nutr["confidence"] = round(confidence, 3)
                nutr["box"] = box_dict
                nutr["recognition_source"] = "yolov8_uec256"
                nutr["recognition_badge"] = "YOLOv8 Recognition"
                yolo_dishes.append(nutr)

            return yolo_dishes

        except Exception as e:
            print(f"[Router] YOLO detection error: {e}")
            return []

    def analyze(self, pil_img: Image.Image, plate_diameter_cm: float = 16.0) -> Dict[str, Any]:
        """
        Execute intelligent routing:
        1. Run YOLOv8m.
        2. Evaluate predictions against confidence threshold and classes.
        3. Activate VLM fallback if needed.
        4. Fuse results if multiple dishes are detected across models.
        """
        w, h = pil_img.size
        plate_diam = max(10.0, min(35.0, float(plate_diameter_cm)))

        # Step 1: Run YOLOv8m
        yolo_dishes = self.run_yolo_detection(pil_img, plate_diam)
        yolo_count = len(yolo_dishes)
        max_yolo_conf = max([d["confidence"] for d in yolo_dishes], default=0.0)

        # Routing flags
        activate_vlm = False
        fallback_reason = ""

        if yolo_count == 0:
            activate_vlm = True
            fallback_reason = "No food items detected by YOLOv8 (dish not in 256 classes or complex multi-dish composition)."
        elif max_yolo_conf < YOLO_CONF_THRESHOLD:
            activate_vlm = True
            fallback_reason = f"YOLOv8 confidence ({round(max_yolo_conf * 100, 1)}%) below reliable threshold ({int(YOLO_CONF_THRESHOLD * 100)}%)."
        else:
            # Check if any dish is an obscure/generic label
            for d in yolo_dishes:
                if d["food_key"] in ("food", "item", "dish") or d["confidence"] < 0.35:
                    activate_vlm = True
                    fallback_reason = "YOLOv8 produced generic or ambiguous category classification."
                    break

        vlm_result = None
        if activate_vlm:
            print(f"[Router] Activating VLM Fallback: {fallback_reason}")
            vlm_result = self.vlm_engine.analyze(pil_img)

        # ----------------------------------------------------------------------
        # CASE 1: YOLO Fast Path (High confidence, known classes)
        # ----------------------------------------------------------------------
        if not activate_vlm or (vlm_result is None and yolo_count > 0):
            primary = yolo_dishes[0]
            tot_cal = sum(d["calories"] for d in yolo_dishes)
            tot_pro = sum(d["protein"] for d in yolo_dishes)
            tot_carb = sum(d["carbs"] for d in yolo_dishes)
            tot_fat = sum(d["fat"] for d in yolo_dishes)
            tot_w = sum(d["weight_g"] for d in yolo_dishes)
            nutri_score = calculate_nutri_score(tot_cal, tot_pro, tot_carb, tot_fat)

            return {
                "status": "success",
                "engine": "yolov8_uec256",
                "recognition_badge": "⚡ YOLOv8 Recognition (Fast Path)",
                "recognition_source": "yolov8_uec256",
                "fallback_activated": False,
                "fallback_reason": None,
                "plate_name": f"{primary['icon']} {primary['name']}",
                "cuisine": primary.get("cuisine", "International / UEC-256"),
                "plate_diameter_cm": plate_diam,
                "dishes": yolo_dishes,
                "top_predictions": [
                    {"label": d["name"], "icon": d["icon"], "confidence": d["confidence"], "rank": i + 1}
                    for i, d in enumerate(yolo_dishes[:5])
                ],
                "totals": {
                    "calories": round(tot_cal, 1),
                    "protein": round(tot_pro, 1),
                    "carbs": round(tot_carb, 1),
                    "fat": round(tot_fat, 1),
                    "weight_g": round(tot_w, 1)
                },
                "nutriScore": nutri_score,
                "athletic_verdict": generate_athletic_verdict(primary["name"], tot_cal, tot_pro, tot_carb, tot_fat),
                "micronutrients": primary.get("micronutrients", {}),
                "explanation": f"YOLOv8 neural detector identified {primary['name']} with {round(primary['confidence']*100, 1)}% confidence using trained UEC-256 convolutional feature maps."
            }

        # ----------------------------------------------------------------------
        # CASE 2: VLM Fallback or Hybrid Fusion
        # ----------------------------------------------------------------------
        vlm_dishes_raw = vlm_result.get("dishes", []) if vlm_result else []
        processed_vlm_dishes = []

        vlm_provider_id = vlm_result.get("vlm_provider", "vlm_gemini")
        provider_badge = "🔮 VLM Recognition (Gemini Vision)" if "gemini" in vlm_provider_id else "🔮 VLM Recognition (Local Moondream)"

        for idx, vd in enumerate(vlm_dishes_raw):
            dish_name = vd.get("name", "Specialty Food")
            vlm_box = vd.get("box", {"x": 10, "y": 10, "width": 80, "height": 80})

            # Portion estimation
            base_w = float(vd.get("estimated_weight_g", 180.0))
            scaled_weight = self.portion_engine.estimate_dish_weight(
                vlm_box, w, h,
                density=0.90,
                plate_diameter_cm=plate_diam,
                base_portion_g=base_w
            )

            # Pass VLM hints to nutrition engine for exact calculation
            nutr = self.nutrition_engine.calculate_dish_nutrition(
                dish_name,
                scaled_weight,
                vlm_hints={
                    "calories_per_100g": vd.get("calories_per_100g", 160.0),
                    "protein_per_100g": vd.get("protein_per_100g", 6.0),
                    "carbs_per_100g": vd.get("carbs_per_100g", 22.0),
                    "fat_per_100g": vd.get("fat_per_100g", 5.0),
                    "fiber_per_100g": vd.get("fiber_per_100g", 2.0),
                    "cuisine": vd.get("cuisine", vlm_result.get("overall_cuisine", "Indian / Global")),
                    "category": vd.get("food_category", "Specialty Dish"),
                    "visible_ingredients": vd.get("visible_ingredients", [dish_name]),
                    "cooking_method": vd.get("cooking_method", "Traditional preparation")
                }
            )

            nutr["id"] = f"vlm_dish_{idx + 1}"
            nutr["confidence"] = float(vd.get("confidence", 0.92))
            nutr["box"] = vlm_box
            nutr["recognition_source"] = vlm_provider_id
            nutr["recognition_badge"] = provider_badge
            processed_vlm_dishes.append(nutr)

        # Check for Hybrid Fusion (combine high confidence YOLO items if they don't overlap)
        final_dishes = list(processed_vlm_dishes)
        is_hybrid = False

        for yd in yolo_dishes:
            if yd["confidence"] >= 0.70:
                # Check spatial overlap against all VLM dishes
                overlap = any(calculate_iou(yd["box"], vd["box"]) > IOU_DEDUPLICATION_THRESHOLD for vd in processed_vlm_dishes)
                if not overlap:
                    yd["recognition_badge"] = "⚡ YOLOv8 (Component)"
                    final_dishes.append(yd)
                    is_hybrid = True

        if not final_dishes and yolo_dishes:
            final_dishes = yolo_dishes

        # Fallback if somehow nothing was identified
        if not final_dishes:
            default_nutr = self.nutrition_engine.calculate_dish_nutrition("Rice", 180.0)
            default_nutr["box"] = {"x": 10, "y": 10, "width": 80, "height": 80}
            default_nutr["confidence"] = 0.50
            default_nutr["recognition_source"] = "baseline_fallback"
            default_nutr["recognition_badge"] = "Baseline Estimation"
            final_dishes = [default_nutr]

        primary = final_dishes[0]
        plate_title = vlm_result.get("plate_name", f"{primary['icon']} {primary['name']}") if vlm_result else f"{primary['icon']} {primary['name']}"
        overall_cuisine = vlm_result.get("overall_cuisine", primary.get("cuisine", "Indian / Global")) if vlm_result else primary.get("cuisine", "Global")

        tot_cal = sum(d["calories"] for d in final_dishes)
        tot_pro = sum(d["protein"] for d in final_dishes)
        tot_carb = sum(d["carbs"] for d in final_dishes)
        tot_fat = sum(d["fat"] for d in final_dishes)
        tot_w = sum(d["weight_g"] for d in final_dishes)
        nutri_score = calculate_nutri_score(tot_cal, tot_pro, tot_carb, tot_fat)

        engine_label = "hybrid_ai" if is_hybrid else ("vlm_fallback" if activate_vlm else "yolov8_uec256")
        badge_label = "🧬 Hybrid AI Recognition (YOLO + VLM)" if is_hybrid else provider_badge

        return {
            "status": "success",
            "engine": engine_label,
            "recognition_badge": badge_label,
            "recognition_source": vlm_provider_id if not is_hybrid else "hybrid_fusion",
            "fallback_activated": activate_vlm,
            "fallback_reason": fallback_reason if activate_vlm else None,
            "plate_name": plate_title,
            "cuisine": overall_cuisine,
            "plate_diameter_cm": plate_diam,
            "dishes": final_dishes,
            "top_predictions": [
                {"label": d["name"], "icon": d["icon"], "confidence": d["confidence"], "rank": i + 1}
                for i, d in enumerate(final_dishes[:5])
            ],
            "totals": {
                "calories": round(tot_cal, 1),
                "protein": round(tot_pro, 1),
                "carbs": round(tot_carb, 1),
                "fat": round(tot_fat, 1),
                "weight_g": round(tot_w, 1)
            },
            "nutriScore": nutri_score,
            "athletic_verdict": generate_athletic_verdict(plate_title, tot_cal, tot_pro, tot_carb, tot_fat, overall_cuisine),
            "micronutrients": primary.get("micronutrients", {}),
            "explanation": vlm_result.get("explanation", f"Vision-Language Model analyzed the plate and recognized {primary['name']} along with {len(final_dishes)} dish components.") if vlm_result else f"AI recognition system analyzed meal components."
        }


# Global singleton instance
_router_instance: Optional[HybridFoodRouter] = None

def get_hybrid_router() -> HybridFoodRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = HybridFoodRouter()
    return _router_instance
