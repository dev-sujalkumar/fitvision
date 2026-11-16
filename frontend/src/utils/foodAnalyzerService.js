/**
 * FitVision AI — Food Vision & Nutrition Studio Service
 * Unified multi-engine orchestrator:
 *   1. Local YOLOv8m Volumetric Flask Server (http://localhost:5000)
 *   2. Google Gemini Multimodal Vision API (Gemini 1.5 Flash / 2.0 Flash)
 *   3. On-Device UEC-256 Benchmark & Heuristic Computer Vision Engine
 */

import { FOOD_DATABASE_256, BENCHMARK_MEALS, calculateFoodNutrition, calculateNutriScore } from './foodNutrition256';

const LOCAL_SERVER_URL = process.env.REACT_APP_FOOD_SERVER_URL || 'http://localhost:5050';
const GEMINI_STORAGE_KEY = 'fitvision_gemini_api_key';

/**
 * Get configured Gemini API key
 */
export const getGeminiApiKey = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(GEMINI_STORAGE_KEY);
      if (stored && stored.trim()) return stored.trim();
    }
  } catch (e) {}
  return process.env.REACT_APP_GEMINI_API_KEY || '';
};

/**
 * Save Gemini API key
 */
export const setGeminiApiKey = (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (key && key.trim()) {
        window.localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
      } else {
        window.localStorage.removeItem(GEMINI_STORAGE_KEY);
      }
    }
  } catch (e) {}
};

/**
 * Check if the local YOLOv8m Flask server is online
 */
