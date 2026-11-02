export const NUTRIENT_LABELS = {
  calories: { label: 'Energy', unit: 'kcal', dailyValue: 2000 },
  protein: { label: 'Protein', unit: 'g', dailyValue: 50 },
  carbs: { label: 'Carbohydrates', unit: 'g', dailyValue: 275 },
  fat: { label: 'Fat', unit: 'g', dailyValue: 78 },
  fiber: { label: 'Fiber', unit: 'g', dailyValue: 28 },
  sugars: { label: 'Total sugars', unit: 'g' },
  sodiumMg: { label: 'Sodium', unit: 'mg', dailyValue: 2300 },
  potassiumMg: { label: 'Potassium', unit: 'mg', dailyValue: 4700 },
  calciumMg: { label: 'Calcium', unit: 'mg', dailyValue: 1300 },
  ironMg: { label: 'Iron', unit: 'mg', dailyValue: 18 },
  magnesiumMg: { label: 'Magnesium', unit: 'mg', dailyValue: 420 },
  zincMg: { label: 'Zinc', unit: 'mg', dailyValue: 11 },
  folateMcg: { label: 'Folate', unit: 'mcg', dailyValue: 400 },
  vitaminCMg: { label: 'Vitamin C', unit: 'mg', dailyValue: 90 },
  vitaminAMcg: { label: 'Vitamin A', unit: 'mcg', dailyValue: 900 },
  vitaminDMcg: { label: 'Vitamin D', unit: 'mcg', dailyValue: 20 },
  vitaminB12Mcg: { label: 'Vitamin B12', unit: 'mcg', dailyValue: 2.4 },
  cholesterolMg: { label: 'Cholesterol', unit: 'mg', dailyValue: 300 },
}

