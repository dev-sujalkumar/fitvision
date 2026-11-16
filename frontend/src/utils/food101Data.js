/**
 * FitVision AI — Food-101 Nutritional Knowledge Base & Helper Functions
 * Matches the 101 categories classified by the PyTorch EfficientNet-B2 neural network.
 */

export const FOOD101_CLASSES = [
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
];

export const FOOD101_DATABASE = {
  apple_pie: { name: "Apple Pie", icon: "🥧", category: "Dessert", calories: 237, protein: 1.9, carbs: 34.0, fat: 11.0, fiber: 1.6, portion_g: 130, verdict: "Carb-dense treat. Best enjoyed post-endurance workouts or on refeed days." },
  baby_back_ribs: { name: "Baby Back Ribs", icon: "🍖", category: "Meat", calories: 292, protein: 24.0, carbs: 0.0, fat: 21.0, fiber: 0.0, portion_g: 220, verdict: "High-protein recovery fuel with elevated dietary fats. Great for muscle repair." },
  baklava: { name: "Baklava", icon: "🥐", category: "Dessert", calories: 429, protein: 6.7, carbs: 54.0, fat: 22.0, fiber: 3.2, portion_g: 85, verdict: "High-density energy pastry loaded with honey and crushed nuts." },
  beef_carpaccio: { name: "Beef Carpaccio", icon: "🥩", category: "Meat", calories: 145, protein: 21.0, carbs: 1.0, fat: 6.5, fiber: 0.2, portion_g: 120, verdict: "Lean, high-purity beef protein with essential iron and zinc for athletic recovery." },
  beef_tartare: { name: "Beef Tartare", icon: "🥩", category: "Meat", calories: 172, protein: 20.0, carbs: 2.5, fat: 9.0, fiber: 0.3, portion_g: 140, verdict: "Nutrient-dense raw lean beef packed with B-vitamins and natural creatine." },
  beet_salad: { name: "Beetroot Salad", icon: "🥗", category: "Salad", calories: 85, protein: 2.2, carbs: 12.0, fat: 3.5, fiber: 2.8, portion_g: 160, verdict: "Exceptional dietary nitrates boosting nitric oxide production and stamina." },
  beignets: { name: "Beignets", icon: "🍩", category: "Dessert", calories: 380, protein: 6.5, carbs: 52.0, fat: 17.0, fiber: 1.8, portion_g: 100, verdict: "Deep-fried choux pastry dusted with powdered sugar. Fast energy source." },
  bibimbap: { name: "Bibimbap Bowl", icon: "🍲", category: "Bowl", calories: 140, protein: 7.0, carbs: 20.0, fat: 3.8, fiber: 2.5, portion_g: 350, verdict: "Balanced athletic macro split with rice, lean protein, and fiber-rich greens." },
  bread_pudding: { name: "Bread Pudding", icon: "🍮", category: "Dessert", calories: 210, protein: 5.2, carbs: 33.0, fat: 6.8, fiber: 1.1, portion_g: 150, verdict: "Carbohydrate-loaded dessert providing sustained glycogen replenishment." },
  breakfast_burrito: { name: "Breakfast Burrito", icon: "🌯", category: "Breakfast", calories: 220, protein: 11.5, carbs: 22.0, fat: 9.5, fiber: 2.2, portion_g: 220, verdict: "Power morning fuel with complete egg amino acids and slow-release carbs." },
  bruschetta: { name: "Tomato Bruschetta", icon: "🥖", category: "Appetizer", calories: 160, protein: 4.5, carbs: 23.0, fat: 5.5, fiber: 2.0, portion_g: 120, verdict: "Antioxidant-rich lycopene and healthy olive oil polyphenols on artisan bread." },
  caesar_salad: { name: "Caesar Salad", icon: "🥗", category: "Salad", calories: 180, protein: 5.0, carbs: 7.0, fat: 15.0, fiber: 1.8, portion_g: 180, verdict: "Crisp romaine providing hydration and micronutrients; watch the dressing quantity." },
  cannoli: { name: "Italian Cannoli", icon: "🥟", category: "Dessert", calories: 340, protein: 6.8, carbs: 39.0, fat: 17.5, fiber: 1.2, portion_g: 90, verdict: "Crispy fried pastry shell filled with sweet ricotta cream." },
  caprese_salad: { name: "Caprese Salad", icon: "🍅", category: "Salad", calories: 170, protein: 8.5, carbs: 3.8, fat: 13.5, fiber: 1.0, portion_g: 160, verdict: "Fresh mozzarella calcium and tomato antioxidants tied together with extra virgin olive oil." },
  carrot_cake: { name: "Carrot Cake", icon: "🥕", category: "Dessert", calories: 360, protein: 4.0, carbs: 48.0, fat: 17.0, fiber: 2.1, portion_g: 125, verdict: "Moist spiced cake topped with cream cheese frosting, providing beta-carotene." },
  ceviche: { name: "Citrus Fish Ceviche", icon: "🐟", category: "Seafood", calories: 95, protein: 15.0, carbs: 4.5, fat: 1.5, fiber: 1.2, portion_g: 180, verdict: "Superb lean protein source with virtually zero fat and abundant vitamin C." },
  cheesecake: { name: "New York Cheesecake", icon: "🍰", category: "Dessert", calories: 321, protein: 5.5, carbs: 25.5, fat: 22.5, fiber: 0.6, portion_g: 120, verdict: "High-fat indulgence rich in dairy lipids. Best reserved for high-activity days." },
  cheese_plate: { name: "Artisan Cheese Plate", icon: "🧀", category: "Appetizer", calories: 380, protein: 22.0, carbs: 2.0, fat: 32.0, fiber: 0.0, portion_g: 100, verdict: "Concentrated bioavailable calcium and casein protein for slow nocturnal amino release." },
  chicken_curry: { name: "Spiced Chicken Curry", icon: "🍛", category: "Entree", calories: 150, protein: 14.5, carbs: 6.5, fat: 7.5, fiber: 1.8, portion_g: 250, verdict: "Anti-inflammatory turmeric curcumin combined with complete poultry protein for joints." },
  chicken_quesadilla: { name: "Chicken Quesadilla", icon: "🌮", category: "Entree", calories: 255, protein: 15.0, carbs: 21.0, fat: 12.0, fiber: 2.0, portion_g: 200, verdict: "Great balance of fast-acting carbohydrates and muscle-building shredded chicken." },
  chicken_wings: { name: "Crispy Chicken Wings", icon: "🍗", category: "Meat", calories: 288, protein: 24.0, carbs: 0.5, fat: 21.0, fiber: 0.0, portion_g: 180, verdict: "Rich in collagen, gelatin, and protein supporting connective tissue." },
  chocolate_cake: { name: "Chocolate Cake", icon: "🍫", category: "Dessert", calories: 371, protein: 4.9, carbs: 53.0, fat: 16.0, fiber: 3.0, portion_g: 115, verdict: "Flavonoid-rich cocoa offering rapid carbohydrate reloading post strenuous training." },
  chocolate_mousse: { name: "Dark Chocolate Mousse", icon: "🍨", category: "Dessert", calories: 290, protein: 5.0, carbs: 28.0, fat: 18.0, fiber: 2.4, portion_g: 110, verdict: "Airy whipped dessert providing magnesium and rapid energy." },
  churros: { name: "Cinnamon Churros", icon: "🥖", category: "Dessert", calories: 380, protein: 4.5, carbs: 46.0, fat: 19.0, fiber: 1.9, portion_g: 100, verdict: "Deep-fried dough coated in cinnamon sugar for quick glycogen replenishment." },
  clam_chowder: { name: "New England Clam Chowder", icon: "🥣", category: "Soup", calories: 110, protein: 5.5, carbs: 11.0, fat: 4.8, fiber: 1.0, portion_g: 240, verdict: "Exceptional vitamin B12 and iron from sea clams supporting red blood cell production." },
  club_sandwich: { name: "Club Sandwich", icon: "🥪", category: "Sandwich", calories: 220, protein: 13.0, carbs: 21.0, fat: 9.5, fiber: 2.0, portion_g: 240, verdict: "Well-balanced macro split with turkey, ham, crisp lettuce, and wheat toast." },
  crab_cakes: { name: "Lump Crab Cakes", icon: "🦀", category: "Seafood", calories: 185, protein: 14.0, carbs: 10.0, fat: 9.5, fiber: 0.6, portion_g: 130, verdict: "High-purity seafood protein packed with zinc and copper for immune defense." },
  creme_brulee: { name: "Crème Brûlée", icon: "🍮", category: "Dessert", calories: 320, protein: 4.5, carbs: 28.0, fat: 21.5, fiber: 0.0, portion_g: 120, verdict: "Rich baked egg custard with a caramelized sugar crust." },
  croque_madame: { name: "Croque Madame", icon: "🥪", category: "Sandwich", calories: 260, protein: 13.5, carbs: 18.0, fat: 14.5, fiber: 1.2, portion_g: 210, verdict: "Toasted ham and gruyere sandwich crowned with a fried egg providing choline." },
  cup_cakes: { name: "Frosted Cupcake", icon: "🧁", category: "Dessert", calories: 385, protein: 3.5, carbs: 58.0, fat: 15.5, fiber: 1.0, portion_g: 85, verdict: "Single-serving cake providing fast-digesting simple carbs." },
  deviled_eggs: { name: "Deviled Eggs", icon: "🥚", category: "Appetizer", calories: 195, protein: 11.5, carbs: 1.5, fat: 16.0, fiber: 0.2, portion_g: 120, verdict: "Superb keto-friendly egg yolk choline, lutein, and high-bioavailability albumin." },
  donuts: { name: "Glazed Donut", icon: "🍩", category: "Dessert", calories: 420, protein: 5.0, carbs: 51.0, fat: 22.0, fiber: 1.6, portion_g: 70, verdict: "Classic sweet fried pastry; optimal as an occasional treat." },
  dumplings: { name: "Steamed Dumplings", icon: "🥟", category: "Entree", calories: 175, protein: 8.5, carbs: 24.0, fat: 4.5, fiber: 1.8, portion_g: 180, verdict: "Steamed savory dumplings with low lipid content and moderate protein." },
  edamame: { name: "Steamed Edamame", icon: "🫛", category: "Healthy", calories: 121, protein: 11.9, carbs: 8.9, fat: 5.2, fiber: 5.2, portion_g: 150, verdict: "Gold standard plant-based complete protein packed with prebiotic fiber." },
  eggs_benedict: { name: "Eggs Benedict", icon: "🍳", category: "Breakfast", calories: 250, protein: 12.0, carbs: 12.0, fat: 17.5, fiber: 0.8, portion_g: 200, verdict: "Poached egg protein on English muffin bathed in hollandaise sauce." },
  escargots: { name: "Garlic Butter Escargot", icon: "🐌", category: "Appetizer", calories: 140, protein: 16.0, carbs: 2.0, fat: 7.5, fiber: 0.0, portion_g: 100, verdict: "Very lean molluscan protein enriched with selenium and magnesium." },
  falafel: { name: "Crispy Falafel", icon: "🧆", category: "Healthy", calories: 333, protein: 13.3, carbs: 31.8, fat: 17.8, fiber: 7.5, portion_g: 140, verdict: "Chickpea power patties providing slow-burning low-GI carbs and fiber." },
  filet_mignon: { name: "Filet Mignon", icon: "🥩", category: "Meat", calories: 210, protein: 28.0, carbs: 0.0, fat: 10.5, fiber: 0.0, portion_g: 200, verdict: "Ultra-lean prime beef delivering maximum branched-chain amino acids (BCAAs)." },
  fish_and_chips: { name: "Fish & Chips", icon: "🐟", category: "Seafood", calories: 230, protein: 11.5, carbs: 24.0, fat: 9.5, fiber: 1.5, portion_g: 280, verdict: "Crisp whitefish supplying marine omega-3s with high-carb potato wedges." },
  foie_gras: { name: "Seared Foie Gras", icon: "🦆", category: "Meat", calories: 462, protein: 11.4, carbs: 4.7, fat: 43.8, fiber: 0.0, portion_g: 60, verdict: "Highly decadent duck liver rich in monounsaturated fats and vitamin A." },
  french_fries: { name: "Crisp French Fries", icon: "🍟", category: "Fast Food", calories: 312, protein: 3.4, carbs: 41.4, fat: 15.0, fiber: 3.8, portion_g: 140, verdict: "High-GI carbs offering rapid potassium and sodium replenishing post sweat." },
  french_onion_soup: { name: "French Onion Soup", icon: "🧅", category: "Soup", calories: 75, protein: 3.8, carbs: 8.5, fat: 2.8, fiber: 1.4, portion_g: 250, verdict: "Caramelized onion flavonoids in rich beef bone broth promoting gut repair." },
  french_toast: { name: "Golden French Toast", icon: "🍞", category: "Breakfast", calories: 230, protein: 7.5, carbs: 32.0, fat: 8.0, fiber: 1.8, portion_g: 160, verdict: "Egg-dipped brioche delivering fast muscle glycogen sugars and albumin." },
  fried_calamari: { name: "Fried Calamari", icon: "🦑", category: "Seafood", calories: 210, protein: 16.0, carbs: 16.0, fat: 8.5, fiber: 0.5, portion_g: 150, verdict: "Tender squid rings high in phosphorus, vitamin B12, and lean marine aminos." },
  fried_rice: { name: "Wok Fried Rice", icon: "🍚", category: "Entree", calories: 175, protein: 5.5, carbs: 26.5, fat: 5.2, fiber: 1.5, portion_g: 240, verdict: "Classic endurance staple delivering rapid glycogen restoration." },
  frozen_yogurt: { name: "Frozen Yogurt", icon: "🍦", category: "Dessert", calories: 130, protein: 4.0, carbs: 24.0, fat: 2.0, fiber: 0.0, portion_g: 140, verdict: "Lower fat dessert providing active probiotic cultures for gut microbiome health." },
  garlic_bread: { name: "Garlic Bread", icon: "🥖", category: "Appetizer", calories: 350, protein: 8.0, carbs: 42.0, fat: 16.5, fiber: 2.5, portion_g: 90, verdict: "Crusty bread toasted with garlic butter; allicin offers cardiovascular perks." },
  gnocchi: { name: "Potato Gnocchi", icon: "🥟", category: "Pasta", calories: 160, protein: 3.8, carbs: 33.0, fat: 1.2, fiber: 2.0, portion_g: 200, verdict: "Dense potato dumplings offering quick-absorbing carbs ideal before heavy lifting." },
  greek_salad: { name: "Greek Salad", icon: "🥗", category: "Salad", calories: 115, protein: 3.5, carbs: 6.5, fat: 8.5, fiber: 2.2, portion_g: 200, verdict: "Hydrating cucumbers, kalamata olives, and feta delivering key electrolytes." },
  grilled_cheese_sandwich: { name: "Grilled Cheese", icon: "🧀", category: "Sandwich", calories: 320, protein: 11.5, carbs: 31.0, fat: 16.5, fiber: 2.0, portion_g: 140, verdict: "Comfort meal combining calcium-rich melted cheese with crisp toasted carbs." },
  grilled_salmon: { name: "Grilled Salmon", icon: "🍣", category: "Seafood", calories: 208, protein: 22.0, carbs: 0.0, fat: 12.5, fiber: 0.0, portion_g: 180, verdict: "Elite athletic recovery food overflowing with anti-inflammatory EPA/DHA omega-3s." },
  guacamole: { name: "Fresh Guacamole", icon: "🥑", category: "Healthy", calories: 160, protein: 2.0, carbs: 8.5, fat: 14.5, fiber: 6.5, portion_g: 100, verdict: "Heart-healthy monounsaturated oleic fats and potassium to prevent cramping." },
  gyoza: { name: "Pan-Fried Gyoza", icon: "🥟", category: "Appetizer", calories: 195, protein: 9.5, carbs: 21.0, fat: 8.0, fiber: 1.5, portion_g: 160, verdict: "Savory dumplings balanced between lean minced pork and wheat wrappers." },
  hamburger: { name: "Classic Burger", icon: "🍔", category: "Fast Food", calories: 250, protein: 14.0, carbs: 22.0, fat: 12.0, fiber: 1.8, portion_g: 220, verdict: "High-density complete protein and heme iron for muscle hypertrophy." },
  hot_and_sour_soup: { name: "Hot & Sour Soup", icon: "🥣", category: "Soup", calories: 48, protein: 3.2, carbs: 5.5, fat: 1.5, fiber: 0.8, portion_g: 240, verdict: "Low-calorie thermogenic soup with chili peppers and vinegar for metabolism." },
  hot_dog: { name: "Grilled Hot Dog", icon: "🌭", category: "Fast Food", calories: 290, protein: 10.5, carbs: 24.0, fat: 16.5, fiber: 1.2, portion_g: 120, verdict: "Convenient quick energy providing fast sodium and protein." },
  huevos_rancheros: { name: "Huevos Rancheros", icon: "🍳", category: "Breakfast", calories: 165, protein: 8.5, carbs: 14.0, fat: 8.5, fiber: 3.0, portion_g: 220, verdict: "Fried eggs over warm corn tortillas and salsa for clean protein." },
  hummus: { name: "Creamy Hummus", icon: "🫓", category: "Healthy", calories: 166, protein: 7.9, carbs: 14.3, fat: 9.6, fiber: 6.0, portion_g: 120, verdict: "Outstanding plant protein with high dietary fiber and healthy sesame tahini fats." },
  ice_cream: { name: "Creamy Ice Cream", icon: "🍨", category: "Dessert", calories: 207, protein: 3.5, carbs: 24.0, fat: 11.0, fiber: 0.7, portion_g: 100, verdict: "Refreshing calcium source with fast simple sugars for immediate muscle refuelling." },
  lasagna: { name: "Beef Lasagna", icon: "🍝", category: "Pasta", calories: 170, protein: 9.5, carbs: 15.0, fat: 7.8, fiber: 1.6, portion_g: 280, verdict: "Hearty pasta layered with ricotta, mozzarella, and beef for intense recovery." },
  lobster_bisque: { name: "Lobster Bisque", icon: "🦞", category: "Soup", calories: 145, protein: 5.8, carbs: 8.5, fat: 10.2, fiber: 0.5, portion_g: 220, verdict: "Savory seafood soup high in zinc, copper, and iodine for thyroid performance." },
  lobster_roll_sandwich: { name: "Lobster Roll", icon: "🦞", category: "Seafood", calories: 210, protein: 15.5, carbs: 18.0, fat: 8.5, fiber: 1.0, portion_g: 180, verdict: "Chilled sweet lobster meat providing premium lean protein on a toasted roll." },
  macaroni_and_cheese: { name: "Mac & Cheese", icon: "🧀", category: "Pasta", calories: 210, protein: 8.0, carbs: 25.0, fat: 8.5, fiber: 1.5, portion_g: 200, verdict: "Carb and calcium powerhouse ideal for heavy training blocks and bulking." },
  macarons: { name: "French Macarons", icon: "🍪", category: "Dessert", calories: 420, protein: 6.5, carbs: 60.0, fat: 17.5, fiber: 2.5, portion_g: 60, verdict: "Delicate almond flour cookies with vitamin E and rapid sucrose energy." },
  miso_soup: { name: "Miso Soup", icon: "🍲", category: "Soup", calories: 35, protein: 2.5, carbs: 4.0, fat: 1.0, fiber: 1.0, portion_g: 220, verdict: "Fermented soybean paste offering electrolyte sodium and digestive enzymes." },
  mussels: { name: "Steamed Mussels", icon: "🦪", category: "Seafood", calories: 105, protein: 14.5, carbs: 4.5, fat: 3.0, fiber: 0.0, portion_g: 180, verdict: "Incredible iron and vitamin B12 density per calorie to fuel endurance athletes." },
  nachos: { name: "Loaded Nachos", icon: "🧀", category: "Appetizer", calories: 305, protein: 7.5, carbs: 33.0, fat: 16.5, fiber: 3.5, portion_g: 160, verdict: "Crunchy tortilla chips topped with cheese, jalapeños, and beans." },
  omelette: { name: "Fluffy Omelette", icon: "🍳", category: "Breakfast", calories: 154, protein: 11.0, carbs: 1.0, fat: 12.0, fiber: 0.2, portion_g: 160, verdict: "Gold-standard morning bioavailability rating of 100 on the protein index." },
  onion_rings: { name: "Crispy Onion Rings", icon: "🧅", category: "Fast Food", calories: 330, protein: 3.5, carbs: 38.0, fat: 18.5, fiber: 2.8, portion_g: 120, verdict: "Crisp battered onions rich in dietary quercetin antioxidants." },
  oysters: { name: "Fresh Raw Oysters", icon: "🦪", category: "Seafood", calories: 68, protein: 9.0, carbs: 3.8, fat: 2.0, fiber: 0.0, portion_g: 120, verdict: "Highest natural dietary concentration of elemental zinc to optimize hormones." },
  pad_thai: { name: "Stir-Fried Pad Thai", icon: "🍜", category: "Noodles", calories: 190, protein: 8.0, carbs: 26.0, fat: 6.0, fiber: 2.0, portion_g: 280, verdict: "Rice noodles stir-fried with eggs, tofu, bean sprouts, and peanuts." },
  paella: { name: "Seafood Paella", icon: "🥘", category: "Seafood", calories: 165, protein: 9.5, carbs: 22.0, fat: 4.2, fiber: 1.6, portion_g: 300, verdict: "Saffron-infused rice with shrimp, mussels, and squid delivering high iodine." },
  pancakes: { name: "Golden Pancakes", icon: "🥞", category: "Breakfast", calories: 227, protein: 6.4, carbs: 38.0, fat: 5.5, fiber: 1.4, portion_g: 150, verdict: "Carb-loading classic for runners and lifters to top off glycogen stores." },
  panna_cotta: { name: "Vanilla Panna Cotta", icon: "🍮", category: "Dessert", calories: 240, protein: 3.8, carbs: 22.0, fat: 15.5, fiber: 0.0, portion_g: 120, verdict: "Silky cream dessert providing amino acids glycine and proline from gelatin." },
  peking_duck: { name: "Peking Duck", icon: "🦆", category: "Meat", calories: 337, protein: 19.0, carbs: 0.0, fat: 28.5, fiber: 0.0, portion_g: 160, verdict: "Succulent roasted duck high in iron, selenium, and energy fats." },
  pho: { name: "Vietnamese Pho", icon: "🍜", category: "Soup", calories: 85, protein: 6.5, carbs: 11.5, fat: 1.6, fiber: 1.0, portion_g: 400, verdict: "Electrolyte broth packed with joint-nourishing collagen and rice noodles." },
  pizza: { name: "Stone-Baked Pizza", icon: "🍕", category: "Entree", calories: 266, protein: 11.0, carbs: 33.0, fat: 10.0, fiber: 2.3, portion_g: 180, verdict: "Classic multi-macro fuel combining wheat carbs, lycopene, and melted cheese." },
  pork_chop: { name: "Grilled Pork Chop", icon: "🥩", category: "Meat", calories: 215, protein: 27.0, carbs: 0.0, fat: 11.2, fiber: 0.0, portion_g: 180, verdict: "Lean pork cut packed with thiamine (B1) for cellular energy metabolism." },
  poutine: { name: "Quebec Poutine", icon: "🍟", category: "Fast Food", calories: 250, protein: 6.5, carbs: 27.0, fat: 13.0, fiber: 2.2, portion_g: 240, verdict: "Fries topped with cheese curds and beef gravy; calorie booster for lifters." },
  prime_rib: { name: "Roasted Prime Rib", icon: "🥩", category: "Meat", calories: 310, protein: 23.5, carbs: 0.0, fat: 23.5, fiber: 0.0, portion_g: 220, verdict: "Premium marbled beef providing full spectrum amino acids and zinc." },
  pulled_pork_sandwich: { name: "Pulled Pork Sandwich", icon: "🥪", category: "Sandwich", calories: 225, protein: 14.5, carbs: 21.0, fat: 8.5, fiber: 1.2, portion_g: 220, verdict: "Slow-smoked tender pork providing sustained energy and muscle rebuilding protein." },
  ramen: { name: "Tonkotsu Ramen", icon: "🍜", category: "Noodles", calories: 145, protein: 7.0, carbs: 18.0, fat: 5.0, fiber: 1.5, portion_g: 400, verdict: "Deeply simmered collagen broth with wheat noodles and eggs for hydration." },
  ravioli: { name: "Cheese Ravioli", icon: "🥟", category: "Pasta", calories: 195, protein: 8.5, carbs: 28.0, fat: 5.5, fiber: 2.0, portion_g: 200, verdict: "Stuffed pasta pillows delivering fast muscle glycogen and ricotta calcium." },
  red_velvet_cake: { name: "Red Velvet Cake", icon: "🍰", category: "Dessert", calories: 395, protein: 4.2, carbs: 54.0, fat: 18.5, fiber: 1.2, portion_g: 115, verdict: "Cocoa buttermilk cake topped with cream cheese frosting." },
  risotto: { name: "Creamy Risotto", icon: "🍚", category: "Entree", calories: 165, protein: 4.5, carbs: 26.0, fat: 4.8, fiber: 1.2, portion_g: 220, verdict: "High-starch short-grain arborio rice cooked creamy; great pre-race fuel." },
  samosa: { name: "Spiced Samosa", icon: "🥟", category: "Appetizer", calories: 262, protein: 4.5, carbs: 32.0, fat: 13.0, fiber: 3.2, portion_g: 90, verdict: "Cumin and coriander spiced potato pockets wrapped in crisp pastry." },
  sashimi: { name: "Fresh Sashimi", icon: "🍣", category: "Seafood", calories: 130, protein: 24.5, carbs: 0.0, fat: 3.5, fiber: 0.0, portion_g: 150, verdict: "Unrivalled ultra-pure lean protein with anti-inflammatory omega-3 fats." },
  scallops: { name: "Pan-Seared Scallops", icon: "🦪", category: "Seafood", calories: 111, protein: 20.5, carbs: 5.4, fat: 0.8, fiber: 0.0, portion_g: 150, verdict: "Super-lean marine protein offering high taurine for cardiovascular stamina." },
  seaweed_salad: { name: "Wakame Salad", icon: "🥗", category: "Healthy", calories: 65, protein: 1.8, carbs: 9.5, fat: 2.2, fiber: 3.0, portion_g: 120, verdict: "Mineral-rich ocean greens with dietary iodine, magnesium, and alginates." },
  shrimp_and_grits: { name: "Shrimp & Grits", icon: "🍤", category: "Seafood", calories: 175, protein: 12.0, carbs: 18.0, fat: 5.8, fiber: 1.2, portion_g: 260, verdict: "Excellent pairing of lean crustaceans and slow-release corn grits." },
  spaghetti_bolognese: { name: "Spaghetti Bolognese", icon: "🍝", category: "Pasta", calories: 155, protein: 9.2, carbs: 21.0, fat: 3.8, fiber: 2.0, portion_g: 300, verdict: "Endurance powerhouse balancing tomato lycopene, durum wheat, and beef." },
  spaghetti_carbonara: { name: "Spaghetti Carbonara", icon: "🍝", category: "Pasta", calories: 215, protein: 10.5, carbs: 23.5, fat: 8.8, fiber: 1.8, portion_g: 260, verdict: "Rich pasta dish with egg yolk, pecorino cheese, and pancetta for stamina." },
  spring_rolls: { name: "Crisp Spring Rolls", icon: "🥢", category: "Appetizer", calories: 185, protein: 4.5, carbs: 24.0, fat: 7.8, fiber: 2.2, portion_g: 120, verdict: "Crisp pastry filled with shredded cabbage, carrots, and mushrooms." },
  steak: { name: "Ribeye Steak", icon: "🥩", category: "Meat", calories: 252, protein: 26.0, carbs: 0.0, fat: 16.0, fiber: 0.0, portion_g: 220, verdict: "Ultimate strength builder packed with creatine, carnitine, and heme iron." },
  strawberry_shortcake: { name: "Strawberry Shortcake", icon: "🍰", category: "Dessert", calories: 240, protein: 3.5, carbs: 33.0, fat: 10.5, fiber: 1.8, portion_g: 140, verdict: "Light sponge layered with whipped cream and fresh strawberries." },
  sushi: { name: "Nigiri & Maki Sushi", icon: "🍱", category: "Seafood", calories: 143, protein: 5.8, carbs: 26.0, fat: 1.5, fiber: 1.2, portion_g: 220, verdict: "Clean athletic nutrition pairing quick rice with raw fish and iodine nori." },
  tacos: { name: "Street Tacos", icon: "🌮", category: "Entree", calories: 210, protein: 11.5, carbs: 21.0, fat: 8.8, fiber: 3.0, portion_g: 180, verdict: "Nixtamalized corn tortillas offering bioavailable calcium and lean meat protein." },
  takoyaki: { name: "Octopus Takoyaki", icon: "🐙", category: "Seafood", calories: 180, protein: 7.5, carbs: 22.0, fat: 6.8, fiber: 1.2, portion_g: 150, verdict: "Tender octopus balls rich in taurine, zinc, and savory umami dashi." },
  tiramisu: { name: "Espresso Tiramisu", icon: "☕", category: "Dessert", calories: 283, protein: 4.5, carbs: 29.0, fat: 16.5, fiber: 1.0, portion_g: 120, verdict: "Coffee-soaked ladyfingers and mascarpone providing caffeine and dairy fats." },
  tuna_tartare: { name: "Ahi Tuna Tartare", icon: "🐟", category: "Seafood", calories: 140, protein: 23.5, carbs: 2.0, fat: 4.0, fiber: 0.5, portion_g: 140, verdict: "Ultra-clean lean protein with abundant selenium and metabolic vitamin B complex." },
  waffles: { name: "Belgian Waffles", icon: "🧇", category: "Breakfast", calories: 290, protein: 7.0, carbs: 41.0, fat: 11.0, fiber: 1.8, portion_g: 130, verdict: "Deep-pocketed grid waffles offering great carbohydrate capacity for workout fuel." }
};

