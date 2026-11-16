# FitVision AI — PyTorch Food-101 Classifier Module

A production-ready deep learning module for food image classification and visual explainability built with **PyTorch**, **EfficientNet-B2**, and **Grad-CAM**.

---

## 🌟 Key Features

1. **EfficientNet-B2 Backbone**:
   - High accuracy-per-parameter transfer learning model.
   - Classification across all 101 categories in the Food-101 benchmark.

2. **Grad-CAM Visual Interpretability**:
   - Gradient-weighted Class Activation Mapping computes attention heatmaps overlaid on the input image.
   - Visually reveals which image regions drove the neural network's prediction.

3. **Nutritional & Biomechanical Profiling**:
   - Real-time mapping of predicted dishes to macronutrients (calories, protein, carbs, fat, fiber).
   - Micronutrient estimates (calcium, iron, vitamin C, electrolytes) and NutriScore grading.
   - Athletic dietary feedback tailored for strength and endurance athletes.

4. **REST API Service**:
   - Ready-to-use Flask API on port `5050` supporting `/api/health`, `/api/analyze-food`, `/api/classify`, and `/api/foods`.

---

## 📁 Module Structure

```
food_classifier/
├── models/
│   ├── food_classifier.py    # EfficientNet-B2 + custom head PyTorch module
│   └── __init__.py
├── pipeline/
│   ├── 01_tensors_fundamentals.py  # PyTorch tensors & autograd primer
│   ├── 02_data_pipeline.py         # Food-101 Dataset & DataLoader pipeline
│   ├── 03_model.py                 # Architecture walkthrough
│   ├── 04_train.py                 # Two-stage training loop (Head -> Fine-tuning)
│   ├── 05_gradcam.py               # Standalone Grad-CAM demo script
│   └── 06_plot_results.py          # Metric & curve plotting
├── checkpoints/              # Saved model checkpoints (e.g. best_stage2.pt)
├── results/                  # Training curves & Grad-CAM outputs
├── gradcam.py                # Reusable Grad-CAM explainer engine
├── nutrition_db.py           # Food-101 nutrition & macro database
├── inference.py              # Production inference engine
├── server.py                 # Flask REST API server (port 5050)
├── run_server.bat            # One-click Windows startup script
└── requirements.txt          # Python dependencies
```

---

## 🚀 Quick Start

### 1. Run the API Server
```powershell
python food_classifier/server.py
# Or run the batch file:
./food_classifier/run_server.bat
```
The server will be reachable at `http://localhost:5050`.

### 2. Test Inference via CLI
```powershell
python food_classifier/inference.py
```

### 3. Run Educational Pipeline Steps
```powershell
python food_classifier/pipeline/01_tensors_fundamentals.py
python food_classifier/pipeline/03_model.py
```