export const FOOD_NUTRIENTS = {
  rice: {
    name: 'White rice, cooked',
    calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, sugars: 0.1,
    sodiumMg: 1, potassiumMg: 35, calciumMg: 10, ironMg: 0.2, magnesiumMg: 12, zincMg: 0.5, folateMcg: 3,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
  brownRice: {
    name: 'Brown rice, cooked',
    calories: 123, protein: 2.7, carbs: 25.6, fat: 1, fiber: 1.6, sugars: 0.2,
    sodiumMg: 4, potassiumMg: 86, calciumMg: 3, ironMg: 0.6, magnesiumMg: 39, zincMg: 0.6, folateMcg: 4,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
  roti: {
    name: 'Whole-wheat roti',
    calories: 297, protein: 11.2, carbs: 55.7, fat: 4.3, fiber: 9.2, sugars: 2.3,
    sodiumMg: 5, potassiumMg: 280, calciumMg: 25, ironMg: 3.6, magnesiumMg: 82, zincMg: 1.2, folateMcg: 28,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
  dal: {
    name: 'Lentils, cooked',
    calories: 116, protein: 9, carbs: 20.1, fat: 0.4, fiber: 7.9, sugars: 1.8,
    sodiumMg: 2, potassiumMg: 369, calciumMg: 19, ironMg: 3.3, magnesiumMg: 36, zincMg: 1.3, folateMcg: 181,
    vitaminCMg: 1.5, vitaminAMcg: 8, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
  chickpeas: {
    name: 'Chickpeas, cooked',
    calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, sugars: 4.8,
    sodiumMg: 7, potassiumMg: 291, calciumMg: 49, ironMg: 2.9, magnesiumMg: 48, zincMg: 1.5, folateMcg: 172,
    vitaminCMg: 1.3, vitaminAMcg: 1, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
  chicken: {
    name: 'Chicken breast, cooked',
    calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugars: 0,
    sodiumMg: 74, potassiumMg: 256, calciumMg: 15, ironMg: 1, magnesiumMg: 29, zincMg: 1, folateMcg: 4,
    vitaminCMg: 0, vitaminAMcg: 6, vitaminDMcg: 0.1, vitaminB12Mcg: 0.3, cholesterolMg: 85,
  },
  egg: {
    name: 'Egg, boiled',
    calories: 155, protein: 12.6, carbs: 1.1, fat: 10.6, fiber: 0, sugars: 1.1,
    sodiumMg: 124, potassiumMg: 126, calciumMg: 50, ironMg: 1.2, magnesiumMg: 10, zincMg: 1.1, folateMcg: 47,
    vitaminCMg: 0, vitaminAMcg: 149, vitaminDMcg: 2, vitaminB12Mcg: 1.1, cholesterolMg: 373,
  },
  paneer: {
    name: 'Paneer',
    calories: 265, protein: 18.3, carbs: 1.2, fat: 20.8, fiber: 0, sugars: 1.2,
    sodiumMg: 18, potassiumMg: 104, calciumMg: 208, ironMg: 0.2, magnesiumMg: 8, zincMg: 2.5, folateMcg: 20,
    vitaminCMg: 0, vitaminAMcg: 210, vitaminDMcg: 0.5, vitaminB12Mcg: 0.7, cholesterolMg: 56,
  },
  yogurt: {
    name: 'Plain yogurt',
    calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, sugars: 4.7,
    sodiumMg: 46, potassiumMg: 155, calciumMg: 121, ironMg: 0.1, magnesiumMg: 12, zincMg: 0.6, folateMcg: 7,
    vitaminCMg: 0.5, vitaminAMcg: 27, vitaminDMcg: 0.1, vitaminB12Mcg: 0.4, cholesterolMg: 13,
  },
  banana: {
    name: 'Banana',
    calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sugars: 12.2,
    sodiumMg: 1, potassiumMg: 358, calciumMg: 5, ironMg: 0.3, magnesiumMg: 27, zincMg: 0.2, folateMcg: 20,
    vitaminCMg: 8.7, vitaminAMcg: 3, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
  apple: {
    name: 'Apple with skin',
    calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sugars: 10.4,
    sodiumMg: 1, potassiumMg: 107, calciumMg: 6, ironMg: 0.1, magnesiumMg: 5, zincMg: 0, folateMcg: 3,
    vitaminCMg: 4.6, vitaminAMcg: 3, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
  spinach: {
    name: 'Spinach, cooked',
    calories: 23, protein: 3, carbs: 3.8, fat: 0.3, fiber: 2.4, sugars: 0.4,
    sodiumMg: 70, potassiumMg: 466, calciumMg: 136, ironMg: 3.6, magnesiumMg: 87, zincMg: 0.5, folateMcg: 146,
    vitaminCMg: 9.8, vitaminAMcg: 524, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
  potato: {
    name: 'Potato, boiled',
    calories: 87, protein: 1.9, carbs: 20.1, fat: 0.1, fiber: 1.8, sugars: 0.9,
    sodiumMg: 4, potassiumMg: 379, calciumMg: 5, ironMg: 0.3, magnesiumMg: 20, zincMg: 0.3, folateMcg: 10,
    vitaminCMg: 13, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
  salmon: {
    name: 'Salmon, cooked',
    calories: 206, protein: 22.1, carbs: 0, fat: 12.4, fiber: 0, sugars: 0,
    sodiumMg: 59, potassiumMg: 384, calciumMg: 15, ironMg: 0.3, magnesiumMg: 30, zincMg: 0.4, folateMcg: 25,
    vitaminCMg: 0, vitaminAMcg: 12, vitaminDMcg: 13, vitaminB12Mcg: 3.2, cholesterolMg: 63,
  },
  oats: {
    name: 'Oats, dry',
    calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, sugars: 0.9,
    sodiumMg: 2, potassiumMg: 429, calciumMg: 54, ironMg: 4.7, magnesiumMg: 177, zincMg: 4, folateMcg: 56,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
  almonds: {
    name: 'Almonds',
    calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, sugars: 4.4,
    sodiumMg: 1, potassiumMg: 733, calciumMg: 269, ironMg: 3.7, magnesiumMg: 270, zincMg: 3.1, folateMcg: 44,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
  tomato: {
    name: 'Tomato, raw',
    calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugars: 2.6,
    sodiumMg: 5, potassiumMg: 237, calciumMg: 10, ironMg: 0.3, magnesiumMg: 11, zincMg: 0.2, folateMcg: 15,
    vitaminCMg: 13.7, vitaminAMcg: 42, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
  avocado: {
    name: 'Avocado',
    calories: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, sugars: 0.7,
    sodiumMg: 7, potassiumMg: 485, calciumMg: 12, ironMg: 0.6, magnesiumMg: 29, zincMg: 0.6, folateMcg: 81,
    vitaminCMg: 10, vitaminAMcg: 7, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
  },
}

export const calculateMealNutrition = items => {
  const totals = Object.keys(NUTRIENT_LABELS).reduce((result, nutrient) => {
    result[nutrient] = 0
    return result
  }, {})

  items.forEach(item => {
    const food = FOOD_NUTRIENTS[item.foodId]
    const grams = Number(item.grams)
    if (!food || !Number.isFinite(grams) || grams <= 0) return

    Object.keys(totals).forEach(nutrient => {
      totals[nutrient] += ((food[nutrient] || 0) * grams) / 100
    })
  })

  return totals
}
