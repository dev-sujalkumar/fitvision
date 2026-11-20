# FitVision AI - Vercel Deployment Guide

This guide explains how to deploy **FitVision AI** to [Vercel](https://vercel.com).

---

## 🏗️ Architecture Overview & Constraints

FitVision AI consists of two parts:
1. **React Frontend** (`/frontend`): Real-time pose estimation (MoveNet/TensorFlow.js), 3D visuals (Three.js), and UI. **Fully supported on Vercel.**
2. **PyTorch & YOLOv8 Backend** (`/food_classifier` & `/food_analyzer`): PyTorch EfficientNet + YOLOv8 ML backend (Port 5050). 
   > ⚠️ **Note on Vercel for Backend**: PyTorch, Ultralytics, and model weights exceed Vercel's 250MB Serverless Function execution limit. The frontend includes built-in client-side fallbacks so it works seamlessly on Vercel on its own. For full backend features (YOLOv8 & PyTorch inference), deploy the Python server to **Render**, **Railway**, **Hugging Face Spaces**, or run it locally.

---

## 🚀 Option 1: Deploy via Vercel Web Dashboard (Recommended)

1. Push your repository to **GitHub**:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. Log in to [Vercel](https://vercel.com/) and click **"Add New..." -> "Project"**.

3. Import your **`fitvision`** repository.

4. Configure Project Settings:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `cd frontend && npm install`

   *(Note: A `vercel.json` has already been added to the root of this project, so Vercel will auto-detect these settings!)*

5. **Environment Variables** (Optional):
   - `REACT_APP_FOOD_SERVER_URL`: Set this to your deployed Python backend URL (e.g., `https://your-backend.onrender.com`). If left blank, the app gracefully falls back to client-side recognition and local demonstration mode.
   - `NODE_OPTIONS`: `--openssl-legacy-provider` (Already configured in `frontend/package.json`).

6. Click **Deploy**! 🎉

---

## 💻 Option 2: Deploy via Vercel CLI

1. Install the Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Run the deployment command from the project root:
   ```bash
   vercel
   ```

3. Follow the CLI prompts:
   - Set up and deploy? **Yes**
   - Which scope? **Select your account**
   - Link to existing project? **No**
   - What's your project's name? **fitvision**
   - In which directory is your code located? **`./`**

4. For production deployment:
   ```bash
   vercel --prod
   ```

---

## 🐍 Deploying the Python Backend (Optional - Render / Railway)

If you wish to host the PyTorch & YOLOv8 food classification server:

### Option A: Render.com (Web Service)
1. Create a new **Web Service** on Render pointing to your GitHub repo.
2. **Build Command**: `pip install -r food_classifier/requirements.txt ultralytics opencv-python-headless google-generativeai`
3. **Start Command**: `gunicorn food_analyzer.server:app` or `python food_classifier/server.py`
4. Copy your Render URL (e.g., `https://fitvision-backend.onrender.com`).
5. Add `REACT_APP_FOOD_SERVER_URL` = `https://fitvision-backend.onrender.com` in your Vercel Project Environment Variables.

---

## ✅ Features Included in `vercel.json`

- **Single Page Application (SPA) Routing**: Handles client-side navigation (`/nutrition`, `/start`, `/gym`, etc.) without throwing `404 Not Found` on page refresh.
- **Node.js Legacy OpenSSL Support**: Prevents OpenSSL compatibility issues with `react-scripts v4`.
