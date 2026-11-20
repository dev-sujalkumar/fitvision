"""
Food-101 Comprehensive Nutrition & Metadata Database
Provides caloric density, macronutrient breakdowns, and micronutrient profiles
for all 101 Food-101 classification categories.
"""

FOOD101_CLASSES = [
    "apple_pie", "baby_back_ribs", "baklava", "beef_carpaccio", "beef_tartare",
    "beet_salad", "beignets", "bibimbap", "bread_pudding", "breakfast_burrito",
    "bruschetta", "caesar_salad", "cannoli", "caprese_salad", "carrot_cake",
    "ceviche", "cheesecake", "cheese_plate", "chicken_curry", "chicken_quesadilla",
    "chicken_wings", "chocolate_cake", "chocolate_mousse", "churros", "clam_chowder",
    "club_sandwich", "crab_cakes", "creme_brulee", "croque_madame", "cup_cakes",
    "deviled_eggs", "donuts", "dumplings", "edamame", "eggs_benedict",
    "escargots", "falafel", "filet_mignon", "fish_and_chips", "foie_gras",
    "french_fries", "french_onion_soup", "french_toast", "fried_calamari", "fried_rice",
    "frozen_yogurt", "garlic_bread", "gnocchi", "greek_salad", "grilled_cheese_sandwich",
    "grilled_salmon", "guacamole", "gyoza", "hamburger", "hot_and_sour_soup",
    "hot_dog", "huevos_rancheros", "hummus", "ice_cream", "lasagna",
    "lobster_bisque", "lobster_roll_sandwich", "macaroni_and_cheese", "macarons", "miso_soup",
    "mussels", "nachos", "omelette", "onion_rings", "oysters",
    "pad_thai", "paella", "pancakes", "panna_cotta", "peking_duck",
    "pho", "pizza", "pork_chop", "poutine", "prime_rib",
    "pulled_pork_sandwich", "ramen", "ravioli", "red_velvet_cake", "risotto",
    "samosa", "sashimi", "scallops", "seaweed_salad", "shrimp_and_grits",
    "spaghetti_bolognese", "spaghetti_carbonara", "spring_rolls", "steak", "strawberry_shortcake",
    "sushi", "tacos", "takoyaki", "tiramisu", "tuna_tartare",
    "waffles"
]

