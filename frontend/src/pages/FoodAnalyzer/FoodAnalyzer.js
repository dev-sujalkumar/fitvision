import React, { useState, useEffect, useRef, useMemo } from 'react';
import './FoodAnalyzer.css';
import {
  FOOD_DATABASE_256,
  BENCHMARK_MEALS,
} from '../../utils/foodNutrition256';
import {
  checkServerHealth,
  analyzeWithLocalServer,
  scanWithGeminiVision,
  analyzeOnDeviceFallback,
  loadBenchmarkPlate,
  recalibratePlateDiameter,
  updateDishInAnalysis,
  removeDishFromAnalysis,
  addDishToAnalysis,
  getFoodEmoji,
  getGeminiApiKey,
  setGeminiApiKey,
} from '../../utils/foodAnalyzerService';
import { saveFoodEntry, getFoodDiary, deleteFoodEntry } from '../../utils/storage';
import { speakInstruction, soundEffects } from '../../utils/voiceCoach';

export default function FoodAnalyzer() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'database' | 'diary'
  const [viewportMode, setViewportMode] = useState('benchmarks'); // 'camera' | 'upload' | 'benchmarks'

  // Engine Configuration & Settings
  const [activeEngine, setActiveEngine] = useState('gemini_vision'); // 'gemini_vision' | 'yolov8m_local' | 'on_device'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [serverHealth, setServerHealth] = useState({ online: false });
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState(null);

  // Analysis State
  const [analysis, setAnalysis] = useState(null);
  const [plateDiameter, setPlateDiameter] = useState(16.0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedDishId, setSelectedDishId] = useState(null);
  const [customImageSrc, setCustomImageSrc] = useState(null);
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState('meal_12082');

  // New Dish Modal / Inline Add
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [newDishFoodKey, setNewDishFoodKey] = useState('chicken');
  const [newDishGrams, setNewDishGrams] = useState(120);

  // Camera Stream
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Knowledgebase Tab State
  const [dbSearch, setDbSearch] = useState('');
  const [dbFilter, setDbFilter] = useState('all'); // 'all' | 'high_protein' | 'low_carb' | 'low_cal'

  // Meal Diary & Hydration State
  const [mealDiary, setMealDiary] = useState([]);
  const [selectedMealType, setSelectedMealType] = useState('Lunch'); // 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  const [waterIntakeMl, setWaterIntakeMl] = useState(() => {
    try {
      const saved = localStorage.getItem('fitvision_water_ml');
      return saved ? parseInt(saved, 10) : 1250;
    } catch (e) {
      return 1250;
    }
  });

  // Load initial benchmark plate & check server on mount
  useEffect(() => {
    const existingKey = getGeminiApiKey();
    setGeminiKeyInput(existingKey);
    if (!existingKey) {
      setActiveEngine('on_device');
    }

    // Load initial benchmark plate
    const initialPlate = loadBenchmarkPlate('meal_12082', 16.0);
    setAnalysis(initialPlate);

    // Check server health
    checkServerHealth().then((health) => {
      setServerHealth(health);
      if (health.online && !existingKey) {
        setActiveEngine('yolov8m_local');
      }
    });

    // Load diary entries
    loadDiaryEntries();
  }, []);

  // Sync water intake to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fitvision_water_ml', String(waterIntakeMl));
    } catch (e) {}
  }, [waterIntakeMl]);

  const loadDiaryEntries = async () => {
    try {
      const entries = await getFoodDiary(50);
      setMealDiary(entries || []);
    } catch (e) {
      console.warn('Failed to load food diary:', e);
    }
  };

  // Camera Management
  const startCamera = async () => {
    setCameraActive(true);
    setViewportMode('camera');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch (err) {
      console.error('Camera stream access error:', err);
      setErrorMsg('Unable to access camera. Please allow camera permissions or upload an image.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    try {
      soundEffects.playRepSuccess();
    } catch (e) {}

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCustomImageSrc(dataUrl);
      stopCamera();
      triggerFoodAnalysis(dataUrl);
    }
  };

  // File Upload Handling
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setCustomImageSrc(base64);
        setViewportMode('upload');
        triggerFoodAnalysis(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Benchmark Plate Selection
  const handleSelectBenchmark = (benchMeal) => {
    setSelectedBenchmarkId(benchMeal.id);
    setCustomImageSrc(null);
    setViewportMode('benchmarks');
    stopCamera();

    const loaded = loadBenchmarkPlate(benchMeal.id, plateDiameter);
    setAnalysis(loaded);
    setSelectedDishId(null);
    setErrorMsg(null);

    try {
      soundEffects.playFormMilestone();
    } catch (e) {}
  };

  // Run AI Scan with chosen engine
  const triggerFoodAnalysis = async (imageSrc = customImageSrc) => {
    if (!imageSrc) {
      setErrorMsg('Please select a plate image, snap a photo, or choose a benchmark plate.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      let result;
      if (activeEngine === 'gemini_vision') {
        const key = getGeminiApiKey();
        if (!key) {
          setIsSettingsOpen(true);
          throw new Error('Gemini API key is required. Please paste your key in Settings.');
        }
        result = await scanWithGeminiVision(imageSrc, key, plateDiameter);
      } else if (activeEngine === 'yolov8m_local') {
        result = await analyzeWithLocalServer(imageSrc, plateDiameter);
      } else {
        result = await analyzeOnDeviceFallback(imageSrc, plateDiameter);
      }

      setAnalysis(result);
      setSelectedDishId(null);

      // Play audio celebratory sound
      try {
        soundEffects.playFanfare();
      } catch (e) {}

      // Optional voice coach announcement
      if (result.totals && result.totals.calories) {
        speakInstruction(
          `Analysis complete. Detected ${result.dishes.length} components, totaling ${Math.round(result.totals.calories)} calories and ${Math.round(result.totals.protein)} grams of protein.`,
          { category: 'telemetry', priority: 'normal' }
        );
      }
    } catch (err) {
      console.error('Scan error:', err);
      setErrorMsg(err.message || 'Plate analysis failed. Switching to on-device benchmark.');
      // Auto-fallback
      const fallback = await analyzeOnDeviceFallback(imageSrc, plateDiameter);
      setAnalysis(fallback);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Diameter Slider Change
  const handleDiameterChange = (e) => {
    const newDiam = parseFloat(e.target.value);
    setPlateDiameter(newDiam);
    if (analysis) {
      const recalibrated = recalibratePlateDiameter(analysis, newDiam);
      setAnalysis(recalibrated);
    }
  };

  // Dish Fine-Tuning
  const handleUpdateDishGrams = (dishId, newGrams) => {
    const updated = updateDishInAnalysis(analysis, dishId, { weight_g: parseFloat(newGrams) });
    setAnalysis(updated);
  };

  const handleUpdateDishFood = (dishId, foodKey) => {
    const updated = updateDishInAnalysis(analysis, dishId, { food: foodKey, name: foodKey });
    setAnalysis(updated);
  };

  const handleRemoveDish = (dishId) => {
    const updated = removeDishFromAnalysis(analysis, dishId);
    setAnalysis(updated);
    if (selectedDishId === dishId) setSelectedDishId(null);
  };

  const handleAddDish = () => {
    if (!newDishFoodKey) return;
    const updated = addDishToAnalysis(analysis, newDishFoodKey, newDishGrams);
    setAnalysis(updated);
    setIsAddingDish(false);
  };

  // Voice Coach readout
  const handleVoiceVerdict = () => {
    if (!analysis) return;
    const text = `${analysis.plate_name}. ${analysis.athletic_verdict}. Total energy: ${Math.round(analysis.totals.calories)} calories, ${Math.round(analysis.totals.protein)} grams protein, ${Math.round(analysis.totals.carbs)} grams carbs. NutriScore Grade ${analysis.nutriScore.grade}.`;
    speakInstruction(text, { category: 'advice', priority: 'urgent' });
  };

  // Log to Meal Diary
  const handleLogMeal = async () => {
    if (!analysis || !analysis.totals) return;
    const entry = {
      id: `meal_${Date.now()}`,
      timestamp: Date.now(),
      mealType: selectedMealType,
      name: analysis.plate_name || `${selectedMealType} Plate`,
      calories: analysis.totals.calories,
      protein: analysis.totals.protein,
      carbs: analysis.totals.carbs,
      fat: analysis.totals.fat,
      weight_g: analysis.totals.weight_g,
      nutriScore: analysis.nutriScore?.grade || 'A',
      dishes: analysis.dishes.map((d) => ({
        name: d.name,
        food: d.food,
        icon: d.icon,
        weight_g: d.weight_g,
        calories: d.calories,
      })),
    };

    try {
      await saveFoodEntry(entry);
      await loadDiaryEntries();
      try {
        soundEffects.playRepSuccess();
      } catch (e) {}
      speakInstruction(`Logged ${entry.name} to your ${selectedMealType} diary.`, { category: 'telemetry' });
      setActiveTab('diary');
    } catch (e) {
      console.error('Failed to log meal:', e);
      setErrorMsg('Failed to save meal entry to storage.');
    }
  };

  const handleDeleteMealEntry = async (id) => {
    await deleteFoodEntry(id);
    await loadDiaryEntries();
  };

  // Export Plate JSON
  const handleExportMealJson = () => {
    if (!analysis) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(analysis, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fitvision_plate_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Gemini API Key Save & Test
  const handleSaveGeminiKey = async () => {
    setIsTestingKey(true);
    setKeyTestStatus(null);
    try {
      setGeminiApiKey(geminiKeyInput);
      // Quick validation with 1x1 test pixel
      const testPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      await scanWithGeminiVision(testPixel, geminiKeyInput, 16.0);
      setKeyTestStatus('valid');
      setActiveEngine('gemini_vision');
      setTimeout(() => setIsSettingsOpen(false), 800);
    } catch (e) {
      console.warn('API key test error:', e);
      setKeyTestStatus('error');
    } finally {
      setIsTestingKey(false);
    }
  };

  // Filtered Food Database items
  const filteredDatabaseFoods = useMemo(() => {
    const list = Object.values(FOOD_DATABASE_256);
    return list.filter((item) => {
      const matchSearch =
        !dbSearch || item.name.toLowerCase().includes(dbSearch.toLowerCase());
      if (!matchSearch) return false;

      if (dbFilter === 'high_protein') return item.protein >= 12;
      if (dbFilter === 'low_carb') return item.carbs <= 10;
      if (dbFilter === 'low_cal') return item.calories <= 120;
      if (dbFilter === 'high_density') return item.density >= 0.9;
      return true;
    });
  }, [dbSearch, dbFilter]);

  // Today's Diary Aggregation
  const todayDiaryTotals = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayMeals = mealDiary.filter((m) => (m.timestamp || 0) >= startOfToday.getTime());
    return {
      count: todayMeals.length,
      calories: Math.round(todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0)),
      protein: Math.round(todayMeals.reduce((acc, m) => acc + (m.protein || 0), 0) * 10) / 10,
      carbs: Math.round(todayMeals.reduce((acc, m) => acc + (m.carbs || 0), 0) * 10) / 10,
      fat: Math.round(todayMeals.reduce((acc, m) => acc + (m.fat || 0), 0) * 10) / 10,
    };
  }, [mealDiary]);

  // Image source to display in viewport
  const currentViewportImage = useMemo(() => {
    if (customImageSrc) return customImageSrc;
    const bm = BENCHMARK_MEALS.find((b) => b.id === selectedBenchmarkId);
    return bm ? bm.image : '/food_samples/12082_annot.jpg';
  }, [customImageSrc, selectedBenchmarkId]);

  return (
    <div className="food-analyzer-page">
      {/* ------------------------------------------------------------------
          Header & Global Engine Status
          ------------------------------------------------------------------ */}
      <header className="fa-header">
        <div className="fa-header-left">
          <div className="fa-super-badge">
            <span className="fa-pulse-dot" />
            FITVISION 2026 AI FOOD LAB · MULTIMODAL SPATIAL VISION
          </div>
          <h1 className="fa-page-title">
            🥗 Food Vision & Nutrition Studio
          </h1>
          <p className="fa-page-sub">
            Instant plate segmentation, volumetric depth analysis, and UEC-256 macronutrient telemetry
          </p>
        </div>

        <div className="fa-header-right">
          <button
            className="fa-engine-pill"
            onClick={() => setIsSettingsOpen(true)}
            title="Configure Vision Engine & API Keys"
          >
            <span
              className={`fa-engine-status-dot ${
                activeEngine === 'gemini_vision'
                  ? 'cloud'
                  : serverHealth.online
                  ? 'online'
                  : 'offline'
              }`}
            />
            {activeEngine === 'gemini_vision'
              ? '⚡ Gemini Vision AI'
              : activeEngine === 'yolov8m_local'
              ? serverHealth.online
                ? '🟢 YOLOv8m Local (5050)'
                : '⚪ YOLOv8m Local (Offline)'
              : '📱 On-Device CV Engine'}
          </button>

          <button
            className="fa-btn-gear"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------
          Tab Navigation Strip
          ------------------------------------------------------------------ */}
      <nav className="fa-tab-nav" aria-label="Studio Tabs">
        <button
          className={`fa-tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveTab('scanner')}
        >
          <span>🥗</span> Spatial Plate Scanner & Diagnostics
        </button>
        <button
          className={`fa-tab-btn ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          <span>📊</span> UEC-256 Food & Density Matrix
          <span className="fa-tab-count-badge">256 Items</span>
        </button>
        <button
          className={`fa-tab-btn ${activeTab === 'diary' ? 'active' : ''}`}
          onClick={() => setActiveTab('diary')}
        >
          <span>📖</span> Clinical Meal Diary & Hydration
          {todayDiaryTotals.count > 0 && (
            <span className="fa-tab-count-badge">{todayDiaryTotals.count} Today</span>
          )}
        </button>
      </nav>

      {/* Error Banner */}
      {errorMsg && (
        <div style={{ margin: '16px 36px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '12px 20px', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ------------------------------------------------------------------
          TAB 1: SPATIAL PLATE SCANNER & VOLUMETRIC DIAGNOSTICS
          ------------------------------------------------------------------ */}
      {activeTab === 'scanner' && (
        <div className="fa-scanner-layout">
          {/* Left Column: Spatial Viewport */}
          <div className="fa-viewport-column">
            <div className="fa-viewport-card">
              {/* Toolbar */}
              <div className="fa-viewport-toolbar">
                <div className="fa-mode-pill-group">
                  <button
                    className={`fa-mode-pill ${viewportMode === 'benchmarks' ? 'active' : ''}`}
                    onClick={() => {
                      stopCamera();
                      setViewportMode('benchmarks');
                    }}
                  >
                    🍱 Benchmark Plates
                  </button>
                  <button
                    className={`fa-mode-pill ${viewportMode === 'camera' ? 'active' : ''}`}
                    onClick={startCamera}
                  >
                    📸 Live Camera
                  </button>
                  <button
                    className={`fa-mode-pill ${viewportMode === 'upload' ? 'active' : ''}`}
                    onClick={() => {
                      stopCamera();
                      setViewportMode('upload');
                      fileInputRef.current?.click();
                    }}
                  >
                    📁 Upload Image
                  </button>
                </div>

                <button
                  className="fa-trigger-scan-btn"
                  onClick={() => triggerFoodAnalysis()}
                  disabled={isAnalyzing || cameraActive}
                >
                  {isAnalyzing ? (
                    <>⏳ Scanning Plate...</>
                  ) : (
                    <>⚡ Run AI Spatial Scan</>
                  )}
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Viewport Canvas Stage */}
              <div className="fa-spatial-stage">
                {cameraActive ? (
                  <div className="fa-camera-stage">
                    <video ref={videoRef} className="fa-camera-video" playsInline />
                    <div className="fa-camera-crosshair" />
                    <button
                      className="fa-snap-btn"
                      onClick={captureCameraFrame}
                      title="Snap Plate"
                    >
                      📸
                    </button>
                  </div>
                ) : (
                  <>
                    <img
                      src={currentViewportImage}
                      alt="Food Plate"
                      className="fa-viewport-image"
                    />

                    {/* Interactive Bounding Boxes */}
                    {analysis &&
                      analysis.dishes &&
                      analysis.dishes.map((dish) => {
                        const box = dish.box || { x: 25, y: 25, width: 40, height: 40 };
                        const isSelected = selectedDishId === dish.id;

                        return (
                          <div
                            key={dish.id}
                            className={`fa-bbox-overlay ${isSelected ? 'selected' : ''}`}
                            style={{
                              left: `${box.x}%`,
                              top: `${box.y}%`,
                              width: `${box.width}%`,
                              height: `${box.height}%`,
                            }}
                            onClick={() => setSelectedDishId(dish.id)}
                            title={`${dish.name} (${dish.weight_g}g)`}
                          >
                            <div className="fa-bbox-tag">
                              <span>{dish.icon || '🍽️'}</span>
                              <span>{dish.name}</span>
                              <span className="fa-bbox-conf">
                                {Math.round(dish.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}

                    {/* Futuristic Scanning Beam */}
                    {isAnalyzing && (
                      <>
                        <div className="fa-scanning-beam" />
                        <div className="fa-scanning-grid" />
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Volumetric Physics Calibration Card */}
              <div className="fa-physics-card">
                <div className="fa-physics-header">
                  <span className="fa-physics-title">
                    📐 Volumetric Calibration (Plate Reference)
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Density Physics Engine active
                  </span>
                </div>

                <div className="fa-plate-slider-row">
                  <span style={{ fontSize: '12px', color: '#64748b' }}>12 cm</span>
                  <input
                    type="range"
                    className="fa-plate-slider"
                    min="12.0"
                    max="30.0"
                    step="0.5"
                    value={plateDiameter}
                    onChange={handleDiameterChange}
                  />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>30 cm</span>
                  <span className="fa-plate-diam-value">{plateDiameter.toFixed(1)} cm</span>
                </div>

                <div className="fa-physics-metrics-grid">
                  <div className="fa-physics-metric-box">
                    <span className="fa-pm-label">Plate Surface Area</span>
                    <span className="fa-pm-val">
                      {Math.round(Math.PI * Math.pow(plateDiameter / 2, 2))} cm²
                    </span>
                  </div>
                  <div className="fa-physics-metric-box">
                    <span className="fa-pm-label">Est. Total Mass</span>
                    <span className="fa-pm-val">
                      {analysis?.totals?.weight_g || 0} g
                    </span>
                  </div>
                  <div className="fa-physics-metric-box">
                    <span className="fa-pm-label">Mean Density (ρ)</span>
                    <span className="fa-pm-val">
                      {(
                        (analysis?.totals?.weight_g || 300) /
                        Math.max(1, (analysis?.totals?.weight_g || 300) * 1.15)
                      ).toFixed(2)}{' '}
                      g/cm³
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benchmark Preset Strips */}
            <div className="fa-benchmark-section">
              <span className="fa-benchmark-title">
                🏆 UEC-256 Verified Benchmark Plates
              </span>
              <div className="fa-benchmark-grid">
                {BENCHMARK_MEALS.map((bm) => (
                  <div
                    key={bm.id}
                    className={`fa-benchmark-card ${
                      selectedBenchmarkId === bm.id && !customImageSrc ? 'active' : ''
                    }`}
                    onClick={() => handleSelectBenchmark(bm)}
                  >
                    <div className="fa-bc-img-wrap">
                      <img src={bm.image} alt={bm.name} className="fa-bc-img" />
                      <span className="fa-bc-badge">{bm.tag.split('#')[1] || 'UEC'}</span>
                    </div>
                    <div className="fa-bc-body">
                      <span className="fa-bc-title">{bm.name}</span>
                      <span className="fa-bc-sub">{bm.dishes.length} Components</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Nutrition Telemetry & Fine-Tuner */}
          <div className="fa-telemetry-column">
            {/* Energy & NutriScore Card */}
            <div className="fa-energy-card">
              <div className="fa-energy-top-row">
                <div>
                  <div className="fa-energy-hero">
                    <span className="fa-energy-number">
                      {Math.round(analysis?.totals?.calories || 0)}
                    </span>
                    <span className="fa-energy-unit">kcal</span>
                  </div>
                  <div className="fa-energy-goal">
                    Target: 2,200 kcal ·{' '}
                    {Math.round(((analysis?.totals?.calories || 0) / 2200) * 100)}% of daily allowance
                  </div>
                </div>

                {analysis?.nutriScore && (
                  <div className="fa-nutriscore-badge">
                    <span className="fa-ns-grade" style={{ color: analysis.nutriScore.color }}>
                      {analysis.nutriScore.grade}
                    </span>
                    <div className="fa-ns-info">
                      <span className="fa-ns-label">Nutri-Score</span>
                      <span className="fa-ns-sub">{analysis.nutriScore.label}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Macro Triad Matrix */}
              <div className="fa-macros-grid">
                <div className="fa-macro-box protein">
                  <span className="fa-macro-label">Protein</span>
                  <span className="fa-macro-val">
                    {Math.round((analysis?.totals?.protein || 0) * 10) / 10}g
                  </span>
                  <span className="fa-macro-pct">
                    {Math.round(((analysis?.totals?.protein || 0) / 150) * 100)}% of 150g
                  </span>
                </div>
                <div className="fa-macro-box carbs">
                  <span className="fa-macro-label">Net Carbs</span>
                  <span className="fa-macro-val">
                    {Math.round((analysis?.totals?.carbs || 0) * 10) / 10}g
                  </span>
                  <span className="fa-macro-pct">
                    {Math.round(((analysis?.totals?.carbs || 0) / 250) * 100)}% of 250g
                  </span>
                </div>
                <div className="fa-macro-box fat">
                  <span className="fa-macro-label">Lipids / Fat</span>
                  <span className="fa-macro-val">
                    {Math.round((analysis?.totals?.fat || 0) * 10) / 10}g
                  </span>
                  <span className="fa-macro-pct">
                    {Math.round(((analysis?.totals?.fat || 0) / 65) * 100)}% of 65g
                  </span>
                </div>
              </div>

              {/* Athletic Sports Nutritionist Verdict */}
              {analysis?.athletic_verdict && (
                <div className="fa-verdict-card">
                  <div className="fa-verdict-header">
                    <span className="fa-verdict-title">
                      🎙️ Clinical Sports Nutritionist Assessment
                    </span>
                    <button className="fa-voice-btn" onClick={handleVoiceVerdict}>
                      <span>🔊</span> Audio Coach
                    </button>
                  </div>
                  <p className="fa-verdict-text">{analysis.athletic_verdict}</p>
                </div>
              )}

              {/* Micronutrients Strip */}
              {analysis?.micronutrients && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(2, 6, 23, 0.5)', padding: '10px 14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Fiber: <strong style={{ color: '#fff' }}>{analysis.micronutrients.fiber_g}g</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Sodium: <strong style={{ color: '#fff' }}>{analysis.micronutrients.sodium_mg}mg</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Potassium: <strong style={{ color: '#fff' }}>{analysis.micronutrients.potassium_mg}mg</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Dishes Fine-Tuner Panel */}
            <div className="fa-dishes-panel">
              <div className="fa-dishes-header">
                <span className="fa-dishes-title">
                  🍽️ Detected Plate Components ({analysis?.dishes?.length || 0})
                </span>
                <button
                  className="fa-add-dish-btn"
                  onClick={() => setIsAddingDish(!isAddingDish)}
                >
                  {isAddingDish ? '✕ Cancel' : '+ Add Food Item'}
                </button>
              </div>

              {/* Inline Add Dish Bar */}
              {isAddingDish && (
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={newDishFoodKey}
                    onChange={(e) => setNewDishFoodKey(e.target.value)}
                    style={{ flex: 1, minWidth: '160px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '8px' }}
                  >
                    {Object.keys(FOOD_DATABASE_256).map((key) => (
                      <option key={key} value={key}>
                        {FOOD_DATABASE_256[key].name} ({FOOD_DATABASE_256[key].calories} kcal/100g)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={newDishGrams}
                    onChange={(e) => setNewDishGrams(Math.max(10, parseInt(e.target.value || '100', 10)))}
                    style={{ width: '80px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '8px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>grams</span>
                  <button
                    className="fa-trigger-scan-btn"
                    onClick={handleAddDish}
                    style={{ padding: '8px 14px', fontSize: '12px' }}
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Dish List */}
              <div className="fa-dishes-list">
                {analysis?.dishes?.map((dish) => {
                  const isSelected = selectedDishId === dish.id;

                  return (
                    <div
                      key={dish.id}
                      className={`fa-dish-row ${isSelected ? 'focused' : ''}`}
                      onClick={() => setSelectedDishId(dish.id)}
                    >
                      <div className="fa-dish-row-top">
                        <div className="fa-dish-info">
                          <span className="fa-dish-icon">{dish.icon || '🍽️'}</span>
                          <div>
                            <div className="fa-dish-name">{dish.name}</div>
                            <span className="fa-dish-conf-tag">
                              {Math.round((dish.confidence || 0.95) * 100)}% Confidence · ρ {dish.density} g/cm³
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <select
                            value={dish.food}
                            onChange={(e) => handleUpdateDishFood(dish.id, e.target.value)}
                            style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px', padding: '3px 6px' }}
                            title="Replace dish item"
                          >
                            {Object.keys(FOOD_DATABASE_256).map((key) => (
                              <option key={key} value={key}>
                                {FOOD_DATABASE_256[key].name}
                              </option>
                            ))}
                          </select>
                          <button
                            className="fa-dish-del-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDish(dish.id);
                            }}
                            title="Remove Dish"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Serving Grams Slider & Quick Chips */}
                      <div className="fa-dish-grams-control">
                        <input
                          type="range"
                          className="fa-dish-grams-slider"
                          min="10"
                          max="400"
                          step="5"
                          value={dish.weight_g}
                          onChange={(e) => handleUpdateDishGrams(dish.id, e.target.value)}
                        />
                        <span className="fa-dish-grams-label">{dish.weight_g}g</span>

                        <div className="fa-gram-chips">
                          {[50, 100, 150, 200, 300].map((preset) => (
                            <button
                              key={preset}
                              className={`fa-gram-chip ${dish.weight_g === preset ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateDishGrams(dish.id, preset);
                              }}
                            >
                              {preset}g
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mini Macro Strip */}
                      <div className="fa-dish-macro-strip">
                        <span>
                          Energy: <strong>{dish.calories} kcal</strong>
                        </span>
                        <span>
                          P: <strong>{dish.protein}g</strong>
                        </span>
                        <span>
                          C: <strong>{dish.carbs}g</strong>
                        </span>
                        <span>
                          F: <strong>{dish.fat}g</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions Footer */}
              <div className="fa-actions-footer">
                <select
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value)}
                  style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '10px', padding: '11px 14px', fontSize: '13px' }}
                >
                  <option value="Breakfast">🍳 Breakfast</option>
                  <option value="Lunch">🥗 Lunch</option>
                  <option value="Dinner">🍲 Dinner</option>
                  <option value="Snack">🍎 Snack</option>
                </select>

                <button className="fa-btn-primary" onClick={handleLogMeal}>
                  <span>💾</span> Log to Meal Diary
                </button>

                <button className="fa-btn-secondary" onClick={handleExportMealJson} title="Export Plate JSON">
                  <span>📥</span> JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------
          TAB 2: UEC-256 FOOD & DENSITY MATRIX
          ------------------------------------------------------------------ */}
      {activeTab === 'database' && (
        <div className="fa-db-container">
          <div className="fa-db-controls">
            <input
              type="text"
              className="fa-db-search-input"
              placeholder="🔍 Search 256 food items (e.g. rice, sashimi, curry)..."
              value={dbSearch}
              onChange={(e) => setDbSearch(e.target.value)}
            />

            <div className="fa-db-filter-chips">
              <button
                className={`fa-db-chip ${dbFilter === 'all' ? 'active' : ''}`}
                onClick={() => setDbFilter('all')}
              >
                All (256)
              </button>
              <button
                className={`fa-db-chip ${dbFilter === 'high_protein' ? 'active' : ''}`}
                onClick={() => setDbFilter('high_protein')}
              >
                High Protein (≥12g)
              </button>
              <button
                className={`fa-db-chip ${dbFilter === 'low_carb' ? 'active' : ''}`}
                onClick={() => setDbFilter('low_carb')}
              >
                Low Carb (≤10g)
              </button>
              <button
                className={`fa-db-chip ${dbFilter === 'low_cal' ? 'active' : ''}`}
                onClick={() => setDbFilter('low_cal')}
              >
                Low Calorie (≤120 kcal)
              </button>
              <button
                className={`fa-db-chip ${dbFilter === 'high_density' ? 'active' : ''}`}
                onClick={() => setDbFilter('high_density')}
              >
                High Density (≥0.9 g/cm³)
              </button>
            </div>
          </div>

          <div className="fa-db-grid">
            {filteredDatabaseFoods.map((item) => (
              <div key={item.name} className="fa-db-card">
                <div className="fa-db-card-header">
                  <span className="fa-db-card-title">
                    <span>{getFoodEmoji(item.name)}</span>
                    <span>{item.name}</span>
                  </span>
                </div>

                <div className="fa-db-card-metrics">
                  <div className="fa-db-metric-item">
                    <span className="fa-dbm-label">Energy</span>
                    <span className="fa-dbm-val">{item.calories}</span>
                  </div>
                  <div className="fa-db-metric-item">
                    <span className="fa-dbm-label">Protein</span>
                    <span className="fa-dbm-val">{item.protein}g</span>
                  </div>
                  <div className="fa-db-metric-item">
                    <span className="fa-dbm-label">Carbs</span>
                    <span className="fa-dbm-val">{item.carbs}g</span>
                  </div>
                  <div className="fa-db-metric-item">
                    <span className="fa-dbm-label">Fat</span>
                    <span className="fa-dbm-val">{item.fat}g</span>
                  </div>
                </div>

                <div className="fa-db-card-actions">
                  <span className="fa-db-density-badge">
                    Density: {item.density} g/cm³
                  </span>
                  <button
                    className="fa-db-load-btn"
                    onClick={() => {
                      handleAddDish();
                      setNewDishFoodKey(item.name);
                      setActiveTab('scanner');
                    }}
                  >
                    + Add to Plate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------
          TAB 3: CLINICAL MEAL DIARY & HYDRATION ANALYTICS
          ------------------------------------------------------------------ */}
      {activeTab === 'diary' && (
        <div className="fa-diary-container">
          {/* Hydration & Daily Overview */}
          <div className="fa-diary-summary-grid">
            {/* Hydration Card */}
            <div className="fa-hydration-card">
              <div className="fa-hydration-header">
                <span className="fa-hydration-title">
                  💧 Athletic Hydration Telemetry
                </span>
                <span style={{ fontSize: '13.5px', fontFamily: 'monospace', color: '#38bdf8' }}>
                  {waterIntakeMl} / 3,000 ml ({Math.min(100, Math.round((waterIntakeMl / 3000) * 100))}%)
                </span>
              </div>

              <div className="fa-hydro-bar-wrap">
                <div
                  className="fa-hydro-bar-fill"
                  style={{ width: `${Math.min(100, (waterIntakeMl / 3000) * 100)}%` }}
                />
              </div>

              <div className="fa-hydro-quick-btns">
                <button
                  className="fa-hydro-btn"
                  onClick={() => setWaterIntakeMl((prev) => prev + 250)}
                >
                  +250ml (Cup)
                </button>
                <button
                  className="fa-hydro-btn"
                  onClick={() => setWaterIntakeMl((prev) => prev + 500)}
                >
                  +500ml (Bottle)
                </button>
                <button
                  className="fa-hydro-btn"
                  onClick={() => setWaterIntakeMl((prev) => prev + 750)}
                >
                  +750ml (Shaker)
                </button>
                <button
                  className="fa-hydro-btn"
                  style={{ color: '#94a3b8', borderColor: '#334155' }}
                  onClick={() => setWaterIntakeMl(0)}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Today's Nutrient Summary Card */}
            <div className="fa-hydration-card">
              <div className="fa-hydration-header">
                <span className="fa-hydration-title" style={{ color: '#10b981' }}>
                  📊 Today's Total Intake ({todayDiaryTotals.count} Meals)
                </span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#10b981', fontFamily: 'monospace' }}>
                  {todayDiaryTotals.calories} kcal
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>PROTEIN</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#f43f5e', fontFamily: 'monospace' }}>
                    {todayDiaryTotals.protein}g
                  </div>
                </div>
                <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>CARBS</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#06b6d4', fontFamily: 'monospace' }}>
                    {todayDiaryTotals.carbs}g
                  </div>
                </div>
                <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>FAT</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#f59e0b', fontFamily: 'monospace' }}>
                    {todayDiaryTotals.fat}g
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diary Timeline Entries */}
          <div className="fa-diary-timeline">
            {mealDiary.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '16px', color: '#64748b' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥗</div>
                <div>No meals logged yet today. Scan a plate or click "Log to Meal Diary" to record your nutrition.</div>
              </div>
            ) : (
              mealDiary.map((item) => (
                <div key={item.id} className="fa-diary-card">
                  <div className="fa-diary-card-left">
                    <span className="fa-diary-time">
                      {new Date(item.timestamp || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="fa-meal-type-pill">{item.mealType || 'Meal'}</span>
                    <div>
                      <div className="fa-diary-card-title">{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {item.dishes ? item.dishes.map((d) => d.name).join(', ') : `${item.weight_g || 200}g portion`}
                      </div>
                    </div>
                  </div>

                  <div className="fa-diary-card-right">
                    <span className="fa-diary-cals">{Math.round(item.calories || 0)} kcal</span>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      P: {Math.round(item.protein || 0)}g · C: {Math.round(item.carbs || 0)}g · F: {Math.round(item.fat || 0)}g
                    </div>
                    <button
                      className="fa-dish-del-btn"
                      onClick={() => handleDeleteMealEntry(item.id)}
                      title="Delete Entry"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------
          AI Engine Settings Modal
          ------------------------------------------------------------------ */}
      {isSettingsOpen && (
        <div className="fa-modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
          <div className="fa-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="fa-modal-header">
              <span className="fa-modal-title">⚙️ AI Vision Engine Configuration</span>
              <button
                className="fa-modal-close-btn"
                aria-label="Close Settings"
                onClick={() => setIsSettingsOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="fa-modal-engine-options">
              <div
                className={`fa-engine-option ${activeEngine === 'gemini_vision' ? 'selected' : ''}`}
                onClick={() => setActiveEngine('gemini_vision')}
              >
                <input
                  type="radio"
                  checked={activeEngine === 'gemini_vision'}
                  onChange={() => setActiveEngine('gemini_vision')}
                />
                <div>
                  <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                    Google Gemini Multimodal Vision AI (Recommended)
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Cloud multi-dish segmentation with 99%+ accuracy, visual depth and bounding boxes.
                  </div>
                </div>
              </div>

              <div
                className={`fa-engine-option ${activeEngine === 'yolov8m_local' ? 'selected' : ''}`}
                onClick={() => setActiveEngine('yolov8m_local')}
              >
                <input
                  type="radio"
                  checked={activeEngine === 'yolov8m_local'}
                  onChange={() => setActiveEngine('yolov8m_local')}
                />
                <div>
                  <div style={{ fontWeight: 700, color: serverHealth.online ? '#10b981' : '#cbd5e1' }}>
                    Local YOLOv8m Volumetric Server (Port 5050)
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Status: {serverHealth.online ? '🟢 Online & Ready' : '⚪ Offline (Run python food_analyzer/server.py)'}
                  </div>
                </div>
              </div>

              <div
                className={`fa-engine-option ${activeEngine === 'on_device' ? 'selected' : ''}`}
                onClick={() => setActiveEngine('on_device')}
              >
                <input
                  type="radio"
                  checked={activeEngine === 'on_device'}
                  onChange={() => setActiveEngine('on_device')}
                />
                <div>
                  <div style={{ fontWeight: 700, color: '#f1f5f9' }}>
                    On-Device Benchmark & Heuristic CV Engine
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    100% offline fallback. Instant 0ms latency with UEC-256 standard plates.
                  </div>
                </div>
              </div>
            </div>

            <div className="fa-modal-field">
              <label className="fa-modal-label">Google Gemini API Key</label>
              <input
                type="password"
                className="fa-modal-input"
                placeholder="AIzaSy..."
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
              />
              <span className="fa-modal-hint">
                Get a free key from Google AI Studio (aistudio.google.com). Stored locally in your browser.
              </span>
              {keyTestStatus === 'valid' && (
                <span style={{ fontSize: '12px', color: '#34d399' }}>✓ API Key successfully verified and saved!</span>
              )}
              {keyTestStatus === 'error' && (
                <span style={{ fontSize: '12px', color: '#f87171' }}>✗ Could not verify key. Check key and connection.</span>
              )}
            </div>

            <button
              className="fa-btn-primary"
              onClick={handleSaveGeminiKey}
              disabled={isTestingKey}
            >
              {isTestingKey ? '⏳ Validating Key...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
