"""
FitVision AI - Portion Estimation & Volumetric Calibration Engine
Calculates food portions and weights from:
  1. Plate diameter calibration (D cm, default 16.0cm)
  2. Bounding box pixel area relative to plate geometry
  3. Empirical food density multipliers
  4. Precise nutrient calculations using:
     nutrient = (nutrient_per_100g * weight_g) / 100.0
"""

import math
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image

DEFAULT_PLATE_DIAMETER_CM = 16.0

class PortionEngine:
    """
    Computes realistic food portion weights from visual cues and user calibrations.
    Distinguishes visually estimated portions from database portions.
    """

    def __init__(self, default_plate_diameter_cm: float = DEFAULT_PLATE_DIAMETER_CM):
        self.default_plate_diameter_cm = default_plate_diameter_cm

    @staticmethod
    def calculate_plate_area_cm2(diameter_cm: float) -> float:
        """Area of circular plate = pi * (d / 2)^2"""
        radius = max(5.0, float(diameter_cm)) / 2.0
        return math.pi * (radius ** 2)

    def estimate_dish_weight(
        self,
        box: Dict[str, float],
        img_width: int,
        img_height: int,
        density: float = 0.85,
        plate_diameter_cm: float = DEFAULT_PLATE_DIAMETER_CM,
        base_portion_g: Optional[float] = None
    ) -> float:
        """
        Estimate dish weight in grams based on bounding box coverage and plate scale.
        """
        plate_diam = max(10.0, min(35.0, float(plate_diameter_cm)))
        scale_factor = (plate_diam / self.default_plate_diameter_cm) ** 2

        if base_portion_g and base_portion_g > 0:
            # Scale known standard portion by plate dimension ratio
            return round(base_portion_g * scale_factor, 1)

        # Volumetric area approximation
        plate_area_cm2 = self.calculate_plate_area_cm2(plate_diam)
        box_w_pct = float(box.get("width", 50)) / 100.0
        box_h_pct = float(box.get("height", 50)) / 100.0
        box_area_ratio = min(1.0, max(0.04, box_w_pct * box_h_pct))

        # Effective plate coverage fraction (assuming plate occupies ~60% of frame)
        covered_plate_cm2 = min(plate_area_cm2 * 0.90, (box_area_ratio / 0.55) * plate_area_cm2)

        # Average food height on plate: ~1.8 to 2.5 cm depth
        depth_cm = 2.2
        volume_cm3 = covered_plate_cm2 * depth_cm

        weight_g = volume_cm3 * max(0.4, min(1.3, float(density)))
        return round(max(15.0, min(800.0, weight_g)), 1)

    @staticmethod
    def compute_nutrients(
        nutrient_per_100g: float,
        weight_g: float
    ) -> float:
        """
        Strict scientific formula:
          nutrient = (nutrient_per_100g * weight_g) / 100.0
        """
        return round((float(nutrient_per_100g) * max(0.0, float(weight_g))) / 100.0, 1)

    def rescale_dish_nutrients(
        self,
        dish: Dict[str, Any],
        new_weight_g: float
    ) -> Dict[str, Any]:
        """
        Recalculates calories, protein, carbs, fat, fiber when portion weight changes.
        """
        new_w = max(5.0, float(new_weight_g))
        factor = new_w / 100.0

        # If base values per 100g are stored or can be inferred:
        old_w = float(dish.get("weight_g", 100.0))
        if old_w <= 0:
            old_w = 100.0

        cal_100 = (float(dish.get("calories", 150)) / old_w) * 100.0
        pro_100 = (float(dish.get("protein", 6)) / old_w) * 100.0
        carb_100 = (float(dish.get("carbs", 20)) / old_w) * 100.0
        fat_100 = (float(dish.get("fat", 4)) / old_w) * 100.0
        fib_100 = (float(dish.get("fiber", 2)) / old_w) * 100.0

        updated = dict(dish)
        updated["weight_g"] = round(new_w, 1)
        updated["calories"] = round(cal_100 * factor, 1)
        updated["protein"] = round(pro_100 * factor, 1)
        updated["carbs"] = round(carb_100 * factor, 1)
        updated["fat"] = round(fat_100 * factor, 1)
        updated["fiber"] = round(fib_100 * factor, 1)

        # Scale micronutrients if present
        if "micronutrients" in updated and isinstance(updated["micronutrients"], dict):
            scaled_micros = {}
            for k, val in updated["micronutrients"].items():
                if isinstance(val, (int, float)):
                    val_100 = (val / old_w) * 100.0
                    scaled_micros[k] = round(val_100 * factor, 1)
            updated["micronutrients"] = scaled_micros

        return updated


# Global singleton instance
_portion_engine_instance: Optional[PortionEngine] = None

def get_portion_engine() -> PortionEngine:
    global _portion_engine_instance
    if _portion_engine_instance is None:
        _portion_engine_instance = PortionEngine()
    return _portion_engine_instance
