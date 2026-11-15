export const NUTRIENT_LABELS = {
  calories: { label: 'Energy', unit: 'kcal', dailyValue: 2000, color: '#f59e0b' },
  protein: { label: 'Protein', unit: 'g', dailyValue: 50, color: '#8b5cf6' },
  carbs: { label: 'Carbohydrates', unit: 'g', dailyValue: 275, color: '#3b82f6' },
  fat: { label: 'Fat', unit: 'g', dailyValue: 78, color: '#ec4899' },
  fiber: { label: 'Fiber', unit: 'g', dailyValue: 28, color: '#10b981' },
  sugars: { label: 'Total sugars', unit: 'g', dailyValue: 50, color: '#f43f5e' },
  sodiumMg: { label: 'Sodium', unit: 'mg', dailyValue: 2300, color: '#a855f7' },
  potassiumMg: { label: 'Potassium', unit: 'mg', dailyValue: 4700, color: '#06b6d4' },
  calciumMg: { label: 'Calcium', unit: 'mg', dailyValue: 1300, color: '#e0e7ff' },
  ironMg: { label: 'Iron', unit: 'mg', dailyValue: 18, color: '#f97316' },
  magnesiumMg: { label: 'Magnesium', unit: 'mg', dailyValue: 420, color: '#14b8a6' },
  zincMg: { label: 'Zinc', unit: 'mg', dailyValue: 11, color: '#6366f1' },
  folateMcg: { label: 'Folate', unit: 'mcg', dailyValue: 400, color: '#84cc16' },
  vitaminCMg: { label: 'Vitamin C', unit: 'mg', dailyValue: 90, color: '#eab308' },
  vitaminAMcg: { label: 'Vitamin A', unit: 'mcg', dailyValue: 900, color: '#fb923c' },
  vitaminDMcg: { label: 'Vitamin D', unit: 'mcg', dailyValue: 20, color: '#fde047' },
  vitaminB12Mcg: { label: 'Vitamin B12', unit: 'mcg', dailyValue: 2.4, color: '#38bdf8' },
  cholesterolMg: { label: 'Cholesterol', unit: 'mg', dailyValue: 300, color: '#f87171' },
}

