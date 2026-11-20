import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

// -----------------------------------------------------------------------------
// Interactive Food Items Showcase Data (Indian + International + Fitness)
// -----------------------------------------------------------------------------
const SHOWCASE_FOODS = {
  indian: [
    {
      id: 'paneer_butter_masala',
      name: 'Paneer Butter Masala',
      subtitle: 'North Indian Rich Gravy',
      image: '/food_showcase/paneer_butter_masala.jpg',
      badge: '🔮 VLM Recognized',
      badgeColor: '#a855f7',
      calories: 412,
      protein: 16.5,
      carbs: 14.2,
      fat: 32.8,
      fiber: 3.4,
      nutriScore: 'B',
      confidence: 98.4,
      weightGrams: 280,
      engine: 'Gemini 1.5 Flash VLM',
      ingredients: ['Fresh Paneer (Cottage Cheese)', 'Ripe Plum Tomatoes', 'Cashew Nut Puree', 'Grass-Fed Butter / Ghee', 'Kasuri Methi', 'Garam Masala'],
      cookingMethod: 'Slow Simmered / Sauteed',
      description: 'Cubes of cottage cheese cooked in a silky, mildly spiced tomato, butter, and cashew paste gravy.',
    },
    {
      id: 'dal_makhani',
      name: 'Dal Makhani',
      subtitle: 'Slow-Cooked Black Lentils',
      image: '/food_showcase/dal_makhani.jpg',
      badge: '🔮 VLM Recognized',
      badgeColor: '#a855f7',
      calories: 320,
      protein: 14.8,
      carbs: 38.6,
      fat: 12.4,
      fiber: 9.8,
      nutriScore: 'A',
      confidence: 97.2,
      weightGrams: 250,
      engine: 'Gemini 1.5 Flash VLM',
      ingredients: ['Whole Black Urad Dal', 'Red Kidney Beans (Rajma)', 'Pure Desi Ghee', 'Ginger-Garlic Puree', 'Kashmiri Chili', 'Fresh Cream'],
      cookingMethod: 'Overnight Slow Braise',
      description: 'Whole black lentils and kidney beans simmered overnight with aromatics and finished with tempered spices.',
    },
    {
      id: 'chicken_biryani',
      name: 'Hyderabadi Chicken Biryani',
      subtitle: 'Aromatic Dum Rice & Chicken',
      image: '/food_showcase/chicken_biryani.jpg',
      badge: '🧬 Hybrid AI Recognition',
      badgeColor: '#38bdf8',
      calories: 580,
      protein: 36.2,
      carbs: 64.0,
      fat: 18.5,
      fiber: 3.8,
      nutriScore: 'B',
      confidence: 96.8,
      weightGrams: 350,
      engine: 'YOLOv8 + Gemini VLM',
      ingredients: ['Aged Long-Grain Basmati Rice', 'Marinated Chicken Thighs', 'Caramelized Onions (Birista)', 'Saffron Milk', 'Mint & Coriander', 'Whole Cloves & Cardamom'],
      cookingMethod: 'Sealed Dum Pot Steaming',
      description: 'Fragrant basmati layered with tender spiced chicken, saffron essence, and golden fried onions.',
    },
    {
      id: 'samosa',
      name: 'Crispy Punjabi Samosa',
      subtitle: 'Spiced Potato & Pea Pastry',
      image: '/food_showcase/samosa.jpg',
      badge: '⚡ YOLOv8 Primary Path',
      badgeColor: '#10b981',
      calories: 262,
      protein: 4.8,
      carbs: 32.4,
      fat: 12.8,
      fiber: 2.6,
      nutriScore: 'C',
      confidence: 99.1,
      weightGrams: 110,
      engine: 'YOLOv8m (Class #68)',
      ingredients: ['Ajwain Infused Wheat Flour', 'Spiced Russet Potatoes', 'Green Peas', 'Pomegranate Seeds (Anardana)', 'Coriander Seeds', 'Mustard Oil'],
      cookingMethod: 'Crisp Deep Fried',
      description: 'Golden pyramid pastry filled with crushed spiced potatoes, green peas, and toasted cumin.',
    },
  ],
  fitness: [
    {
      id: 'caesar_salad',
      name: 'Mediterranean Grilled Chicken Salad',
      subtitle: 'High Protein · Lean Carb',
      image: '/food_showcase/caesar_salad.jpg',
      badge: '⚡ YOLOv8 Primary Path',
      badgeColor: '#10b981',
      calories: 340,
      protein: 38.5,
      carbs: 11.2,
      fat: 14.6,
      fiber: 6.2,
      nutriScore: 'A',
      confidence: 98.7,
      weightGrams: 320,
      engine: 'YOLOv8m (Class #15)',
      ingredients: ['Organic Romaine Hearts', 'Charbroiled Herb Chicken Breast', 'Extra Virgin Olive Oil', 'Shaved Aged Parmesan', 'Cherry Vine Tomatoes'],
      cookingMethod: 'Fire Grilled / Fresh Tossed',
      description: 'Nutrient-rich salad packed with lean chicken breast, antioxidant greens, and heart-healthy olive oil.',
    },
    {
      id: 'steak',
      name: 'Herb-Basted Tenderloin Steak',
      subtitle: 'Iron Rich · Zero Carb Protein',
      image: '/food_showcase/steak.jpg',
      badge: '⚡ YOLOv8 Primary Path',
      badgeColor: '#10b981',
      calories: 460,
      protein: 52.0,
      carbs: 0.8,
      fat: 26.4,
      fiber: 0.0,
      nutriScore: 'A',
      confidence: 99.4,
      weightGrams: 240,
      engine: 'YOLOv8m (Class #89)',
      ingredients: ['Prime Beef Tenderloin', 'Crushed Garlic Cloves', 'Fresh Garden Rosemary', 'Organic Grass-Fed Butter', 'Flaky Sea Salt', 'Black Peppercorn'],
      cookingMethod: 'Cast Iron Sear & Butter Basting',
      description: 'Pan-seared tenderloin cut basted in garlic and rosemary butter for optimal amino acid delivery.',
    },
    {
      id: 'pancakes',
      name: 'Whole Grain Protein Oat Pancakes',
      subtitle: 'Clean Morning Fuel',
      image: '/food_showcase/pancakes.jpg',
      badge: '⚡ YOLOv8 Primary Path',
      badgeColor: '#10b981',
      calories: 380,
      protein: 24.0,
      carbs: 52.0,
      fat: 8.5,
      fiber: 7.4,
      nutriScore: 'A',
      confidence: 97.9,
      weightGrams: 220,
      engine: 'YOLOv8m (Class #62)',
      ingredients: ['Rolled Oats Flour', 'Whey Isolate Protein', 'Free-Range Eggs', 'Almond Milk', 'Pure Maple Drizzle', 'Wild Blueberries'],
      cookingMethod: 'Griddle Baked',
      description: 'Fluffy whole-grain oat griddle cakes enhanced with isolate protein and natural blueberries.',
    },
  ],
  global: [
    {
      id: 'pizza',
      name: 'Artisan Neapolitan Pizza Margherita',
      subtitle: 'Wood-Fired Italian Classic',
      image: '/food_showcase/pizza.jpg',
      badge: '⚡ YOLOv8 Primary Path',
      badgeColor: '#10b981',
      calories: 640,
      protein: 28.0,
      carbs: 78.0,
      fat: 22.0,
      fiber: 4.8,
      nutriScore: 'B',
      confidence: 99.2,
      weightGrams: 340,
      engine: 'YOLOv8m (Class #66)',
      ingredients: ['Fermented Tipo 00 Dough', 'San Marzano Tomato Sauce', 'Fresh Buffalo Mozzarella', 'Sweet Genovese Basil', 'EVOO Drizzle'],
      cookingMethod: 'Wood-Fired Oven (450°C)',
      description: 'Slow-fermented artisan crust topped with volcanic San Marzano sauce and melted buffalo mozzarella.',
    },
    {
      id: 'ramen',
      name: 'Kyoto Shoyu Chashu Ramen',
      subtitle: 'Rich Broth & Handcrafted Noodles',
      image: '/food_showcase/ramen.jpg',
      badge: '⚡ YOLOv8 Primary Path',
      badgeColor: '#10b981',
      calories: 520,
      protein: 26.5,
      carbs: 62.0,
      fat: 18.2,
      fiber: 3.5,
      nutriScore: 'B',
      confidence: 98.6,
      weightGrams: 420,
      engine: 'YOLOv8m (Class #74)',
      ingredients: ['Hand-Pulled Alkaline Noodles', '12-Hour Bone Dashi Broth', 'Braised Chashu Pork Belly', 'Ajitsuke Tamago (Soy Egg)', 'Menma Bamboo Shoots', 'Nori Seaweed'],
      cookingMethod: 'Simmered Broth & Blanched Wheat',
      description: 'Rich artisanal noodle soup with deep umami broth, soft-centered marinated egg, and pork chashu.',
    },
    {
      id: 'sushi',
      name: 'Tokyo Nigiri & Sashimi Platter',
      subtitle: 'Omega-3 Rich Wild Salmon & Tuna',
      image: '/food_showcase/sushi.jpg',
      badge: '⚡ YOLOv8 Primary Path',
      badgeColor: '#10b981',
      calories: 360,
      protein: 32.0,
      carbs: 42.0,
      fat: 6.8,
      fiber: 1.8,
      nutriScore: 'A',
      confidence: 99.0,
      weightGrams: 260,
      engine: 'YOLOv8m (Class #88)',
      ingredients: ['Wild Atlantic Salmon', 'Pacific Yellowfin Tuna', 'Seasoned Koshihikari Rice', 'Aged Rice Vinegar', 'Shizuoka Real Wasabi', 'Pickled Gari'],
      cookingMethod: 'Master Knife Cut & Hand Pressed',
      description: 'Pristine raw seafood gently draped over seasoned vinegared sushi rice.',
    },
  ],
}

