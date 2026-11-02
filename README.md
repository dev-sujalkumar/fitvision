# FitVision AI

FitVision AI is a browser-based fitness application with real-time yoga and exercise pose detection, workout tracking, nutrition logging, and planning tools.

## Run the application

Requirements: Node.js and npm.

```powershell
cd frontend
npm install
$env:NODE_OPTIONS='--openssl-legacy-provider'
npm start
```

Open [http://localhost:3000](http://localhost:3000). The legacy OpenSSL option is needed by this project’s older Create React App/webpack toolchain on newer Node.js versions.

## Project layout

- `frontend/` — React application, browser ML assets, and UI tests.
- `classification model/` — Python pose preprocessing/training scripts, datasets, and model files. Scripts use paths relative to this directory.
- `docs/` — setup, feature, testing, and project-history documentation.

Start with the [documentation index](docs/INDEX.md) or the [quick-start guide](docs/QUICK_START.md).

## Project overview

[Video explanation](https://www.youtube.com/watch?v=fiDaAc7z_kQ)
