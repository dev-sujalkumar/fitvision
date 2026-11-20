/**
 * FitVision AI — Hybrid AI Food Recognition Client Service
 * Connects to YOLOv8 + VLM Fallback (Gemini Vision / Moondream) REST API on port 5050.
 */

import {
  FOOD101_DATABASE,
  SAMPLE_PLATES,
  calculateFoodNutrition,
  calculateNutriScore,
  generateAthleticVerdict,
} from './food101Data';

const LOCAL_SERVER_URL = process.env.REACT_APP_FOOD_SERVER_URL || 'http://localhost:5050';
<<<<<<< Updated upstream
=======
const GEMINI_STORAGE_KEY = 'fitvision_gemini_api_key';
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];

const FOOD_ALIASES = {
  chicken: 'roast chicken',
  'grilled chicken': 'roast chicken',
  'chicken breast': 'roast chicken',
  'herb chicken': 'roast chicken',
  vegetables: 'sauteed vegetables',
  vegetable: 'sauteed vegetables',
  veggies: 'sauteed vegetables',
  greens: 'sauteed spinach',
  broccoli: 'sauteed vegetables',
  'white rice': 'rice',
  'steamed rice': 'rice',
  'steamed white rice': 'rice',
  'jasmine white rice': 'rice',
  egg: 'steamed egg hotchpotch',
  chawanmushi: 'steamed egg hotchpotch',
};

/**
 * Map a free-text food label onto a UEC-256 database key when possible.
 */
export const resolveFoodKey = (raw) => {
  const key = String(raw || 'unknown')
    .toLowerCase()
    .trim()
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ');
  if (!key) return 'unknown';
  if (FOOD_DATABASE_256[key]) return key;
  if (FOOD_ALIASES[key] && FOOD_DATABASE_256[FOOD_ALIASES[key]]) return FOOD_ALIASES[key];

  const keys = Object.keys(FOOD_DATABASE_256);
  const contained = keys.filter((candidate) => key.includes(candidate));
  if (contained.length) {
    contained.sort((a, b) => b.length - a.length);
    return contained[0];
  }
  if (key.length >= 4) {
    const containers = keys.filter((candidate) => candidate.includes(key));
    if (containers.length === 1) return containers[0];
  }
  return key;
};
>>>>>>> Stashed changes

/**
 * Check if the Hybrid Food Recognition Flask server is online
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
 * Classify a meal image with Hybrid YOLOv8m + VLM Fallback Architecture
 */
export const classifyWithPyTorch = async (imageBase64, plateDiameterCm = 16.0) => {
  const geminiKey = getGeminiApiKey();

  try {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/analyze-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageBase64,
        plate_diameter_cm: plateDiameterCm,
        gemini_api_key: geminiKey || undefined,
        top_k: 5,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return normalizeAnalysisResponse(data, plateDiameterCm);
      }
    }
  } catch (err) {
    console.warn('Backend server unreachable on port 5050:', err.message);
  }

  // Fallback: Check if image matches a known benchmark/sample plate
  const sample = SAMPLE_PLATES.find(
    (s) => imageBase64.includes(s.id) || (s.image && imageBase64.includes(s.image))
  );
  if (sample) {
    return loadSamplePlate(sample.id, plateDiameterCm);
  }

  // Fallback for custom user uploads when local server is offline
  const defaultPlate = SAMPLE_PLATES[0] || { id: 'sample_pizza', category: 'pizza' };
  const fallback = loadSamplePlate(defaultPlate.id, plateDiameterCm);
  return {
    ...fallback,
    plate_name: 'Meal Scan (Local Baseline)',
    is_offline_simulation: true,
    engine: 'offline_baseline',
    recognition_badge: 'Offline Baseline',
    explanation: 'Backend server (port 5050) is offline. Start start_backend.bat to run YOLOv8 and VLM neural inference.',
  };
};

export const analyzeWithLocalServer = classifyWithPyTorch;
export const classifyWithTransformer = classifyWithPyTorch;

/**
 * Manually correct an identified dish via backend
 */
export const correctDishOnline = async (dishId, newFoodName, weightG = 180, plateDiameterCm = 16.0) => {
  try {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/correct-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dish_id: dishId,
        new_food_name: newFoodName,
        weight_g: weightG,
        plate_diameter_cm: plateDiameterCm
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return data.corrected_dish;
      }
    }
  } catch (err) {
    console.warn('Error correcting food via API:', err);
  }
  return null;
};