// -----------------------------------------------------------------------------
// Core Architecture Pillars Data
// -----------------------------------------------------------------------------
const AI_PILLARS = [
  {
    icon: '⚡',
    title: 'YOLOv8m Fast-Path Detector',
    badge: 'On-Device · < 45ms',
    color: '#10b981',
    description:
      'Trained on 256 food categories (UEC-FOOD256). Provides lightning-fast spatial bounding boxes, confidence scoring, and multi-dish localization directly on device.',
    stats: '256 Classes · 58.8MB Weights · 0.72 mAP',
  },
  {
    icon: '🔮',
    title: 'Google Gemini 1.5 Multimodal VLM',
    badge: 'Cloud Vision Fallback',
    color: '#38bdf8',
    description:
      'Automatically triggers when YOLO confidence drops below 50% or encounters unknown regional dishes. Recognizes authentic Indian curries, complex thalis, and unseen ingredients.',
    stats: 'Zero-Shot Recognition · 100+ Cuisines · Ingredient Breakdown',
  },
  {
    icon: '🦙',
    title: 'Moondream Local Edge VLM',
    badge: '100% Offline · Private',
    color: '#a855f7',
    description:
      'Runs locally via Ollama without internet. Inspects images on your CPU/GPU to understand dishes privately without transmitting sensitive meal data.',
    stats: 'Edge LLM · 1.8B Vision Weights · Zero Cloud Latency',
  },
  {
    icon: '📐',
    title: 'Volumetric Portion Engine',
    badge: 'Scientific Nutrition',
    color: '#f59e0b',
    description:
      'Calibrates food mass using standard plate diameters (25cm) and food-specific density tables. Computes macronutrients using the exact scientific scaling formula.',
    stats: 'Formula: (Nutrient / 100g) × Weight(g) / 100',
  },
]

