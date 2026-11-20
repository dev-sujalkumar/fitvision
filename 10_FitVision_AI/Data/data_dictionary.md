# FitVision AI - Comprehensive Data Dictionary
**Course:** CSE471 | **Student:** Sujal Kumar | **Roll No:** 10 | **Reg No:** 12405329  
**Repository:** [https://github.com/dev-sujalkumar/fitvision](https://github.com/dev-sujalkumar/fitvision)

---

## 📂 Overview of Included Datasets in `Data/`

| File Name | Record Count | Number of Columns | Description |
| :--- | :--- | :--- | :--- |
| **`food_101_dataset_100k.csv`** | **100,000** | 12 | Food-101 full image corpus metadata with nutritional macro/micronutrient mappings |
| **`pose_detection_dataset_2000.csv`** | **2,000** | 54 | 17-Keypoint MoveNet anatomical landmark coordinates across yoga & gym postures |
| **`sample_food_nutrition_dataset.csv`** | **30** | 12 | Curated benchmark sample dataset for rapid verification and grading |

---

## 1. Dataset 1: `food_101_dataset_100k.csv` (100,000 Records)
- **Domain:** Computer Vision Image Classification & Nutritional Biochemistry
- **Source:** Food-101 Benchmark Dataset (Bossard et al., ETH Zurich) + USDA FoodData Central Nutrition Database

| Column Name | Data Type | Constraint / Unit | Description | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `record_id` | String | Unique Key (`IMG_\d{6}`) | Unique serial identifier for each image record | `IMG_000001` |
| `image_path` | String | Format: `class/id` | Relative image file path matching Food-101 hierarchy | `apple_pie/1005649` |
| `class_name` | String | 101 Categories | Standardized folder/class name | `apple_pie` |
| `dish_name` | String | Non-null | Human-readable dish title | `Apple Pie` |
| `split` | String | `train` / `test` | Official split allocation (75,000 train / 25,000 test) | `train` |
| `calories_kcal` | Integer | $\ge 0$ (per 100g) | Caloric density per 100 grams | `237` |
| `protein_g` | Float | $\ge 0$ (per 100g) | Protein content in grams per 100g | `1.9` |
| `carbs_g` | Float | $\ge 0$ (per 100g) | Carbohydrates in grams per 100g | `34.0` |
| `fat_g` | Float | $\ge 0$ (per 100g) | Total lipid/fat content in grams per 100g | `11.0` |
| `fiber_g` | Float | $\ge 0$ (per 100g) | Dietary fiber in grams per 100g | `1.6` |
| `density_g_cm3` | Float | $0.2 \le \rho \le 1.6$ | Physical volumetric density for 3D portion estimation | `0.85` |
| `portion_g` | Float | $> 0$ (grams) | Standard single-plate serving portion | `130.0` |

---

## 2. Dataset 2: `pose_detection_dataset_2000.csv` (2,000 Records)
- **Domain:** Biomechanics, Kinematics & Sports Motion Analysis
- **Model Standard:** MoveNet Thunder / COCO 17-Keypoint Landmark Topology
- **Attributes:** 54 fields (17 keypoints $\times$ [x, y, confidence score] + image filename + class index + class name)

### Coordinate System & Normalization
- $x \in [0, 256]$: Horizontal pixel coordinate of detected joint landmark.
- $y \in [0, 256]$: Vertical pixel coordinate of detected joint landmark.
- $\text{score} \in [0.0, 1.0]$: Model detection confidence probability for the specific landmark.

### Keypoint Topology Mapping (COCO-17 Standard)

| Keypoint Index | Landmark Name | Coordinate Columns in CSV |
| :---: | :--- | :--- |
| **0** | Nose | `NOSE_x`, `NOSE_y`, `NOSE_score` |
| **1** | Left Eye | `LEFT_EYE_x`, `LEFT_EYE_y`, `LEFT_EYE_score` |
| **2** | Right Eye | `RIGHT_EYE_x`, `RIGHT_EYE_y`, `RIGHT_EYE_score` |
| **3** | Left Ear | `LEFT_EAR_x`, `LEFT_EAR_y`, `LEFT_EAR_score` |
| **4** | Right Ear | `RIGHT_EAR_x`, `RIGHT_EAR_y`, `RIGHT_EAR_score` |
| **5** | Left Shoulder | `LEFT_SHOULDER_x`, `LEFT_SHOULDER_y`, `LEFT_SHOULDER_score` |
| **6** | Right Shoulder | `RIGHT_SHOULDER_x`, `RIGHT_SHOULDER_y`, `RIGHT_SHOULDER_score` |
| **7** | Left Elbow | `LEFT_ELBOW_x`, `LEFT_ELBOW_y`, `LEFT_ELBOW_score` |
| **8** | Right Elbow | `RIGHT_ELBOW_x`, `RIGHT_ELBOW_y`, `RIGHT_ELBOW_score` |
| **9** | Left Wrist | `LEFT_WRIST_x`, `LEFT_WRIST_y`, `LEFT_WRIST_score` |
| **10** | Right Wrist | `RIGHT_WRIST_x`, `RIGHT_WRIST_y`, `RIGHT_WRIST_score` |
| **11** | Left Hip | `LEFT_HIP_x`, `LEFT_HIP_y`, `LEFT_HIP_score` |
| **12** | Right Hip | `RIGHT_HIP_x`, `RIGHT_HIP_y`, `RIGHT_HIP_score` |
| **13** | Left Knee | `LEFT_KNEE_x`, `LEFT_KNEE_y`, `LEFT_KNEE_score` |
| **14** | Right Knee | `RIGHT_KNEE_x`, `RIGHT_KNEE_y`, `RIGHT_KNEE_score` |
| **15** | Left Ankle | `LEFT_ANKLE_x`, `LEFT_ANKLE_y`, `LEFT_ANKLE_score` |
| **16** | Right Ankle | `RIGHT_ANKLE_x`, `RIGHT_ANKLE_y`, `RIGHT_ANKLE_score` |
| **Metadata** | `filename` | File path of original camera frame |
| **Target 1** | `class_no` | Integer encoding (`0` to `5`) |
| **Target 2** | `class_name` | Pose category (`chair`, `cobra`, `dog`, `tree`, `warrior`, `traingle`) |

---

## 3. Dataset 3: `sample_food_nutrition_dataset.csv` (30 Records)
- **Domain:** Clinical Nutrition, Indian Dietetics & Rapid Evaluator Verification
- **Contains:** 30 comprehensive items covering North Indian, South Indian, Mughlai, Continental, Italian, and Sports Nutrition diets.
- **Nutri-Score Rating:** Graded `A` through `E` using the European Public Health Nutri-Score algorithm based on caloric density, saturated lipids, and sugar vs. protein and fiber.