NUTRITION_PROFILES = {
    "apple_pie": {"name": "Apple Pie", "icon": "🥧", "calories": 237, "protein": 1.9, "carbs": 34.0, "fat": 11.0, "fiber": 1.6, "density": 0.85, "portion_g": 130, "verdict": "Carb-dense treat. Best enjoyed post-endurance workouts or on refeed days."},
    "baby_back_ribs": {"name": "Baby Back Ribs", "icon": "🍖", "calories": 292, "protein": 24.0, "carbs": 0.0, "fat": 21.0, "fiber": 0.0, "density": 1.05, "portion_g": 220, "verdict": "High-protein recovery fuel with elevated dietary fats. Great for muscle repair."},
    "baklava": {"name": "Baklava", "icon": "🥐", "calories": 429, "protein": 6.7, "carbs": 54.0, "fat": 22.0, "fiber": 3.2, "density": 0.95, "portion_g": 85, "verdict": "High-density energy pastry loaded with honey and crushed nuts."},
    "beef_carpaccio": {"name": "Beef Carpaccio", "icon": "🥩", "calories": 145, "protein": 21.0, "carbs": 1.0, "fat": 6.5, "fiber": 0.2, "density": 0.90, "portion_g": 120, "verdict": "Lean, high-purity beef protein with essential iron and zinc for athletic recovery."},
    "beef_tartare": {"name": "Beef Tartare", "icon": "🥩", "calories": 172, "protein": 20.0, "carbs": 2.5, "fat": 9.0, "fiber": 0.3, "density": 0.95, "portion_g": 140, "verdict": "Nutrient-dense raw lean beef packed with B-vitamins and creatine."},
    "beet_salad": {"name": "Beetroot Salad", "icon": "🥗", "calories": 85, "protein": 2.2, "carbs": 12.0, "fat": 3.5, "fiber": 2.8, "density": 0.70, "portion_g": 160, "verdict": "Exceptional dietary nitrates boosting nitric oxide production and blood flow for stamina."},
    "beignets": {"name": "Beignets", "icon": "🍩", "calories": 380, "protein": 6.5, "carbs": 52.0, "fat": 17.0, "fiber": 1.8, "density": 0.60, "portion_g": 100, "verdict": "Traditional fried choux pastry dusted with powdered sugar. High energy treat."},
    "bibimbap": {"name": "Bibimbap Bowl", "icon": "🍲", "calories": 140, "protein": 7.0, "carbs": 20.0, "fat": 3.8, "fiber": 2.5, "density": 0.85, "portion_g": 350, "verdict": "Balanced athletic macro ratio with rice, lean protein, sesame, and fiber-rich greens."},
    "bread_pudding": {"name": "Bread Pudding", "icon": "🍮", "calories": 210, "protein": 5.2, "carbs": 33.0, "fat": 6.8, "fiber": 1.1, "density": 0.88, "portion_g": 150, "verdict": "Carbohydrate-loaded dessert providing sustained glycogen replenishment."},
    "breakfast_burrito": {"name": "Breakfast Burrito", "icon": "🌯", "calories": 220, "protein": 11.5, "carbs": 22.0, "fat": 9.5, "fiber": 2.2, "density": 0.92, "portion_g": 220, "verdict": "Power-packed morning fuel with complete egg amino acids, slow-release carbs, and salsa."},
    "bruschetta": {"name": "Tomato Bruschetta", "icon": "🥖", "calories": 160, "protein": 4.5, "carbs": 23.0, "fat": 5.5, "fiber": 2.0, "density": 0.75, "portion_g": 120, "verdict": "Antioxidant-rich lycopene and healthy olive oil polyphenols on toasted artisan bread."},
    "caesar_salad": {"name": "Caesar Salad", "icon": "🥗", "calories": 180, "protein": 5.0, "carbs": 7.0, "fat": 15.0, "fiber": 1.8, "density": 0.50, "portion_g": 180, "verdict": "Crisp romaine providing vitamin K and hydration; adjust dressing for lower fat macros."},
    "cannoli": {"name": "Italian Cannoli", "icon": "🥟", "calories": 340, "protein": 6.8, "carbs": 39.0, "fat": 17.5, "fiber": 1.2, "density": 0.80, "portion_g": 90, "verdict": "Crispy fried pastry filled with sweet ricotta cream. Moderate protein from dairy."},
    "caprese_salad": {"name": "Caprese Salad", "icon": "🍅", "calories": 170, "protein": 8.5, "carbs": 3.8, "fat": 13.5, "fiber": 1.0, "density": 0.80, "portion_g": 160, "verdict": "Fresh mozzarella calcium and tomato antioxidants tied together with extra virgin olive oil."},
    "carrot_cake": {"name": "Carrot Cake", "icon": "🥕", "calories": 360, "protein": 4.0, "carbs": 48.0, "fat": 17.0, "fiber": 2.1, "density": 0.82, "portion_g": 125, "verdict": "Moist spiced cake topped with cream cheese frosting, providing beta-carotene."},
    "ceviche": {"name": "Citrus Fish Ceviche", "icon": "🐟", "calories": 95, "protein": 15.0, "carbs": 4.5, "fat": 1.5, "fiber": 1.2, "density": 0.88, "portion_g": 180, "verdict": "Superb lean protein source with virtually zero fat and abundant vitamin C from lime marinade."},
    "cheesecake": {"name": "New York Cheesecake", "icon": "🍰", "calories": 321, "protein": 5.5, "carbs": 25.5, "fat": 22.5, "fiber": 0.6, "density": 0.95, "portion_g": 120, "verdict": "High-fat indulgence rich in dairy lipids. Great taste, best balanced with clean training days."},
    "cheese_plate": {"name": "Artisan Cheese Plate", "icon": "🧀", "calories": 380, "protein": 22.0, "carbs": 2.0, "fat": 32.0, "fiber": 0.0, "density": 1.00, "portion_g": 100, "verdict": "Concentrated bioavailable calcium and casein protein for slow nocturnal amino release."},
    "chicken_curry": {"name": "Spiced Chicken Curry", "icon": "🍛", "calories": 150, "protein": 14.5, "carbs": 6.5, "fat": 7.5, "fiber": 1.8, "density": 0.95, "portion_g": 250, "verdict": "Anti-inflammatory turmeric curcumin combined with complete poultry protein for joint recovery."},
    "chicken_quesadilla": {"name": "Chicken Quesadilla", "icon": "🌮", "calories": 255, "protein": 15.0, "carbs": 21.0, "fat": 12.0, "fiber": 2.0, "density": 0.88, "portion_g": 200, "verdict": "Great balance of fast-acting carbohydrates and muscle-building shredded chicken protein."},
    "chicken_wings": {"name": "Crispy Chicken Wings", "icon": "🍗", "calories": 288, "protein": 24.0, "carbs": 0.5, "fat": 21.0, "fiber": 0.0, "density": 1.02, "portion_g": 180, "verdict": "Rich in collagen, gelatin, and protein supporting connective tissue and tendon resilience."},
    "chocolate_cake": {"name": "Decadent Chocolate Cake", "icon": "🍫", "calories": 371, "protein": 4.9, "carbs": 53.0, "fat": 16.0, "fiber": 3.0, "density": 0.78, "portion_g": 115, "verdict": "Flavonoid-rich cocoa offering rapid carbohydrate reloading post strenuous training."},
    "chocolate_mousse": {"name": "Dark Chocolate Mousse", "icon": "🍨", "calories": 290, "protein": 5.0, "carbs": 28.0, "fat": 18.0, "fiber": 2.4, "density": 0.65, "portion_g": 110, "verdict": "Airy whipped dessert providing magnesium and fast energy."},
    "churros": {"name": "Cinnamon Churros", "icon": "🥖", "calories": 380, "protein": 4.5, "carbs": 46.0, "fat": 19.0, "fiber": 1.9, "density": 0.65, "portion_g": 100, "verdict": "Deep-fried dough coated in cinnamon-sugar for quick energy spikes."},
    "clam_chowder": {"name": "New England Clam Chowder", "icon": "🥣", "calories": 110, "protein": 5.5, "carbs": 11.0, "fat": 4.8, "fiber": 1.0, "density": 1.02, "portion_g": 240, "verdict": "Exceptional vitamin B12 and iron from sea clams supporting red blood cell oxygen delivery."},
    "club_sandwich": {"name": "Triple Decker Club Sandwich", "icon": "🥪", "calories": 220, "protein": 13.0, "carbs": 21.0, "fat": 9.5, "fiber": 2.0, "density": 0.72, "portion_g": 240, "verdict": "Well-balanced macro split with turkey, ham, crisp lettuce, tomato, and wheat toast."},
    "crab_cakes": {"name": "Lump Crab Cakes", "icon": "🦀", "calories": 185, "protein": 14.0, "carbs": 10.0, "fat": 9.5, "fiber": 0.6, "density": 0.90, "portion_g": 130, "verdict": "High-purity seafood protein packed with zinc and copper for immune system defense."},
    "creme_brulee": {"name": "Vanilla Crème Brûlée", "icon": "🍮", "calories": 320, "protein": 4.5, "carbs": 28.0, "fat": 21.5, "fiber": 0.0, "density": 0.98, "portion_g": 120, "verdict": "Rich baked egg custard with a caramelized sugar crust."},
    "croque_madame": {"name": "Croque Madame", "icon": "🥪", "calories": 260, "protein": 13.5, "carbs": 18.0, "fat": 14.5, "fiber": 1.2, "density": 0.85, "portion_g": 210, "verdict": "Toasted ham and gruyere sandwich crowned with a fried egg providing choline and protein."},
    "cup_cakes": {"name": "Frosted Cupcake", "icon": "🧁", "calories": 385, "protein": 3.5, "carbs": 58.0, "fat": 15.5, "fiber": 1.0, "density": 0.70, "portion_g": 85, "verdict": "Single-serving cake providing fast-digesting simple carbs."},
    "deviled_eggs": {"name": "Deviled Eggs", "icon": "🥚", "calories": 195, "protein": 11.5, "carbs": 1.5, "fat": 16.0, "fiber": 0.2, "density": 0.95, "portion_g": 120, "verdict": "Superb keto-friendly egg yolk choline, lutein, and high-bioavailability albumin protein."},
    "donuts": {"name": "Glazed Donut", "icon": "🍩", "calories": 420, "protein": 5.0, "carbs": 51.0, "fat": 22.0, "fiber": 1.6, "density": 0.55, "portion_g": 70, "verdict": "Classic sweet fried pastry; optimal as an occasional cheat meal."},
    "dumplings": {"name": "Steamed Dumplings", "icon": "🥟", "calories": 175, "protein": 8.5, "carbs": 24.0, "fat": 4.5, "fiber": 1.8, "density": 0.90, "portion_g": 180, "verdict": "Steamed savory pockets with low lipid content and moderate protein from pork or chicken."},
    "edamame": {"name": "Steamed Salted Edamame", "icon": "🫛", "calories": 121, "protein": 11.9, "carbs": 8.9, "fat": 5.2, "fiber": 5.2, "density": 0.75, "portion_g": 150, "verdict": "Gold standard plant-based complete protein packed with prebiotic dietary fiber and isoflavones."},
    "eggs_benedict": {"name": "Eggs Benedict", "icon": "🍳", "calories": 250, "protein": 12.0, "carbs": 12.0, "fat": 17.5, "fiber": 0.8, "density": 0.92, "portion_g": 200, "verdict": "Poached egg protein on English muffin bathed in hollandaise sauce."},
    "escargots": {"name": "Garlic Butter Escargot", "icon": "🐌", "calories": 140, "protein": 16.0, "carbs": 2.0, "fat": 7.5, "fiber": 0.0, "density": 0.95, "portion_g": 100, "verdict": "Very lean molluscan protein enriched with selenium and magnesium in herbed butter."},
    "falafel": {"name": "Crispy Falafel Balls", "icon": "🧆", "calories": 333, "protein": 13.3, "carbs": 31.8, "fat": 17.8, "fiber": 7.5, "density": 0.80, "portion_g": 140, "verdict": "Chickpea and herb power patties providing slow-burning low GI carbs and gut-friendly fiber."},
    "filet_mignon": {"name": "Tender Filet Mignon", "icon": "🥩", "calories": 210, "protein": 28.0, "carbs": 0.0, "fat": 10.5, "fiber": 0.0, "density": 1.05, "portion_g": 200, "verdict": "Ultra-lean prime beef cut delivering maximum branched-chain amino acids (BCAAs) for hypertrophy."},
    "fish_and_chips": {"name": "Crispy Fish & Chips", "icon": "🐟", "calories": 230, "protein": 11.5, "carbs": 24.0, "fat": 9.5, "fiber": 1.5, "density": 0.80, "portion_g": 280, "verdict": "Battered whitefish supplying lean omega-3s paired with high carbohydrate potato wedges."},
    "foie_gras": {"name": "Seared Foie Gras", "icon": "🦆", "calories": 462, "protein": 11.4, "carbs": 4.7, "fat": 43.8, "fiber": 0.0, "density": 0.98, "portion_g": 60, "verdict": "Highly decadent duck liver rich in monounsaturated fats and vitamin A."},
    "french_fries": {"name": "Golden French Fries", "icon": "🍟", "calories": 312, "protein": 3.4, "carbs": 41.4, "fat": 15.0, "fiber": 3.8, "density": 0.60, "portion_g": 140, "verdict": "High glycemic index carbohydrates providing rapid potassium and sodium after sweat sessions."},
    "french_onion_soup": {"name": "French Onion Soup", "icon": "🧅", "calories": 75, "protein": 3.8, "carbs": 8.5, "fat": 2.8, "fiber": 1.4, "density": 1.02, "portion_g": 250, "verdict": "Caramelized onion flavonoids (quercetin) in rich beef bone broth promoting gut lining repair."},
    "french_toast": {"name": "Golden French Toast", "icon": "🍞", "calories": 230, "protein": 7.5, "carbs": 32.0, "fat": 8.0, "fiber": 1.8, "density": 0.70, "portion_g": 160, "verdict": "Egg-dipped brioche delivering fast muscle glycogen replenishing sugars and albumin protein."},
    "fried_calamari": {"name": "Crisp Fried Calamari", "icon": "🦑", "calories": 210, "protein": 16.0, "carbs": 16.0, "fat": 8.5, "fiber": 0.5, "density": 0.78, "portion_g": 150, "verdict": "Tender squid rings high in phosphorus, vitamin B12, and lean marine amino acids."},
    "fried_rice": {"name": "Wok Fried Rice", "icon": "🍚", "calories": 175, "protein": 5.5, "carbs": 26.5, "fat": 5.2, "fiber": 1.5, "density": 0.85, "portion_g": 240, "verdict": "Classic endurance staple delivering rapid glycogen restoration for high-output training days."},
    "frozen_yogurt": {"name": "Probiotic Frozen Yogurt", "icon": "🍦", "calories": 130, "protein": 4.0, "carbs": 24.0, "fat": 2.0, "fiber": 0.0, "density": 0.75, "portion_g": 140, "verdict": "Lower fat dessert providing active probiotic cultures supporting athletic gut microbiome health."},
    "garlic_bread": {"name": "Toasted Garlic Bread", "icon": "🥖", "calories": 350, "protein": 8.0, "carbs": 42.0, "fat": 16.5, "fiber": 2.5, "density": 0.65, "portion_g": 90, "verdict": "Crusty bread toasted with garlic butter; allicin compounds offer cardiovascular perks."},
    "gnocchi": {"name": "Potato Gnocchi", "icon": "🥟", "calories": 160, "protein": 3.8, "carbs": 33.0, "fat": 1.2, "fiber": 2.0, "density": 0.95, "portion_g": 200, "verdict": "Dense potato dumplings offering quick-absorbing carbohydrates ideal before heavy leg sessions."},
    "greek_salad": {"name": "Traditional Greek Salad", "icon": "🥗", "calories": 115, "protein": 3.5, "carbs": 6.5, "fat": 8.5, "fiber": 2.2, "density": 0.65, "portion_g": 200, "verdict": "Hydrating cucumbers, kalamata olives, and feta delivering key electrolytes (sodium & magnesium)."},
    "grilled_cheese_sandwich": {"name": "Grilled Cheese Sandwich", "icon": "🧀", "calories": 320, "protein": 11.5, "carbs": 31.0, "fat": 16.5, "fiber": 2.0, "density": 0.75, "portion_g": 140, "verdict": "Comfort meal combining calcium-rich melted cheese with crisp toasted carbohydrates."},
    "grilled_salmon": {"name": "Char-Grilled Salmon", "icon": "🍣", "calories": 208, "protein": 22.0, "carbs": 0.0, "fat": 12.5, "fiber": 0.0, "density": 0.98, "portion_g": 180, "verdict": "Elite athletic recovery food overflowing with anti-inflammatory EPA/DHA omega-3 fatty acids."},
    "guacamole": {"name": "Fresh Haas Guacamole", "icon": "🥑", "calories": 160, "protein": 2.0, "carbs": 8.5, "fat": 14.5, "fiber": 6.5, "density": 0.92, "portion_g": 100, "verdict": "Heart-healthy monounsaturated oleic fats and potassium to prevent cramping."},
    "gyoza": {"name": "Pan-Fried Pork Gyoza", "icon": "🥟", "calories": 195, "protein": 9.5, "carbs": 21.0, "fat": 8.0, "fiber": 1.5, "density": 0.90, "portion_g": 160, "verdict": "Savory dumplings balanced between lean minced pork and wheat wrappers."},
    "hamburger": {"name": "Classic Beef Burger", "icon": "🍔", "calories": 250, "protein": 14.0, "carbs": 22.0, "fat": 12.0, "fiber": 1.8, "density": 0.85, "portion_g": 220, "verdict": "High-density complete protein and iron for muscle hypertrophy and strength building."},
    "hot_and_sour_soup": {"name": "Hot & Sour Soup", "icon": "🥣", "calories": 48, "protein": 3.2, "carbs": 5.5, "fat": 1.5, "fiber": 0.8, "density": 1.02, "portion_g": 240, "verdict": "Low-calorie thermogenic soup with chili peppers and vinegar to kickstart metabolism."},
    "hot_dog": {"name": "Grilled Hot Dog", "icon": "🌭", "calories": 290, "protein": 10.5, "carbs": 24.0, "fat": 16.5, "fiber": 1.2, "density": 0.80, "portion_g": 120, "verdict": "Convenient street energy providing fast sodium and quick protein on the go."},
    "huevos_rancheros": {"name": "Huevos Rancheros", "icon": "🍳", "calories": 165, "protein": 8.5, "carbs": 14.0, "fat": 8.5, "fiber": 3.0, "density": 0.90, "portion_g": 220, "verdict": "Fried eggs over warm corn tortillas and salsa, delivering clean protein and complex carbs."},
    "hummus": {"name": "Creamy Tahini Hummus", "icon": "🫓", "calories": 166, "protein": 7.9, "carbs": 14.3, "fat": 9.6, "fiber": 6.0, "density": 0.95, "portion_g": 120, "verdict": "Outstanding plant protein with high dietary fiber and healthy sesame tahini fats."},
    "ice_cream": {"name": "Creamy Dairy Ice Cream", "icon": "🍨", "calories": 207, "protein": 3.5, "carbs": 24.0, "fat": 11.0, "fiber": 0.7, "density": 0.65, "portion_g": 100, "verdict": "Refreshing calcium source with fast simple sugars for immediate muscle refuelling."},
    "lasagna": {"name": "Layered Beef Lasagna", "icon": "🍝", "calories": 170, "protein": 9.5, "carbs": 15.0, "fat": 7.8, "fiber": 1.6, "density": 1.02, "portion_g": 280, "verdict": "Hearty pasta layered with ricotta, mozzarella, and lean ground beef for intense workout recovery."},
    "lobster_bisque": {"name": "Creamy Lobster Bisque", "icon": "🦞", "calories": 145, "protein": 5.8, "carbs": 8.5, "fat": 10.2, "fiber": 0.5, "density": 1.02, "portion_g": 220, "verdict": "Savory seafood soup high in zinc, copper, and iodine to support thyroid performance."},
    "lobster_roll_sandwich": {"name": "Maine Lobster Roll", "icon": "🦞", "calories": 210, "protein": 15.5, "carbs": 18.0, "fat": 8.5, "fiber": 1.0, "density": 0.78, "portion_g": 180, "verdict": "Chilled sweet lobster meat providing premium lean protein on a toasted split-top roll."},
    "macaroni_and_cheese": {"name": "Creamy Mac & Cheese", "icon": "🧀", "calories": 210, "protein": 8.0, "carbs": 25.0, "fat": 8.5, "fiber": 1.5, "density": 0.90, "portion_g": 200, "verdict": "Carb and calcium powerhouse ideal for heavy training blocks and bulking phases."},
    "macarons": {"name": "French Almond Macarons", "icon": "🍪", "calories": 420, "protein": 6.5, "carbs": 60.0, "fat": 17.5, "fiber": 2.5, "density": 0.65, "portion_g": 60, "verdict": "Delicate almond flour cookies with healthy vitamin E and rapid sucrose energy."},
    "miso_soup": {"name": "Fermented Miso Soup", "icon": "🍲", "calories": 35, "protein": 2.5, "carbs": 4.0, "fat": 1.0, "fiber": 1.0, "density": 1.02, "portion_g": 220, "verdict": "Fermented soybean paste offering exceptional electrolyte sodium and digestive enzymes."},
    "mussels": {"name": "Steamed Garlic Mussels", "icon": "🦪", "calories": 105, "protein": 14.5, "carbs": 4.5, "fat": 3.0, "fiber": 0.0, "density": 0.95, "portion_g": 180, "verdict": "Incredible iron and vitamin B12 density per calorie to fuel endurance athletes."},
    "nachos": {"name": "Loaded Cheese Nachos", "icon": "🧀", "calories": 305, "protein": 7.5, "carbs": 33.0, "fat": 16.5, "fiber": 3.5, "density": 0.60, "portion_g": 160, "verdict": "Crunchy tortilla chips topped with cheese, jalapeños, and beans; high carb & sodium."},
    "omelette": {"name": "Fluffy Herb Omelette", "icon": "🍳", "calories": 154, "protein": 11.0, "carbs": 1.0, "fat": 12.0, "fiber": 0.2, "density": 0.85, "portion_g": 160, "verdict": "Gold-standard morning bioavailability rating of 100 on protein quality index."},
    "onion_rings": {"name": "Crispy Onion Rings", "icon": "🧅", "calories": 330, "protein": 3.5, "carbs": 38.0, "fat": 18.5, "fiber": 2.8, "density": 0.50, "portion_g": 120, "verdict": "Crisp battered onions rich in dietary quercetin antioxidants."},
    "oysters": {"name": "Fresh Raw Oysters", "icon": "🦪", "calories": 68, "protein": 9.0, "carbs": 3.8, "fat": 2.0, "fiber": 0.0, "density": 1.02, "portion_g": 120, "verdict": "Highest natural dietary concentration of elemental zinc to optimize testosterone production."},
    "pad_thai": {"name": "Stir-Fried Pad Thai", "icon": "🍜", "calories": 190, "protein": 8.0, "carbs": 26.0, "fat": 6.0, "fiber": 2.0, "density": 0.88, "portion_g": 280, "verdict": "Rice noodles stir-fried with eggs, tofu, bean sprouts, and crushed peanuts for stamina."},
    "paella": {"name": "Seafood Saffron Paella", "icon": "🥘", "calories": 165, "protein": 9.5, "carbs": 22.0, "fat": 4.2, "fiber": 1.6, "density": 0.90, "portion_g": 300, "verdict": "Saffron-infused rice with shrimp, mussels, and squid delivering high iodine and carbs."},
    "pancakes": {"name": "Fluffy Golden Pancakes", "icon": "🥞", "calories": 227, "protein": 6.4, "carbs": 38.0, "fat": 5.5, "fiber": 1.4, "density": 0.65, "portion_g": 150, "verdict": "Carb-loading classic for runners and lifters to top off glycogen stores."},
    "panna_cotta": {"name": "Vanilla Panna Cotta", "icon": "🍮", "calories": 240, "protein": 3.8, "carbs": 22.0, "fat": 15.5, "fiber": 0.0, "density": 0.95, "portion_g": 120, "verdict": "Silky cream dessert with bovine gelatin providing amino acids glycine and proline."},
    "peking_duck": {"name": "Crispy Peking Duck", "icon": "🦆", "calories": 337, "protein": 19.0, "carbs": 0.0, "fat": 28.5, "fiber": 0.0, "density": 1.00, "portion_g": 160, "verdict": "Succulent roasted duck with crispy skin, high in iron, selenium, and healthy fats."},
    "pho": {"name": "Vietnamese Beef Pho", "icon": "🍜", "calories": 85, "protein": 6.5, "carbs": 11.5, "fat": 1.6, "fiber": 1.0, "density": 1.02, "portion_g": 400, "verdict": "Electrolyte broth packed with joint-nourishing collagen and easily digestible rice noodles."},
    "pizza": {"name": "Stone-Baked Pizza", "icon": "🍕", "calories": 266, "protein": 11.0, "carbs": 33.0, "fat": 10.0, "fiber": 2.3, "density": 0.85, "portion_g": 180, "verdict": "Classic multi-macro fuel combining wheat crust carbohydrates, lycopene, and melted cheese protein."},
    "pork_chop": {"name": "Seared Center-Cut Pork Chop", "icon": "🥩", "calories": 215, "protein": 27.0, "carbs": 0.0, "fat": 11.2, "fiber": 0.0, "density": 1.05, "portion_g": 180, "verdict": "Lean pork cut packed with thiamine (vitamin B1) essential for cellular energy metabolism."},
    "poutine": {"name": "Quebec Gravy Poutine", "icon": "🍟", "calories": 250, "protein": 6.5, "carbs": 27.0, "fat": 13.0, "fiber": 2.2, "density": 0.85, "portion_g": 240, "verdict": "Fries topped with cheese curds and beef gravy; calorie bomb for bulking athletes."},
    "prime_rib": {"name": "Roasted Prime Rib", "icon": "🥩", "calories": 310, "protein": 23.5, "carbs": 0.0, "fat": 23.5, "fiber": 0.0, "density": 1.05, "portion_g": 220, "verdict": "Premium marbled beef providing full spectrum amino acids and zinc for cellular repair."},
    "pulled_pork_sandwich": {"name": "Smoked Pulled Pork", "icon": "🥪", "calories": 225, "protein": 14.5, "carbs": 21.0, "fat": 8.5, "fiber": 1.2, "density": 0.82, "portion_g": 220, "verdict": "Slow-smoked tender pork providing sustained energy and muscle rebuilding protein."},
    "ramen": {"name": "Tonkotsu Ramen Bowl", "icon": "🍜", "calories": 145, "protein": 7.0, "carbs": 18.0, "fat": 5.0, "fiber": 1.5, "density": 1.02, "portion_g": 400, "verdict": "Deeply simmered collagen broth with wheat noodles, eggs, and bamboo shoots for hydration."},
    "ravioli": {"name": "Cheese & Herb Ravioli", "icon": "🥟", "calories": 195, "protein": 8.5, "carbs": 28.0, "fat": 5.5, "fiber": 2.0, "density": 0.95, "portion_g": 200, "verdict": "Stuffed pasta pillows delivering fast muscle glycogen and ricotta calcium."},
    "red_velvet_cake": {"name": "Red Velvet Cake", "icon": "🍰", "calories": 395, "protein": 4.2, "carbs": 54.0, "fat": 18.5, "fiber": 1.2, "density": 0.78, "portion_g": 115, "verdict": "Cocoa buttermilk cake topped with cream cheese frosting."},
    "risotto": {"name": "Creamy Arborio Risotto", "icon": "🍚", "calories": 165, "protein": 4.5, "carbs": 26.0, "fat": 4.8, "fiber": 1.2, "density": 0.95, "portion_g": 220, "verdict": "High-starch short-grain rice cooked to creamy perfection; great pre-race fuel."},
    "samosa": {"name": "Spiced Potato Samosa", "icon": "🥟", "calories": 262, "protein": 4.5, "carbs": 32.0, "fat": 13.0, "fiber": 3.2, "density": 0.75, "portion_g": 90, "verdict": "Cumin and coriander spiced potato pockets wrapped in a crisp pastry."},
    "sashimi": {"name": "Fresh Tuna & Salmon Sashimi", "icon": "🍣", "calories": 130, "protein": 24.5, "carbs": 0.0, "fat": 3.5, "fiber": 0.0, "density": 1.02, "portion_g": 150, "verdict": "Unrivalled ultra-pure lean protein with anti-inflammatory omega-3 fats and zero carbs."},
    "scallops": {"name": "Pan-Seared Sea Scallops", "icon": "🦪", "calories": 111, "protein": 20.5, "carbs": 5.4, "fat": 0.8, "fiber": 0.0, "density": 1.02, "portion_g": 150, "verdict": "Super-lean marine protein offering high taurine concentrations for cardiovascular stamina."},
    "seaweed_salad": {"name": "Sesame Wakame Salad", "icon": "🥗", "calories": 65, "protein": 1.8, "carbs": 9.5, "fat": 2.2, "fiber": 3.0, "density": 0.85, "portion_g": 120, "verdict": "Mineral-rich ocean greens with dietary iodine, magnesium, and alginate prebiotics."},
    "shrimp_and_grits": {"name": "Southern Shrimp & Grits", "icon": "🍤", "calories": 175, "protein": 12.0, "carbs": 18.0, "fat": 5.8, "fiber": 1.2, "density": 0.95, "portion_g": 260, "verdict": "Excellent pairing of lean crustaceans and slow-release ground corn grits."},
    "spaghetti_bolognese": {"name": "Spaghetti Bolognese", "icon": "🍝", "calories": 155, "protein": 9.2, "carbs": 21.0, "fat": 3.8, "fiber": 2.0, "density": 0.92, "portion_g": 300, "verdict": "Endurance athlete powerhouse balancing tomato lycopene, durum wheat, and minced beef."},
    "spaghetti_carbonara": {"name": "Spaghetti Carbonara", "icon": "🍝", "calories": 215, "protein": 10.5, "carbs": 23.5, "fat": 8.8, "fiber": 1.8, "density": 0.90, "portion_g": 260, "verdict": "Rich pasta dish with egg yolk, pecorino cheese, and pancetta for sustained endurance."},
    "spring_rolls": {"name": "Crisp Spring Rolls", "icon": "🥢", "calories": 185, "protein": 4.5, "carbs": 24.0, "fat": 7.8, "fiber": 2.2, "density": 0.70, "portion_g": 120, "verdict": "Crisp pastry filled with shredded cabbage, carrots, and mushrooms."},
    "steak": {"name": "Char-Grilled Ribeye Steak", "icon": "🥩", "calories": 252, "protein": 26.0, "carbs": 0.0, "fat": 16.0, "fiber": 0.0, "density": 1.05, "portion_g": 220, "verdict": "Ultimate strength builder packed with creatine, carnitine, heme iron, and complete proteins."},
    "strawberry_shortcake": {"name": "Strawberry Shortcake", "icon": "🍰", "calories": 240, "protein": 3.5, "carbs": 33.0, "fat": 10.5, "fiber": 1.8, "density": 0.72, "portion_g": 140, "verdict": "Light sponge layered with whipped cream and fresh vitamin C strawberries."},
    "sushi": {"name": "Assorted Nigiri & Maki Sushi", "icon": "🍱", "calories": 143, "protein": 5.8, "carbs": 26.0, "fat": 1.5, "fiber": 1.2, "density": 0.95, "portion_g": 220, "verdict": "Clean athletic nutrition pairing quick-digesting rice with raw fish and iodine-rich nori."},
    "tacos": {"name": "Street Corn Tacos", "icon": "🌮", "calories": 210, "protein": 11.5, "carbs": 21.0, "fat": 8.8, "fiber": 3.0, "density": 0.85, "portion_g": 180, "verdict": "Nixtamalized corn tortillas offering bioavailable calcium and lean meat protein."},
    "takoyaki": {"name": "Japanese Octopus Takoyaki", "icon": "🐙", "calories": 180, "protein": 7.5, "carbs": 22.0, "fat": 6.8, "fiber": 1.2, "density": 0.90, "portion_g": 150, "verdict": "Tender octopus balls rich in taurine, zinc, and savory umami dashi."},
    "tiramisu": {"name": "Italian Espresso Tiramisu", "icon": "☕", "calories": 283, "protein": 4.5, "carbs": 29.0, "fat": 16.5, "fiber": 1.0, "density": 0.82, "portion_g": 120, "verdict": "Coffee-soaked ladyfingers and mascarpone providing caffeine and smooth dairy fats."},
    "tuna_tartare": {"name": "Ahi Tuna Tartare", "icon": "🐟", "calories": 140, "protein": 23.5, "carbs": 2.0, "fat": 4.0, "fiber": 0.5, "density": 0.98, "portion_g": 140, "verdict": "Ultra-clean lean protein with abundant selenium and metabolic vitamin B complex."},
    "waffles": {"name": "Belgian Golden Waffles", "icon": "🧇", "calories": 290, "protein": 7.0, "carbs": 41.0, "fat": 11.0, "fiber": 1.8, "density": 0.58, "portion_g": 130, "verdict": "Deep-pocketed grid waffles offering great carbohydrate capacity for workout fuel."}
}