export const FOOD_NUTRIENTS = {
  rice: {
    name: 'White rice, cooked',
    icon: '🍚',
    category: 'grain',
    defaultGrams: 150,
    calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, sugars: 0.1,
    sodiumMg: 1, potassiumMg: 35, calciumMg: 10, ironMg: 0.2, magnesiumMg: 12, zincMg: 0.5, folateMcg: 3,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Carb Source', 'Gluten-Free', 'Quick Energy'],
    colorHue: 'white',
  },
  brownRice: {
    name: 'Brown rice, cooked',
    icon: '🌾',
    category: 'grain',
    defaultGrams: 150,
    calories: 123, protein: 2.7, carbs: 25.6, fat: 1, fiber: 1.6, sugars: 0.2,
    sodiumMg: 4, potassiumMg: 86, calciumMg: 3, ironMg: 0.6, magnesiumMg: 39, zincMg: 0.6, folateMcg: 4,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Whole Grain', 'Fiber Rich', 'Slow Digesting'],
    colorHue: 'brown',
  },
  roti: {
    name: 'Whole-wheat roti / chapati',
    icon: '🫓',
    category: 'grain',
    defaultGrams: 60,
    calories: 297, protein: 11.2, carbs: 55.7, fat: 4.3, fiber: 9.2, sugars: 2.3,
    sodiumMg: 5, potassiumMg: 280, calciumMg: 25, ironMg: 3.6, magnesiumMg: 82, zincMg: 1.2, folateMcg: 28,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['High Fiber', 'Complex Carbs', 'Traditional'],
    colorHue: 'brown',
  },
  dal: {
    name: 'Lentils / Dal, cooked',
    icon: '🍲',
    category: 'meal',
    defaultGrams: 180,
    calories: 116, protein: 9, carbs: 20.1, fat: 0.4, fiber: 7.9, sugars: 1.8,
    sodiumMg: 2, potassiumMg: 369, calciumMg: 19, ironMg: 3.3, magnesiumMg: 36, zincMg: 1.3, folateMcg: 181,
    vitaminCMg: 1.5, vitaminAMcg: 8, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Plant Protein', 'High Fiber', 'Iron Rich', 'Heart Healthy'],
    colorHue: 'yellow',
  },
  chickpeas: {
    name: 'Chickpeas / Chana, cooked',
    icon: '🧆',
    category: 'meal',
    defaultGrams: 160,
    calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, sugars: 4.8,
    sodiumMg: 7, potassiumMg: 291, calciumMg: 49, ironMg: 2.9, magnesiumMg: 48, zincMg: 1.5, folateMcg: 172,
    vitaminCMg: 1.3, vitaminAMcg: 1, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['High Fiber', 'Plant Protein', 'Satiating'],
    colorHue: 'yellow',
  },
  chicken: {
    name: 'Chicken breast, grilled',
    icon: '🍗',
    category: 'protein',
    defaultGrams: 120,
    calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugars: 0,
    sodiumMg: 74, potassiumMg: 256, calciumMg: 15, ironMg: 1, magnesiumMg: 29, zincMg: 1, folateMcg: 4,
    vitaminCMg: 0, vitaminAMcg: 6, vitaminDMcg: 0.1, vitaminB12Mcg: 0.3, cholesterolMg: 85,
    tags: ['Lean Protein', 'Zero Carbs', 'Muscle Building'],
    colorHue: 'white',
  },
  egg: {
    name: 'Egg, whole boiled',
    icon: '🥚',
    category: 'protein',
    defaultGrams: 100,
    calories: 155, protein: 12.6, carbs: 1.1, fat: 10.6, fiber: 0, sugars: 1.1,
    sodiumMg: 124, potassiumMg: 126, calciumMg: 50, ironMg: 1.2, magnesiumMg: 10, zincMg: 1.1, folateMcg: 47,
    vitaminCMg: 0, vitaminAMcg: 149, vitaminDMcg: 2, vitaminB12Mcg: 1.1, cholesterolMg: 373,
    tags: ['Complete Protein', 'Choline Rich', 'Healthy Fats'],
    colorHue: 'white',
  },
  paneer: {
    name: 'Paneer / Cottage cheese',
    icon: '🧀',
    category: 'dairy',
    defaultGrams: 100,
    calories: 265, protein: 18.3, carbs: 1.2, fat: 20.8, fiber: 0, sugars: 1.2,
    sodiumMg: 18, potassiumMg: 104, calciumMg: 208, ironMg: 0.2, magnesiumMg: 8, zincMg: 2.5, folateMcg: 20,
    vitaminCMg: 0, vitaminAMcg: 210, vitaminDMcg: 0.5, vitaminB12Mcg: 0.7, cholesterolMg: 56,
    tags: ['Vegetarian Protein', 'Calcium Rich', 'Keto Friendly'],
    colorHue: 'white',
  },
  yogurt: {
    name: 'Greek yogurt, plain',
    icon: '🥣',
    category: 'dairy',
    defaultGrams: 150,
    calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, sugars: 4.7,
    sodiumMg: 46, potassiumMg: 155, calciumMg: 121, ironMg: 0.1, magnesiumMg: 12, zincMg: 0.6, folateMcg: 7,
    vitaminCMg: 0.5, vitaminAMcg: 27, vitaminDMcg: 0.1, vitaminB12Mcg: 0.4, cholesterolMg: 13,
    tags: ['Probiotic', 'Gut Health', 'Calcium Rich'],
    colorHue: 'white',
  },
  banana: {
    name: 'Banana, fresh',
    icon: '🍌',
    category: 'fruit',
    defaultGrams: 120,
    calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sugars: 12.2,
    sodiumMg: 1, potassiumMg: 358, calciumMg: 5, ironMg: 0.3, magnesiumMg: 27, zincMg: 0.2, folateMcg: 20,
    vitaminCMg: 8.7, vitaminAMcg: 3, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Potassium Rich', 'Pre-Workout', 'Natural Energy'],
    colorHue: 'yellow',
  },
  apple: {
    name: 'Apple with skin',
    icon: '🍎',
    category: 'fruit',
    defaultGrams: 150,
    calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sugars: 10.4,
    sodiumMg: 1, potassiumMg: 107, calciumMg: 6, ironMg: 0.1, magnesiumMg: 5, zincMg: 0, folateMcg: 3,
    vitaminCMg: 4.6, vitaminAMcg: 3, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Antioxidants', 'Low Calorie', 'High Pectin'],
    colorHue: 'red',
  },
  spinach: {
    name: 'Spinach, cooked / Palak',
    icon: '🥬',
    category: 'vegetable',
    defaultGrams: 100,
    calories: 23, protein: 3, carbs: 3.8, fat: 0.3, fiber: 2.4, sugars: 0.4,
    sodiumMg: 70, potassiumMg: 466, calciumMg: 136, ironMg: 3.6, magnesiumMg: 87, zincMg: 0.5, folateMcg: 146,
    vitaminCMg: 9.8, vitaminAMcg: 524, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Superfood', 'Iron Rich', 'Vitamin A', 'Low Calorie'],
    colorHue: 'green',
  },
  potato: {
    name: 'Potato, boiled',
    icon: '🥔',
    category: 'grain',
    defaultGrams: 150,
    calories: 87, protein: 1.9, carbs: 20.1, fat: 0.1, fiber: 1.8, sugars: 0.9,
    sodiumMg: 4, potassiumMg: 379, calciumMg: 5, ironMg: 0.3, magnesiumMg: 20, zincMg: 0.3, folateMcg: 10,
    vitaminCMg: 13, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Satiating', 'Clean Starch', 'Potassium Source'],
    colorHue: 'yellow',
  },
  salmon: {
    name: 'Salmon fillet, cooked',
    icon: '🐟',
    category: 'protein',
    defaultGrams: 140,
    calories: 206, protein: 22.1, carbs: 0, fat: 12.4, fiber: 0, sugars: 0,
    sodiumMg: 59, potassiumMg: 384, calciumMg: 15, ironMg: 0.3, magnesiumMg: 30, zincMg: 0.4, folateMcg: 25,
    vitaminCMg: 0, vitaminAMcg: 12, vitaminDMcg: 13, vitaminB12Mcg: 3.2, cholesterolMg: 63,
    tags: ['Omega-3', 'High Protein', 'Vitamin D', 'Brain Health'],
    colorHue: 'red',
  },
  oats: {
    name: 'Oats, cooked porridge',
    icon: '🥣',
    category: 'grain',
    defaultGrams: 180,
    calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, sugars: 0.9,
    sodiumMg: 2, potassiumMg: 429, calciumMg: 54, ironMg: 4.7, magnesiumMg: 177, zincMg: 4, folateMcg: 56,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Beta Glucan', 'Heart Healthy', 'High Fiber'],
    colorHue: 'brown',
  },
  almonds: {
    name: 'Almonds, raw',
    icon: '🥜',
    category: 'fat',
    defaultGrams: 30,
    calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, sugars: 4.4,
    sodiumMg: 1, potassiumMg: 733, calciumMg: 269, ironMg: 3.7, magnesiumMg: 270, zincMg: 3.1, folateMcg: 44,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Vitamin E', 'Healthy Fats', 'Magnesium Rich'],
    colorHue: 'brown',
  },
  tomato: {
    name: 'Tomato, fresh raw',
    icon: '🍅',
    category: 'vegetable',
    defaultGrams: 100,
    calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugars: 2.6,
    sodiumMg: 5, potassiumMg: 237, calciumMg: 10, ironMg: 0.3, magnesiumMg: 11, zincMg: 0.2, folateMcg: 15,
    vitaminCMg: 13.7, vitaminAMcg: 42, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Lycopene', 'Vitamin C', 'Hydrating'],
    colorHue: 'red',
  },
  avocado: {
    name: 'Avocado, ripe',
    icon: '🥑',
    category: 'fat',
    defaultGrams: 80,
    calories: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, sugars: 0.7,
    sodiumMg: 7, potassiumMg: 485, calciumMg: 12, ironMg: 0.6, magnesiumMg: 29, zincMg: 0.6, folateMcg: 81,
    vitaminCMg: 10, vitaminAMcg: 7, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Monounsaturated Fats', 'High Fiber', 'Potassium Power'],
    colorHue: 'green',
  },
  salad: {
    name: 'Garden Green Salad (Mixed)',
    icon: '🥗',
    category: 'vegetable',
    defaultGrams: 150,
    calories: 33, protein: 1.8, carbs: 5.2, fat: 0.6, fiber: 2.8, sugars: 2.1,
    sodiumMg: 38, potassiumMg: 310, calciumMg: 65, ironMg: 1.4, magnesiumMg: 24, zincMg: 0.4, folateMcg: 78,
    vitaminCMg: 18.5, vitaminAMcg: 280, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Ultra Low Calorie', 'High Micronutrients', 'Detox'],
    colorHue: 'green',
  },
  broccoli: {
    name: 'Broccoli, steamed',
    icon: '🥦',
    category: 'vegetable',
    defaultGrams: 120,
    calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 3.3, sugars: 1.4,
    sodiumMg: 41, potassiumMg: 293, calciumMg: 40, ironMg: 0.7, magnesiumMg: 21, zincMg: 0.4, folateMcg: 108,
    vitaminCMg: 65, vitaminAMcg: 77, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Vitamin C Bomb', 'Sulforaphane', 'Cruciferous'],
    colorHue: 'green',
  },
  biryani: {
    name: 'Chicken / Veg Biryani',
    icon: '🥘',
    category: 'meal',
    defaultGrams: 250,
    calories: 168, protein: 8.5, carbs: 23.4, fat: 5.1, fiber: 1.5, sugars: 0.8,
    sodiumMg: 210, potassiumMg: 160, calciumMg: 22, ironMg: 1.1, magnesiumMg: 24, zincMg: 0.9, folateMcg: 16,
    vitaminCMg: 2.2, vitaminAMcg: 45, vitaminDMcg: 0.1, vitaminB12Mcg: 0.2, cholesterolMg: 25,
    tags: ['Complete Meal', 'Aromatic Spices', 'High Energy'],
    colorHue: 'yellow',
  },
  butterChicken: {
    name: 'Butter Chicken / Chicken Tikka Masala',
    icon: '🍛',
    category: 'meal',
    defaultGrams: 200,
    calories: 185, protein: 14.2, carbs: 5.8, fat: 11.8, fiber: 1.2, sugars: 3.4,
    sodiumMg: 340, potassiumMg: 280, calciumMg: 48, ironMg: 1.5, magnesiumMg: 28, zincMg: 1.4, folateMcg: 18,
    vitaminCMg: 4.5, vitaminAMcg: 160, vitaminDMcg: 0.2, vitaminB12Mcg: 0.4, cholesterolMg: 52,
    tags: ['High Protein', 'Rich Flavor', 'Keto Friendly'],
    colorHue: 'red',
  },
  dosa: {
    name: 'Crisp Masala Dosa',
    icon: '🥞',
    category: 'meal',
    defaultGrams: 150,
    calories: 168, protein: 3.9, carbs: 28.5, fat: 4.2, fiber: 2.1, sugars: 0.6,
    sodiumMg: 195, potassiumMg: 145, calciumMg: 24, ironMg: 1.4, magnesiumMg: 28, zincMg: 0.7, folateMcg: 22,
    vitaminCMg: 3.1, vitaminAMcg: 15, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Fermented Batter', 'Crispy', 'Comfort Food'],
    colorHue: 'yellow',
  },
  idli: {
    name: 'Steamed Idli (Rice & Urad Dal)',
    icon: '🍙',
    category: 'meal',
    defaultGrams: 120,
    calories: 132, protein: 4.2, carbs: 27.5, fat: 0.5, fiber: 1.8, sugars: 0.3,
    sodiumMg: 110, potassiumMg: 125, calciumMg: 18, ironMg: 1.2, magnesiumMg: 22, zincMg: 0.6, folateMcg: 26,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Steamed', 'Zero Oil', 'Easy Digestion'],
    colorHue: 'white',
  },
  tofu: {
    name: 'Tofu, firm pan-seared',
    icon: '🧈',
    category: 'protein',
    defaultGrams: 120,
    calories: 144, protein: 17.3, carbs: 2.8, fat: 8.7, fiber: 2.3, sugars: 0.6,
    sodiumMg: 14, potassiumMg: 237, calciumMg: 350, ironMg: 2.7, magnesiumMg: 58, zincMg: 1.6, folateMcg: 29,
    vitaminCMg: 0.2, vitaminAMcg: 17, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Vegan Protein', 'Calcium Powerhouse', 'Low Carb'],
    colorHue: 'white',
  },
  sweetPotato: {
    name: 'Sweet potato, baked',
    icon: '🍠',
    category: 'grain',
    defaultGrams: 150,
    calories: 90, protein: 2, carbs: 20.7, fat: 0.2, fiber: 3.3, sugars: 6.5,
    sodiumMg: 36, potassiumMg: 475, calciumMg: 38, ironMg: 0.7, magnesiumMg: 27, zincMg: 0.3, folateMcg: 6,
    vitaminCMg: 19.6, vitaminAMcg: 961, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['High Vitamin A', 'Clean Carbs', 'Immunity Boost'],
    colorHue: 'red',
  },
  orange: {
    name: 'Orange, fresh citrus',
    icon: '🍊',
    category: 'fruit',
    defaultGrams: 140,
    calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, sugars: 9.4,
    sodiumMg: 0, potassiumMg: 181, calciumMg: 40, ironMg: 0.1, magnesiumMg: 10, zincMg: 0.1, folateMcg: 30,
    vitaminCMg: 53.2, vitaminAMcg: 11, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Vitamin C Rich', 'Hydrating', 'Immunity'],
    colorHue: 'red',
  },
  peanutButter: {
    name: 'Peanut Butter, natural',
    icon: '🥜',
    category: 'fat',
    defaultGrams: 32,
    calories: 588, protein: 25.1, carbs: 20, fat: 50.4, fiber: 6, sugars: 9.2,
    sodiumMg: 17, potassiumMg: 649, calciumMg: 43, ironMg: 1.9, magnesiumMg: 154, zincMg: 2.9, folateMcg: 86,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Calorie Dense', 'Plant Protein', 'Healthy Fats'],
    colorHue: 'brown',
  },
  wheyProtein: {
    name: 'Whey Protein Shake (1 scoop in water)',
    icon: '🥤',
    category: 'protein',
    defaultGrams: 30,
    calories: 395, protein: 78.5, carbs: 6.5, fat: 5.2, fiber: 0, sugars: 3.5,
    sodiumMg: 180, potassiumMg: 450, calciumMg: 420, ironMg: 0.8, magnesiumMg: 60, zincMg: 2.1, folateMcg: 15,
    vitaminCMg: 0, vitaminAMcg: 20, vitaminDMcg: 0.5, vitaminB12Mcg: 1.4, cholesterolMg: 45,
    tags: ['Pure Protein', 'Post-Workout', 'Rapid Absorption'],
    colorHue: 'white',
  },
  pizza: {
    name: 'Vegetable & Cheese Pizza (Slice)',
    icon: '🍕',
    category: 'meal',
    defaultGrams: 120,
    calories: 266, protein: 11.4, carbs: 33.3, fat: 9.7, fiber: 2.3, sugars: 3.6,
    sodiumMg: 598, potassiumMg: 172, calciumMg: 188, ironMg: 2.5, magnesiumMg: 24, zincMg: 1.3, folateMcg: 68,
    vitaminCMg: 2.8, vitaminAMcg: 98, vitaminDMcg: 0.3, vitaminB12Mcg: 0.6, cholesterolMg: 17,
    tags: ['Comfort Food', 'Calcium Source', 'Energy Rich'],
    colorHue: 'yellow',
  },
  puri: {
    name: 'Puri / Poori (Crisp Fried Wheat Bread)',
    icon: '🫓',
    category: 'grain',
    defaultGrams: 80,
    calories: 298, protein: 6.8, carbs: 44.5, fat: 11.2, fiber: 3.2, sugars: 0.8,
    sodiumMg: 195, potassiumMg: 165, calciumMg: 24, ironMg: 2.2, magnesiumMg: 42, zincMg: 0.9, folateMcg: 18,
    vitaminCMg: 0, vitaminAMcg: 8, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Whole Wheat', 'Crisp & Golden', 'Indian Staple'],
    colorHue: 'brown',
  },
  greenSabzi: {
    name: 'Green Beans & Peas Sabzi',
    icon: '🫛',
    category: 'vegetable',
    defaultGrams: 120,
    calories: 54, protein: 3.1, carbs: 9.6, fat: 1.1, fiber: 4.5, sugars: 2.4,
    sodiumMg: 145, potassiumMg: 290, calciumMg: 48, ironMg: 1.6, magnesiumMg: 34, zincMg: 0.7, folateMcg: 62,
    vitaminCMg: 22.4, vitaminAMcg: 95, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['High Fiber', 'Rich in Vitamins', 'Low Calorie', 'Antioxidants'],
    colorHue: 'green',
  },
  cabbageSabzi: {
    name: 'Cabbage Sabzi / Poriyal',
    icon: '🥗',
    category: 'vegetable',
    defaultGrams: 100,
    calories: 46, protein: 1.8, carbs: 7.2, fat: 1.4, fiber: 3.1, sugars: 2.3,
    sodiumMg: 135, potassiumMg: 215, calciumMg: 42, ironMg: 0.9, magnesiumMg: 19, zincMg: 0.4, folateMcg: 48,
    vitaminCMg: 31.5, vitaminAMcg: 22, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Cruciferous', 'Light & Fresh', 'Low Calorie'],
    colorHue: 'yellow',
  },
  kheer: {
    name: 'Rice Kheer / Sweet Curd / Raita',
    icon: '🥣',
    category: 'dairy',
    defaultGrams: 120,
    calories: 138, protein: 4.2, carbs: 22.1, fat: 3.9, fiber: 0.4, sugars: 15.8,
    sodiumMg: 68, potassiumMg: 175, calciumMg: 135, ironMg: 0.3, magnesiumMg: 18, zincMg: 0.6, folateMcg: 9,
    vitaminCMg: 0.6, vitaminAMcg: 62, vitaminDMcg: 0.2, vitaminB12Mcg: 0.5, cholesterolMg: 12,
    tags: ['Dairy Calcium', 'Sweet Treat', 'Traditional Dessert'],
    colorHue: 'white',
  },
  chai: {
    name: 'Indian Masala Chai / Milk Tea',
    icon: '☕',
    category: 'beverage',
    defaultGrams: 150,
    calories: 72, protein: 2.4, carbs: 10.2, fat: 2.5, fiber: 0, sugars: 9.4,
    sodiumMg: 45, potassiumMg: 125, calciumMg: 88, ironMg: 0.2, magnesiumMg: 15, zincMg: 0.3, folateMcg: 7,
    vitaminCMg: 0.4, vitaminAMcg: 30, vitaminDMcg: 0.1, vitaminB12Mcg: 0.3, cholesterolMg: 7,
    tags: ['Warm Beverage', 'Antioxidants', 'Energy Boost'],
    colorHue: 'brown',
  },
  bread: {
    name: 'Sliced Bread (White / Wheat)',
    icon: '🍞',
    category: 'grain',
    defaultGrams: 60,
    calories: 152, protein: 5.4, carbs: 28.2, fat: 1.9, fiber: 1.9, sugars: 3.1,
    sodiumMg: 275, potassiumMg: 78, calciumMg: 62, ironMg: 1.7, magnesiumMg: 16, zincMg: 0.5, folateMcg: 36,
    vitaminCMg: 0, vitaminAMcg: 0, vitaminDMcg: 0, vitaminB12Mcg: 0, cholesterolMg: 0,
    tags: ['Breakfast Carbs', 'Toast Staple'],
    colorHue: 'brown',
  },
}