/**
 * 8 Instant Demonstration Sample Plates (for 1-click teacher/testing demos)
 */
export const SAMPLE_PLATES = [
  {
    id: "sample_pizza",
    name: "Artisan Stone-Baked Pizza",
    category: "pizza",
    icon: "🍕",
    weight_g: 180,
    tag: "High Carb / Post-Workout",
    description: "Stone-baked Italian pizza with mozzarella, tomato sauce, and basil.",
    image: "/sample_images/01_pizza.jpg",
  },
  {
    id: "sample_steak",
    name: "Char-Grilled Ribeye Steak",
    category: "steak",
    icon: "🥩",
    weight_g: 220,
    tag: "High Protein / Hypertrophy",
    description: "USDA Prime beef rich in natural creatine, BCAAs, and heme iron.",
    image: "/sample_images/04_steak.jpg",
  },
  {
    id: "sample_salmon",
    name: "Grilled Atlantic Salmon",
    category: "grilled_salmon",
    icon: "🍣",
    weight_g: 180,
    tag: "Omega-3 Anti-Inflammatory",
    description: "Wild salmon fillet with heart-healthy EPA/DHA fatty acids.",
    image: "/sample_images/06_grilled_salmon.jpg",
  },
  {
    id: "sample_ramen",
    name: "Tonkotsu Chashu Ramen",
    category: "ramen",
    icon: "🍜",
    weight_g: 380,
    tag: "Endurance Glycogen & Broth",
    description: "Slow-simmered bone broth with artisan noodles and tender pork.",
    image: "/sample_images/05_ramen.jpg",
  },
  {
    id: "sample_salad",
    name: "Fresh Caesar Salad",
    category: "caesar_salad",
    icon: "🥗",
    weight_g: 190,
    tag: "Electrolytes & Micronutrients",
    description: "Crisp romaine, parmesan cheese, herb croutons, and dressing.",
    image: "/sample_images/07_caesar_salad.jpg",
  },
  {
    id: "sample_sushi",
    name: "Tokyo Nigiri & Sashimi Combo",
    category: "sushi",
    icon: "🍱",
    weight_g: 210,
    tag: "Clean Athletic Protein",
    description: "Fresh raw tuna and salmon nigiri over seasoned sushi rice.",
    image: "/sample_images/03_sushi.jpg",
  },
  {
    id: "sample_burger",
    name: "Grass-Fed Beef Burger",
    category: "hamburger",
    icon: "🍔",
    weight_g: 240,
    tag: "Strength Bulking Fuel",
    description: "Seared lean beef patty with crisp lettuce and tomato on a brioche bun.",
    image: "/sample_images/02_hamburger.jpg",
  },
  {
    id: "sample_pancakes",
    name: "Golden Fluffy Pancakes",
    category: "pancakes",
    icon: "🥞",
    weight_g: 160,
    tag: "Pre-Workout Carb Loading",
    description: "Stacked buttermilk pancakes for rapid morning energy.",
    image: "/sample_images/10_pancakes.jpg",
  }
];

