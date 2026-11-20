import React, { useState, useEffect, useRef, useMemo } from 'react';
import Webcam from 'react-webcam';
import './FoodAnalyzer.css';
import {
  FOOD101_DATABASE,
  SAMPLE_PLATES,
  calculateFoodNutrition,
  calculateNutriScore,
} from '../../utils/food101Data';
import {
  checkServerHealth,
  classifyWithPyTorch,
  loadSamplePlate,
  setGeminiApiKey,
  getGeminiApiKey,
  correctDishOnline,
  getVlmConfig,
  setVlmConfig,
} from '../../utils/foodAnalyzerService';
import { saveFoodEntry, getFoodDiary, deleteFoodEntry } from '../../utils/storage';
import { speakInstruction, soundEffects } from '../../utils/voiceCoach';

export default function FoodAnalyzer() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'library' | 'diary'
  const [viewportMode, setViewportMode] = useState('upload'); // 'upload' | 'camera'
  const [viewChoice, setViewChoice] = useState('split'); // 'split' | 'slider' | 'heatmap' | 'original'
  const [sliderPos, setSliderPos] = useState(50); // 0-100% for Grad-CAM comparison slider

  // Model & Server Status
  const [serverHealth, setServerHealth] = useState({ online: false, model: 'YOLOv8m + VLM Hybrid' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [vlmProviderMode, setVlmProviderMode] = useState('auto');
  const [vlmStatusInfo, setVlmStatusInfo] = useState(null);

  // Manual Food Correction State
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correctionInput, setCorrectionInput] = useState('');

  // Analysis & Image State — INITIAL STATE IS EMPTY! (No pre-loaded pizza)
  const [analysis, setAnalysis] = useState(null);
  const [customImageSrc, setCustomImageSrc] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [plateDiameter, setPlateDiameter] = useState(16.0);
  const [portionGrams, setPortionGrams] = useState(180);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStage, setScanStage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Diary & Hydration
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [waterMl, setWaterMl] = useState(1250);

  // Library Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Camera & File Input Refs
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Notification Toast Helper
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Initial Load: Check server health & load diary ONLY (starts completely empty)
  useEffect(() => {
    checkServerHealth().then((health) => {
      setServerHealth(health);
    });
    const key = getGeminiApiKey();
    if (key) setGeminiKeyInput(key);
    getVlmConfig().then((cfg) => {
      if (cfg) {
        setVlmStatusInfo(cfg);
        if (cfg.preferred_mode) setVlmProviderMode(cfg.preferred_mode);
      }
    });
    loadDiary();
  }, []);

  const loadDiary = async () => {
    try {
      const entries = await getFoodDiary();
      if (Array.isArray(entries)) {
        setDiaryEntries(entries);
      }
    } catch (e) {
      console.warn('Failed to load food diary:', e);
    }
  };

  // Re-check server on demand
  const handleRefreshServer = async () => {
    showToast('Checking Hybrid Food Recognition API on port 5050...');
    const health = await checkServerHealth();
    setServerHealth(health);
    const cfg = await getVlmConfig();
    if (cfg) setVlmStatusInfo(cfg);

    if (health.online) {
      showToast('🟢 Hybrid AI Server (YOLOv8 + VLM) online & ready!');
    } else {
      showToast('⚪ Backend Server offline. Start via start_backend.bat');
    }
  };

  // Trigger File Input Click (for Upload / Change Photo)
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // File Upload Handling
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result;
      setCustomImageSrc(src);
      setUploadedFileName(file.name);
      setAnalysis(null); // Reset previous analysis on new photo upload
      setViewportMode('upload');
      setErrorMsg(null);
      showToast('📸 Photo loaded! Click "Scan Meal with PyTorch AI" to analyze.');
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImageSrc(event.target?.result);
        setUploadedFileName(file.name);
        setAnalysis(null);
        setViewportMode('upload');
        setErrorMsg(null);
        showToast('📸 Meal photo loaded! Tap "Scan Meal with PyTorch AI".');
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMsg('Please drop an image file (JPG, PNG, WebP).');
    }
  };

  // Reset / Clear Photo Back to Empty State
  const handleResetPhoto = () => {
    setCustomImageSrc(null);
    setAnalysis(null);
    setUploadedFileName('');
    setErrorMsg(null);
    showToast('Photo cleared. Ready for new upload.');
  };

  // Select Sample Demo Plate (User-initiated only)
  const handleSelectSample = (sample) => {
    const loaded = loadSamplePlate(sample.id, plateDiameter);
    setAnalysis(loaded);
    setPortionGrams(loaded.totals.weight_g);
    setCustomImageSrc(sample.image || null);
    setUploadedFileName(`${sample.name}.jpg`);
    showToast(`Loaded ${sample.name} demonstration plate`);
    try {
      soundEffects.playFormMilestone();
    } catch (e) {}
  };

  // Capture Snapshot from Webcam
  const handleCaptureCamera = () => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (screenshot) {
      setCustomImageSrc(screenshot);
      setUploadedFileName('webcam_snapshot.jpg');
      setViewportMode('upload');
      setAnalysis(null);
      showToast('Photo captured! Running PyTorch neural inference...');
      runInference(screenshot);
    }
  };

  // Trigger Inference
  const runInference = async (imgSource) => {
    const targetImg = imgSource || customImageSrc;
    if (!targetImg) {
      setErrorMsg('Please upload a photo, choose a demo plate, or snap with webcam.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setScanStage('Initializing YOLOv8m food detector (256 classes)...');

    const timer1 = setTimeout(() => {
      setScanStage('Extracting multi-scale bounding features & confidence scores...');
    }, 400);

    const timer2 = setTimeout(() => {
      setScanStage('Evaluating confidence & checking VLM fallback routing...');
    }, 900);

    try {
      const result = await classifyWithPyTorch(targetImg, plateDiameter);
      setAnalysis(result);
      if (result.totals?.weight_g) {
        setPortionGrams(result.totals.weight_g);
      }
      showToast(`🎯 Classified: ${result.plate_name}`);
      try {
        soundEffects.playFanfare();
      } catch (e) {}
    } catch (err) {
      console.warn('Food inference error:', err);
      setErrorMsg(`Inference notice: ${err.message}.`);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsAnalyzing(false);
      setScanStage('');
    }
  };

  // Manual Food Correction Handler
  const handleManualCorrection = async (e) => {
    e.preventDefault();
    if (!correctionInput.trim() || !analysis?.dishes?.[0]) return;
    const targetDish = analysis.dishes[0];

    try {
      const corrected = await correctDishOnline(targetDish.id, correctionInput.trim(), portionGrams, plateDiameter);
      if (corrected) {
        const updatedDishes = [corrected, ...analysis.dishes.slice(1)];
        const totCal = updatedDishes.reduce((a, d) => a + d.calories, 0);
        const totPro = updatedDishes.reduce((a, d) => a + d.protein, 0);
        const totCarb = updatedDishes.reduce((a, d) => a + d.carbs, 0);
        const totFat = updatedDishes.reduce((a, d) => a + d.fat, 0);
        const totW = updatedDishes.reduce((a, d) => a + d.weight_g, 0);
        const score = calculateNutriScore(totCal, totPro, totCarb, totFat);

        setAnalysis({
          ...analysis,
          plate_name: `${corrected.icon || '🍲'} ${corrected.name}`,
          cuisine: corrected.cuisine || analysis.cuisine,
          dishes: updatedDishes,
          totals: {
            calories: Math.round(totCal * 10) / 10,
            protein: Math.round(totPro * 10) / 10,
            carbs: Math.round(totCarb * 10) / 10,
            fat: Math.round(totFat * 10) / 10,
            weight_g: Math.round(totW * 10) / 10,
          },
          nutriScore: score,
          micronutrients: corrected.micronutrients || analysis.micronutrients,
        });
        setIsCorrecting(false);
        setCorrectionInput('');
        showToast(`✅ Food corrected to: ${corrected.name}`);
      } else {
        // Local calculation fallback
        const nutr = calculateFoodNutrition(correctionInput.trim(), portionGrams);
        const updatedDish = {
          ...targetDish,
          name: nutr.name,
          food: correctionInput.trim().toLowerCase(),
          icon: nutr.icon,
          calories: nutr.calories,
          protein: nutr.protein,
          carbs: nutr.carbs,
          fat: nutr.fat,
          fiber: nutr.fiber,
          recognition_badge: '✏️ User Corrected',
          recognition_source: 'user_correction',
          nutrition_source: 'database_derived',
          is_visually_estimated: false,
        };
        const updatedDishes = [updatedDish, ...analysis.dishes.slice(1)];
        const totCal = updatedDishes.reduce((a, d) => a + d.calories, 0);
        const totPro = updatedDishes.reduce((a, d) => a + d.protein, 0);
        const totCarb = updatedDishes.reduce((a, d) => a + d.carbs, 0);
        const totFat = updatedDishes.reduce((a, d) => a + d.fat, 0);

        setAnalysis({
          ...analysis,
          plate_name: `${nutr.icon} ${nutr.name}`,
          dishes: updatedDishes,
          totals: {
            calories: Math.round(totCal * 10) / 10,
            protein: Math.round(totPro * 10) / 10,
            carbs: Math.round(totCarb * 10) / 10,
            fat: Math.round(totFat * 10) / 10,
            weight_g: portionGrams,
          },
          nutriScore: calculateNutriScore(totCal, totPro, totCarb, totFat),
          micronutrients: nutr.micronutrients,
        });
        setIsCorrecting(false);
        setCorrectionInput('');
        showToast(`✅ Food corrected to: ${nutr.name}`);
      }
    } catch (err) {
      console.warn('Correction error:', err);
    }
  };

  // VLM Config Save Handler
  const handleSaveVlmConfig = async () => {
    setGeminiApiKey(geminiKeyInput);
    const updated = await setVlmConfig(vlmProviderMode, geminiKeyInput);
    if (updated) {
      setVlmStatusInfo(updated.current_status);
    }
    setIsSettingsOpen(false);
    showToast('⚙️ AI Vision Engine settings saved!');
  };

  // Dynamic Portion Rescaling
  const handlePortionChange = (newGrams) => {
    const grams = Number(newGrams);
    setPortionGrams(grams);

    if (analysis && analysis.dishes?.[0]) {
      const primaryFood = analysis.dishes[0].food;
      const nutr = calculateFoodNutrition(primaryFood, grams);
      const score = calculateNutriScore(nutr.calories, nutr.protein, nutr.carbs, nutr.fat);

      const updatedDishes = [
        {
          ...analysis.dishes[0],
          weight_g: grams,
          calories: nutr.calories,
          protein: nutr.protein,
          carbs: nutr.carbs,
          fat: nutr.fat,
          fiber: nutr.fiber,
        },
      ];

      setAnalysis({
        ...analysis,
        dishes: updatedDishes,
        totals: {
          calories: nutr.calories,
          protein: nutr.protein,
          carbs: nutr.carbs,
          fat: nutr.fat,
          weight_g: grams,
        },
        nutriScore: score,
        micronutrients: nutr.micronutrients,
      });
    }
  };

  // Spoken Voice Feedback
  const handleVoiceFeedback = () => {
    if (!analysis) return;
    const msg = `${analysis.plate_name}. Caloric yield: ${Math.round(analysis.totals.calories)} calories, ${Math.round(analysis.totals.protein)} grams protein, ${Math.round(analysis.totals.carbs)} grams carbohydrates. ${analysis.athletic_verdict}`;
    speakInstruction(msg);
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    if (!analysis) return;
    const summary = `FitVision AI Meal Scan: ${analysis.plate_name}
Portion: ${portionGrams}g
Calories: ${Math.round(analysis.totals.calories)} kcal
Protein: ${Math.round(analysis.totals.protein)}g
Carbs: ${Math.round(analysis.totals.carbs)}g
Fat: ${Math.round(analysis.totals.fat)}g
Nutri-Score: ${analysis.nutriScore?.grade || 'A'}`;
    navigator.clipboard?.writeText(summary);
    showToast('📋 Nutrition breakdown copied to clipboard!');
  };

  // Log to Diary
  const handleLogToDiary = async () => {
    if (!analysis) return;
    const entry = {
      id: `meal_${Date.now()}`,
      name: analysis.plate_name,
      mealType: 'Meal Scan',
      calories: analysis.totals.calories,
      protein: analysis.totals.protein,
      carbs: analysis.totals.carbs,
      fat: analysis.totals.fat,
      timestamp: Date.now(),
    };

    try {
      await saveFoodEntry(entry);
      setDiaryEntries((prev) => [entry, ...prev]);
      showToast('🎉 Meal successfully logged to Daily Diary!');
      try {
        soundEffects.playRepSuccess();
      } catch (e) {}
    } catch (e) {
      showToast('Error saving to diary');
    }
  };

  // Delete Diary Entry
  const handleDeleteDiaryItem = async (id) => {
    try {
      await deleteFoodEntry(id);
      setDiaryEntries((prev) => prev.filter((item) => item.id !== id));
      showToast('Meal removed from diary');
    } catch (e) {}
  };

  // Filtered Food-101 Database items
  const filteredFoodList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return Object.entries(FOOD101_DATABASE).filter(([key, item]) => {
      const matchQuery = !q || item.name.toLowerCase().includes(q) || key.includes(q);
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [searchQuery, selectedCategory]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set(Object.values(FOOD101_DATABASE).map((d) => d.category));
    return ['All', ...Array.from(cats).sort()];
  }, []);

  return (
    <div className="food-studio-container">
      {/* ------------------------------------------------------------------
          Top Header Bar
          ------------------------------------------------------------------ */}
      <header className="fa-top-header">
        <div className="fa-title-group">
          <h1>
            <span className="fa-title-icon">🥗</span> Food Vision &amp; Nutrition Studio
          </h1>
          <p>
            Hybrid AI Food Recognition: YOLOv8m (256 classes) + VLM Fallback (Gemini / Moondream)
          </p>
        </div>

        <div className="fa-header-badges">
          <button
            type="button"
            className="fa-server-status-pill"
            onClick={handleRefreshServer}
            title="Click to re-ping Hybrid Backend on Port 5050"
          >
            <span className={`fa-status-dot ${serverHealth.online ? 'online' : 'offline'}`} />
            <span>
              {serverHealth.online ? 'Hybrid Server: Online (5050)' : 'Server: Offline'}
            </span>
          </button>

          <span className="fa-meta-badge">⚡ YOLOv8m (256 Classes)</span>
          <span className="fa-meta-badge">🔮 VLM Fallback Active</span>

          <button
            type="button"
            className="fa-voice-btn"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
            title="Open AI Engine Settings"
            style={{ padding: '6px 14px' }}
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------
          Navigation Tabs Bar
          ------------------------------------------------------------------ */}
      <nav className="fa-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'scanner'}
          className={`fa-tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveTab('scanner')}
        >
          <span>📸</span> Spatial Plate Scanner &amp; Diagnostics
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'library'}
          className={`fa-tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <span>📖</span> UEC-256 Food &amp; Density Matrix
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'diary'}
          className={`fa-tab-btn ${activeTab === 'diary' ? 'active' : ''}`}
          onClick={() => setActiveTab('diary')}
        >
          <span>📋</span> Clinical Meal Diary &amp; Hydration
        </button>
      </nav>

      {/* ------------------------------------------------------------------
          TAB 1: AI Scanner & Grad-CAM Visualizer
          ------------------------------------------------------------------ */}
      {activeTab === 'scanner' && (
        <section aria-label="AI Food Scanner" className="fa-scanner-tab-section">
          {/* Hidden File Input (Used by "Upload Photo" & "Change Photo") */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          {/* Error Banner */}
          {errorMsg && (
            <div className="fa-alert-banner">
              <span>⚠️ {errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="fa-alert-close"
              >
                ✕
              </button>
            </div>
          )}

          {/* Offline Notice (if analysis was performed offline) */}
          {analysis?.is_offline_simulation && (
            <div className="fa-notice-banner">
              <span>ℹ️ {analysis.explanation}</span>
              <button type="button" className="fa-notice-btn" onClick={handleRefreshServer}>
                🔄 Check Backend
              </button>
            </div>
          )}

          {/* ==============================================================
              CASE A: EMPTY STATE (No photo uploaded yet)
              ============================================================== */}
          {!customImageSrc && viewportMode !== 'camera' ? (
            <div
              className={`fa-empty-hero-canvas ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="fa-radar-reticle">
                <div className="fa-radar-ping" />
                <div className="fa-radar-core">📸</div>
              </div>

              <h2 className="fa-empty-title">Upload Your Meal Photo</h2>
              <p className="fa-empty-subtitle">
                Drag and drop your food picture here, or browse from your device. PyTorch will recognize the dish across 101 classes, estimate caloric &amp; macronutrient yield, and compute explainable Grad-CAM activation heatmaps.
              </p>

              <div className="fa-empty-cta-group">
                <button
                  type="button"
                  className="fa-btn-upload-primary"
                  onClick={triggerFileInput}
                >
                  <span>📁</span> Select Photo from Device
                </button>

                <button
                  type="button"
                  className="fa-btn-camera-secondary"
                  onClick={() => setViewportMode('camera')}
                >
                  <span>📷</span> Open Live Webcam
                </button>
              </div>

              <div className="fa-drop-canvas-hint">
                <span>or drag &amp; drop meal photo anywhere onto this canvas</span>
                <span className="fa-format-pill">JPG • PNG • WebP • Auto-Resized for Neural Net</span>
              </div>

              <div className="fa-capabilities-strip">
                <div className="fa-cap-item">
                  <span className="fa-cap-icon">⚡</span>
                  <div>
                    <strong>256 YOLO Classes</strong>
                    <span>Fast YOLOv8m Neural Net</span>
                  </div>
                </div>

                <div className="fa-cap-item">
                  <span className="fa-cap-icon">🔮</span>
                  <div>
                    <strong>VLM AI Fallback</strong>
                    <span>Gemini Vision &amp; Moondream</span>
                  </div>
                </div>

                <div className="fa-cap-item">
                  <span className="fa-cap-icon">🥗</span>
                  <div>
                    <strong>Nutri-Score &amp; Macros</strong>
                    <span>Calories, Protein, Carbs, Fat</span>
                  </div>
                </div>

                <div className="fa-cap-item">
                  <span className="fa-cap-icon">⚖️</span>
                  <div>
                    <strong>Portion Calibrator</strong>
                    <span>Interactive weight scaling</span>
                  </div>
                </div>
              </div>

              {/* Quick Sample Demo Plates (Unselected presets for fast testing) */}
              <div className="fa-quick-demo-strip">
                <span className="fa-demo-strip-label">No meal picture handy? Test with a demo plate:</span>
                <div className="fa-demo-strip-pills">
                  {SAMPLE_PLATES.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      className="fa-demo-strip-pill"
                      onClick={() => handleSelectSample(sample)}
                      title={sample.description}
                    >
                      <span>{sample.icon}</span>
                      <span>{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ==============================================================
               CASE B: ACTIVE WORKSPACE (Photo uploaded or Camera active)
               ============================================================== */
            <div className="fa-workspace-grid">
              {/* Left Column: Visual Viewport & Studio Toolbar */}
              <div className="fa-panel-card">
                {/* Studio Toolbar (Photo Status + CHANGE PHOTO + Reset) */}
                <div className="fa-studio-toolbar">
                  <div className="fa-toolbar-left">
                    <span className="fa-photo-status-badge">
                      {analysis ? (
                        <>🟢 Analyzed • {analysis.plate_name}</>
                      ) : (
                        <>📷 Photo Ready • Tap Scan Meal</>
                      )}
                    </span>
                    {uploadedFileName && (
                      <span className="fa-filename-tag" title={uploadedFileName}>
                        {uploadedFileName}
                      </span>
                    )}
                  </div>

                  <div className="fa-toolbar-actions">
                    {/* KEY FEATURE: PROMINENT CHANGE PHOTO BUTTON */}
                    <button
                      type="button"
                      className="fa-tool-action-btn fa-change-photo-btn"
                      onClick={triggerFileInput}
                      title="Upload or choose a different photo"
                    >
                      <span>🔄</span> Change Photo
                    </button>

                    <button
                      type="button"
                      className={`fa-tool-action-btn ${viewportMode === 'camera' ? 'active' : ''}`}
                      onClick={() => setViewportMode(viewportMode === 'camera' ? 'upload' : 'camera')}
                      title="Toggle Webcam / Photo View"
                    >
                      <span>📷</span> {viewportMode === 'camera' ? 'View Photo' : 'Webcam'}
                    </button>

                    <button
                      type="button"
                      className="fa-tool-action-btn fa-clear-btn"
                      onClick={handleResetPhoto}
                      title="Clear photo and start over"
                    >
                      <span>✕</span> Clear
                    </button>
                  </div>
                </div>

                {/* Viewport Box */}
                <div
                  className={`fa-viewport-box ${customImageSrc || analysis?.gradcam_image ? 'has-image' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {viewportMode === 'camera' ? (
                    <div className="fa-camera-wrap">
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                        className="fa-webcam-video"
                      />
                      <button
                        type="button"
                        className="fa-camera-shutter-btn"
                        onClick={handleCaptureCamera}
                      >
                        📸 Capture &amp; Scan
                      </button>
                    </div>
                  ) : isAnalyzing ? (
                    /* Futuristic Scanning Animation Overlay */
                    <div className="fa-scanning-overlay">
                      {customImageSrc && <img src={customImageSrc} alt="Analyzing" className="fa-scan-bg-img" />}
                      <div className="fa-laser-scanline" />
                      <div className="fa-cyber-grid-overlay" />
                      <div className="fa-scan-pulse-reticle">
                        <div className="fa-radar-ping" />
                        <span>🧠</span>
                      </div>
                      <div className="fa-scan-status-text">
                        <strong>PyTorch EfficientNet-B2 Active</strong>
                        <span>{scanStage || 'Extracting deep feature activations...'}</span>
                      </div>
                    </div>
                  ) : analysis?.gradcam_image && customImageSrc ? (
                    /* Scanned Visualizer View Modes */
                    viewChoice === 'slider' ? (
                      /* Interactive Before/After Split Slider */
                      <div className="fa-slider-compare-container">
                        <img src={customImageSrc} alt="Original Meal" className="fa-slider-img-orig" />
                        <div
                          className="fa-slider-overlay-wrap"
                          style={{ clipPath: `inset(0 calc(100% - ${sliderPos}%) 0 0)` }}
                        >
                          <img src={analysis.gradcam_image} alt="Grad-CAM Heatmap" className="fa-slider-img-cam" />
                        </div>
                        <div className="fa-slider-divider-line" style={{ left: `${sliderPos}%` }}>
                          <div className="fa-slider-handle">↔</div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sliderPos}
                          onChange={(e) => setSliderPos(Number(e.target.value))}
                          className="fa-slider-range-input"
                          aria-label="Grad-CAM comparison slider"
                        />
                        <div className="fa-slider-legend">
                          <span className="fa-legend-tag left">🔥 Grad-CAM Heatmap</span>
                          <span className="fa-legend-tag right">📸 Original Photo</span>
                        </div>
                      </div>
                    ) : viewChoice === 'split' ? (
                      /* Side-by-Side Split View */
                      <div className="fa-side-by-side-wrap">
                        <div className="fa-side-pane">
                          <img src={customImageSrc} alt="Original Meal" />
                          <span className="fa-pane-tag">📸 Original Photo</span>
                        </div>
                        <div className="fa-side-pane">
                          <img src={analysis.gradcam_image} alt="Grad-CAM Heatmap" />
                          <span className="fa-pane-tag heatmap">🔥 Grad-CAM Heatmap</span>
                        </div>
                      </div>
                    ) : viewChoice === 'heatmap' ? (
                      /* Heatmap Only */
                      <div className="fa-single-view-wrap">
                        <img src={analysis.gradcam_image} alt="Grad-CAM Activation" className="fa-display-image" />
                        <span className="fa-pane-tag heatmap">🔥 Grad-CAM Attention Heatmap</span>
                      </div>
                    ) : (
                      /* Original Photo Only */
                      <div className="fa-single-view-wrap">
                        <img src={customImageSrc} alt="Original Meal" className="fa-display-image" />
                        <span className="fa-pane-tag">📸 Original Photo</span>
                      </div>
                    )
                  ) : customImageSrc ? (
                    /* Image loaded, awaiting scan */
                    <div className="fa-single-view-wrap">
                      <img src={customImageSrc} alt="Meal Preview" className="fa-display-image" />
                      <div className="fa-ready-tag">
                        <span>✨ Ready to Scan • Tap Button Below</span>
                      </div>
                    </div>
                  ) : (
                    <div className="fa-dropzone" onClick={triggerFileInput}>
                      <div className="fa-drop-icon">📸</div>
                      <div className="fa-drop-text">Drop meal photo here or click to browse</div>
                      <div className="fa-drop-sub">Accepts JPG, PNG, WebP meal pictures</div>
                    </div>
                  )}
                </div>

                {/* View Switcher Chips (when Grad-CAM exists) */}
                {analysis?.gradcam_image && customImageSrc && (
                  <div className="fa-view-switcher">
                    <button
                      type="button"
                      className={`fa-view-choice-btn ${viewChoice === 'split' ? 'active' : ''}`}
                      onClick={() => setViewChoice('split')}
                    >
                      ⚡ Side-by-Side
                    </button>
                    <button
                      type="button"
                      className={`fa-view-choice-btn ${viewChoice === 'slider' ? 'active' : ''}`}
                      onClick={() => setViewChoice('slider')}
                    >
                      ↔️ Slider Compare
                    </button>
                    <button
                      type="button"
                      className={`fa-view-choice-btn ${viewChoice === 'heatmap' ? 'active' : ''}`}
                      onClick={() => setViewChoice('heatmap')}
                    >
                      🔥 Grad-CAM Heatmap
                    </button>
                    <button
                      type="button"
                      className={`fa-view-choice-btn ${viewChoice === 'original' ? 'active' : ''}`}
                      onClick={() => setViewChoice('original')}
                    >
                      📸 Original
                    </button>
                  </div>
                )}

                {/* Plate Calibration Slider (When photo is present) */}
                {customImageSrc && !analysis && (
                  <div className="fa-plate-calibration-strip">
                    <div className="fa-calib-header">
                      <span>Plate Scale Calibration</span>
                      <strong>{plateDiameter} cm</strong>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="26"
                      step="1"
                      value={plateDiameter}
                      onChange={(e) => setPlateDiameter(Number(e.target.value))}
                      className="fa-calib-slider"
                    />
                    <div className="fa-calib-chips">
                      {[
                        { label: 'Small (14cm)', val: 14.0 },
                        { label: 'Standard (16cm)', val: 16.0 },
                        { label: 'Large (20cm)', val: 20.0 },
                        { label: 'Feast (24cm)', val: 24.0 },
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          className={`fa-calib-chip ${plateDiameter === p.val ? 'active' : ''}`}
                          onClick={() => setPlateDiameter(p.val)}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                {viewportMode === 'camera' ? (
                  <button
                    type="button"
                    className="fa-scan-action-btn"
                    onClick={handleCaptureCamera}
                    disabled={isAnalyzing}
                  >
                    <span>📸</span> Snap &amp; Classify with PyTorch
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`fa-scan-action-btn ${!analysis && customImageSrc ? 'pulse-glow' : ''}`}
                    onClick={() => runInference()}
                    disabled={isAnalyzing || !customImageSrc}
                  >
                    {isAnalyzing ? (
                      <span>⏳ Running EfficientNet-B2 Inference...</span>
                    ) : analysis ? (
                      <span>⚡ Re-Scan Meal with PyTorch AI</span>
                    ) : (
                      <span>⚡ Scan Meal with PyTorch AI</span>
                    )}
                  </button>
                )}
              </div>

              {/* Right Column: Diagnostic Telemetry & Nutritional Results */}
              <div className="fa-panel-card">
                {analysis ? (
                  <>
                    {/* VLM Fallback Activation Notification */}
                    {analysis.fallback_activated && (
                      <div className="fa-vlm-fallback-banner">
                        <div className="fa-vlm-banner-icon">🔮</div>
                        <div className="fa-vlm-banner-text">
                          <strong>Advanced AI Vision Model Activated</strong>
                          <span>
                            {analysis.fallback_reason ||
                              'YOLOv8 confidence threshold triggered. Multi-modal VLM analyzed this meal.'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Hero Dish Card */}
                    <div className="fa-dish-hero-card">
                      <div className="fa-dish-hero-title">
                        <span className="fa-hero-icon">{analysis.dishes?.[0]?.icon || '🍲'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                            <h2 className="fa-hero-name" style={{ margin: 0 }}>
                              {analysis.plate_name}
                            </h2>
                            <button
                              type="button"
                              className="fa-correct-btn"
                              onClick={() => {
                                setCorrectionInput(analysis.dishes?.[0]?.name || '');
                                setIsCorrecting(!isCorrecting);
                              }}
                              title="Manually correct food recognition"
                            >
                              ✏️ {isCorrecting ? 'Close' : 'Correct Food'}
                            </button>
                          </div>

                          {/* Manual Correction Inline Form */}
                          {isCorrecting && (
                            <form onSubmit={handleManualCorrection} className="fa-correction-form">
                              <input
                                type="text"
                                className="fa-correction-input"
                                placeholder="Type correct dish (e.g. Paneer Butter Masala, Roti, Dosa)..."
                                value={correctionInput}
                                onChange={(e) => setCorrectionInput(e.target.value)}
                                autoFocus
                              />
                              <button type="submit" className="fa-correction-save-btn">
                                Save
                              </button>
                              <button
                                type="button"
                                className="fa-correction-cancel-btn"
                                onClick={() => setIsCorrecting(false)}
                              >
                                Cancel
                              </button>
                            </form>
                          )}

                          <div className="fa-badge-row">
                            <span className="fa-recognition-badge-chip">
                              {analysis.recognition_badge || '⚡ YOLOv8 + VLM Hybrid'}
                            </span>
                            {analysis.cuisine && (
                              <span className="fa-cuisine-tag">
                                🌍 {analysis.cuisine}
                              </span>
                            )}
                            <span
                              className={`fa-source-badge-chip ${
                                analysis.dishes?.[0]?.is_visually_estimated ? 'estimated' : 'verified'
                              }`}
                            >
                              {analysis.dishes?.[0]?.is_visually_estimated
                                ? '👁️ Visually Estimated'
                                : '📋 Database Verified'}
                            </span>
                            <span className="fa-hero-confidence">
                              🎯 Match: {Math.round((analysis.dishes?.[0]?.confidence || 0.95) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* NutriScore Badge */}
                      <div className="fa-nutriscore-badge">
                        <span
                          className="fa-score-grade"
                          style={{ color: analysis.nutriScore?.color || '#10b981' }}
                        >
                          {analysis.nutriScore?.grade || 'A'}
                        </span>
                        <span className="fa-score-label">NutriScore</span>
                      </div>
                    </div>

                    {/* Visible Ingredients & Culinary Details (When provided by VLM or Extended DB) */}
                    {analysis.dishes?.[0] && (
                      (analysis.dishes[0].visible_ingredients?.length > 0 || analysis.dishes[0].cooking_method) && (
                        <div className="fa-dish-details-card">
                          {analysis.dishes[0].visible_ingredients?.length > 0 && (
                            <>
                              <div className="fa-details-label">Visible Key Ingredients</div>
                              <div className="fa-ingredients-wrap">
                                {analysis.dishes[0].visible_ingredients.map((ing, i) => (
                                  <span key={i} className="fa-ingredient-pill">
                                    {ing}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                          {analysis.dishes[0].cooking_method && (
                            <p className="fa-cooking-method-text">
                              🍳 <em>{analysis.dishes[0].cooking_method}</em>
                            </p>
                          )}
                        </div>
                      )
                    )}

                    {/* Portion Slider */}
                    <div className="fa-portion-control">
                      <div className="fa-portion-label-row">
                        <span>Portion Weight Calibration</span>
                        <strong className="fa-portion-value">{portionGrams}g</strong>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="800"
                        step="10"
                        value={portionGrams}
                        onChange={(e) => handlePortionChange(e.target.value)}
                        className="fa-portion-slider"
                      />
                      <div className="fa-portion-chips">
                        {[
                          { label: 'Snack (100g)', val: 100 },
                          { label: 'Normal (180g)', val: 180 },
                          { label: 'Gym (320g)', val: 320 },
                          { label: 'Hearty (500g)', val: 500 },
                        ].map((c) => (
                          <button
                            key={c.val}
                            type="button"
                            className={`fa-portion-chip ${portionGrams === c.val ? 'active' : ''}`}
                            onClick={() => handlePortionChange(c.val)}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4 Glowing Macro Cards */}
                    <div className="fa-macro-grid">
                      <div className="fa-macro-card cal">
                        <div className="fa-macro-name">Calories</div>
                        <div className="fa-macro-num">{Math.round(analysis.totals.calories)}</div>
                        <div className="fa-macro-sub">
                          <span>kcal</span>
                          <span>{Math.round((analysis.totals.calories / 2000) * 100)}% target</span>
                        </div>
                        <div className="fa-macro-bar">
                          <div
                            className="fa-macro-bar-fill cal"
                            style={{ width: `${Math.min(100, Math.round((analysis.totals.calories / 2000) * 100))}%` }}
                          />
                        </div>
                      </div>

                      <div className="fa-macro-card pro">
                        <div className="fa-macro-name">Protein</div>
                        <div className="fa-macro-num">{Math.round(analysis.totals.protein)}g</div>
                        <div className="fa-macro-sub">
                          <span>muscle fuel</span>
                          <span>{Math.round(analysis.totals.protein * 4)} kcal</span>
                        </div>
                        <div className="fa-macro-bar">
                          <div
                            className="fa-macro-bar-fill pro"
                            style={{ width: `${Math.min(100, Math.round((analysis.totals.protein / 150) * 100))}%` }}
                          />
                        </div>
                      </div>

                      <div className="fa-macro-card carb">
                        <div className="fa-macro-name">Carbs</div>
                        <div className="fa-macro-num">{Math.round(analysis.totals.carbs)}g</div>
                        <div className="fa-macro-sub">
                          <span>glycogen</span>
                          <span>{Math.round(analysis.totals.carbs * 4)} kcal</span>
                        </div>
                        <div className="fa-macro-bar">
                          <div
                            className="fa-macro-bar-fill carb"
                            style={{ width: `${Math.min(100, Math.round((analysis.totals.carbs / 250) * 100))}%` }}
                          />
                        </div>
                      </div>

                      <div className="fa-macro-card fat">
                        <div className="fa-macro-name">Fats</div>
                        <div className="fa-macro-num">{Math.round(analysis.totals.fat)}g</div>
                        <div className="fa-macro-sub">
                          <span>healthy lipids</span>
                          <span>{Math.round(analysis.totals.fat * 9)} kcal</span>
                        </div>
                        <div className="fa-macro-bar">
                          <div
                            className="fa-macro-bar-fill fat"
                            style={{ width: `${Math.min(100, Math.round((analysis.totals.fat / 70) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Top-5 PyTorch Predictions Spectrum */}
                    {analysis.top_predictions && analysis.top_predictions.length > 0 && (
                      <div className="fa-spectrum-card">
                        <div className="fa-spectrum-title">
                          <span>🔥 PyTorch Food-101 Probability Spectrum</span>
                          <span style={{ color: '#38bdf8' }}>Top Candidates</span>
                        </div>
                        {analysis.top_predictions.slice(0, 4).map((p, idx) => (
                          <div key={idx} className="fa-pred-row">
                            <span className="fa-pred-label">
                              {p.icon} {p.display_name}
                            </span>
                            <div className="fa-pred-bar-track">
                              <div
                                className="fa-pred-bar-fill"
                                style={{ width: `${Math.min(100, Math.round(p.confidence * 100))}%` }}
                              />
                            </div>
                            <span className="fa-pred-pct">
                              {Math.round(p.confidence * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Micronutrients Strip */}
                    {analysis.micronutrients && (
                      <div className="fa-micro-grid">
                        <div className="fa-micro-item">
                          🌾 Fiber: <strong>{analysis.micronutrients.fiber_g ?? '—'}g</strong>
                        </div>
                        <div className="fa-micro-item">
                          🧂 Sodium: <strong>{analysis.micronutrients.sodium_mg ?? '—'}mg</strong>
                        </div>
                        <div className="fa-micro-item">
                          ⚡ Potassium: <strong>{analysis.micronutrients.potassium_mg ?? '—'}mg</strong>
                        </div>
                        <div className="fa-micro-item">
                          🥛 Calcium: <strong>{analysis.micronutrients.calcium_mg ?? '—'}mg</strong>
                        </div>
                        <div className="fa-micro-item">
                          🩸 Iron: <strong>{analysis.micronutrients.iron_mg ?? '—'}mg</strong>
                        </div>
                        <div className="fa-micro-item">
                          🍊 Vitamin C: <strong>{analysis.micronutrients.vitamin_c_mg ?? '—'}mg</strong>
                        </div>
                      </div>
                    )}

                    {/* Athletic Coach Verdict Card */}
                    <div className="fa-coach-card">
                      <div className="fa-coach-header">
                        <span className="fa-coach-title">
                          <span>🎙️</span> Athletic Nutrition Coach
                        </span>
                        <button type="button" className="fa-voice-btn" onClick={handleVoiceFeedback}>
                          🔊 Listen
                        </button>
                      </div>
                      <p className="fa-coach-text">{analysis.athletic_verdict}</p>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="fa-bottom-actions">
                      <button type="button" className="fa-log-diary-btn" onClick={handleLogToDiary}>
                        <span>➕</span> Log to Daily Diary
                      </button>
                      <button type="button" className="fa-secondary-btn" onClick={triggerFileInput}>
                        <span>🔄</span> Change Photo
                      </button>
                      <button type="button" className="fa-copy-btn" onClick={handleCopySummary} title="Copy summary">
                        📋 Copy
                      </button>
                    </div>
                  </>
                ) : (
                  /* Photo is uploaded, but not yet analyzed */
                  <div className="fa-pending-analysis-card">
                    <div className="fa-pending-icon-wrap">
                      <div className="fa-radar-ping" />
                      <span className="fa-pending-icon">🧠</span>
                    </div>
                    <h3 className="fa-pending-title">Ready for PyTorch Classification</h3>
                    <p className="fa-pending-desc">
                      Your meal photo is calibrated. Tap <strong>"Scan Meal with PyTorch AI"</strong> to extract deep convolutional activations and calculate complete nutritional diagnostics.
                    </p>

                    <div className="fa-pending-features-list">
                      <div className="fa-pending-feature">
                        <span>✓</span> 101-dish neural classification &amp; confidence ranking
                      </div>
                      <div className="fa-pending-feature">
                        <span>✓</span> Explainable Grad-CAM activation heatmap
                      </div>
                      <div className="fa-pending-feature">
                        <span>✓</span> Calorie, protein, carb &amp; healthy fat quantification
                      </div>
                      <div className="fa-pending-feature">
                        <span>✓</span> Nutri-Score calculation (Grades A through E)
                      </div>
                      <div className="fa-pending-feature">
                        <span>✓</span> Personalized athletic dietary recommendations
                      </div>
                    </div>

                    <button
                      type="button"
                      className="fa-btn-upload-primary"
                      onClick={() => runInference()}
                      style={{ width: '100%', marginTop: '16px' }}
                    >
                      <span>⚡</span> Run Neural Scan Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------
          TAB 2: Food-101 Macro Library
          ------------------------------------------------------------------ */}
      {activeTab === 'library' && (
        <section aria-label="Food Database">
          <div className="fa-library-header">
            <input
              type="text"
              className="fa-search-input"
              placeholder="Search 256 food items (e.g. rice, pizza, steak, ramen)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="fa-filter-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`fa-filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="fa-library-grid">
            {filteredFoodList.map(([key, item]) => (
              <div
                key={key}
                className="fa-lib-card"
                onClick={() => {
                  const sampleObj = {
                    id: `lib_${key}`,
                    name: item.name,
                    category: key,
                    icon: item.icon,
                    weight_g: item.portion_g,
                    image: `/sample_images/01_pizza.jpg`, // fallback image pointer
                  };
                  handleSelectSample(sampleObj);
                  setActiveTab('scanner');
                }}
              >
                <div className="fa-lib-card-top">
                  <span className="fa-lib-icon">{item.icon}</span>
                  <div>
                    <h3 className="fa-lib-name">{item.name}</h3>
                    <span className="fa-lib-category">{item.category}</span>
                  </div>
                </div>

                <div className="fa-lib-macros">
                  <span><strong>{item.calories}</strong> kcal</span>
                  <span><strong>{item.protein}g</strong> pro</span>
                  <span><strong>{item.carbs}g</strong> carb</span>
                  <span><strong>{item.fat}g</strong> fat</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------
          TAB 3: Meal Diary & Hydration Telemetry
          ------------------------------------------------------------------ */}
      {activeTab === 'diary' && (
        <section aria-label="Meal Diary & Hydration">
          {/* Hydration Telemetry Card */}
          <div className="fa-diary-summary-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>
                  💧 Athletic Hydration Telemetry
                </h3>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Daily intake: <strong>{waterMl} ml</strong> / Target: 3000 ml
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="fa-demo-strip-pill"
                  onClick={() => {
                    setWaterMl((w) => w + 250);
                    showToast('+250ml logged');
                  }}
                >
                  +250ml (Cup)
                </button>
                <button
                  type="button"
                  className="fa-demo-strip-pill"
                  onClick={() => {
                    setWaterMl((w) => w + 500);
                    showToast('+500ml logged');
                  }}
                >
                  +500ml (Bottle)
                </button>
              </div>
            </div>

            {/* Hydration progress bar */}
            <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.round((waterMl / 3000) * 100))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
                  borderRadius: '999px',
                }}
              />
            </div>
          </div>

          {/* Meals Logged */}
          <div className="fa-diary-summary-card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 800 }}>
              🍽️ Logged Meals Today ({diaryEntries.length})
            </h3>

            {diaryEntries.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                No meals logged today yet. Scan a meal in the Scanner tab and tap "Log to Daily Diary".
              </p>
            ) : (
              <div className="fa-diary-list">
                {diaryEntries.map((item) => (
                  <div key={item.id} className="fa-diary-item">
                    <div className="fa-diary-item-left">
                      <span style={{ fontSize: '24px' }}>🍽️</span>
                      <div>
                        <div className="fa-diary-item-name">{item.name}</div>
                        <span className="fa-diary-item-time">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="fa-diary-item-macros">
                      <span>🔥 {Math.round(item.calories)} kcal</span>
                      <span>🥩 {Math.round(item.protein)}g pro</span>
                      <span>🌾 {Math.round(item.carbs)}g carb</span>
                      <span>🥑 {Math.round(item.fat)}g fat</span>

                      <button
                        type="button"
                        className="fa-delete-entry-btn"
                        onClick={() => handleDeleteDiaryItem(item.id)}
                        title="Delete meal"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------
          AI Engine Settings Modal
          ------------------------------------------------------------------ */}
      {isSettingsOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            background: 'var(--fa-bg)',
            border: '1px solid var(--fa-card-border)',
            borderRadius: '18px',
            padding: '28px',
            width: '90%',
            maxWidth: '520px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                ⚙️ AI Vision Engine Configuration
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Close Settings"
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 700, color: '#93c5fd', marginBottom: '4px' }}>
                ⚡ Primary Neural Model: YOLOv8m (UEC-256)
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4 }}>
                Real-time YOLOv8 detector trained on 256 food classes with automatic Vision-Language Model fallback for uncatalogued, complex, or Indian dishes.
              </p>
            </div>

            {/* Provider Selection */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                Vision-Language Model (VLM) Fallback Mode
              </label>
              <select
                value={vlmProviderMode}
                onChange={(e) => setVlmProviderMode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid var(--fa-card-border)',
                  borderRadius: '10px',
                  color: '#fff',
                  boxSizing: 'border-box',
                  fontSize: '13px'
                }}
              >
                <option value="auto">Auto (Cloud Gemini Vision ➔ Local Ollama Moondream)</option>
                <option value="gemini">Cloud VLM (Google Gemini 1.5 Flash)</option>
                <option value="ollama">Local VLM (Ollama Moondream - Offline CPU)</option>
              </select>
            </div>

            {/* Live Provider Status */}
            {vlmStatusInfo && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--fa-card-border)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '18px',
                fontSize: '12px'
              }}>
                <div style={{ color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Engine Diagnostic Status:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ color: vlmStatusInfo.gemini_available ? '#34d399' : '#f87171' }}>
                    • Gemini Vision Cloud: {vlmStatusInfo.gemini_available ? '🟢 Ready (Key Configured)' : '⚪ Missing API Key'}
                  </div>
                  <div style={{ color: vlmStatusInfo.ollama_moondream_available ? '#34d399' : '#94a3b8' }}>
                    • Ollama Moondream Local: {vlmStatusInfo.ollama_moondream_available ? '🟢 Ready (Local Port 11434)' : '⚪ Daemon Standby'}
                  </div>
                  <div style={{ color: '#38bdf8' }}>
                    • Offline Vision Transformer: 🟢 Ready (Cached)
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                Gemini Vision API Key (Optional for Cloud VLM)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--fa-card-border)',
                  borderRadius: '10px',
                  color: '#fff',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Used for Cloud VLM recognition of uncatalogued Indian & international foods.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="fa-voice-btn"
                onClick={handleSaveVlmConfig}
              >
                Save &amp; Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMsg && <div className="fa-toast">{toastMsg}</div>}
    </div>
  );
}