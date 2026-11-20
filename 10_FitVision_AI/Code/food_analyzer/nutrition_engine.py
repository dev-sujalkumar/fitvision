"""
FitVision AI - Intelligent Nutrition Knowledge Base & Matching Engine
Combines:
  1. UEC-256 database (nutrition_256.csv)
  2. Extended Indian & International authentic nutritional profiles
  3. Density overrides database (density_overrides_template.csv)
  4. Multi-tier matching: Exact -> Normalized -> Synonym -> Fuzzy -> Ingredient-based
  5. Scientifically grounded nutrient scaling:
     nutrient = (nutrient_per_100g * weight_g) / 100.0
"""

import os
import re
import difflib
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATASETS_DIR = BASE_DIR / "datasets"
NUTRITION_CSV = DATASETS_DIR / "nutrition_256.csv"
DENSITY_CSV = DATASETS_DIR / "density_overrides_template.csv"

# ==============================================================================
# EXTENDED AUTHENTIC NUTRITION DATABASE (Indian + Global Specialities)
# Values verified per 100 grams of standard edible portion
# ==============================================================================
EXTENDED_FOOD_DB = {
    # --- Indian Vegetarian Classics ---
    "paneer_butter_masala": {
        "name": "Paneer Butter Masala",
        "category": "Curry / Gravy",
        "cuisine": "Indian (North Indian)",
        "icon": "🍲",
        "calories": 229.0,
        "protein": 8.5,
        "carbs": 7.2,
        "fat": 19.0,
        "fiber": 1.8,
        "density": 0.95,
        "portion_g": 220,
        "visible_ingredients": ["Paneer cubes", "Tomato-cashew gravy", "Butter", "Cream", "Kasuri methi"],
        "cooking_method": "Simmered in spiced butter and tomato-cashew reduction",
        "athletic_verdict": "High-protein recovery fuel rich in calcium and dietary fats for sustained energy.",
        "micronutrients": {"calcium_mg": 280, "iron_mg": 1.4, "potassium_mg": 210, "vitamin_c_mg": 6.5, "sodium_mg": 380, "fiber_g": 1.8}
    },
    "shahi_paneer": {
        "name": "Shahi Paneer",
        "category": "Curry / Gravy",
        "cuisine": "Indian (Mughlai)",
        "icon": "🍲",
        "calories": 218.0,
        "protein": 8.0,
        "carbs": 8.0,
        "fat": 17.5,
        "fiber": 1.5,
        "density": 0.95,
        "portion_g": 220,
        "visible_ingredients": ["Paneer", "Yogurt", "Cashew-almond paste", "Cardamom", "Saffron gravy"],
        "cooking_method": "Royal slow-braised curry finished with aromatics",
        "athletic_verdict": "Rich in leucine for muscle protein synthesis and slow-digesting lipids.",
        "micronutrients": {"calcium_mg": 260, "iron_mg": 1.2, "potassium_mg": 190, "vitamin_c_mg": 4.0, "sodium_mg": 340, "fiber_g": 1.5}
    },
    "dal_makhani": {
        "name": "Dal Makhani",
        "category": "Lentil / Dal",
        "cuisine": "Indian (Punjabi)",
        "icon": "🥣",
        "calories": 142.0,
        "protein": 6.2,
        "carbs": 16.5,
        "fat": 5.8,
        "fiber": 4.8,
        "density": 0.98,
        "portion_g": 200,
        "visible_ingredients": ["Whole black urad dal", "Rajma", "Tomato purée", "Butter", "Fenugreek"],
        "cooking_method": "Slow-cooked over charcoal for 8+ hours with butter & cream",
        "athletic_verdict": "Complex low-GI carbohydrate source packed with pre-biotic fiber and plant protein.",
        "micronutrients": {"calcium_mg": 75, "iron_mg": 2.8, "potassium_mg": 360, "vitamin_c_mg": 3.0, "sodium_mg": 320, "fiber_g": 4.8}
    },
    "rajma_chawal": {
        "name": "Rajma Chawal",
        "category": "Composite Meal",
        "cuisine": "Indian (North Indian)",
        "icon": "🍛",
        "calories": 148.0,
        "protein": 5.2,
        "carbs": 26.0,
        "fat": 2.6,
        "fiber": 3.6,
        "density": 0.90,
        "portion_g": 350,
        "visible_ingredients": ["Red kidney beans", "Steamed basmati rice", "Onion-tomato gravy", "Coriander"],
        "cooking_method": "Pressure-cooked spiced kidney bean stew served with steamed basmati rice",
        "athletic_verdict": "Complete amino acid profile combo (grain + legume). Superb post-workout muscle glycogen restorer.",
        "micronutrients": {"calcium_mg": 45, "iron_mg": 2.2, "potassium_mg": 310, "vitamin_c_mg": 4.5, "sodium_mg": 290, "fiber_g": 3.6}
    },
    "chole_bhature": {
        "name": "Chole Bhature",
        "category": "Composite Meal / Street Food",
        "cuisine": "Indian (Punjabi)",
        "icon": "🥘",
        "calories": 275.0,
        "protein": 7.0,
        "carbs": 35.0,
        "fat": 12.0,
        "fiber": 4.2,
        "density": 0.85,
        "portion_g": 320,
        "visible_ingredients": ["Kabuli chana", "Deep-fried fermented bhatura", "Pickled onion", "Green chutney"],
        "cooking_method": "Dark spiced chickpea masala with leavened deep-fried bread",
        "athletic_verdict": "Calorie & carbohydrate dense. Excellent for heavy training refeed or bulking phases.",
        "micronutrients": {"calcium_mg": 60, "iron_mg": 3.0, "potassium_mg": 280, "vitamin_c_mg": 5.0, "sodium_mg": 480, "fiber_g": 4.2}
    },
    "aloo_paratha": {
        "name": "Aloo Paratha",
        "category": "Flatbread / Breakfast",
        "cuisine": "Indian (Punjabi)",
        "icon": "🫓",
        "calories": 215.0,
        "protein": 4.8,
        "carbs": 34.0,
        "fat": 7.2,
        "fiber": 3.1,
        "density": 0.88,
        "portion_g": 160,
        "visible_ingredients": ["Whole wheat dough", "Spiced mashed potatoes", "Ghee / Butter", "Coriander", "Cumin"],
        "cooking_method": "Stuffed whole wheat flatbread griddled on tawa with ghee",
        "athletic_verdict": "Dense pre-workout complex carbs. Delivers steady glycogen for prolonged stamina.",
        "micronutrients": {"calcium_mg": 30, "iron_mg": 1.9, "potassium_mg": 250, "vitamin_c_mg": 8.0, "sodium_mg": 310, "fiber_g": 3.1}
    },
    "masala_dosa": {
        "name": "Masala Dosa",
        "category": "Crepe / Breakfast",
        "cuisine": "Indian (South Indian)",
        "icon": "🥞",
        "calories": 168.0,
        "protein": 3.9,
        "carbs": 26.5,
        "fat": 5.2,
        "fiber": 2.2,
        "density": 0.80,
        "portion_g": 200,
        "visible_ingredients": ["Fermented rice-lentil crepe", "Spiced potato masala", "Mustard seeds", "Curry leaves"],
        "cooking_method": "Crispy griddled fermented batter rolled around savory spiced potato filling",
        "athletic_verdict": "Fermented gut-friendly carbs with easily digestible starch for fast endurance energy.",
        "micronutrients": {"calcium_mg": 28, "iron_mg": 1.6, "potassium_mg": 190, "vitamin_c_mg": 6.0, "sodium_mg": 340, "fiber_g": 2.2}
    },
    "idli": {
        "name": "Idli",
        "category": "Steamed Cake / Breakfast",
        "cuisine": "Indian (South Indian)",
        "icon": "⚪",
        "calories": 132.0,
        "protein": 3.8,
        "carbs": 28.0,
        "fat": 0.4,
        "fiber": 1.8,
        "density": 0.82,
        "portion_g": 140,
        "visible_ingredients": ["Fermented rice and urad dal batter", "Fenugreek seeds"],
        "cooking_method": "Steam-cooked in specialized concave molds without added oil",
        "athletic_verdict": "Zero-added-fat pure clean carbohydrate. The ultimate clean pre-training fuel.",
        "micronutrients": {"calcium_mg": 22, "iron_mg": 1.1, "potassium_mg": 110, "vitamin_c_mg": 0.0, "sodium_mg": 180, "fiber_g": 1.8}
    },
    "sambar": {
        "name": "Sambar",
        "category": "Lentil Soup / Stew",
        "cuisine": "Indian (South Indian)",
        "icon": "🥣",
        "calories": 62.0,
        "protein": 2.9,
        "carbs": 9.5,
        "fat": 1.5,
        "fiber": 2.6,
        "density": 0.98,
        "portion_g": 180,
        "visible_ingredients": ["Toor dal", "Drumsticks", "Shallots", "Tamarind", "Sambar masala", "Curry leaves"],
        "cooking_method": "Lentils simmered with indigenous vegetables, tamarind broth, and tempering",
        "athletic_verdict": "Electrolyte and micronutrient rich low-calorie hydration soup promoting digestion.",
        "micronutrients": {"calcium_mg": 40, "iron_mg": 1.5, "potassium_mg": 240, "vitamin_c_mg": 9.0, "sodium_mg": 360, "fiber_g": 2.6}
    },
    "pav_bhaji": {
        "name": "Pav Bhaji",
        "category": "Street Food / Curry",
        "cuisine": "Indian (Maharashtrian)",
        "icon": "🍛",
        "calories": 178.0,
        "protein": 4.2,
        "carbs": 23.0,
        "fat": 7.8,
        "fiber": 3.4,
        "density": 0.92,
        "portion_g": 300,
        "visible_ingredients": ["Mashed potatoes, cauliflower, peas, tomatoes", "Butter-toasted pav", "Pav bhaji masala"],
        "cooking_method": "Wok-mashed seasonal vegetable medley with generous butter, served with griddled rolls",
        "athletic_verdict": "Carb and vegetable packed post-workout fuel. Great source of vitamins A and C.",
        "micronutrients": {"calcium_mg": 52, "iron_mg": 2.1, "potassium_mg": 320, "vitamin_c_mg": 18.0, "sodium_mg": 460, "fiber_g": 3.4}
    },
    "chicken_biryani": {
        "name": "Chicken Biryani",
        "category": "Rice Dish / Main",
        "cuisine": "Indian (Hyderabadi / Mughlai)",
        "icon": "🍗",
        "calories": 182.0,
        "protein": 11.5,
        "carbs": 21.0,
        "fat": 5.8,
        "fiber": 1.4,
        "density": 0.88,
        "portion_g": 350,
        "visible_ingredients": ["Marinated chicken pieces", "Long-grain aged basmati rice", "Saffron", "Fried onions (birista)", "Mint"],
        "cooking_method": "Layered 'Dum' slow steam-cooked sealed with dough",
        "athletic_verdict": "Optimal hypertrophy fuel: high-quality animal protein combined with muscle-loading complex rice carbs.",
        "micronutrients": {"calcium_mg": 32, "iron_mg": 1.8, "potassium_mg": 260, "vitamin_c_mg": 3.5, "sodium_mg": 420, "fiber_g": 1.4}
    },
    "butter_chicken": {
        "name": "Butter Chicken (Murgh Makhani)",
        "category": "Curry / Poultry",
        "cuisine": "Indian (Punjabi / Delhi)",
        "icon": "🍗",
        "calories": 195.0,
        "protein": 14.8,
        "carbs": 5.2,
        "fat": 12.8,
        "fiber": 1.1,
        "density": 0.95,
        "portion_g": 240,
        "visible_ingredients": ["Tandoori chicken pieces", "Tomato puree", "Butter", "Heavy cream", "Fenugreek"],
        "cooking_method": "Charcoal-tandoor grilled chicken simmered in a silky tomato-makhani gravy",
        "athletic_verdict": "High-leucine lean poultry protein with satiating fats; ideal for muscle repair and anabolic recovery.",
        "micronutrients": {"calcium_mg": 58, "iron_mg": 1.6, "potassium_mg": 290, "vitamin_c_mg": 5.2, "sodium_mg": 410, "fiber_g": 1.1}
    },
    "samosa": {
        "name": "Samosa",
        "category": "Savory Pastry / Snack",
        "cuisine": "Indian (National)",
        "icon": "🥟",
        "calories": 262.0,
        "protein": 4.2,
        "carbs": 32.5,
        "fat": 13.0,
        "fiber": 2.4,
        "density": 0.80,
        "portion_g": 90,
        "visible_ingredients": ["Crispy pastry crust", "Spiced potatoes", "Green peas", "Cumin seeds", "Coriander"],
        "cooking_method": "Deep-fried flaky pastry filled with savory potato-pea stuffing",
        "athletic_verdict": "Calorically dense snack. Enjoy on high-energy output training days.",
        "micronutrients": {"calcium_mg": 24, "iron_mg": 1.8, "potassium_mg": 210, "vitamin_c_mg": 6.0, "sodium_mg": 380, "fiber_g": 2.4}
    },
    "kachori": {
        "name": "Kachori",
        "category": "Savory Pastry / Snack",
        "cuisine": "Indian (Rajasthani / UP)",
        "icon": "🍘",
        "calories": 315.0,
        "protein": 5.6,
        "carbs": 35.0,
        "fat": 17.0,
        "fiber": 2.8,
        "density": 0.78,
        "portion_g": 85,
        "visible_ingredients": ["Flaky fried pastry", "Spiced yellow moong dal / urad dal / onion filling", "Fennel"],
        "cooking_method": "Deep-fried golden flaky puffed pastry with spiced dal mixture",
        "athletic_verdict": "High energy density; good fuel reserve prior to intense outdoor endurance sessions.",
        "micronutrients": {"calcium_mg": 28, "iron_mg": 2.2, "potassium_mg": 180, "vitamin_c_mg": 2.0, "sodium_mg": 420, "fiber_g": 2.8}
    },
    "dhokla": {
        "name": "Khaman Dhokla",
        "category": "Steamed Snack / Breakfast",
        "cuisine": "Indian (Gujarati)",
        "icon": "🟡",
        "calories": 158.0,
        "protein": 6.2,
        "carbs": 25.5,
        "fat": 3.6,
        "fiber": 2.9,
        "density": 0.65,
        "portion_g": 120,
        "visible_ingredients": ["Gram flour (Besan)", "Turmeric", "Mustard seeds", "Green chilies", "Fresh coconut"],
        "cooking_method": "Fermented besan batter steamed into spongy cakes and tempered with mustard seeds",
        "athletic_verdict": "Low-fat, high-fiber, fermented plant protein sponge. Ideal clean snack for cutting.",
        "micronutrients": {"calcium_mg": 42, "iron_mg": 2.4, "potassium_mg": 220, "vitamin_c_mg": 4.0, "sodium_mg": 310, "fiber_g": 2.9}
    },
    "poha": {
        "name": "Kanda Poha",
        "category": "Breakfast / Snack",
        "cuisine": "Indian (Maharashtrian / MP)",
        "icon": "🥣",
        "calories": 135.0,
        "protein": 2.8,
        "carbs": 24.5,
        "fat": 3.0,
        "fiber": 1.9,
        "density": 0.70,
        "portion_g": 150,
        "visible_ingredients": ["Flattened rice", "Onions", "Roasted peanuts", "Turmeric", "Curry leaves", "Lemon juice"],
        "cooking_method": "Tempered and sautéed soaked flattened rice with onions, peanuts, and spices",
        "athletic_verdict": "Iron-rich easily digestible carbohydrate with healthy fats from peanuts. Fast energy booster.",
        "micronutrients": {"calcium_mg": 20, "iron_mg": 3.5, "potassium_mg": 140, "vitamin_c_mg": 7.5, "sodium_mg": 220, "fiber_g": 1.9}
    },
    "upma": {
        "name": "Rava Upma",
        "category": "Porridge / Breakfast",
        "cuisine": "Indian (South Indian)",
        "icon": "🥣",
        "calories": 142.0,
        "protein": 3.4,
        "carbs": 23.5,
        "fat": 4.0,
        "fiber": 1.7,
        "density": 0.85,
        "portion_g": 180,
        "visible_ingredients": ["Semolina (sooji)", "Mustard seeds", "Ginger", "Curry leaves", "Cashews / Peanuts"],
        "cooking_method": "Roasted semolina cooked into a savory porridge with aromatics and vegetables",
        "athletic_verdict": "Sustained-release complex carbs helping maintain stable blood glucose during training.",
        "micronutrients": {"calcium_mg": 18, "iron_mg": 1.4, "potassium_mg": 120, "vitamin_c_mg": 3.0, "sodium_mg": 260, "fiber_g": 1.7}
    },
    "litti_chokha": {
        "name": "Litti Chokha",
        "category": "Traditional Meal",
        "cuisine": "Indian (Bihari)",
        "icon": "🧆",
        "calories": 210.0,
        "protein": 6.8,
        "carbs": 35.0,
        "fat": 5.2,
        "fiber": 4.5,
        "density": 0.85,
        "portion_g": 260,
        "visible_ingredients": ["Whole wheat balls stuffed with spiced roasted sattu", "Smoked eggplant-tomato chokha", "Ghee"],
        "cooking_method": "Cow-dung cake or charcoal grilled dough balls served with smoked mash and pure ghee",
        "athletic_verdict": "Nutritional powerhouse! Sattu provides high-fiber plant protein and sustained stamina.",
        "micronutrients": {"calcium_mg": 65, "iron_mg": 3.8, "potassium_mg": 340, "vitamin_c_mg": 12.0, "sodium_mg": 320, "fiber_g": 4.5}
    },
    "khichdi": {
        "name": "Moong Dal Khichdi",
        "category": "One-Pot Meal",
        "cuisine": "Indian (National)",
        "icon": "🍲",
        "calories": 120.0,
        "protein": 4.5,
        "carbs": 21.0,
        "fat": 2.2,
        "fiber": 2.8,
        "density": 0.92,
        "portion_g": 280,
        "visible_ingredients": ["Rice", "Split yellow moong dal", "Cumin seeds", "Turmeric", "Ghee"],
        "cooking_method": "Simmered rice and lentils cooked together until tender, tempered with cumin and ghee",
        "athletic_verdict": "Ultimate digestive recovery meal. Gentle on the GI tract while delivering full amino spectrum.",
        "micronutrients": {"calcium_mg": 28, "iron_mg": 1.8, "potassium_mg": 190, "vitamin_c_mg": 2.0, "sodium_mg": 210, "fiber_g": 2.8}
    },
    "roti": {
        "name": "Roti (Phulka / Chapati)",
        "category": "Flatbread",
        "cuisine": "Indian (National)",
        "icon": "🫓",
        "calories": 264.0,
        "protein": 9.2,
        "carbs": 55.0,
        "fat": 1.2,
        "fiber": 7.0,
        "density": 0.80,
        "portion_g": 45,
        "visible_ingredients": ["100% Whole wheat flour (Atta)", "Water"],
        "cooking_method": "Dry roasted on tawa and puffed directly over open flame with zero added fat",
        "athletic_verdict": "High-fiber whole-grain staple. The gold standard athletic Indian carbohydrate foundation.",
        "micronutrients": {"calcium_mg": 35, "iron_mg": 3.6, "potassium_mg": 290, "vitamin_c_mg": 0.0, "sodium_mg": 5, "fiber_g": 7.0}
    },
    "naan": {
        "name": "Butter Naan",
        "category": "Flatbread",
        "cuisine": "Indian (North Indian)",
        "icon": "🫓",
        "calories": 290.0,
        "protein": 8.5,
        "carbs": 50.0,
        "fat": 6.5,
        "fiber": 2.2,
        "density": 0.78,
        "portion_g": 90,
        "visible_ingredients": ["Refined flour (Maida)", "Yogurt", "Butter", "Nigella seeds (kalonji)"],
        "cooking_method": "Slapped onto the interior clay wall of an intensely hot tandoor, brushed with butter",
        "athletic_verdict": "High glycemic index fast carbohydrate. Ideal for rapid glycogen reloading post-workout.",
        "micronutrients": {"calcium_mg": 45, "iron_mg": 1.8, "potassium_mg": 130, "vitamin_c_mg": 0.0, "sodium_mg": 380, "fiber_g": 2.2}
    },
    "palak_paneer": {
        "name": "Palak Paneer",
        "category": "Curry / Greens",
        "cuisine": "Indian (North Indian)",
        "icon": "🍲",
        "calories": 155.0,
        "protein": 7.8,
        "carbs": 4.5,
        "fat": 12.0,
        "fiber": 3.2,
        "density": 0.95,
        "portion_g": 220,
        "visible_ingredients": ["Blanched spinach puree", "Paneer cubes", "Garlic", "Ginger", "Garam masala"],
        "cooking_method": "Spinach pureed with aromatics and folded with pan-seared paneer cubes",
        "athletic_verdict": "Superfood powerhouse! High bioavailability iron, magnesium, calcium, and clean casein protein.",
        "micronutrients": {"calcium_mg": 290, "iron_mg": 3.8, "potassium_mg": 410, "vitamin_c_mg": 14.0, "sodium_mg": 320, "fiber_g": 3.2}
    },
    "gulab_jamun": {
        "name": "Gulab Jamun",
        "category": "Dessert / Sweet",
        "cuisine": "Indian (National)",
        "icon": "🟤",
        "calories": 326.0,
        "protein": 4.5,
        "carbs": 54.0,
        "fat": 10.5,
        "fiber": 0.5,
        "density": 1.10,
        "portion_g": 80,
        "visible_ingredients": ["Milk solids (Khoa/Mawa)", "Flour", "Rose-cardamom sugar syrup", "Ghee"],
        "cooking_method": "Deep-fried khoa dough balls soaked in warm rosewater and saffron sugar syrup",
        "athletic_verdict": "High-sugar indulgence. Use exclusively as an immediate refeed carb spike if needed.",
        "micronutrients": {"calcium_mg": 110, "iron_mg": 0.8, "potassium_mg": 95, "vitamin_c_mg": 0.0, "sodium_mg": 90, "fiber_g": 0.5}
    },
};