const geminiGenerate = async (apiKey, payload) => {
  const key = String(apiKey || '').trim();
  if (!key) {
    throw new Error('Gemini API key is required. Add it in Settings.');
  }

  let lastError = null;
  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (response.status === 404) {
      lastError = new Error(`${model} is not available for this API key.`);
      continue;
    }

    if (response.status === 400 && payload?.generationConfig?.responseMimeType) {
      const retryPayload = {
        ...payload,
        generationConfig: { ...payload.generationConfig },
      };
      delete retryPayload.generationConfig.responseMimeType;
      const retry = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(retryPayload),
        }
      );
      if (retry.ok) return retry.json();
    }

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Gemini API error (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        msg = errJson.error?.message || msg;
      } catch (e) {}
      throw new Error(msg);
    }

    return response.json();
  }

  throw lastError || new Error('No Gemini model is available for this API key.');
};

/**
 * Confirm a Gemini key with a tiny text request before saving it.
 */
export const verifyGeminiApiKey = async (apiKey) => {
  const result = await geminiGenerate(apiKey, {
    contents: [{ parts: [{ text: 'Reply with the single word OK.' }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 8 },
  });
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text.trim()) {
    throw new Error('Gemini accepted the key but returned an empty response.');
  }
  return true;
};

/**
 * Inspect or update VLM configuration on backend
 */
export const getVlmConfig = async () => {
  try {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/vlm-config`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
};

export const setVlmConfig = async (preferredMode, geminiKey) => {
  try {
    const res = await fetch(`${LOCAL_SERVER_URL}/api/vlm-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferred_mode: preferredMode,
        gemini_api_key: geminiKey
      })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
};

/**
 * Load one of the demonstration sample plates
 */
export const loadSamplePlate = (sampleId, plateDiameterCm = 16.0) => {
  const sample = SAMPLE_PLATES.find((s) => s.id === sampleId) || SAMPLE_PLATES[0];
  const scale = Math.pow(plateDiameterCm / 16.0, 2);
  const scaledWeight = Math.round(sample.weight_g * scale * 10) / 10;
  const nutr = calculateFoodNutrition(sample.category, scaledWeight);

<<<<<<< Updated upstream
  const raw = {
    status: 'success',
    engine: 'sample_demonstration',
    recognition_badge: '⚡ YOLOv8 (Demo Benchmark)',
    model: 'YOLOv8m Demo Benchmark',
    plate_name: `${sample.icon} ${sample.name}`,
    cuisine: 'Benchmark / Demonstration',
    dishes: [
      {
        id: 'dish_1',
        name: sample.name,
        food_category: sample.category,
        food: sample.category,
        cuisine: 'International',
        visible_ingredients: [sample.name],
        cooking_method: 'Culinary preparation',
        icon: sample.icon,
        weight_g: scaledWeight,
        calories: nutr.calories,
        protein: nutr.protein,
        carbs: nutr.carbs,
        fat: nutr.fat,
        fiber: nutr.fiber,
        confidence: 0.96,
        recognition_badge: '⚡ YOLOv8 Recognition',
        box: { x: 10, y: 10, width: 80, height: 80 },
      },
    ],
    top_predictions: [
      { rank: 1, label: sample.name, icon: sample.icon, confidence: 0.96 },
      { rank: 2, label: 'Alternative Plate', icon: '🍲', confidence: 0.03 },
      { rank: 3, label: 'Side Dish', icon: '🥗', confidence: 0.01 },
    ],
    athletic_verdict: nutr.verdict,
    micronutrients: nutr.micronutrients,
    explanation: `Feature activations extracted around ${sample.name} regions.`,
  };

  return normalizeAnalysisResponse(raw, plateDiameterCm);
};