export const calculateFoodNutrition = (foodKey, weightG = 100) => {
  const clean = String(foodKey || '').toLowerCase().replace(/[\s-]/g, '_');
  const entry = FOOD101_DATABASE[clean] || {
    name: foodKey || 'Meal Item',
    icon: '🍲',
    calories: 180,
    protein: 8.0,
    carbs: 22.0,
    fat: 6.5,
    fiber: 2.0,
    density: 0.85,
    portion_g: 150,
    verdict: 'Balanced meal providing sustained athletic energy.'
  };

  const factor = Math.max(1, weightG) / 100.0;
  return {
    foodKey: clean,
    name: entry.name,
    icon: entry.icon,
    weight_g: Math.round(weightG * 10) / 10,
    calories: Math.round(entry.calories * factor * 10) / 10,
    protein: Math.round(entry.protein * factor * 10) / 10,
    carbs: Math.round(entry.carbs * factor * 10) / 10,
    fat: Math.round(entry.fat * factor * 10) / 10,
    fiber: Math.round(entry.fiber * factor * 10) / 10,
    verdict: entry.verdict,
    micronutrients: {
      fiber_g: Math.round(entry.fiber * factor * 10) / 10,
      sodium_mg: Math.round(260 * factor),
      potassium_mg: Math.round(340 * factor),
      calcium_mg: Math.round(75 * factor),
      iron_mg: Math.round(2.1 * factor * 10) / 10,
      vitamin_c_mg: Math.round(14 * factor * 10) / 10,
    }
  };
};