// -----------------------------------------------------------------------------
// How It Works Steps
// -----------------------------------------------------------------------------
const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    icon: '📸',
    title: 'Upload or Snap Meal',
    text: 'Drag and drop any food photo, upload from your smartphone gallery, or snap directly with your webcam. Handles single items or crowded dining tables.',
  },
  {
    step: '02',
    icon: '🧠',
    title: 'Dual-Engine Neural Scan',
    text: 'YOLOv8m detects spatial bounding boxes in milliseconds. If a dish is unsupported or unknown, Gemini VLM analyzes ingredients, textures, and culinary styles.',
  },
  {
    step: '03',
    icon: '📊',
    title: 'Calibrated Nutrition & Diary',
    text: 'Receive calibrated gram weights, exact calories, protein, carbs, fats, NutriScore grade, and one-click logging to your offline IndexedDB food diary.',
  },
]

// -----------------------------------------------------------------------------
// Key Platform Features
// -----------------------------------------------------------------------------
const PLATFORM_FEATURES = [
  {
    icon: '🍛',
    title: 'Authentic Indian Food Detection',
    description: 'Expert recognition of Paneer Butter Masala, Dal Makhani, Biryani, Rajma Chawal, Chole Bhature, Dosa, Idli, Roti, and 50+ regional specialties.',
    tag: 'Deep Regional AI',
  },
  {
    icon: '🥗',
    title: 'Multi-Item Plate Segmentation',
    description: 'Simultaneously detects multiple food components on one plate with IoU spatial deduplication, avoiding double-counting.',
    tag: 'Spatial Vision',
  },
  {
    icon: '🔬',
    title: 'Ingredient & Cooking Analysis',
    description: 'Identifies visible ingredients (cashews, paneer, lentils, oils) and infers cooking styles (simmered, wood-fired, deep-fried, steamed).',
    tag: 'Multimodal VLM',
  },
  {
    icon: '⚖️',
    title: 'Adaptive Portion Calibration',
    description: 'Dynamic slider allows instant scaling from small snack (100g) to gym meal (320g) with live real-time macro recalculations.',
    tag: 'Portion Control',
  },
  {
    icon: '📓',
    title: 'Offline Food Diary & History',
    description: 'Logs all meals locally with IndexedDB persistence, macro targets, date filtering, and NutriScore analytics without data harvesting.',
    tag: '100% Private',
  },
  {
    icon: '🧘',
    title: 'Integrated Biomechanics Suite',
    description: 'Pair your nutrition with MoveNet Thunder AI real-time yoga posture analysis, voice coaching, rep counting, and video lab.',
    tag: 'Full-Stack Fitness',
  },
]

