# FitVision AI Studio

FitVision AI is a comprehensive computer vision and biomechanical fitness platform combining real-time human pose estimation, 15-discipline gym rep tracking, 8 core photographic yoga disciplines, and an AI-powered **PyTorch Food-101 Classifier** with **EfficientNet-B2** and **Grad-CAM visual explainability**.

---

## 🌟 Key Capabilities

### 1. 🥗 AI Food Recognition & Nutrition Studio (`/nutrition`)
Powered by our integrated **PyTorch Food Classifier**:
- **EfficientNet-B2 Architecture**: Transfer learning pipeline trained on the Food-101 benchmark dataset (101 diverse food categories).
- **Grad-CAM Visual Explainability**: Real-time class activation mapping (Grad-CAM) that generates heatmaps showing exactly which pixel regions of the meal triggered the prediction.
- **Macronutrient & Micronutrient Profiling**: Automated mapping to calories, proteins, carbohydrates, fats, dietary fiber, and essential minerals (calcium, iron, vitamin C, electrolytes).
- **NutriScore Telemetry**: Computes NutriScore grades (A through D) and athletic macronutrient balance.
- **Multi-Engine Flexibility**: Seamlessly toggle between local PyTorch Food-101, Google Gemini Multimodal Vision API, or bundled on-device benchmark plates.
- **FitVision Food Diary**: Local and IndexedDB persistent nutrition tracking with hands-free audio coaching.

### 2. 💪 Gym AI Strength Trainer (`/gym`) — 15 Exercises
- **15 Exercises**: Lateral Raise, Front Raise, Tricep Extension, Upright Row, Punches, Calf Raise, Squats, Pushups, Bicep Curls, Jumping Jacks, Lunges, Shoulder Press, Plank, Crunches, High Knees.
- **Desk & Webcam Friendly**: Relaxed upper-body framing for easy desk demonstration (especially Lateral Raises, Front Raises, and Bicep Curls).
- **Rep & Form Telemetry**: Real-time joint angle arcs, rep counters, velocity cadence, and spoken corrections.

### 3. 🧘 Movement & Yoga Studio (`/start`) — 8 Core Photographic Poses
- Pruned to 8 core photographic poses with 100% verified image references: Tree, Chair, Warrior I, Warrior II, Downward Dog, Cobra, Triangle, and Shoulderstand.
- MoveNet Thunder real-time skeleton tracking with multi-angle alignment verification.

---

## 🚀 How to Run the Project

### 1. Start the React Frontend
Requirements: Node.js and npm.

```powershell
# Double-click start_app.bat OR run:
cd frontend
npm start
```
Open [http://localhost:3000](http://localhost:3000).

### 2. Start the PyTorch Food Classifier Backend API (Optional / Recommended)
Requirements: Python 3.10+ (Python 3.13 tested and supported).

```powershell
# Double-click start_backend.bat OR run:
python food_classifier/server.py
```
The PyTorch Food Classifier API starts on [http://localhost:5050](http://localhost:5050).

*Note: The frontend includes autonomous client-side computer vision engine fallbacks that operate automatically even if the Python backend is offline, ensuring reliable demonstrations.*

---

## 📁 Repository Layout

```
fitvision/
├── frontend/                # React 17 SPA, MoveNet pose tracking, and Nutrition Studio UI
├── food_classifier/         # PyTorch Food-101 Classifier module
│   ├── models/              # EfficientNet-B2 + custom head architecture
│   ├── pipeline/            # Two-stage training pipeline, tensors primer, and Grad-CAM scripts
│   ├── checkpoints/         # Model weights (best_stage1.pt, best_stage2.pt)
│   ├── gradcam.py           # Reusable Grad-CAM explainability engine
│   ├── nutrition_db.py      # Food-101 nutrition and macronutrient knowledge base
│   ├── inference.py         # Production inference and Grad-CAM generator
│   ├── server.py            # Flask REST API server (port 5050)
│   └── run_server.bat       # Startup script for backend API
├── pose_classifier/         # MoveNet pose estimation training data & scripts
├── docs/                    # Architecture and setup documentation
├── start_app.bat            # One-click startup for React frontend
└── start_backend.bat        # One-click startup for PyTorch backend API
```

---

## 🧪 Testing

To run the frontend test suites:
```powershell
cd frontend
npm test -- --watchAll=false
```

To test the PyTorch inference engine:
```powershell
python food_classifier/inference.py
```
