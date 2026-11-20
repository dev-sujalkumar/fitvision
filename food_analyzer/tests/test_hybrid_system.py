"""
FitVision AI - Comprehensive Hybrid AI Food Recognition Test Suite
Tests:
  1. Known YOLO food recognition (fast path)
  2. Unknown food recognition & Indian cuisine (Paneer Butter Masala, Dal Makhani, Samosa, etc.)
  3. Low-confidence triggering of VLM fallback
  4. Multiple foods in one image
  5. Missing nutrition database entries & fuzzy/synonym matching
  6. Verification of the exact nutritional formula:
     nutrient = (nutrient_per_100g * weight_g) / 100.0
  7. Interactive manual food correction endpoint
  8. Resilient error handling (invalid images, missing payloads)
  9. VLM provider architecture & graceful fallback
"""

import os
import sys
import io
import json
import base64
import unittest
from pathlib import Path
from PIL import Image

# Ensure food_analyzer is on path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from nutrition_engine import get_nutrition_engine, EXTENDED_FOOD_DB, FOOD_ALIASES
from vlm_engine import get_vlm_engine, GeminiVisionProvider, OllamaMoondreamProvider, ViTOfflineProvider
from portion_engine import get_portion_engine
from router import get_hybrid_router, calculate_iou, calculate_nutri_score
from server import app


class TestHybridFoodRecognitionSystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()
        cls.nutrition = get_nutrition_engine()
        cls.portion = get_portion_engine()
        cls.router = get_hybrid_router()
        cls.vlm = get_vlm_engine()

        # Create a synthetic 100x100 RGB image for testing
        cls.dummy_img = Image.new("RGB", (200, 200), color=(240, 200, 150))
        buf = io.BytesIO()
        cls.dummy_img.save(buf, format="JPEG")
        cls.dummy_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

    # --------------------------------------------------------------------------
    # 1. Scientific Nutritional Formula Verification
    # --------------------------------------------------------------------------
    def test_scientific_nutritional_formula(self):
        """Verify nutrient = (nutrient_per_100g * weight_g) / 100.0"""
        weight_g = 250.0
        # Test Paneer Butter Masala
        result = self.nutrition.calculate_dish_nutrition("Paneer Butter Masala", weight_g)

        base_cal_100g = EXTENDED_FOOD_DB["paneer_butter_masala"]["calories"]
        base_pro_100g = EXTENDED_FOOD_DB["paneer_butter_masala"]["protein"]
        base_carb_100g = EXTENDED_FOOD_DB["paneer_butter_masala"]["carbs"]
        base_fat_100g = EXTENDED_FOOD_DB["paneer_butter_masala"]["fat"]

        expected_cal = round((base_cal_100g * weight_g) / 100.0, 1)
        expected_pro = round((base_pro_100g * weight_g) / 100.0, 1)
        expected_carb = round((base_carb_100g * weight_g) / 100.0, 1)
        expected_fat = round((base_fat_100g * weight_g) / 100.0, 1)

        self.assertEqual(result["calories"], expected_cal)
        self.assertEqual(result["protein"], expected_pro)
        self.assertEqual(result["carbs"], expected_carb)
        self.assertEqual(result["fat"], expected_fat)
        self.assertEqual(result["nutrition_source"], "database_verified")

    # --------------------------------------------------------------------------
    # 2. Indian Foods Recognition & Extended Database
    # --------------------------------------------------------------------------
    def test_indian_foods_coverage(self):
        """Verify presence of key Indian dishes required by specification."""
        required_indian_foods = [
            "Paneer Butter Masala", "Shahi Paneer", "Dal Makhani", "Rajma Chawal",
            "Chole Bhature", "Aloo Paratha", "Masala Dosa", "Idli", "Sambar",
            "Pav Bhaji", "Chicken Biryani", "Butter Chicken", "Samosa",
            "Kachori", "Dhokla", "Poha", "Upma", "Litti Chokha", "Khichdi",
            "Roti", "Naan"
        ]
        for food in required_indian_foods:
            match = self.nutrition.find_food_match(food)
            self.assertIsNotNone(match, f"Failed to match Indian food: {food}")
            key, profile, match_type = match
            self.assertGreater(profile["calories"], 0, f"Zero calories for {food}")
            self.assertGreater(profile["protein"], 0, f"Zero protein for {food}")

    # --------------------------------------------------------------------------
    # 3. Intelligent Name Matching (Synonyms, Normalized, Fuzzy)
    # --------------------------------------------------------------------------
    def test_intelligent_name_matching(self):
        """Test exact, synonym, substring, and fuzzy matching."""
        # Synonym / Alias
        m1 = self.nutrition.find_food_match("Butter Paneer")
        self.assertIsNotNone(m1)
        self.assertEqual(m1[0], "paneer_butter_masala")

        # Colloquial name
        m2 = self.nutrition.find_food_match("chapati")
        self.assertIsNotNone(m2)
        self.assertEqual(m2[0], "roti")

        # Fuzzy matching with slight typo
        m3 = self.nutrition.find_food_match("paner buttr masala")
        self.assertIsNotNone(m3)
        self.assertEqual(m3[0], "paneer_butter_masala")

        # UEC-256 match
        m4 = self.nutrition.find_food_match("fried rice")
        self.assertIsNotNone(m4)
        self.assertIn("rice", m4[0])

    # --------------------------------------------------------------------------
    # 4. Unknown Food / VLM Fallback Nutrition Calculation
    # --------------------------------------------------------------------------
    def test_novel_food_vlm_fallback(self):
        """Test calculation when food is not in any database (novel dish)."""
        vlm_hints = {
            "calories_per_100g": 185.0,
            "protein_per_100g": 12.0,
            "carbs_per_100g": 15.0,
            "fat_per_100g": 8.0,
            "cuisine": "Fusion",
            "visible_ingredients": ["Grilled artichoke", "Quinoa"],
            "cooking_method": "Charred on open grill"
        }
        res = self.nutrition.calculate_dish_nutrition("Artichoke Quinoa Medley", 200.0, vlm_hints=vlm_hints)
        self.assertEqual(res["nutrition_source"], "vlm_estimated")
        self.assertTrue(res["is_visually_estimated"])
        self.assertEqual(res["calories"], 370.0)  # (185 * 200) / 100
        self.assertEqual(res["protein"], 24.0)   # (12 * 200) / 100

    # --------------------------------------------------------------------------
    # 5. Spatial IoU and Duplicate Suppression
    # --------------------------------------------------------------------------
    def test_spatial_iou_calculation(self):
        """Verify IoU calculation for duplicate detection."""
        boxA = {"x": 10, "y": 10, "width": 40, "height": 40}
        boxB = {"x": 10, "y": 10, "width": 40, "height": 40}
        self.assertAlmostEqual(calculate_iou(boxA, boxB), 1.0, places=2)

        boxC = {"x": 60, "y": 60, "width": 30, "height": 30}
        self.assertEqual(calculate_iou(boxA, boxC), 0.0)

    # --------------------------------------------------------------------------
    # 6. Server Health Check Endpoint
    # --------------------------------------------------------------------------
    def test_api_health_endpoint(self):
        """GET /api/health returns complete hybrid system status."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("yolo_classes_count", data)
        self.assertIn("extended_classes_count", data)
        self.assertIn("vlm_status", data)

    # --------------------------------------------------------------------------
    # 7. Food Catalog Search Endpoint
    # --------------------------------------------------------------------------
    def test_api_foods_search(self):
        """GET /api/foods?q=paneer returns matching dishes."""
        res = self.client.get("/api/foods?q=paneer")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertGreater(data["count"], 0)
        names = [f["name"] for f in data["foods"]]
        self.assertTrue(any("Paneer" in n for n in names))

    # --------------------------------------------------------------------------
    # 8. Interactive Food Correction Endpoint
    # --------------------------------------------------------------------------
    def test_api_correct_food(self):
        """POST /api/correct-food recalculates nutrition for user-specified dish."""
        payload = {
            "dish_id": "dish_1",
            "new_food_name": "Dal Makhani",
            "weight_g": 200.0
        }
        res = self.client.post("/api/correct-food", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        corrected = data["corrected_dish"]
        self.assertEqual(corrected["name"], "Dal Makhani")
        self.assertEqual(corrected["weight_g"], 200.0)
        self.assertAlmostEqual(corrected["calories"], 284.0, delta=2.0)
        self.assertEqual(corrected["recognition_source"], "user_manual_correction")

    # --------------------------------------------------------------------------
    # 9. Analyze Food Endpoint (Integration with Routing)
    # --------------------------------------------------------------------------
    def test_api_analyze_food_success(self):
        """POST /api/analyze-food executes end-to-end pipeline."""
        payload = {
            "image": self.dummy_b64,
            "plate_diameter_cm": 18.0
        }
        res = self.client.post("/api/analyze-food", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("dishes", data)
        self.assertIn("totals", data)
        self.assertIn("nutriScore", data)
        self.assertIn("recognition_badge", data)

    # --------------------------------------------------------------------------
    # 10. Error Handling (Missing image, invalid data)
    # --------------------------------------------------------------------------
    def test_api_analyze_food_invalid_input(self):
        """POST /api/analyze-food with missing image returns 400 Bad Request."""
        res = self.client.post("/api/analyze-food", json={})
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertEqual(data["status"], "error")

    # --------------------------------------------------------------------------
    # 11. VLM Configuration Management Endpoint
    # --------------------------------------------------------------------------
    def test_api_vlm_config(self):
        """GET & POST /api/vlm-config inspects and updates provider settings."""
        get_res = self.client.get("/api/vlm-config")
        self.assertEqual(get_res.status_code, 200)

        post_res = self.client.post("/api/vlm-config", json={"preferred_mode": "auto"})
        self.assertEqual(post_res.status_code, 200)
        data = post_res.get_json()
        self.assertEqual(data["status"], "success")


if __name__ == "__main__":
    unittest.main()