def get_nutrition_for_class(class_name: str, portion_g: float = None) -> dict:
    """Retrieve nutritional details for a given food class name."""
    clean_name = class_name.lower().replace("-", "_").replace(" ", "_")
    profile = NUTRITION_PROFILES.get(clean_name)
    if not profile:
        # Fallback profile
        formatted = class_name.replace("_", " ").title()
        profile = {
            "name": formatted,
            "icon": "🍲",
            "calories": 180,
            "protein": 8.0,
            "carbs": 22.0,
            "fat": 6.5,
            "fiber": 2.0,
            "density": 0.85,
            "portion_g": 180,
            "verdict": "Nutritious balanced meal providing sustained energy and recovery aminos."
        }
    
    weight = portion_g if portion_g and portion_g > 0 else profile.get("portion_g", 150)
    factor = weight / 100.0
    
    calories = round(profile["calories"] * factor, 1)
    protein = round(profile["protein"] * factor, 1)
    carbs = round(profile["carbs"] * factor, 1)
    fat = round(profile["fat"] * factor, 1)
    fiber = round(profile.get("fiber", 2.0) * factor, 1)
    
    return {
        "class_id": clean_name,
        "name": profile["name"],
        "icon": profile["icon"],
        "weight_g": round(weight, 1),
        "calories": calories,
        "protein": protein,
        "carbs": carbs,
        "fat": fat,
        "fiber": fiber,
        "density": profile["density"],
        "athletic_verdict": profile["verdict"],
        "micronutrients": {
            "fiber_g": fiber,
            "sodium_mg": round(250 * factor),
            "potassium_mg": round(320 * factor),
            "calcium_mg": round(60 * factor),
            "iron_mg": round(1.8 * factor, 1),
            "vitamin_c_mg": round(12 * factor, 1)
        }
    }