export const checkServerHealth = async (timeoutMs = 1500) => {
  if (typeof navigator !== 'undefined' && navigator.userAgent?.includes('jsdom')) {
    return { online: false, isJsdom: true };
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch (e) {
    clearTimeout(id);
    return { online: false, error: e.message };
  }
};

/**
 * Analyze an image with the local YOLOv8m Flask server
 */
export const analyzeWithLocalServer = async (imageBase64, plateDiameterCm = 16.0) => {
  const res = await fetch(`${LOCAL_SERVER_URL}/api/analyze-food`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageBase64,
      plate_diameter_cm: plateDiameterCm,
    }),
  });

  if (!res.ok) {
    throw new Error(`Local server returned ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.status !== 'success') {
    throw new Error(data.message || 'Analysis failed on local server');
  }

  return normalizeAnalysisResponse(data, 'yolov8m_local', plateDiameterCm);
};

/**
 * Scan food with Google Gemini Multimodal Vision API
 */
export const scanWithGeminiVision = async (imageBase64, apiKey = getGeminiApiKey(), plateDiameterCm = 16.0) => {
  const key = apiKey || getGeminiApiKey();
  if (!key) {
    throw new Error('Gemini API Key is required for Cloud Vision Scan. Please add your key in AI Engine settings.');
  }

  // Strip prefix data URL if present
  let cleanBase64 = imageBase64;
  let mimeType = 'image/jpeg';
  if (imageBase64.includes(';base64,')) {
    const parts = imageBase64.split(';base64,');
    mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    cleanBase64 = parts[1];
  }

  const foodCategories = Object.keys(FOOD_DATABASE_256).join(', ');
  const prompt = `You are a food image recognition assistant. Analyze the provided meal image. The visible plate or bowl is approximately ${plateDiameterCm} cm in diameter.

Identify visible food items only. Do not invent components that are not clearly visible. Return fewer items rather than guessing.
For each dish component:
1. Provide a short descriptive name.
2. Set "food_category" to exactly one matching label from this list, or "unknown" if it cannot be identified: ${foodCategories}
3. Estimate the portion weight in grams using the ${plateDiameterCm} cm plate for scale. This is an estimate, not a measured value.
4. Provide normalized bounding box coordinates for the visible food region:
   - x: left edge percentage (0 to 100)
   - y: top edge percentage (0 to 100)
   - width: box width percentage (0 to 100)
   - height: box height percentage (0 to 100)
5. Choose a representative single emoji icon.

Also provide:
- "plate_name": A short appetizing title for this meal.
- "athletic_verdict": one concise, non-medical observation based on the identified foods.
- "micronutrients": estimated total amounts for { fiber_g, sodium_mg, potassium_mg, calcium_mg, iron_mg, vitamin_c_mg }, or null if these cannot be estimated reliably.

Respond ONLY in valid, parseable JSON with this exact structure (no markdown fences, no explanatory preamble):
{
  "plate_name": "...",
  "athletic_verdict": "...",
  "dishes": [
    {
      "name": "...",
      "food_category": "chicken",
      "icon": "🍗",
      "weight_g": 160.0,
      "calories": 260.0,
      "protein": 48.0,
      "carbs": 0.0,
      "fat": 6.0,
      "box": { "x": 15, "y": 20, "width": 40, "height": 45 }
    }
  ],
  "micronutrients": {
    "fiber_g": 6.5,
    "sodium_mg": 480,
    "potassium_mg": 620,
    "calcium_mg": 95,
    "iron_mg": 3.2,
    "vitamin_c_mg": 28
  }
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.15,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    let msg = `Gemini API Error (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      msg = errJson.error?.message || msg;
    } catch (e) {}
    throw new Error(msg);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract JSON from response text
  let jsonString = rawText.trim();
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  }
  jsonString = jsonString.trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    const match = jsonString.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error('Failed to parse structured JSON from Gemini Vision AI response.');
    }
  }

  return normalizeAnalysisResponse(parsed, 'gemini_vision', plateDiameterCm);
};

/**
 * Offline benchmark resolver. Custom-photo inference requires a vision engine.
 */
export const analyzeOnDeviceFallback = async (imageBase64, plateDiameterCm = 16.0) => {
  // Check if image matches one of the benchmark meals
  const foundMeal = BENCHMARK_MEALS.find((m) => {
    return imageBase64.includes(m.id) || (m.image && imageBase64.includes(m.image));
  });

  if (foundMeal) {
    return loadBenchmarkPlate(foundMeal.id, plateDiameterCm);
  }

  throw new Error(
    'Offline recognition is available for bundled benchmark plates only. Select the local YOLO or Gemini engine to analyze a custom photo.'
  );
};

/**
 * Load a pre-annotated benchmark plate with volumetric calibration
 */
export const loadBenchmarkPlate = (benchmarkId, plateDiameterCm = 16.0) => {
  const meal = BENCHMARK_MEALS.find((m) => m.id === benchmarkId) || BENCHMARK_MEALS[0];
  const scale = Math.pow(plateDiameterCm / 16.0, 2);

  const dishes = meal.dishes.map((d) => {
    const scaledWeight = Math.round(d.weight_g * scale * 10) / 10;
    const nutrition = calculateFoodNutrition(d.food, scaledWeight);
    return {
      ...d,
      weight_g: scaledWeight,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
    };
  });

  return normalizeAnalysisResponse(
    {
      plate_name: meal.name,
      dishes,
      benchmark_id: meal.id,
      benchmark_tag: meal.tag,
      image: meal.image,
    },
    'uec256_benchmark',
    plateDiameterCm
  );
};

/**
 * Standardize and enrich the analysis response format
 */
export const normalizeAnalysisResponse = (raw, engine = 'unknown', plateDiameterCm = 16.0) => {
  const dishes = (raw.dishes || []).map((d, index) => {
    const rawWeight = Number(d.weight_g);
    const weightG = Math.min(1000, Math.max(5, Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 100));
    const foodKey = String(d.food_category || d.food || d.name || 'unknown').toLowerCase().trim();
    const fallbackNutr = calculateFoodNutrition(foodKey, weightG);
    const databaseEntry = FOOD_DATABASE_256[foodKey];
    const providedNumber = (value, fallback) => {
      const number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    };
    const calories = databaseEntry
      ? fallbackNutr.calories
      : providedNumber(d.calories, fallbackNutr.calories);
    const protein = databaseEntry
      ? fallbackNutr.protein
      : providedNumber(d.protein, fallbackNutr.protein);
    const carbs = databaseEntry
      ? fallbackNutr.carbs
      : providedNumber(d.carbs, fallbackNutr.carbs);
    const fat = databaseEntry
      ? fallbackNutr.fat
      : providedNumber(d.fat, fallbackNutr.fat);
    const confidenceValue = Number(d.confidence);
    const confidence = Number.isFinite(confidenceValue)
      ? Math.min(1, Math.max(0, confidenceValue))
      : 0;

    // Bounding box normalization to 0-100%
    let box = d.box || null;
    if (box && box.ymin !== undefined && box.xmin !== undefined) {
      // Gemini [ymin, xmin, ymax, xmax] format
      box = {
        x: Math.round(box.xmin * (box.xmin <= 1 ? 100 : 1)),
        y: Math.round(box.ymin * (box.ymin <= 1 ? 100 : 1)),
        width: Math.round((box.xmax - box.xmin) * (box.xmax <= 1 ? 100 : 1)),
        height: Math.round((box.ymax - box.ymin) * (box.ymax <= 1 ? 100 : 1)),
      };
    }
    if (box && ['x', 'y', 'width', 'height'].every((key) => Number.isFinite(Number(box[key])))) {
      const x = Math.min(100, Math.max(0, Number(box.x)));
      const y = Math.min(100, Math.max(0, Number(box.y)));
      box = {
        x,
        y,
        width: Math.min(100 - x, Math.max(0, Number(box.width))),
        height: Math.min(100 - y, Math.max(0, Number(box.height))),
      };
    } else {
      box = null;
    }

    return {
      id: d.id || `dish_${index + 1}`,
      name: d.name || foodKey,
      food: foodKey,
      icon: d.icon || getFoodEmoji(foodKey),
      weight_g: weightG,
      calories: Math.round(calories * 10) / 10,
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      density: d.density || FOOD_DATABASE_256[foodKey]?.density || 0.85,
      confidence,
      nutrition_source: databaseEntry ? 'food_database' : 'vision_estimate',
      box,
    };
  });

  const totalCalories = Math.round(dishes.reduce((acc, d) => acc + d.calories, 0) * 10) / 10;
  const totalProtein = Math.round(dishes.reduce((acc, d) => acc + d.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(dishes.reduce((acc, d) => acc + d.carbs, 0) * 10) / 10;
  const totalFat = Math.round(dishes.reduce((acc, d) => acc + d.fat, 0) * 10) / 10;
  const totalWeightG = Math.round(dishes.reduce((acc, d) => acc + d.weight_g, 0) * 10) / 10;

  const nutriScore = calculateNutriScore(totalCalories, totalProtein, totalCarbs, totalFat);

  // Calculate volumetric surface area
  const plateRadius = plateDiameterCm / 2.0;
  const plateAreaCm2 = Math.round(Math.PI * Math.pow(plateRadius, 2) * 10) / 10;

  // Micronutrients estimates
  const micronutrientKeys = [
    'fiber_g',
    'sodium_mg',
    'potassium_mg',
    'calcium_mg',
    'iron_mg',
    'vitamin_c_mg',
  ];
  let micronutrients = raw.micronutrients && typeof raw.micronutrients === 'object'
    ? micronutrientKeys.reduce((result, key) => {
      const value = raw.micronutrients[key];
      if (value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))) {
        result[key] = Number(value);
      }
      return result;
    }, {})
    : null;
  if (micronutrients && Object.keys(micronutrients).length === 0) {
    micronutrients = null;
  }

  return {
    plate_name: raw.plate_name || 'Nutrition Diagnostic Scan',
    engine,
    plate_diameter_cm: plateDiameterCm,
    plate_area_cm2: plateAreaCm2,
    timestamp: Date.now(),
    dishes,
    totals: {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      weight_g: totalWeightG,
    },
    nutriScore,
    health_score: raw.health_score || calculateHealthScore(totalCalories, totalProtein, totalCarbs, totalFat),
    athletic_verdict: raw.athletic_verdict || generateAthleticVerdict(totalCalories, totalProtein, totalCarbs, totalFat),
    micronutrients,
    overall_confidence:
      dishes.length > 0
        ? Math.round((dishes.reduce((acc, d) => acc + d.confidence, 0) / dishes.length) * 100) / 100
        : 0,
  };
};

/**
 * Helper to get representative food emoji
 */
export const getFoodEmoji = (foodName = '') => {
  const name = String(foodName).toLowerCase();
  if (name.includes('rice') || name.includes('pilaf')) return '🍚';
  if (name.includes('sashimi') || name.includes('salmon') || name.includes('tuna') || name.includes('fish')) return '🐟';
  if (name.includes('chicken') || name.includes('poultry') || name.includes('duck')) return '🍗';
  if (name.includes('beef') || name.includes('steak')) return '🥩';
  if (name.includes('pork') || name.includes('bacon')) return '🥓';
  if (name.includes('soup') || name.includes('miso') || name.includes('chowder') || name.includes('curry')) return '🥣';
  if (name.includes('noodle') || name.includes('udon') || name.includes('ramen') || name.includes('soba')) return '🍜';
  if (name.includes('egg') || name.includes('chawanmushi')) return '🥚';
  if (name.includes('salad') || name.includes('spinach') || name.includes('vegetable') || name.includes('green')) return '🥗';
  if (name.includes('broccoli')) return '🥦';
  if (name.includes('bread') || name.includes('toast')) return '🍞';
  if (name.includes('tempura') || name.includes('fried')) return '🍤';
  if (name.includes('fruit') || name.includes('apple')) return '🍎';
  return '🍽️';
};

/**
 * Calculate clinical health score (0 - 100)
 */
const calculateHealthScore = (calories, protein, carbs, fat) => {
  if (calories <= 0) return 70;
  const pCal = protein * 4;
  const fCal = fat * 9;
  const proteinRatio = pCal / calories;
  const fatRatio = fCal / calories;

  let score = 75;
  if (proteinRatio >= 0.25) score += 15;
  else if (proteinRatio >= 0.18) score += 8;

  if (fatRatio <= 0.30) score += 10;
  else if (fatRatio > 0.45) score -= 12;

  return Math.min(99, Math.max(40, Math.round(score)));
};

/**
 * Generate sports nutritionist verbal assessment
 */
const generateAthleticVerdict = (calories, protein, carbs, fat) => {
  if (calories === 0) return 'Add food components to generate nutritional feedback.';
  const proteinRatio = (protein * 4) / Math.max(1, calories);

  if (proteinRatio >= 0.25) {
    return 'Outstanding athletic profile with high protein density. Ideal for muscular hypertrophy, tissue repair, and prolonged satiety post-workout.';
  } else if (carbs > 60 && protein >= 20) {
    return 'Balanced glycolytic recovery plate. Replenishes muscle glycogen stores while providing amino acids for sustained energy.';
  } else if (fat > 30) {
    return 'Moderate-to-high caloric and lipid density. Recommend pairing with leafy cruciferous greens to optimize metabolic efficiency.';
  }
  return 'Well-portioned daily meal providing clean macros. Maintain steady hydration to support nutrient absorption.';
};

/**
 * Recalculate whole plate when user adjusts plate diameter slider
 */
export const recalibratePlateDiameter = (analysis, newDiameterCm) => {
  if (!analysis || !analysis.dishes) return analysis;
  const oldDiameter = analysis.plate_diameter_cm || 16.0;
  if (Math.abs(oldDiameter - newDiameterCm) < 0.05) return analysis;

  const scaleFactor = Math.pow(newDiameterCm / oldDiameter, 2);

  const updatedDishes = analysis.dishes.map((dish) => {
    const newWeight = Math.round(dish.weight_g * scaleFactor * 10) / 10;
    const nutrition = calculateFoodNutrition(dish.food, newWeight);
    return {
      ...dish,
      weight_g: newWeight,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
    };
  });

  return normalizeAnalysisResponse(
    {
      ...analysis,
      plate_diameter_cm: newDiameterCm,
      dishes: updatedDishes,
    },
    analysis.engine,
    newDiameterCm
  );
};

/**
 * Update an individual dish in an active analysis
 */
export const updateDishInAnalysis = (analysis, dishId, updates) => {
  if (!analysis || !analysis.dishes) return analysis;

  const updatedDishes = analysis.dishes.map((dish) => {
    if (dish.id !== dishId) return dish;
    const merged = { ...dish, ...updates };

    // If weight changed or food changed, recalculate macros
    if (updates.weight_g !== undefined || updates.food !== undefined) {
      const nutrition = calculateFoodNutrition(merged.food, merged.weight_g);
      merged.calories = nutrition.calories;
      merged.protein = nutrition.protein;
      merged.carbs = nutrition.carbs;
      merged.fat = nutrition.fat;
      merged.density = FOOD_DATABASE_256[merged.food]?.density || merged.density || 0.85;
      merged.icon = getFoodEmoji(merged.food);
      if (updates.food !== undefined) {
        merged.confidence = 0;
        merged.nutrition_source = FOOD_DATABASE_256[merged.food] ? 'food_database' : 'vision_estimate';
      }
    }
    return merged;
  });

  return normalizeAnalysisResponse(
    {
      ...analysis,
      dishes: updatedDishes,
    },
    analysis.engine,
    analysis.plate_diameter_cm
  );
};

/**
 * Remove a dish from analysis
 */
export const removeDishFromAnalysis = (analysis, dishId) => {
  if (!analysis || !analysis.dishes) return analysis;
  const filtered = analysis.dishes.filter((d) => d.id !== dishId);
  return normalizeAnalysisResponse(
    {
      ...analysis,
      dishes: filtered,
    },
    analysis.engine,
    analysis.plate_diameter_cm
  );
};

/**
 * Add a new dish to analysis
 */
export const addDishToAnalysis = (analysis, foodKey, weightG = 100) => {
  if (!analysis || !analysis.dishes) return analysis;
  const key = String(foodKey).toLowerCase().trim();
  const dbEntry = FOOD_DATABASE_256[key];
  const nutr = calculateFoodNutrition(key, weightG);

  const newDish = {
    id: `dish_${Date.now()}`,
    name: dbEntry?.name || key,
    food: key,
    icon: getFoodEmoji(key),
    weight_g: weightG,
    calories: nutr.calories,
    protein: nutr.protein,
    carbs: nutr.carbs,
    fat: nutr.fat,
    density: dbEntry?.density || 0.85,
    confidence: 0,
    nutrition_source: dbEntry ? 'food_database' : 'vision_estimate',
    box: null,
  };

  return normalizeAnalysisResponse(
    {
      ...analysis,
      dishes: [...analysis.dishes, newDish],
    },
    analysis.engine,
    analysis.plate_diameter_cm
  );
};
