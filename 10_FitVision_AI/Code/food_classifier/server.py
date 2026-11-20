"""
FitVision AI - Unified Backend Server Entry Point
Delegates to food_analyzer.server for full Hybrid AI (YOLOv8 + VLM Fallback + Indian & International Nutrition)
"""

import sys
from pathlib import Path

# Add root and food_analyzer to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
FOOD_ANALYZER_DIR = BASE_DIR / "food_analyzer"

if str(FOOD_ANALYZER_DIR) not in sys.path:
    sys.path.insert(0, str(FOOD_ANALYZER_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Import the unified Flask application from food_analyzer
from food_analyzer.server import app

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5050))
    print("=" * 65)
    print("  FitVision AI - Hybrid AI Food Recognition Server")
    print("  Primary: YOLOv8m (UEC-FOOD256)")
    print("  Fallback: Vision-Language Model (Gemini Vision / Moondream)")
    print(f"  Listening on http://localhost:{port}")
    print("=" * 65)
    app.run(host="0.0.0.0", port=port, debug=False)
