/**
 * Live Food & Nutrition API Service
 * Integrates Open Food Facts Global API with Barcode Lookup and Offline Caching.
 */

// Popular verified branded foods cache for instant 0ms responses & offline resilience
const VERIFIED_BRAND_FOODS = [
  {
    code: '737628064502',
    name: 'Chobani Greek Yogurt (Plain Non-Fat)',
    brand: 'Chobani',
    category: 'Dairy & Plant Yogurts',
    image: 'https://images.openfoodfacts.org/images/products/007/376/280/64502/front_en.16.400.jpg',
    nutriscore: 'A',
    nova: 1,
    nutriments: {
      calories: 59,
      protein: 10.3,
      carbs: 3.6,
      fat: 0,
      fiber: 0,
      sugars: 3.6,
      sodiumMg: 36,
      potassiumMg: 141,
      calciumMg: 110,
      ironMg: 0.1,
      magnesiumMg: 11,
      zincMg: 0.5,
      folateMcg: 7,
      vitaminCMg: 0,
      vitaminAMcg: 0,
      vitaminDMcg: 0,
      vitaminB12Mcg: 0.5,
      cholesterolMg: 5,
    },
    servingGrams: 170,
    tags: ['High Protein', 'Zero Fat', 'Probiotic', 'Clean Label'],
  },
  {
    code: '7350052850027',
    name: 'Oatly Barista Edition Oat Milk',
    brand: 'Oatly',
    category: 'Plant Milks',
    image: 'https://images.openfoodfacts.org/images/products/735/005/285/0027/front_en.149.400.jpg',
    nutriscore: 'B',
    nova: 3,
    nutriments: {
      calories: 59,
      protein: 1.1,
      carbs: 6.6,
      fat: 3,
      fiber: 0.8,
      sugars: 4,
      sodiumMg: 40,
      potassiumMg: 222,
      calciumMg: 120,
      ironMg: 0.1,
      magnesiumMg: 10,
      zincMg: 0.2,
      folateMcg: 5,
      vitaminCMg: 0,
      vitaminAMcg: 0,
      vitaminDMcg: 1.1,
      vitaminB12Mcg: 0.38,
      cholesterolMg: 0,
    },
    servingGrams: 200,
    tags: ['Vegan', 'Dairy-Free', 'Fortified Calcium'],
  },
  {
    code: '8901262010052',
    name: 'Amul Pure Ghee / Clarified Butter',
    brand: 'Amul',
    category: 'Fats & Oils',
    image: 'https://images.openfoodfacts.org/images/products/890/126/201/0052/front_en.11.400.jpg',
    nutriscore: 'D',
    nova: 2,
    nutriments: {
      calories: 897,
      protein: 0,
      carbs: 0,
      fat: 99.7,
      fiber: 0,
      sugars: 0,
      sodiumMg: 0,
      potassiumMg: 0,
      calciumMg: 0,
      ironMg: 0,
      magnesiumMg: 0,
      zincMg: 0,
      folateMcg: 0,
      vitaminCMg: 0,
      vitaminAMcg: 650,
      vitaminDMcg: 1.2,
      vitaminB12Mcg: 0,
      cholesterolMg: 256,
    },
    servingGrams: 15,
    tags: ['Traditional Ghee', 'Vitamin A', 'Keto Energy'],
  },
  {
    code: '038000318282',
    name: "Kellogg's Special K Original Cereal",
    brand: "Kellogg's",
    category: 'Breakfast Cereals',
    image: 'https://images.openfoodfacts.org/images/products/003/800/031/8282/front_en.41.400.jpg',
    nutriscore: 'B',
    nova: 4,
    nutriments: {
      calories: 382,
      protein: 17.9,
      carbs: 76.5,
      fat: 1.2,
      fiber: 5.9,
      sugars: 11.8,
      sodiumMg: 794,
      potassiumMg: 265,
      calciumMg: 40,
      ironMg: 26.5,
      magnesiumMg: 50,
      zincMg: 8.8,
      folateMcg: 700,
      vitaminCMg: 35,
      vitaminAMcg: 882,
      vitaminDMcg: 8.8,
      vitaminB12Mcg: 5.3,
      cholesterolMg: 0,
    },
    servingGrams: 39,
    tags: ['High Iron', 'B-Vitamins', 'Quick Breakfast'],
  },
  {
    code: '076808518335',
    name: 'Barilla Protein+ Penne Pasta',
    brand: 'Barilla',
    category: 'Grains & Pasta',
    image: 'https://images.openfoodfacts.org/images/products/007/680/851/8335/front_en.11.400.jpg',
    nutriscore: 'A',
    nova: 1,
    nutriments: {
      calories: 345,
      protein: 17.2,
      carbs: 69,
      fat: 1.7,
      fiber: 6.9,
      sugars: 3.4,
      sodiumMg: 0,
      potassiumMg: 431,
      calciumMg: 34,
      ironMg: 3.4,
      magnesiumMg: 65,
      zincMg: 2.1,
      folateMcg: 172,
      vitaminCMg: 0,
      vitaminAMcg: 0,
      vitaminDMcg: 0,
      vitaminB12Mcg: 0,
      cholesterolMg: 0,
    },
    servingGrams: 100,
    tags: ['Plant Protein', 'High Fiber', 'Non-GMO'],
  },
  {
    code: '8906067020083',
    name: 'MuscleBlaze Biozyme Performance Whey',
    brand: 'MuscleBlaze',
    category: 'Sports Nutrition',
    image: 'https://images.openfoodfacts.org/images/products/890/606/702/0083/front_en.4.400.jpg',
    nutriscore: 'A',
    nova: 4,
    nutriments: {
      calories: 388,
      protein: 75,
      carbs: 9.5,
      fat: 5.6,
      fiber: 1.2,
      sugars: 3.1,
      sodiumMg: 190,
      potassiumMg: 460,
      calciumMg: 480,
      ironMg: 1.2,
      magnesiumMg: 65,
      zincMg: 2.4,
      folateMcg: 22,
      vitaminCMg: 0,
      vitaminAMcg: 15,
      vitaminDMcg: 0.8,
      vitaminB12Mcg: 1.6,
      cholesterolMg: 48,
    },
    servingGrams: 36,
    tags: ['75% Protein', 'Enzyme Enhanced', 'Fast Digestion'],
  },
]