/**
 * Calculates sum of nutrients for a meal composed of items { foodId, grams }
 */
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

/**
 * Compute NutriScore (A/B/C/D) and diet health insights
 */
export const calculateNutriScore = totals => {
  let score = 70 // Baseline

  // Positive nutrient factors
  if (totals.protein >= 25) score += 10
  else if (totals.protein >= 15) score += 5

  if (totals.fiber >= 6) score += 10
  else if (totals.fiber >= 3) score += 5

  if (totals.potassiumMg >= 400) score += 5
  if (totals.vitaminCMg >= 30) score += 5

  // Negative nutrient factors
  if (totals.sodiumMg > 800) score -= 12
  else if (totals.sodiumMg > 500) score -= 6

  if (totals.sugars > 25) score -= 12
  else if (totals.sugars > 15) score -= 6

  if (totals.calories > 900) score -= 8

  score = Math.max(20, Math.min(100, Math.round(score)))

  let grade = 'B'
  let label = 'Nutritious & Balanced'
  let color = '#10b981'

  if (score >= 85) {
    grade = 'A'
    label = 'Excellent Nutrient Density'
    color = '#10b981'
  } else if (score >= 70) {
    grade = 'B'
    label = 'Good Nutritional Balance'
    color = '#3b82f6'
  } else if (score >= 50) {
    grade = 'C'
    label = 'Moderate Balance — Watch Sodium & Sugar'
    color = '#f59e0b'
  } else {
    grade = 'D'
    label = 'High Calorie / Refined Diet'
    color = '#ef4444'
  }

  return { score, grade, label, color }
}

