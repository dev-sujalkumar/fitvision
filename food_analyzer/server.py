"""
FitVision AI - Hybrid AI Food Recognition & Nutrition Server
Combines:
  1. YOLOv8m (Fast Path for 256 UEC-FOOD categories)
  2. Vision-Language Model Fallback (Cloud Gemini Vision & Local Ollama Moondream)
  3. Extended Indian & International Authentic Nutrition Database
  4. Dynamic Portion Calibration & Nutrient Calculation:
     nutrient = (nutrient_per_100g * weight_g) / 100.0
  5. Interactive Food Correction Endpoint
"""

import os
from pathlib import Path
CURRENT_DIR = Path(__file__).resolve().parent
YOLO_CFG_DIR = CURRENT_DIR / ".ultralytics"
YOLO_CFG_DIR.mkdir(parents=True, exist_ok=True)
os.environ["YOLO_CONFIG_DIR"] = str(YOLO_CFG_DIR)
os.environ["ULTRALYTICS_SETTINGS"] = "False"

import sys
import io
import json
import base64
from typing import Optional, Dict, Any, List
from flask import Flask, request, jsonify
try:
    from flask_cors import CORS
except ImportError:
    CORS = None
from PIL import Image

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from router import get_hybrid_router, calculate_nutri_score, generate_athletic_verdict
from nutrition_engine import get_nutrition_engine, EXTENDED_FOOD_DB
from vlm_engine import get_vlm_engine
from portion_engine import get_portion_engine

app = Flask(__name__)
if CORS is not None:
    CORS(app, resources={r"/api/*": {"origins": "*"}})
else:
    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,PUT,POST,DELETE,OPTIONS"
        return response

router = get_hybrid_router()
nutrition_engine = get_nutrition_engine()
vlm_engine = get_vlm_engine()
portion_engine = get_portion_engine()

def _parse_image_from_request(req) -> Optional[Image.Image]:
    """Parse PIL Image from JSON base64 string or multipart file upload."""
    data = req.get_json(silent=True) or {}
    image_data = data.get("image")

    if not image_data and "image" in req.files:
        file = req.files["image"]
        return Image.open(io.BytesIO(file.read())).convert("RGB")
    elif image_data:
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]
        image_bytes = base64.b64decode(image_data)
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return None


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "FitVision AI Hybrid Food Recognition Server",
        "version": "2.0-Hybrid",
        "status": "online",
        "endpoints": [
            "/api/health",
            "/api/analyze-food",
            "/api/classify",
            "/api/correct-food",
            "/api/foods",
            "/api/vlm-config",
            "/api/benchmark-plates"
        ]
    })


@app.route("/api/health", methods=["GET"])
def health_check():
    """Live health and readiness check for YOLO and VLM providers."""
    yolo_model = router.nutrition_engine
    vlm_status = vlm_engine.get_status()

    return jsonify({
        "status": "healthy",
        "service": "FitVision AI Hybrid Food Recognition Studio",
        "engine": "hybrid_yolo_vlm",
        "primary_model": "YOLOv8m (UEC-FOOD256)",
        "yolo_classes_count": len(nutrition_engine.uec256_db),
        "extended_classes_count": len(EXTENDED_FOOD_DB),
        "total_catalog_foods": len(nutrition_engine.uec256_db) + len(EXTENDED_FOOD_DB),
        "vlm_status": vlm_status,
        "active_vlm_provider": vlm_status["active_provider"],
        "gemini_ready": vlm_status["gemini_available"],
        "ollama_moondream_ready": vlm_status["ollama_moondream_available"],
        "vit_offline_ready": vlm_status["vit_offline_available"],
    })


@app.route("/api/vlm-config", methods=["GET", "POST"])
def manage_vlm_config():
    """Inspect or update VLM provider configuration (Cloud vs Local, API keys)."""
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        preferred_mode = data.get("preferred_mode")
        gemini_key = data.get("gemini_api_key")
        vlm_engine.set_config(mode=preferred_mode, gemini_key=gemini_key)
        return jsonify({
            "status": "success",
            "message": "VLM configuration updated.",
            "current_status": vlm_engine.get_status()
        })
    return jsonify(vlm_engine.get_status())


@app.route("/api/analyze-food", methods=["POST"])
@app.route("/api/classify", methods=["POST"])
def analyze_food():
    """
    Main Food Recognition Endpoint.
    Executes Intelligent Routing: YOLOv8m -> VLM Fallback -> Hybrid Fusion.
    """
    try:
        data = request.get_json(silent=True) or {}
        plate_diam = float(data.get("plate_diameter_cm", 16.0))
        if not (10.0 <= plate_diam <= 35.0):
            plate_diam = 16.0

        # Optional client-side API key passed in request
        client_key = data.get("gemini_api_key")
        if client_key and client_key.strip():
            vlm_engine.gemini.update_api_key(client_key.strip())

        pil_img = _parse_image_from_request(request)
        if pil_img is None:
            return jsonify({
                "status": "error",
                "message": "Missing 'image' base64 data or multipart file in request."
            }), 400

        result = router.analyze(pil_img, plate_diameter_cm=plate_diam)
        return jsonify(result)

    except Exception as e:
        print(f"[Server Error] /api/analyze-food: {e}")
        return jsonify({
            "status": "error",
            "message": f"Food analysis failed: {str(e)}"
        }), 500


