# FitVision AI — Real-Time Posture Tracking & Multimodal Food Vision Studio

**Course:** CSE471 Final Project  
**Institution:** Lovely Professional University (LPU)  
**Student Name:** Sujal Kumar  
**Roll Number:** 10  
**Registration Number:** 12405329  
**Live Public Deployment:** [https://fitvision.vercel.app](https://fitvision.vercel.app)  
**GitHub Repository:** [https://github.com/dev-sujalkumar/fitvision](https://github.com/dev-sujalkumar/fitvision)

---

## 📌 Executive Summary

**FitVision AI** is an end-to-end computer vision and sports health analytics platform combining browser-based real-time pose estimation with a hybrid multi-dish nutritional analysis pipeline.

1. **AI Movement & Posture Coach (Client-Side Real-Time)**
   - Utilizes Google MoveNet (Lightning & Thunder) and MediaPipe Pose via TensorFlow.js directly in the browser at 30+ FPS with zero server latency.
   - Computes kinematic joint angles (elbow, knee, hip, shoulder) for real-time repetition counting, form deviation detection, and audio biofeedback.
2. **Hybrid Food Vision & Dynamic Nutrition Studio**
   - **Primary Fast-Path Model:** YOLOv8m trained on 256 food categories (UEC-FOOD256) for multi-dish detection and spatial bounding.
   - **Intelligent Fallback Model:** Cloud Gemini Vision API / Local Ollama Moondream when YOLO encounters complex mixed plates or dishes outside the 256-class catalog.
   - **Scientific Nutrition Engine:** Scales macro- and micro-nutrients via physical portion estimation ($W = \text{Volume} \times \text{Density}$) and calculates standard European Nutri-Scores alongside athletic coaching recommendations.

---

## 🛠️ Tech Stack & Libraries

- **Frontend:**
  - React 17.0.2 / React Router DOM v6
  - `@tensorflow/tfjs` & `@tensorflow-models/pose-detection` (MoveNet)
  - `@mediapipe/pose`
  - HTML5 Canvas & WebRTC Webcam API
- **Backend:**
  - Python 3.10+
  - Flask 2.3+ & Flask-CORS
  - PyTorch 2.0+ & Ultralytics YOLOv8
  - Google Generative AI (`google-generativeai` Gemini Vision API)
  - NumPy, Pandas, Pillow
- **Cloud & Deployment:**
  - Frontend: Vercel (CI/CD connected to GitHub)
  - Backend: Local Port 5050 or Render / Railway Web Service

---

## 📁 Repository & Folder Layout

```text
Code/
├── food_analyzer/               # Hybrid Food Recognition & Nutrition Server
│   ├── server.py                # Flask REST API endpoints
│   ├── router.py                # Intelligent YOLOv8m -> VLM fallback routing logic
│   ├── nutrition_engine.py      # Database loader & nutrient scaling formula
│   ├── portion_engine.py        # 3D bounding box & density portion estimator
│   ├── vlm_engine.py            # Gemini Vision & Moondream fallback clients
│   ├── verify_modules.py        # Automated test suite (health, routing, scaling)
│   └── datasets/                # CSV tables (nutrition_256.csv, densities)
├── food_classifier/             # Legacy classifier & benchmarking utilities
│   └── server.py                # Backward-compatible unified server entry point
├── frontend/                    # React Single Page Application (SPA)
│   ├── src/                     # React components, pages, and TensorFlow pose models
│   ├── public/                  # Static assets & food showcase images
│   ├── package.json             # NPM dependencies & scripts
│   ├── .npmrc                   # Legacy peer dependency resolution for Vercel
│   └── vercel.json              # Client-side SPA routing rewrites
├── requirements.txt             # Clean Python backend dependency requirements
├── .env.example                 # Environment variables template
└── run_full_project.bat         # One-click Windows launcher for Full Stack app
```

---

## 🚀 Local Installation & Setup Instructions

### 1. Prerequisites
- **Node.js**: v18.x or v20.x ([Download Node.js](https://nodejs.org/))
- **Python**: v3.10 or v3.11 ([Download Python](https://www.python.org/))
- **Git**

### 2. Backend Setup (Python)
```bash
# Clone the repository
git clone https://github.com/dev-sujalkumar/fitvision.git
cd fitvision

# Create and activate Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set your Gemini API key in .env for cloud VLM fallback
# set GEMINI_API_KEY=your_key_here

# Start the Flask Backend Server (Port 5050)
cd food_analyzer
python server.py
```
*The backend will initialize and listen on `http://localhost:5050/api/health`.*

### 3. Frontend Setup (React)
Open a new terminal window:
```bash
cd fitvision/frontend

# Install dependencies (using legacy peer deps)
npm install --legacy-peer-deps

# Start the React Development Server (Port 3000)
npm start
```
*The app will automatically launch in your browser at `http://localhost:3000`.*

---

## 🧪 Automated Testing & Verification

To verify that all modules are working correctly, run the built-in test suite:

```bash
# 1. Run Comprehensive Module Verification
python food_analyzer/verify_modules.py

# 2. Run Hybrid Router Unit Tests
python food_analyzer/tests/test_hybrid_system.py

# 3. Test Frontend Production Build
cd frontend
npm run build
```

---

## 🌐 Live Deployment Details

- **Vercel Production URL:** [https://fitvision.vercel.app](https://fitvision.vercel.app)
- **Deployment Status:** Green (Continuous Deployment via GitHub Actions / Vercel Webhook)
- **Client-Side Fallback:** If the local Python backend is not running, the web application runs client-side posture tracking and fallback nutrition demonstration plates natively in the browser!
