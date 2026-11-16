# FitVision AI — Curated Sample Test Images

This directory contains real test images extracted directly from the **Food-101 Benchmark Dataset**. Use these to test the classifier in the web application or via CLI.

| File | Food Item | Category ID | Typical Serving | Calories | Protein | Carbs | Fat |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `01_pizza.jpg` | Pizza Margherita | `pizza` | 280g | 680 kcal | 26g | 78g | 28g |
| `02_hamburger.jpg` | Cheeseburger | `hamburger` | 240g | 550 kcal | 31g | 42g | 26g |
| `03_sushi.jpg` | Sushi Platter | `sushi` | 220g | 340 kcal | 18g | 56g | 4g |
| `04_steak.jpg` | Grilled Ribeye Steak | `steak` | 250g | 540 kcal | 52g | 0g | 36g |
| `05_ramen.jpg` | Tonkotsu Ramen | `ramen` | 450g | 620 kcal | 26g | 74g | 24g |
| `06_grilled_salmon.jpg` | Grilled Salmon Fillet | `grilled_salmon` | 200g | 410 kcal | 44g | 0g | 24g |
| `07_caesar_salad.jpg` | Fresh Caesar Salad | `caesar_salad` | 180g | 220 kcal | 7g | 12g | 16g |
| `08_chocolate_cake.jpg` | Chocolate Cake | `chocolate_cake` | 130g | 450 kcal | 5g | 58g | 22g |
| `09_french_fries.jpg` | Crispy French Fries | `french_fries` | 150g | 465 kcal | 5g | 63g | 22g |
| `10_pancakes.jpg` | Breakfast Pancakes | `pancakes` | 200g | 450 kcal | 10g | 72g | 12g |
| `11_ice_cream.jpg` | Artisanal Ice Cream | `ice_cream` | 120g | 250 kcal | 4g | 28g | 14g |
| `12_spaghetti_bolognese.jpg` | Spaghetti Bolognese | `spaghetti_bolognese` | 320g | 520 kcal | 24g | 68g | 16g |

---

### How to Test

#### 1. In the Web App (Drag & Drop)
1. Open [http://localhost:3000/food-analyzer](http://localhost:3000/food-analyzer).
2. Drag and drop any image from this folder onto the upload dropzone.
3. The neural network will instantly compute predictions, nutritional breakdown, and Grad-CAM attention heatmaps!

#### 2. From the Command Line
```powershell
python -c "from food_classifier.inference import get_engine; res = get_engine().predict('sample_test_images/01_pizza.jpg'); print(res['plate_name'], res['confidence'], res['top_predictions'][:3])"
```