@app.route("/api/correct-food", methods=["POST"])
def correct_food():
    """
    Interactive Food Correction Endpoint.
    Allows users to manually correct an incorrectly identified dish name,
    recalculating exact nutritional macros via:
      nutrient = (nutrient_per_100g * weight_g) / 100.0
    """
    try:
        data = request.get_json(silent=True) or {}
        dish_id = data.get("dish_id", "dish_1")
        new_food_name = data.get("new_food_name", "").strip()
        weight_g = float(data.get("weight_g", 180.0))

        if not new_food_name:
            return jsonify({
                "status": "error",
                "message": "Missing 'new_food_name' field."
            }), 400

        updated_nutr = nutrition_engine.calculate_dish_nutrition(new_food_name, weight_g)
        updated_nutr["id"] = dish_id
        updated_nutr["confidence"] = 1.0
        updated_nutr["recognition_source"] = "user_manual_correction"
        updated_nutr["recognition_badge"] = "✏️ User Corrected"
        updated_nutr["box"] = data.get("box", {"x": 10, "y": 10, "width": 80, "height": 80})

        return jsonify({
            "status": "success",
            "corrected_dish": updated_nutr,
            "message": f"Dish corrected to {updated_nutr['name']}. Macros recalculated."
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Food correction failed: {str(e)}"
        }), 500


@app.route("/api/foods", methods=["GET"])
def list_foods():
    """Search and list all available food categories across UEC-256 and Extended Indian DB."""
    q = request.args.get("q", "").strip().lower()
    results = []

    # 1. Extended Indian and Global Foods
    for key, item in EXTENDED_FOOD_DB.items():
        if not q or q in key or q in item["name"].lower() or q in item.get("cuisine", "").lower():
            results.append({
                "key": key,
                "name": item["name"],
                "category": item["category"],
                "cuisine": item["cuisine"],
                "icon": item["icon"],
                "calories": item["calories"],
                "protein": item["protein"],
                "carbs": item["carbs"],
                "fat": item["fat"],
                "fiber": item.get("fiber", 2.0),
                "density": item.get("density", 0.85),
                "portion_g": item.get("portion_g", 180),
                "visible_ingredients": item.get("visible_ingredients", []),
                "cooking_method": item.get("cooking_method", ""),
            })

    # 2. UEC-256 Foods
    for key, item in nutrition_engine.uec256_db.items():
        if not q or q in key.lower():
            if not any(r["key"] == key for r in results):
                results.append({
                    "key": key,
                    "name": item["name"].title(),
                    "category": "Prepared Dish",
                    "cuisine": "International / UEC-256",
                    "icon": nutrition_engine._guess_icon(key),
                    "calories": item["calories"],
                    "protein": item["protein"],
                    "carbs": item["carbs"],
                    "fat": item["fat"],
                    "fiber": 2.0,
                    "density": nutrition_engine.density_db.get(key, 0.85),
                    "portion_g": 180,
                    "visible_ingredients": [item["name"].title()],
                    "cooking_method": "Traditional preparation"
                })

    return jsonify({
        "status": "success",
        "count": len(results),
        "foods": results[:150]
    })


@app.route("/api/benchmark-plates", methods=["GET"])
@app.route("/api/benchmarks", methods=["GET"])
def get_benchmark_plates():
    """Return diverse benchmark plates including Indian thali, gym bowls, and Asian staples."""
    benchmarks = [
        {
            "id": "plate_indian_thali",
            "name": "Royal Punjabi Thali",
            "tag": "Indian Cuisine Special",
            "cuisine": "Indian (Punjabi)",
            "plate_diameter_cm": 22.0,
            "dishes": [
                nutrition_engine.calculate_dish_nutrition("Paneer Butter Masala", 180.0),
                nutrition_engine.calculate_dish_nutrition("Dal Makhani", 150.0),
                nutrition_engine.calculate_dish_nutrition("Roti", 90.0),
                nutrition_engine.calculate_dish_nutrition("Steamed Rice", 140.0),
            ]
        },
        {
            "id": "plate_south_indian",
            "name": "Crispy Masala Dosa & Sambar",
            "tag": "Fermented Clean Carbs",
            "cuisine": "Indian (South Indian)",
            "plate_diameter_cm": 20.0,
            "dishes": [
                nutrition_engine.calculate_dish_nutrition("Masala Dosa", 190.0),
                nutrition_engine.calculate_dish_nutrition("Sambar", 150.0),
            ]
        },
        {
            "id": "plate_biryani",
            "name": "Hyderabadi Chicken Biryani",
            "tag": "High Protein Hypertrophy",
            "cuisine": "Indian (Hyderabadi)",
            "plate_diameter_cm": 18.0,
            "dishes": [
                nutrition_engine.calculate_dish_nutrition("Chicken Biryani", 320.0),
            ]
        },
        {
            "id": "plate_gym_bowl",
            "name": "Athletic Hypertrophy Plate",
            "tag": "Lean Protein & Complex Carbs",
            "cuisine": "Continental",
            "plate_diameter_cm": 18.0,
            "dishes": [
                nutrition_engine.calculate_dish_nutrition("Grilled Salmon", 170.0),
                nutrition_engine.calculate_dish_nutrition("Steamed Rice", 160.0),
                nutrition_engine.calculate_dish_nutrition("Salad", 100.0),
            ]
        }
    ]

    return jsonify({
        "status": "success",
        "count": len(benchmarks),
        "benchmarks": benchmarks,
        "plates": benchmarks
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print("=" * 65)
    print("  FitVision AI - Hybrid AI Food Recognition Server (Port 5050)")
    print("  Models: YOLOv8m (UEC-256) + VLM Fallback (Gemini / Moondream)")
    print(f"  Listening on http://localhost:{port}")
    print("=" * 65)
    app.run(host="0.0.0.0", port=port, debug=False)