/**
 * Image classification dictionary mapping MobileNet / AI keywords to food IDs
 */
export const FOOD_KEYWORD_MAP = {
  rice: 'rice',
  wok: 'rice',
  pilaf: 'rice',
  biryani: 'biryani',
  risotto: 'rice',
  roti: 'roti',
  flatbread: 'roti',
  naan: 'roti',
  pita: 'roti',
  tortilla: 'roti',
  burrito: 'roti',
  taco: 'roti',
  lentil: 'dal',
  dal: 'dal',
  soup: 'dal',
  consomme: 'dal',
  stew: 'dal',
  chickpea: 'chickpeas',
  hummus: 'chickpeas',
  falafel: 'chickpeas',
  chicken: 'chicken',
  poultry: 'chicken',
  drumstick: 'chicken',
  turkey: 'chicken',
  egg: 'egg',
  omelet: 'egg',
  scrambled: 'egg',
  paneer: 'paneer',
  cheese: 'paneer',
  cottage: 'paneer',
  tofu: 'tofu',
  yogurt: 'yogurt',
  custard: 'yogurt',
  banana: 'banana',
  plantain: 'banana',
  apple: 'apple',
  pomegranate: 'apple',
  spinach: 'spinach',
  kale: 'spinach',
  salad: 'salad',
  lettuce: 'salad',
  cucumber: 'salad',
  broccoli: 'broccoli',
  cauliflower: 'broccoli',
  potato: 'potato',
  french_fries: 'potato',
  mashed_potato: 'potato',
  salmon: 'salmon',
  fish: 'salmon',
  trout: 'salmon',
  oats: 'oats',
  porridge: 'oats',
  granola: 'oats',
  cereal: 'oats',
  almond: 'almonds',
  nut: 'almonds',
  peanut: 'almonds',
  tomato: 'tomato',
  avocado: 'avocado',
  guacamole: 'avocado',
  orange: 'orange',
  lemon: 'orange',
  citrus: 'orange',
  pizza: 'pizza',
  burger: 'chicken',
  cheeseburger: 'chicken',
  curry: 'dal',
  butter_chicken: 'butterChicken',
  masala: 'dal',
  tikka: 'butterChicken',
  dosa: 'dosa',
  crepe: 'dosa',
  pancake: 'dosa',
  idli: 'idli',
  puri: 'puri',
  poori: 'puri',
  bread: 'bread',
  toast: 'bread',
  loaf: 'bread',
  bun: 'bread',
  cabbage: 'cabbageSabzi',
  bean: 'greenSabzi',
  beans: 'greenSabzi',
  pea: 'greenSabzi',
  peas: 'greenSabzi',
  green_bean: 'greenSabzi',
  green_beans: 'greenSabzi',
  vegetable: 'greenSabzi',
  veggie: 'greenSabzi',
  kheer: 'kheer',
  pudding: 'kheer',
  dessert: 'kheer',
  raita: 'kheer',
  curd: 'kheer',
  tea: 'chai',
  chai: 'chai',
  coffee: 'chai',
  cup: 'chai',
  mug: 'chai',
  tumbler: 'chai',
  glass: 'chai',
  thali: 'dal',
  platter: 'dal',
  tray: 'dal',
  pot: 'dal',
  pan: 'dal',
  bowl: 'dal',
  dish: 'dal',
}