export default function Home() {
  const [activeShowcaseTab, setActiveShowcaseTab] = useState('indian')
  const [selectedFood, setSelectedFood] = useState(SHOWCASE_FOODS.indian[0])
  const [heroPortionWeight, setHeroPortionWeight] = useState(280) // grams
  const scanLaserActive = true

  // Intersection observer for silky smooth scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.12 }
    )

    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Switch showcase tab
  const handleTabChange = (tab) => {
    setActiveShowcaseTab(tab)
    setSelectedFood(SHOWCASE_FOODS[tab][0])
  }

  // Smooth scroll helper
  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Dynamically calculate nutrition based on hero portion weight
  const heroNutrients = useMemo(() => {
    const baseWeight = 280 // standard serving for Paneer Butter Masala
    const factor = heroPortionWeight / baseWeight
    return {
      calories: Math.round(412 * factor),
      protein: (16.5 * factor).toFixed(1),
      carbs: (14.2 * factor).toFixed(1),
      fat: (32.8 * factor).toFixed(1),
      fiber: (3.4 * factor).toFixed(1),
    }
  }, [heroPortionWeight])

  return (
    <div className="home-food-experience">
      {/* ---------------------------------------------------------------------
          SUB-HEADER / IN-PAGE NAVIGATION BAR
          --------------------------------------------------------------------- */}
      <nav className="food-brand-subnav">
        <div className="subnav-left">
          <div className="subnav-logo">
            <span className="subnav-logo-icon">🥗⚡</span>
            <div className="subnav-title-group">
              <span className="subnav-brand">FitVision</span>
              <span className="subnav-tag">AI FOOD INTELLIGENCE</span>
            </div>
          </div>
          <span className="subnav-version-badge">Hybrid Vision 2.0</span>
        </div>

        <div className="subnav-links">
          <button type="button" className="subnav-link" onClick={() => scrollToSection('hero')}>
            Overview
          </button>
          <button type="button" className="subnav-link" onClick={() => scrollToSection('architecture')}>
            Hybrid AI
          </button>
          <button type="button" className="subnav-link" onClick={() => scrollToSection('how-it-works')}>
            How It Works
          </button>
          <button type="button" className="subnav-link" onClick={() => scrollToSection('showcase')}>
            Cuisine AI
          </button>
          <button type="button" className="subnav-link" onClick={() => scrollToSection('dashboard-preview')}>
            Dashboard
          </button>
          <button type="button" className="subnav-link" onClick={() => scrollToSection('features')}>
            Features
          </button>
        </div>

        <div className="subnav-right">
          <Link to="/nutrition" className="subnav-cta-btn">
            <span>Scan Food</span>
            <span className="cta-arrow">→</span>
          </Link>
        </div>
      </nav>

      {/* ---------------------------------------------------------------------
          HERO SECTION: FUTURISTIC AI FOOD SCANNER
          --------------------------------------------------------------------- */}
      <section className="hero-food-section" id="hero">
        <div className="hero-food-content">
          <div className="hero-eyebrow-chip animate-on-scroll">
            <span className="eyebrow-pulse-dot" />
            <span>Dual YOLOv8m + Gemini 1.5 Multimodal VLM · Indian & Global Cuisines</span>
          </div>

          <h1 className="hero-main-title animate-on-scroll">
            Understand Every Bite
            <span className="hero-gradient-text"> With Precision AI</span>
          </h1>

          <p className="hero-description animate-on-scroll">
            Instantly decode calories, macronutrients, ingredients, and portion weights with computer vision.
            From single dishes to complex Indian thalis, FitVision fuses high-speed object detection with multimodal vision models.
          </p>

          <div className="hero-cta-group animate-on-scroll">
            <Link to="/nutrition" className="btn-hero-primary">
              <span className="btn-icon">🥗</span>
              <span>Analyze Your Food</span>
              <span className="btn-glow-ring" />
            </Link>

            <button
              type="button"
              className="btn-hero-secondary"
              onClick={() => scrollToSection('features')}
            >
              <span>Explore Features</span>
              <span className="btn-arrow-down">↓</span>
            </button>
          </div>

          {/* Quick Real-Time Telemetry Bar */}
          <div className="hero-telemetry-bar animate-on-scroll">
            <div className="telemetry-item">
              <span className="telemetry-val">256+</span>
              <span className="telemetry-label">YOLO Classes</span>
            </div>
            <div className="telemetry-divider" />
            <div className="telemetry-item">
              <span className="telemetry-val">Zero-Shot</span>
              <span className="telemetry-label">Gemini VLM Fallback</span>
            </div>
            <div className="telemetry-divider" />
            <div className="telemetry-item">
              <span className="telemetry-val">&lt; 45ms</span>
              <span className="telemetry-label">On-Device Inference</span>
            </div>
            <div className="telemetry-divider" />
            <div className="telemetry-item">
              <span className="telemetry-val">100%</span>
              <span className="telemetry-label">Exact Formula Math</span>
            </div>
          </div>
        </div>

        {/* HERO VISUAL: HOLOGRAPHIC SCANNER VIEWPORT */}
        <div className="hero-food-visual animate-on-scroll">
          <div className="scanner-glass-card">
            {/* Holographic Header */}
            <div className="scanner-card-header">
              <div className="scanner-status">
                <span className="live-camera-dot" />
                <span className="scanner-title">Live Vision Stream · Camera HUD</span>
              </div>
              <div className="scanner-badges">
                <span className="engine-badge vlm-pill">🔮 Gemini VLM Fallback</span>
                <span className="score-pill">NutriScore B</span>
              </div>
            </div>

            {/* Meal Image with Active Scanning Overlay */}
            <div className="scanner-viewport">
              <img
                src="/food_showcase/paneer_butter_masala.jpg"
                alt="AI Food Recognition Plate - Paneer Butter Masala"
                className="scanned-plate-img"
              />

              {/* Animated Laser Scanning Line */}
              {scanLaserActive && (
                <div className="scanner-laser-beam">
                  <div className="laser-glow-core" />
                  <div className="laser-trailing-field" />
                </div>
              )}

              {/* Bounding Box HUD Graphic */}
              <div className="scanner-target-box">
                <div className="target-corner top-left" />
                <div className="target-corner top-right" />
                <div className="target-corner bottom-left" />
                <div className="target-corner bottom-right" />
                <div className="target-tag">
                  <span className="target-name">Paneer Butter Masala</span>
                  <span className="target-confidence">98.4% Match</span>
                </div>
              </div>

              {/* Floating Ingredient Recognizers */}
              <div className="floating-ingredient-chip chip-1">
                <span className="chip-icon">🧀</span>
                <span>Fresh Paneer Cubes (99%)</span>
              </div>
              <div className="floating-ingredient-chip chip-2">
                <span className="chip-icon">🍅</span>
                <span>Tomato Cashew Gravy</span>
              </div>
              <div className="floating-ingredient-chip chip-3">
                <span className="chip-icon">🌿</span>
                <span>Kasuri Methi & Ghee</span>
              </div>
            </div>

            {/* Interactive Live Portion Slider & Macro Telemetry */}
            <div className="scanner-telemetry-body">
              <div className="portion-calibration-row">
                <div className="portion-text">
                  <span className="portion-label">⚖️ Interactive Portion Weight:</span>
                  <strong className="portion-number">{heroPortionWeight}g</strong>
                </div>
                <div className="portion-preset-buttons">
                  <button
                    type="button"
                    className={`preset-btn ${heroPortionWeight === 150 ? 'active' : ''}`}
                    onClick={() => setHeroPortionWeight(150)}
                  >
                    Snack (150g)
                  </button>
                  <button
                    type="button"
                    className={`preset-btn ${heroPortionWeight === 280 ? 'active' : ''}`}
                    onClick={() => setHeroPortionWeight(280)}
                  >
                    Meal (280g)
                  </button>
                  <button
                    type="button"
                    className={`preset-btn ${heroPortionWeight === 420 ? 'active' : ''}`}
                    onClick={() => setHeroPortionWeight(420)}
                  >
                    Hearty (420g)
                  </button>
                </div>
              </div>

              <input
                type="range"
                min="100"
                max="500"
                step="10"
                value={heroPortionWeight}
                onChange={(e) => setHeroPortionWeight(Number(e.target.value))}
                className="hero-portion-slider"
                aria-label="Portion weight slider"
              />

              {/* Real-time Recalculated Macros Grid */}
              <div className="live-macro-grid">
                <div className="live-macro-cell calorie-cell">
                  <div className="macro-cell-header">
                    <span className="macro-icon">🔥</span>
                    <span className="macro-name">CALORIES</span>
                  </div>
                  <span className="macro-num">{heroNutrients.calories}</span>
                  <span className="macro-unit">kcal</span>
                </div>

                <div className="live-macro-cell protein-cell">
                  <div className="macro-cell-header">
                    <span className="macro-icon">🥩</span>
                    <span className="macro-name">PROTEIN</span>
                  </div>
                  <span className="macro-num">{heroNutrients.protein}g</span>
                  <span className="macro-unit">Muscle Fuel</span>
                </div>

                <div className="live-macro-cell carbs-cell">
                  <div className="macro-cell-header">
                    <span className="macro-icon">🍚</span>
                    <span className="macro-name">CARBS</span>
                  </div>
                  <span className="macro-num">{heroNutrients.carbs}g</span>
                  <span className="macro-unit">Glycogen</span>
                </div>

                <div className="live-macro-cell fat-cell">
                  <div className="macro-cell-header">
                    <span className="macro-icon">🥑</span>
                    <span className="macro-name">FATS</span>
                  </div>
                  <span className="macro-num">{heroNutrients.fat}g</span>
                  <span className="macro-unit">Healthy Lipids</span>
                </div>
              </div>

              {/* Action Button inside Card */}
              <div className="scanner-card-action">
                <Link to="/nutrition" className="btn-card-launch">
                  <span>Open in Full Food Vision Studio →</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="hero-scanner-glow" />
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          SECTION 2: HYBRID AI ARCHITECTURE (YOLOv8 + VLM + VOLUMETRIC)
          --------------------------------------------------------------------- */}
      <section className="architecture-section animate-on-scroll" id="architecture">
        <div className="section-header">
          <div className="section-eyebrow">Hybrid Multimodal Intelligence</div>
          <h2 className="section-title">The Four Pillars of FitVision Food AI</h2>
          <p className="section-subtitle">
            Traditional food classifiers fail on unmodeled regional dishes. FitVision combines fast on-device detection
            with multimodal cloud and edge language models for 100% recognition resilience.
          </p>
        </div>

        <div className="architecture-grid">
          {AI_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="arch-card"
              style={{ '--pillar-color': pillar.color }}
            >
              <div className="arch-card-top">
                <div
                  className="arch-icon-wrap"
                  style={{
                    background: `${pillar.color}15`,
                    borderColor: `${pillar.color}40`,
                  }}
                >
                  <span className="arch-icon">{pillar.icon}</span>
                </div>
                <span
                  className="arch-badge"
                  style={{
                    color: pillar.color,
                    background: `${pillar.color}15`,
                    borderColor: `${pillar.color}35`,
                  }}
                >
                  {pillar.badge}
                </span>
              </div>
              <h3 className="arch-title">{pillar.title}</h3>
              <p className="arch-desc">{pillar.description}</p>
              <div className="arch-stats-row">
                <span className="arch-stats-text">{pillar.stats}</span>
              </div>
              <div
                className="arch-hover-glow"
                style={{
                  background: `radial-gradient(circle at 50% 100%, ${pillar.color}25, transparent 70%)`,
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          SECTION 3: HOW IT WORKS (3-STEP VISUAL PIPELINE)
          --------------------------------------------------------------------- */}
      <section className="how-it-works-section animate-on-scroll" id="how-it-works">
        <div className="section-header">
          <div className="section-eyebrow">Zero Friction Workflow</div>
          <h2 className="section-title">How Food Vision Works in 3 Steps</h2>
          <p className="section-subtitle">
            From raw camera pixels to comprehensive nutritional breakdown in under two seconds.
          </p>
        </div>

        <div className="steps-container">
          {HOW_IT_WORKS_STEPS.map((step, idx) => (
            <React.Fragment key={step.step}>
              <div className="step-box">
                <div className="step-number-pill">{step.step}</div>
                <div className="step-icon-circle">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-text">{step.text}</p>
              </div>
              {idx < HOW_IT_WORKS_STEPS.length - 1 && (
                <div className="step-arrow-divider">
                  <div className="arrow-line" />
                  <div className="arrow-head">›</div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          SECTION 4: INTERACTIVE FOOD SHOWCASE (INDIAN, FITNESS, GLOBAL)
          --------------------------------------------------------------------- */}
      <section className="showcase-section animate-on-scroll" id="showcase">
        <div className="section-header">
          <div className="section-eyebrow">Comprehensive Culinary Coverage</div>
          <h2 className="section-title">Explore Recognized Foods & Live Data</h2>
          <p className="section-subtitle">
            Click any dish below to inspect its AI confidence score, identified ingredients, and calibrated macronutrients.
          </p>
        </div>

        <div className="showcase-wrapper glass-card">
          {/* Category Tabs */}
          <div className="showcase-tabs">
            <button
              type="button"
              className={`showcase-tab ${activeShowcaseTab === 'indian' ? 'active' : ''}`}
              onClick={() => handleTabChange('indian')}
            >
              🇮🇳 Authentic Indian Cuisine
            </button>
            <button
              type="button"
              className={`showcase-tab ${activeShowcaseTab === 'fitness' ? 'active' : ''}`}
              onClick={() => handleTabChange('fitness')}
            >
              🥗 High-Protein & Fitness Meals
            </button>
            <button
              type="button"
              className={`showcase-tab ${activeShowcaseTab === 'global' ? 'active' : ''}`}
              onClick={() => handleTabChange('global')}
            >
              🌍 Global Favorites
            </button>
          </div>

          <div className="showcase-content-grid">
            {/* Left Food Selector List */}
            <div className="showcase-list">
              {SHOWCASE_FOODS[activeShowcaseTab].map((item) => {
                const isSelected = selectedFood.id === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`showcase-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedFood(item)}
                  >
                    <img src={item.image} alt={item.name} className="showcase-thumb" />
                    <div className="showcase-item-meta">
                      <div className="showcase-item-title-row">
                        <span className="item-name">{item.name}</span>
                        <span className="item-cals">{item.calories} kcal</span>
                      </div>
                      <div className="showcase-item-sub-row">
                        <span className="item-sub">{item.subtitle}</span>
                        <span className="item-engine-badge">{item.engine}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Right Detailed Showcase Pane */}
            <div className="showcase-detail-pane">
              <div className="detail-hero-banner">
                <img
                  src={selectedFood.image}
                  alt={selectedFood.name}
                  className="detail-main-img"
                />
                <div className="detail-img-overlay">
                  <div className="detail-top-tags">
                    <span
                      className="detail-badge"
                      style={{ background: `${selectedFood.badgeColor}22`, borderColor: selectedFood.badgeColor, color: selectedFood.badgeColor }}
                    >
                      {selectedFood.badge}
                    </span>
                    <span className="detail-nutriscore">
                      NutriScore {selectedFood.nutriScore}
                    </span>
                  </div>
                  <h3 className="detail-dish-title">{selectedFood.name}</h3>
                  <p className="detail-dish-desc">{selectedFood.description}</p>
                </div>
              </div>

              {/* Nutrition Summary Bar */}
              <div className="detail-macro-bar">
                <div className="detail-macro-item">
                  <span className="macro-metric-label">🔥 Energy</span>
                  <span className="macro-metric-val">{selectedFood.calories} kcal</span>
                </div>
                <div className="detail-macro-item">
                  <span className="macro-metric-label">🥩 Protein</span>
                  <span className="macro-metric-val">{selectedFood.protein}g</span>
                </div>
                <div className="detail-macro-item">
                  <span className="macro-metric-label">🍚 Carbs</span>
                  <span className="macro-metric-val">{selectedFood.carbs}g</span>
                </div>
                <div className="detail-macro-item">
                  <span className="macro-metric-label">🥑 Healthy Fat</span>
                  <span className="macro-metric-val">{selectedFood.fat}g</span>
                </div>
                <div className="detail-macro-item">
                  <span className="macro-metric-label">🌾 Fiber</span>
                  <span className="macro-metric-val">{selectedFood.fiber}g</span>
                </div>
              </div>

              {/* Identified Ingredients & Culinary Metadata */}
              <div className="detail-ingredients-box">
                <div className="detail-meta-row">
                  <span className="meta-tag-label">🍳 Cooking Method:</span>
                  <span className="meta-tag-value">{selectedFood.cookingMethod}</span>
                  <span className="meta-tag-label" style={{ marginLeft: '16px' }}>⚖️ Calibrated Mass:</span>
                  <span className="meta-tag-value">{selectedFood.weightGrams}g</span>
                </div>

                <div className="ingredients-chips-row">
                  <span className="ingredients-label">Visible Ingredients:</span>
                  <div className="chips-wrap">
                    {selectedFood.ingredients.map((ing) => (
                      <span key={ing} className="ingredient-chip">
                        ✓ {ing}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="showcase-pane-action">
                <Link to="/nutrition" className="btn-showcase-action">
                  <span>Scan {selectedFood.name} with AI →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          SECTION 5: NUTRITION DASHBOARD PREVIEW
          --------------------------------------------------------------------- */}
      <section className="dashboard-preview-section animate-on-scroll" id="dashboard-preview">
        <div className="section-header">
          <div className="section-eyebrow">Persistent Analytics Hub</div>
          <h2 className="section-title">Your Daily Nutrition Command Center</h2>
          <p className="section-subtitle">
            Every scanned meal seamlessly logs into your private offline dashboard with automated macro progress tracking.
          </p>
        </div>

        <div className="dashboard-preview-card">
          {/* Top KPI Row */}
          <div className="kpi-cards-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span>🔥 Daily Energy Target</span>
                <span className="kpi-percent">84% Met</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-current">1,840</span>
                <span className="kpi-target">/ 2,200 kcal</span>
              </div>
              <div className="kpi-progress-track">
                <div className="kpi-progress-fill calorie-fill" style={{ width: '84%' }} />
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>🥩 Muscle Protein Target</span>
                <span className="kpi-percent">92% Met</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-current">138g</span>
                <span className="kpi-target">/ 150g</span>
              </div>
              <div className="kpi-progress-track">
                <div className="kpi-progress-fill protein-fill" style={{ width: '92%' }} />
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>🍚 Glycogen Energy (Carbs)</span>
                <span className="kpi-percent">82% Met</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-current">180g</span>
                <span className="kpi-target">/ 220g</span>
              </div>
              <div className="kpi-progress-track">
                <div className="kpi-progress-fill carbs-fill" style={{ width: '82%' }} />
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span>🥑 Essential Healthy Lipids</span>
                <span className="kpi-percent">78% Met</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-current">51g</span>
                <span className="kpi-target">/ 65g</span>
              </div>
              <div className="kpi-progress-track">
                <div className="kpi-progress-fill fat-fill" style={{ width: '78%' }} />
              </div>
            </div>
          </div>

          {/* Today's Logged Meal Stream */}
          <div className="dashboard-meal-stream">
            <div className="stream-header">
              <h4 className="stream-title">Today's Scanned Meal Timeline</h4>
              <Link to="/nutrition" className="stream-link">
                View Food Diary →
              </Link>
            </div>

            <div className="stream-items-row">
              <div className="stream-item">
                <img src="/food_showcase/pancakes.jpg" alt="Breakfast" className="stream-img" />
                <div className="stream-meta">
                  <span className="stream-time">08:30 AM · Breakfast</span>
                  <span className="stream-food-name">Oatmeal Protein Pancakes</span>
                  <span className="stream-macros">380 kcal · 24g Protein · NutriScore A</span>
                </div>
              </div>

              <div className="stream-item">
                <img src="/food_showcase/paneer_butter_masala.jpg" alt="Lunch" className="stream-img" />
                <div className="stream-meta">
                  <span className="stream-time">01:15 PM · Lunch</span>
                  <span className="stream-food-name">Paneer Butter Masala & Roti</span>
                  <span className="stream-macros">560 kcal · 22g Protein · NutriScore B</span>
                </div>
              </div>

              <div className="stream-item">
                <img src="/food_showcase/caesar_salad.jpg" alt="Dinner" className="stream-img" />
                <div className="stream-meta">
                  <span className="stream-time">07:45 PM · Dinner</span>
                  <span className="stream-food-name">Mediterranean Grilled Chicken Salad</span>
                  <span className="stream-macros">340 kcal · 38g Protein · NutriScore A</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          SECTION 6: COMPREHENSIVE FEATURES MATRIX
          --------------------------------------------------------------------- */}
      <section className="features-section animate-on-scroll" id="features">
        <div className="section-header">
          <div className="section-eyebrow">Enterprise Health Intelligence</div>
          <h2 className="section-title">Engineered for Precision & Everyday Life</h2>
          <p className="section-subtitle">
            Everything you need to master your nutrition and movement in one cohesive, privacy-first interface.
          </p>
        </div>

        <div className="features-grid">
          {PLATFORM_FEATURES.map((feature) => (
            <div key={feature.title} className="feature-card">
              <div className="feature-card-header">
                <span className="feature-icon">{feature.icon}</span>
                <span className="feature-tag">{feature.tag}</span>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          SECTION 7: INTEGRATED MOVEMENT COMPATIBILITY BANNER
          --------------------------------------------------------------------- */}
      <section className="movement-sync-banner animate-on-scroll">
        <div className="movement-sync-content">
          <div className="sync-badge">
            <span>🧘 Full Vision Fitness Suite</span>
          </div>
          <h3 className="sync-title">Nutrition Meets Computer Vision Biomechanics</h3>
          <p className="sync-desc">
            Pair your calibrated nutrition tracking with real-time MoveNet posture feedback, spoken voice coaching,
            and joint angle telemetry across 8 core Yoga postures and custom workout videos.
          </p>
          <div className="sync-actions">
            <Link to="/start" className="btn-sync-yoga">
              <span>🧘 Launch Yoga Studio (8 Poses)</span>
            </Link>
            <Link to="/video-analysis" className="btn-sync-video">
              <span>🎬 Video Biomechanics Lab</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          SECTION 8: FINAL HERO CALL TO ACTION (CTA)
          --------------------------------------------------------------------- */}
      <section className="final-cta-section animate-on-scroll">
        <div className="final-cta-card">
          <div className="final-cta-glow" />
          <div className="final-cta-content">
            <h2 className="final-cta-title">
              Ready to Decode Your Meals with AI Precision?
            </h2>
            <p className="final-cta-subtitle">
              Join the new era of automated nutrition tracking. Zero tedious database search, zero guesswork.
              Just snap, calibrate, and track.
            </p>
            <div className="final-cta-actions">
              <Link to="/nutrition" className="btn-final-primary">
                <span>Analyze Your Food Now 🥗</span>
              </Link>
              <Link to="/dashboard" className="btn-final-ghost">
                <span>View Daily Dashboard 📊</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          FOOTER WITH SYSTEM STATUS & QUICK LINKS
          --------------------------------------------------------------------- */}
      <footer className="food-experience-footer">
        <div className="footer-top-row">
          <div className="footer-brand">
            <span className="footer-logo">🥗⚡ FitVision AI Studio</span>
            <p className="footer-brand-sub">
              Next-generation multimodal vision intelligence for automated food recognition, portion mass estimation, and biomechanics tracking.
            </p>
          </div>

          <div className="footer-nav-col">
            <span className="footer-col-header">Food Intelligence</span>
            <Link to="/nutrition">Food Vision Studio</Link>
            <Link to="/nutrition">Indian Food Recognition</Link>
            <Link to="/nutrition">VLM Fallback Engine</Link>
            <Link to="/nutrition">Portion Calibration</Link>
          </div>

          <div className="footer-nav-col">
            <span className="footer-col-header">Movement & Fitness</span>
            <Link to="/start">Yoga Posture Studio</Link>
            <Link to="/video-analysis">Video Biomechanics</Link>
            <Link to="/dashboard">Intelligence Dashboard</Link>
            <Link to="/planner">Workout Planner</Link>
          </div>

          <div className="footer-nav-col">
            <span className="footer-col-header">AI Architecture</span>
            <span className="footer-static-link">YOLOv8m (UEC-256)</span>
            <span className="footer-static-link">Gemini 1.5 Flash VLM</span>
            <span className="footer-static-link">Moondream Edge Ollama</span>
            <span className="footer-static-link">Volumetric Depth Calibration</span>
          </div>
        </div>

        <div className="footer-bottom-row">
          <span className="footer-copy">
            © 2026 FitVision AI Studio. Built with PyTorch, React, YOLOv8, and Google Gemini Vision.
          </span>
          <div className="footer-system-chip">
            <span className="chip-green-dot" />
            <span>Hybrid AI Engine Operational · Port 5050</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