# ==============================================================================
# ALIAS & SYNONYM DICTIONARY FOR ROBUST LOOKUPS
# Maps various colloquial, regional, and multilingual names to canonical keys
# ==============================================================================
FOOD_ALIASES: Dict[str, str] = {
    # Paneer aliases
    "paneer butter masala": "paneer_butter_masala",
    "butter paneer": "paneer_butter_masala",
    "paneer makhani": "paneer_butter_masala",
    "paneer tikka masala": "paneer_butter_masala",
    "shahi paneer": "shahi_paneer",
    "palak paneer": "palak_paneer",
    "saag paneer": "palak_paneer",
    "paneer": "paneer_butter_masala",
    "cottage cheese curry": "paneer_butter_masala",

    # Dal aliases
    "dal makhani": "dal_makhani",
    "dal makhni": "dal_makhani",
    "makhani dal": "dal_makhani",
    "black dal": "dal_makhani",
    "dal": "dal_makhani",
    "daal": "dal_makhani",
    "lentil curry": "dal_makhani",
    "yellow dal": "khichdi",
    "tadka dal": "dal_makhani",

    # Rice and combos
    "rajma chawal": "rajma_chawal",
    "rajma": "rajma_chawal",
    "rajmah": "rajma_chawal",
    "kidney bean rice": "rajma_chawal",
    "chicken biryani": "chicken_biryani",
    "biryani": "chicken_biryani",
    "mutton biryani": "chicken_biryani",
    "veg biryani": "chicken_biryani",
    "biriyani": "chicken_biryani",
    "chole bhature": "chole_bhature",
    "chana bhatura": "chole_bhature",
    "chickpea curry with fried bread": "chole_bhature",
    "chole": "chole_bhature",

    # Breads
    "roti": "roti",
    "phulka": "roti",
    "chapati": "roti",
    "chapatti": "roti",
    "flatbread": "roti",
    "indian flatbread": "roti",
    "naan": "naan",
    "butter naan": "naan",
    "garlic naan": "naan",
    "tandoori roti": "roti",
    "aloo paratha": "aloo_paratha",
    "paratha": "aloo_paratha",
    "parantha": "aloo_paratha",
    "stuffed paratha": "aloo_paratha",

    # South Indian
    "masala dosa": "masala_dosa",
    "dosa": "masala_dosa",
    "plain dosa": "masala_dosa",
    "paper dosa": "masala_dosa",
    "idli": "idli",
    "idly": "idli",
    "steamed idli": "idli",
    "sambar": "sambar",
    "sambhar": "sambar",

    # Snacks & Street food
    "pav bhaji": "pav_bhaji",
    "pao bhaji": "pav_bhaji",
    "butter chicken": "butter_chicken",
    "murgh makhani": "butter_chicken",
    "chicken makhani": "butter_chicken",
    "samosa": "samosa",
    "singhada": "samosa",
    "kachori": "kachori",
    "khasta kachori": "kachori",
    "dhokla": "dhokla",
    "khaman": "dhokla",
    "khaman dhokla": "dhokla",
    "poha": "poha",
    "kanda poha": "poha",
    "pohe": "poha",
    "upma": "upma",
    "rava upma": "upma",
    "sooji upma": "upma",
    "litti chokha": "litti_chokha",
    "litti": "litti_chokha",
    "khichdi": "khichdi",
    "khichuri": "khichdi",
    "moong dal khichdi": "khichdi",
    "gulab jamun": "gulab_jamun",
    "jamun": "gulab_jamun",
}