/**
 * Normalizes Open Food Facts product structure to our 18-nutrient schema
 */
export const normalizeApiProduct = (prod) => {
  const nut = prod.nutriments || {}
  const getNum = (val, fallback = 0) => {
    const n = Number(val)
    return Number.isFinite(n) ? n : fallback
  }

  const cals = getNum(nut['energy-kcal_100g'], getNum(nut.energy_100g ? nut.energy_100g / 4.184 : 0))

  return {
    code: prod.code || prod._id || String(Math.random()),
    name: prod.product_name || prod.product_name_en || 'Nutrition Item',
    brand: prod.brands || prod.brand_owner || 'Verified Food',
    category: prod.categories?.split(',')[0] || 'Food & Grocery',
    image: prod.image_front_url || prod.image_url || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400',
    nutriscore: (prod.nutriscore_grade || 'b').toUpperCase(),
    nova: prod.nova_group || 2,
    servingGrams: Math.round(getNum(prod.serving_quantity, 100)),
    nutriments: {
      calories: Math.round(cals),
      protein: Number(getNum(nut.proteins_100g, 0).toFixed(1)),
      carbs: Number(getNum(nut.carbohydrates_100g, 0).toFixed(1)),
      fat: Number(getNum(nut.fat_100g, 0).toFixed(1)),
      fiber: Number(getNum(nut.fiber_100g, 0).toFixed(1)),
      sugars: Number(getNum(nut.sugars_100g, 0).toFixed(1)),
      sodiumMg: Math.round(getNum(nut.sodium_100g, 0) * 1000),
      potassiumMg: Math.round(getNum(nut.potassium_100g, 0) * 1000),
      calciumMg: Math.round(getNum(nut.calcium_100g, 0) * 1000),
      ironMg: Number(getNum(nut.iron_100g, 0) * 1000).toFixed(1) * 1,
      magnesiumMg: Math.round(getNum(nut.magnesium_100g, 0) * 1000),
      zincMg: Number(getNum(nut.zinc_100g, 0) * 1000).toFixed(1) * 1,
      folateMcg: Math.round(getNum(nut.folates_100g, 0) * 1000000),
      vitaminCMg: Number(getNum(nut['vitamin-c_100g'], 0) * 1000).toFixed(1) * 1,
      vitaminAMcg: Math.round(getNum(nut['vitamin-a_100g'], 0) * 1000000),
      vitaminDMcg: Number(getNum(nut['vitamin-d_100g'], 0) * 1000000).toFixed(1) * 1,
      vitaminB12Mcg: Number(getNum(nut['vitamin-b12_100g'], 0) * 1000000).toFixed(2) * 1,
      cholesterolMg: Math.round(getNum(nut.cholesterol_100g, 0) * 1000),
    },
    tags: [
      prod.nutriscore_grade ? `Nutri-Score ${prod.nutriscore_grade.toUpperCase()}` : 'Clean Diet',
      cals > 250 ? 'Energy Dense' : 'Low Calorie',
      getNum(nut.proteins_100g, 0) > 10 ? 'High Protein' : 'Balanced',
    ],
  }
}

/**
 * Searches Open Food Facts Global API with local cache fallback
 */
export const searchFoodApi = async (query) => {
  if (!query || query.trim().length === 0) return VERIFIED_BRAND_FOODS

  const trimmed = query.trim().toLowerCase()

  // 1. Check local verified catalog first
  const localMatches = VERIFIED_BRAND_FOODS.filter(
    f =>
      f.name.toLowerCase().includes(trimmed) ||
      f.brand.toLowerCase().includes(trimmed) ||
      f.tags.some(t => t.toLowerCase().includes(trimmed))
  )

  // 2. Query Open Food Facts API with timeout
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    const url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(
      query
    )}&page_size=8&json=true`

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FitVisionAI/1.0 (fitness-vision-app)' },
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data.products && data.products.length > 0) {
        const apiResults = data.products
          .filter(p => p.product_name && p.nutriments)
          .map(normalizeApiProduct)

        // Combine API results with local matches (deduping by name)
        const combined = [...apiResults]
        localMatches.forEach(lm => {
          if (!combined.some(c => c.name.toLowerCase() === lm.name.toLowerCase())) {
            combined.unshift(lm)
          }
        })
        return combined.slice(0, 10)
      }
    }
  } catch (err) {
    console.warn('Open Food Facts API search fallback:', err.message)
  }

  return localMatches.length > 0 ? localMatches : VERIFIED_BRAND_FOODS
}

/**
 * Looks up a food product by Barcode (EAN-13 / UPC)
 */
export const lookupBarcodeApi = async (barcode) => {
  const cleanBarcode = barcode.trim()

  // 1. Check local cache
  const local = VERIFIED_BRAND_FOODS.find(f => f.code === cleanBarcode)
  if (local) return local

  // 2. Query Open Food Facts Barcode endpoint
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      cleanBarcode
    )}.json`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FitVisionAI/1.0 (fitness-vision-app)' },
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (data.status === 1 && data.product) {
        return normalizeApiProduct(data.product)
      }
    }
  } catch (err) {
    console.warn('Barcode lookup error:', err)
  }

  return null
}