export const loadBenchmarkPlate = loadSamplePlate;
=======
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

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.15,
      topP: 0.9,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  const result = await geminiGenerate(key, payload);
  const rawText = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  if (!rawText.trim()) {
    throw new Error('Gemini returned no meal description. Try a clearer, closer photo of the plate.');
  }

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
    const foodKey = resolveFoodKey(d.food);
    const nutrition = calculateFoodNutrition(foodKey, scaledWeight);
    return {
      ...d,
      food: foodKey,
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
>>>>>>> Stashed changes

/**
 * Standardize and enrich the analysis response format
 */
export const normalizeAnalysisResponse = (raw, plateDiameterCm = 16.0) => {
  const dishes = (raw.dishes || []).map((d, index) => {
    const rawWeight = Number(d.weight_g);
    const weightG = Math.min(1000, Math.max(5, Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 100));
<<<<<<< Updated upstream
    const foodKey = String(d.food_category || d.food || d.food_key || d.name || 'unknown').toLowerCase().trim();

    // Respect server-calculated values first (which use exact nutrient = (per100g * weight)/100 formula)
    const calories = Number.isFinite(Number(d.calories))
      ? Number(d.calories)
      : calculateFoodNutrition(foodKey, weightG).calories;
    const protein = Number.isFinite(Number(d.protein))
      ? Number(d.protein)
      : calculateFoodNutrition(foodKey, weightG).protein;
    const carbs = Number.isFinite(Number(d.carbs))
      ? Number(d.carbs)
      : calculateFoodNutrition(foodKey, weightG).carbs;
    const fat = Number.isFinite(Number(d.fat))
      ? Number(d.fat)
      : calculateFoodNutrition(foodKey, weightG).fat;
    const fiber = Number.isFinite(Number(d.fiber))
      ? Number(d.fiber)
      : calculateFoodNutrition(foodKey, weightG).fiber;

    const confidence = Number.isFinite(Number(d.confidence)) ? Number(d.confidence) : 0.9;
=======
    const foodKey = resolveFoodKey(d.food_category || d.food || d.name || 'unknown');
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
>>>>>>> Stashed changes

    let box = d.box || null;
    if (box) {
      const rawX = Number(box.x || 0);
      const rawY = Number(box.y || 0);
      const rawW = Number(box.width || 0);
      const rawH = Number(box.height || 0);
      const x = Math.min(100, Math.max(0, rawX));
      const y = Math.min(100, Math.max(0, rawY));
      box = {
        x,
        y,
        width: Math.min(100 - x, Math.max(5, rawW)),
        height: Math.min(100 - y, Math.max(5, rawH)),
      };
    }

    return {
      id: d.id || `dish_${index + 1}`,
      name: d.name || 'Specialty Dish',
      food: foodKey,
      icon: d.icon || getFoodEmoji(d.name || foodKey),
      weight_g: weightG,
      calories: Math.round(calories * 10) / 10,
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      confidence: Math.min(1, Math.max(0, confidence)),
      cuisine: d.cuisine || raw.cuisine || 'Specialty',
      category: d.category || d.food_category || 'Prepared Meal',
      visible_ingredients: Array.isArray(d.visible_ingredients) ? d.visible_ingredients : [d.name],
      cooking_method: d.cooking_method || '',
      recognition_badge: d.recognition_badge || raw.recognition_badge || 'AI Recognition',
      recognition_source: d.recognition_source || raw.recognition_source || 'hybrid',
      nutrition_source: d.nutrition_source || (d.is_visually_estimated ? 'vlm_estimated' : 'database_verified'),
      is_visually_estimated: Boolean(d.is_visually_estimated),
      box,
    };
  });

  const totalCalories = Math.round(dishes.reduce((acc, d) => acc + d.calories, 0) * 10) / 10;
  const totalProtein = Math.round(dishes.reduce((acc, d) => acc + d.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(dishes.reduce((acc, d) => acc + d.carbs, 0) * 10) / 10;
  const totalFat = Math.round(dishes.reduce((acc, d) => acc + d.fat, 0) * 10) / 10;
  const totalWeightG = Math.round(dishes.reduce((acc, d) => acc + d.weight_g, 0) * 10) / 10;

  const nutriScore = raw.nutriScore || calculateNutriScore(totalCalories, totalProtein, totalCarbs, totalFat);

  const formattedPredictions = (raw.top_predictions || []).map((p, idx) => ({
    rank: p.rank || idx + 1,
    display_name: p.display_name || p.label || p.class_id || `Dish ${idx + 1}`,
    confidence: Number.isFinite(Number(p.confidence))
      ? Number(p.confidence)
      : Number.isFinite(Number(p.probability))
      ? Number(p.probability)
      : 0,
    icon: p.icon || getFoodEmoji(p.label || p.display_name),
  }));

  return {
    plate_name: raw.plate_name || (dishes[0] ? `${dishes[0].icon} ${dishes[0].name}` : 'Meal Scan'),
    cuisine: raw.cuisine || dishes[0]?.cuisine || 'Global',
    engine: raw.engine || 'hybrid_yolo_vlm',
    recognition_badge: raw.recognition_badge || '⚡ YOLOv8 + VLM Hybrid',
    recognition_source: raw.recognition_source || 'hybrid_fusion',
    fallback_activated: Boolean(raw.fallback_activated),
    fallback_reason: raw.fallback_reason || null,
    model: raw.model || raw.recognition_badge || 'Hybrid YOLOv8 + VLM',
    plate_diameter_cm: plateDiameterCm,
    timestamp: Date.now(),
    dishes,
    top_predictions: formattedPredictions.length > 0 ? formattedPredictions : null,
    gradcam_image: raw.gradcam_image || null,
    explanation: raw.explanation || '',
    totals: {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      weight_g: totalWeightG,
    },
    nutriScore,
    athletic_verdict: raw.athletic_verdict || generateAthleticVerdict(totalCalories, totalProtein, totalCarbs, totalFat),
    micronutrients: raw.micronutrients || (dishes[0]?.micronutrients ?? null),
    overall_confidence:
      dishes.length > 0
        ? Math.round((dishes.reduce((acc, d) => acc + d.confidence, 0) / dishes.length) * 100) / 100
        : 0,
  };
};

/**
 * Dynamically rescale portion weight and all nutritional macros
 * strictly using nutrient = (per100g * newWeight) / 100.0
 */
export const recalibratePlateDiameter = (analysis, newDiameterCm) => {
  if (!analysis) return null;
  const oldDiameter = analysis.plate_diameter_cm || 16.0;
  const ratio = Math.pow(newDiameterCm / oldDiameter, 2);

  const updatedDishes = (analysis.dishes || []).map((d) => {
    const oldWeight = Number(d.weight_g) || 100;
    const newWeight = Math.round(oldWeight * ratio * 10) / 10;
    const factor = newWeight / oldWeight;

    return {
      ...d,
      weight_g: newWeight,
      calories: Math.round(d.calories * factor * 10) / 10,
      protein: Math.round(d.protein * factor * 10) / 10,
      carbs: Math.round(d.carbs * factor * 10) / 10,
      fat: Math.round(d.fat * factor * 10) / 10,
      fiber: Math.round(d.fiber * factor * 10) / 10,
    };
  });

  return normalizeAnalysisResponse(
    {
      ...analysis,
      dishes: updatedDishes,
    },
    newDiameterCm
  );
};

export const updateDishInAnalysis = (analysis, dishId, updates) => {
  if (!analysis) return null;
  const updatedDishes = (analysis.dishes || []).map((d) => {
    if (d.id === dishId) {
      const oldWeight = Number(d.weight_g) || 100;
      const newWeight = updates.weight_g !== undefined ? Number(updates.weight_g) : oldWeight;
      const factor = newWeight / oldWeight;

<<<<<<< Updated upstream
      return {
        ...d,
        ...updates,
        weight_g: newWeight,
        calories: Math.round(d.calories * factor * 10) / 10,
        protein: Math.round(d.protein * factor * 10) / 10,
        carbs: Math.round(d.carbs * factor * 10) / 10,
        fat: Math.round(d.fat * factor * 10) / 10,
        fiber: Math.round(d.fiber * factor * 10) / 10,
      };
=======
  const updatedDishes = analysis.dishes.map((dish) => {
    if (dish.id !== dishId) return dish;
    const merged = { ...dish, ...updates };

    // If weight changed or food changed, recalculate macros
    if (updates.weight_g !== undefined || updates.food !== undefined) {
      merged.food = resolveFoodKey(merged.food);
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
>>>>>>> Stashed changes
    }
    return d;
  });
  return normalizeAnalysisResponse({ ...analysis, dishes: updatedDishes }, analysis.plate_diameter_cm);
};

export const getFoodEmoji = (foodName = '') => {
  const name = String(foodName).toLowerCase();
  if (name.includes('rice') || name.includes('biryani') || name.includes('pulao')) return '🍚';
  if (name.includes('paneer') || name.includes('curry') || name.includes('masala') || name.includes('dal')) return '🍲';
  if (name.includes('sashimi') || name.includes('salmon') || name.includes('fish')) return '🐟';
  if (name.includes('chicken') || name.includes('poultry') || name.includes('tandoori')) return '🍗';
  if (name.includes('beef') || name.includes('steak') || name.includes('meat')) return '🥩';
  if (name.includes('roti') || name.includes('naan') || name.includes('paratha') || name.includes('bread')) return '🫓';
  if (name.includes('dosa') || name.includes('pancake')) return '🥞';
  if (name.includes('idli')) return '⚪';
  if (name.includes('samosa') || name.includes('dumpling')) return '🥟';
  if (name.includes('dhokla')) return '🟡';
  if (name.includes('pizza')) return '🍕';
  if (name.includes('burger')) return '🍔';
  if (name.includes('noodle') || name.includes('ramen') || name.includes('pasta')) return '🍜';
  if (name.includes('salad')) return '🥗';
  if (name.includes('soup') || name.includes('sambar')) return '🥣';
  return '🍛';
};

<<<<<<< Updated upstream
export const getGeminiApiKey = () => {
  try {
    return window?.localStorage?.getItem('fitvision_gemini_api_key') || '';
  } catch (e) {
    return '';
  }
};
=======
/**
 * Add a new dish to analysis
 */
export const addDishToAnalysis = (analysis, foodKey, weightG = 100) => {
  if (!analysis || !analysis.dishes) return analysis;
  const key = resolveFoodKey(foodKey);
  const dbEntry = FOOD_DATABASE_256[key];
  const nutr = calculateFoodNutrition(key, weightG);
>>>>>>> Stashed changes

export const setGeminiApiKey = (key) => {
  try {
    if (key && key.trim()) window?.localStorage?.setItem('fitvision_gemini_api_key', key.trim());
    else window?.localStorage?.removeItem('fitvision_gemini_api_key');
  } catch (e) {}
};