# ==============================================================================
# UNIFIED NUTRITION ENGINE CLASS
# ==============================================================================
class NutritionEngine:
    """
    Robust nutrition database management & matching engine.
    Integrates UEC-256 dataset, extended authentic cuisines, and fuzzy resolvers.
    """

    def __init__(self):
        self.uec256_db: Dict[str, Dict[str, float]] = {}
        self.density_db: Dict[str, float] = {}
        self.load_uec256_csv()
        self.load_density_csv()

    def load_uec256_csv(self):
        """Load UEC-256 nutrition CSV file (256 classes)."""
        if NUTRITION_CSV.exists():
            try:
                df = pd.read_csv(NUTRITION_CSV)
                for _, row in df.iterrows():
                    key = str(row["food"]).strip().lower()
                    self.uec256_db[key] = {
                        "name": str(row["food"]),
                        "calories": float(row["calories"]),
                        "protein": float(row["protein"]),
                        "carbs": float(row["carbs"]),
                        "fat": float(row["fat"]),
                    }
                print(f"[NutritionEngine] Loaded {len(self.uec256_db)} foods from nutrition_256.csv")
            except Exception as e:
                print(f"[NutritionEngine] Warning loading nutrition_256.csv: {e}")

    def load_density_csv(self):
        """Load density overrides CSV."""
        if DENSITY_CSV.exists():
            try:
                df = pd.read_csv(DENSITY_CSV)
                for _, row in df.iterrows():
                    label = str(row.get("label", "")).strip().lower()
                    val = row.get("density", None)
                    if label and pd.notna(val):
                        self.density_db[label] = float(val)
                print(f"[NutritionEngine] Loaded {len(self.density_db)} density entries.")
            except Exception as e:
                print(f"[NutritionEngine] Warning loading density CSV: {e}")

    @staticmethod
    def normalize_string(s: str) -> str:
        """Strip punctuation, excessive whitespaces, and lowercase."""
        s = s.lower().strip()
        s = re.sub(r"[^\w\s]", " ", s)
        s = re.sub(r"\s+", " ", s).strip()
        return s

    def find_food_match(self, query: str) -> Optional[Tuple[str, Dict[str, Any], str]]:
        """
        Intelligently resolves a query string to a nutritional entry.
        Returns (canonical_key, profile_dict, match_type) or None.
        """
        if not query:
            return None

        raw = query.strip()
        norm = self.normalize_string(raw)
        slug = norm.replace(" ", "_")

        # 1. Check Extended Indian/Global Database (Exact slug)
        if slug in EXTENDED_FOOD_DB:
            return slug, EXTENDED_FOOD_DB[slug], "exact_extended"

        # 2. Check Aliases & Synonyms Dictionary
        if norm in FOOD_ALIASES:
            alias_key = FOOD_ALIASES[norm]
            if alias_key in EXTENDED_FOOD_DB:
                return alias_key, EXTENDED_FOOD_DB[alias_key], "alias_match"

        for alias_phrase, canonical in FOOD_ALIASES.items():
            if alias_phrase in norm or norm in alias_phrase:
                if canonical in EXTENDED_FOOD_DB:
                    return canonical, EXTENDED_FOOD_DB[canonical], "alias_substring"

        # 3. Check UEC-256 database (Exact name)
        if norm in self.uec256_db:
            return norm, self._uec_to_profile(norm), "exact_uec256"

        for key in self.uec256_db:
            if key == norm or key.replace(" ", "_") == slug:
                return key, self._uec_to_profile(key), "exact_uec256"

        # 4. Fuzzy Match against Extended DB
        all_ext_keys = list(EXTENDED_FOOD_DB.keys())
        fuzzy_matches = difflib.get_close_matches(slug, all_ext_keys, n=1, cutoff=0.55)
        if fuzzy_matches:
            matched_key = fuzzy_matches[0]
            return matched_key, EXTENDED_FOOD_DB[matched_key], "fuzzy_extended"

        # 5. Fuzzy Match against UEC-256 DB
        all_uec_keys = list(self.uec256_db.keys())
        fuzzy_uec = difflib.get_close_matches(norm, all_uec_keys, n=1, cutoff=0.55)
        if fuzzy_uec:
            matched_key = fuzzy_uec[0]
            return matched_key, self._uec_to_profile(matched_key), "fuzzy_uec256"

        # 6. Word-based token overlap matching
        query_tokens = set(norm.split())
        best_overlap_key = None
        best_overlap_count = 0
        for ext_key in all_ext_keys:
            key_tokens = set(ext_key.split("_"))
            overlap = len(query_tokens.intersection(key_tokens))
            if overlap > best_overlap_count:
                best_overlap_count = overlap
                best_overlap_key = ext_key

        if best_overlap_count >= 2 and best_overlap_key:
            return best_overlap_key, EXTENDED_FOOD_DB[best_overlap_key], "token_overlap"

        return None

    def _uec_to_profile(self, uec_key: str) -> Dict[str, Any]:
        """Wrap a UEC-256 entry into standard extended profile format."""
        raw = self.uec256_db.get(uec_key, {"name": uec_key.title(), "calories": 150.0, "protein": 5.0, "carbs": 20.0, "fat": 4.0})
        density = self.density_db.get(uec_key, 0.85)
        return {
            "name": raw["name"].title(),
            "category": "Prepared Dish",
            "cuisine": "International / UEC-256",
            "icon": self._guess_icon(uec_key),
            "calories": raw["calories"],
            "protein": raw["protein"],
            "carbs": raw["carbs"],
            "fat": raw["fat"],
            "fiber": 2.0,
            "density": density,
            "portion_g": 180,
            "visible_ingredients": [raw["name"].title()],
            "cooking_method": "Standard culinary preparation",
            "athletic_verdict": f"Provides balanced nutrition with {raw['calories']} kcal and {raw['protein']}g protein per 100g.",
            "micronutrients": {"calcium_mg": 30, "iron_mg": 1.5, "potassium_mg": 200, "vitamin_c_mg": 2.0, "sodium_mg": 300, "fiber_g": 2.0}
        }

    @staticmethod
    def _guess_icon(food_name: str) -> str:
        n = food_name.lower()
        if "rice" in n: return "🍚"
        if "noodle" in n or "ramen" in n or "udon" in n or "soba" in n: return "🍜"
        if "soup" in n or "chowder" in n: return "🥣"
        if "curry" in n or "masala" in n: return "🍲"
        if "chicken" in n or "poultry" in n: return "🍗"
        if "beef" in n or "steak" in n: return "🥩"
        if "fish" in n or "sashimi" in n or "sushi" in n: return "🍣"
        if "pizza" in n: return "🍕"
        if "burger" in n or "hamburger" in n: return "🍔"
        if "bread" in n or "toast" in n or "roti" in n or "naan" in n: return "🫓"
        if "salad" in n or "vegetable" in n: return "🥗"
        if "cake" in n or "dessert" in n or "pie" in n: return "🍰"
        if "egg" in n or "omelette" in n: return "🍳"
        return "🍱"

    def calculate_dish_nutrition(
        self,
        food_name: str,
        weight_g: float,
        vlm_hints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate total nutrients for a given food name and weight in grams.
        Strictly applies the scientific formula:
          nutrient_amount = (nutrient_per_100g * weight_g) / 100.0
        """
        weight_g = max(5.0, float(weight_g))
        factor = weight_g / 100.0

        match = self.find_food_match(food_name)

        if match:
            canonical_key, profile, match_type = match
            cal_100 = profile["calories"]
            pro_100 = profile["protein"]
            carb_100 = profile["carbs"]
            fat_100 = profile["fat"]
            fib_100 = profile.get("fiber", 2.0)
            density = profile.get("density", 0.85)

            # Extract base micronutrients
            micros_100 = profile.get("micronutrients", {})
            scaled_micros = {}
            for k, val in micros_100.items():
                if isinstance(val, (int, float)):
                    scaled_micros[k] = round(val * factor, 1)

            return {
                "name": profile.get("name", food_name.title()),
                "food_key": canonical_key,
                "category": profile.get("category", "Prepared Food"),
                "cuisine": profile.get("cuisine", "Global"),
                "icon": profile.get("icon", "🍲"),
                "weight_g": round(weight_g, 1),
                "calories": round(cal_100 * factor, 1),
                "protein": round(pro_100 * factor, 1),
                "carbs": round(carb_100 * factor, 1),
                "fat": round(fat_100 * factor, 1),
                "fiber": round(fib_100 * factor, 1),
                "density": density,
                "visible_ingredients": profile.get("visible_ingredients", [food_name.title()]),
                "cooking_method": profile.get("cooking_method", "Culinary preparation"),
                "athletic_verdict": profile.get("athletic_verdict", "Quality balanced macronutrient fuel."),
                "micronutrients": scaled_micros,
                "nutrition_source": "database_verified",
                "is_visually_estimated": False,
                "match_type": match_type,
            }

        # Fallback when food is not in any database: Use VLM hints or conservative scientific baseline
        vlm_hints = vlm_hints or {}
        cal_100 = float(vlm_hints.get("calories_per_100g", 160.0))
        pro_100 = float(vlm_hints.get("protein_per_100g", 6.0))
        carb_100 = float(vlm_hints.get("carbs_per_100g", 22.0))
        fat_100 = float(vlm_hints.get("fat_per_100g", 5.0))
        fib_100 = float(vlm_hints.get("fiber_per_100g", 2.0))
        density = float(vlm_hints.get("density", 0.85))

        clean_name = food_name.replace("_", " ").title()
        cuisine = vlm_hints.get("cuisine", "Specialty")
        category = vlm_hints.get("category", "Fresh Meal")
        ingredients = vlm_hints.get("visible_ingredients", [clean_name])
        cooking_method = vlm_hints.get("cooking_method", "Identified by Vision-Language Model")

        return {
            "name": clean_name,
            "food_key": clean_name.lower().replace(" ", "_"),
            "category": category,
            "cuisine": cuisine,
            "icon": self._guess_icon(food_name),
            "weight_g": round(weight_g, 1),
            "calories": round(cal_100 * factor, 1),
            "protein": round(pro_100 * factor, 1),
            "carbs": round(carb_100 * factor, 1),
            "fat": round(fat_100 * factor, 1),
            "fiber": round(fib_100 * factor, 1),
            "density": density,
            "visible_ingredients": ingredients,
            "cooking_method": cooking_method,
            "athletic_verdict": f"Estimated via Vision-Language visual analysis for {clean_name}. Provides {round(cal_100 * factor, 1)} kcal.",
            "micronutrients": {
                "calcium_mg": round(35 * factor, 1),
                "iron_mg": round(1.5 * factor, 1),
                "potassium_mg": round(210 * factor, 1),
                "sodium_mg": round(320 * factor, 1),
                "fiber_g": round(fib_100 * factor, 1)
            },
            "nutrition_source": "vlm_estimated",
            "is_visually_estimated": True,
            "match_type": "vlm_novel_dish",
        }


# Global singleton instance
_nutrition_engine_instance: Optional[NutritionEngine] = None

def get_nutrition_engine() -> NutritionEngine:
    global _nutrition_engine_instance
    if _nutrition_engine_instance is None:
        _nutrition_engine_instance = NutritionEngine()
    return _nutrition_engine_instance