export const calculateNutriScore = (calories, protein, carbs, fat) => {
  let score = 0;
  if (calories > 350) score += 4;
  else if (calories > 250) score += 2;
  else score -= 1;

  if (fat > 18) score += 4;
  else if (fat > 10) score += 2;
  else score -= 1;

  if (protein > 20) score -= 4;
  else if (protein > 10) score -= 2;

  if (score <= -2) return { grade: "A", color: "#10b981", label: "Excellent Nutrition Profile" };
  if (score <= 1) return { grade: "B", color: "#22c55e", label: "Good Balanced Fuel" };
  if (score <= 4) return { grade: "C", color: "#f59e0b", label: "Moderate Density" };
  if (score <= 7) return { grade: "D", color: "#f97316", label: "High Caloric Load" };
  return { grade: "E", color: "#ef4444", label: "Indulgence / Refeed Only" };
};

export const generateAthleticVerdict = (calories, protein, carbs, fat) => {
  const proteinRatio = (protein * 4) / Math.max(calories, 1);
  if (proteinRatio > 0.35) {
    return "High protein density optimal for muscle hypertrophy and fast post-workout recovery.";
  }
  if (carbs > 50) {
    return "High carbohydrate concentration ideal for endurance athletes or glycogen reloading.";
  }
  if (fat > 25) {
    return "Calorie-dense meal rich in dietary fats; great for sustained energy during long training.";
  }
  return "Well-balanced macro split supporting overall athletic wellness and daily performance.";
};
