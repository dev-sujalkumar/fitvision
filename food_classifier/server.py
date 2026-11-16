"""
FitVision AI - PyTorch Food-101 Classifier REST API Server
Runs EfficientNet-B2 Inference, Grad-CAM Visual Heatmaps, and Nutrition Estimation.
"""

import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify
try:
    from flask_cors import CORS
except ImportError:
    CORS = None
import torch

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from inference import get_engine
from nutrition_db import FOOD101_CLASSES, NUTRITION_PROFILES, get_nutrition_for_class

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

# Lazy engine initialization
_engine = None

def get_inference_engine():
    global _engine
    if _engine is None:
        _engine = get_engine()
    return _engine

@app.route("/", methods=["GET"])
def index():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>FitVision AI - PyTorch Food Classifier API</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
            .card { max-width: 650px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h1 { color: #38bdf8; margin-top: 0; }
            a.btn { display: inline-block; background: #0284c7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
            a.btn:hover { background: #0369a1; }
            code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #38bdf8; }
            ul { line-height: 1.8; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>🥗 FitVision AI - PyTorch Food API</h1>
            <p>This is the PyTorch EfficientNet-B2 backend server running on port <code>5050</code>.</p>
            <p>To view and interact with the full <strong>FitVision AI Studio</strong> application, please open the React frontend:</p>
            <a class="btn" href="http://localhost:3000">Open FitVision AI Studio (Port 3000) &rarr;</a>
            <h3>Available API Endpoints:</h3>
            <ul>
                <li><a href="/api/health" style="color: #38bdf8;">/api/health</a> - Server and model status</li>
                <li><a href="/api/foods" style="color: #38bdf8;">/api/foods</a> - List of 101 food classes & nutrition data</li>
                <li><a href="/api/benchmark-plates" style="color: #38bdf8;">/api/benchmark-plates</a> - Predefined benchmark meals</li>
                <li><code>POST /api/classify</code> - Image classification with Grad-CAM heatmap</li>
            </ul>
        </div>
    </body>
    </html>
    """

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    engine = get_inference_engine()
    return jsonify({
        "status": "healthy",
        "service": "FitVision AI PyTorch Food Classifier",
        "engine": "pytorch_food101",
        "model": "EfficientNet-B2 (PyTorch)",
        "device": str(engine.device),
        "pytorch_version": torch.__version__,
        "classes_count": len(FOOD101_CLASSES),
        "checkpoint_loaded": engine.checkpoint_loaded,
        "gradcam_available": engine.gradcam is not None,
    })

@app.route("/api/analyze-food", methods=["POST"])
@app.route("/api/classify", methods=["POST"])
def analyze_food():
    """Classify food dish with PyTorch EfficientNet-B2 and compute Grad-CAM."""
    try:
        data = request.get_json(force=True, silent=True) or {}
        image_data = data.get("image")
        if not image_data:
            return jsonify({
                "status": "error",
                "message": "Missing 'image' base64 data in request body."
            }), 400

        plate_diameter = float(data.get("plate_diameter_cm", 16.0))
        top_k = int(data.get("top_k", 5))

        engine = get_inference_engine()
        result = engine.predict(image_data, top_k=top_k, plate_diameter_cm=plate_diameter)
        return jsonify(result)

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Food analysis inference failed: {str(e)}"
        }), 500

@app.route("/api/foods", methods=["GET"])
def list_foods():
    """List all supported Food-101 categories with their nutritional breakdowns."""
    foods = []
    for c_id in FOOD101_CLASSES:
        foods.append(get_nutrition_for_class(c_id))
    return jsonify({
        "count": len(foods),
        "foods": foods
    })

@app.route("/api/benchmark-plates", methods=["GET"])
def get_benchmarks():
    """Return pre-configured benchmark plates for demonstrations."""
    benchmarks = [
        {
            "id": "meal_pizza",
            "name": "Artisan Stone-Baked Pizza",
            "tag": "High Carb / Post-Workout",
            "class_id": "pizza",
            "dishes": [get_nutrition_for_class("pizza", portion_g=180)]
        },
        {
            "id": "meal_steak",
            "name": "Grilled Ribeye Steak & Asparagus",
            "tag": "High Protein / Hypertrophy",
            "class_id": "steak",
            "dishes": [get_nutrition_for_class("steak", portion_g=220)]
        },
        {
            "id": "meal_sushi",
            "name": "Tokyo Nigiri & Salmon Sashimi",
            "tag": "Omega-3 Clean Energy",
            "class_id": "sushi",
            "dishes": [get_nutrition_for_class("sushi", portion_g=200)]
        },
        {
            "id": "meal_salad",
            "name": "Mediterranean Greek Salad",
            "tag": "Micronutrient & Electrolytes",
            "class_id": "greek_salad",
            "dishes": [get_nutrition_for_class("greek_salad", portion_g=180)]
        }
    ]
    return jsonify({"status": "success", "benchmarks": benchmarks})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print(f"==============================================================")
    print(f"  FitVision AI - PyTorch Food-101 Classifier API Server")
    print(f"  Architecture: EfficientNet-B2 + Grad-CAM Interpretability")
    print(f"  Listening on http://localhost:{port}")
    print(f"==============================================================")
    app.run(host="0.0.0.0", port=port, debug=False)