/**
 * Intelligent Image Vision Analyzer:
 * Analyzes image pixels via HTML5 Canvas for dominant color hue, brightness,
 * and matches with visual food signatures.
 */
export const analyzeImagePixels = (imgElement) => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const size = 64
    canvas.width = size
    canvas.height = size
    ctx.drawImage(imgElement, 0, 0, size, size)

    const imageData = ctx.getImageData(0, 0, size, size)
    const data = imageData.data
    let totalR = 0, totalG = 0, totalB = 0
    let greenCount = 0, redCount = 0, yellowCount = 0, darkCount = 0, whiteCount = 0

    const totalPixels = size * size
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      totalR += r
      totalG += g
      totalB += b

      const brightness = (r + g + b) / 3

      // Green dominance (Salads, Spinach, Green Sabzi, Broccoli, Avocado)
      if (g > r * 1.12 && g > b * 1.12) {
        greenCount++
      }
      // Red/Orange dominance (Curry, Tomato, Salmon)
      else if (r > g * 1.25 && r > b * 1.35) {
        redCount++
      }
      // Yellow/Golden dominance (Dal, Roti, Puri, Dosa, Banana, Cabbage Sabzi)
      else if (r > 135 && g > 110 && b < 100) {
        yellowCount++
      }
      // Dark/Brown dominance (Chicken, Nuts, Roti crust, Chai)
      else if (brightness < 80) {
        darkCount++
      }
      // High brightness / White dominance (White rice, Kheer, Curd, Paneer, Idli)
      else if (brightness > 190) {
        whiteCount++
      }
    }

    const avgR = Math.round(totalR / totalPixels)
    const avgG = Math.round(totalG / totalPixels)
    const avgB = Math.round(totalB / totalPixels)

    let detectedCategory = 'meal'
    let candidateIds = []

    if (greenCount / totalPixels > 0.18) {
      detectedCategory = 'vegetable'
      candidateIds = ['greenSabzi', 'salad', 'spinach', 'broccoli', 'avocado']
    } else if (redCount / totalPixels > 0.2) {
      detectedCategory = 'meal'
      candidateIds = ['butterChicken', 'tomato', 'dal', 'salmon', 'sweetPotato']
    } else if (yellowCount / totalPixels > 0.16) {
      detectedCategory = 'grain'
      candidateIds = ['dal', 'puri', 'cabbageSabzi', 'roti', 'banana', 'biryani', 'dosa']
    } else if (whiteCount / totalPixels > 0.22) {
      detectedCategory = 'grain'
      candidateIds = ['rice', 'kheer', 'idli', 'egg', 'paneer', 'yogurt']
    } else if (darkCount / totalPixels > 0.25) {
      detectedCategory = 'protein'
      candidateIds = ['roti', 'bread', 'chai', 'chicken', 'salmon', 'almonds']
    } else {
      detectedCategory = 'meal'
      candidateIds = ['dal', 'puri', 'greenSabzi', 'cabbageSabzi', 'roti', 'chicken']
    }

    return {
      dominantColor: `rgb(${avgR}, ${avgG}, ${avgB})`,
      category: detectedCategory,
      candidates: candidateIds,
    }
  } catch (err) {
    console.warn('Canvas pixel analysis fallback:', err)
    return {
      dominantColor: '#10b981',
      category: 'meal',
      candidates: ['salad', 'chicken', 'rice', 'dal'],
    }
  }
}
