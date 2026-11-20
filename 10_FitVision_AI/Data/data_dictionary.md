# FitVision AI - Comprehensive Data Dictionary
**Course:** CSE471 | **Student:** Sujal Kumar | **Roll No:** 10 | **Reg No:** 12405329  
**Repository:** [https://github.com/dev-sujalkumar/fitvision](https://github.com/dev-sujalkumar/fitvision)

---

## 📂 Overview of Datasets in `Data/`

| File Name | Record Count | Columns | Description |
| :--- | :---: | :---: | :--- |
| **`food_101_dataset_40k.csv`** | **40,000** | 13 | 40,000 distinct culinary dish records across all 101 Food-101 categories with realistic, non-repeating macronutrient and physical property measurements. |
| **`pose_detection_dataset_2000.csv`** | **2,000** | 54 | 17-Keypoint MoveNet anatomical landmark coordinates ($x$, $y$, and confidence score) across yoga poses (`chair`, `cobra`, `dog`, `tree`, `warrior`, `traingle`). |

---

## 1. Dataset 1: `food_101_dataset_40k.csv` (40,000 Records)
- **Domain:** Multimodal Computer Vision & Computational Dietetics
- **Sampling Methodology:** 40,000 stratified samples across 101 Food-101 classes with culinary preparation variants and realistic Gaussian distribution shifts ($\pm 8\%$–$15\%$ standard deviation) reflecting genuine culinary recipe and portion variability.

### Field Definitions

| Column Name | Data Type | Constraint / Unit | Description | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `record_id` | String | Unique Key (`DISH_\d{5}`) | Unique alphanumeric record identifier | `DISH_00402` |
| `image_path` | String | Format: `class/id` | Benchmark dataset reference image path | `pho/2825284` |
| `class_name` | String | 101 Categories | Canonical Food-101 category key | `pho` |
| `dish_name` | String | Non-null | Unique culinary dish title with preparation variant | `Artisan Vietnamese Beef Pho` |
| `category` | String | Non-null | High-level culinary classification | `Noodle Soup / Vietnamese` |
| `split` | String | `train` / `test` | Dataset training/testing partition flag | `train` |
| `calories_kcal` | Float | $> 0$ (per 100g) | Caloric density measured in kilocalories per 100g | `84.0` |
| `protein_g` | Float | $\ge 0$ (per 100g) | Protein macronutrient content in grams per 100g | `6.2` |
| `carbs_g` | Float | $\ge 0$ (per 100g) | Carbohydrates content in grams per 100g | `12.7` |
| `fat_g` | Float | $\ge 0$ (per 100g) | Total lipid/fat content in grams per 100g | `2.4` |
| `fiber_g` | Float | $\ge 0$ (per 100g) | Dietary fiber content in grams per 100g | `1.4` |
| `density_g_cm3` | Float | $0.35 \le \rho \le 1.45$ | Volumetric physical density for 3D portion bounding | `0.88` |
| `portion_g` | Float | $> 0$ (grams) | Dynamic single-serving portion weight | `403.7` |

---

## 2. Dataset 2: `pose_detection_dataset_2000.csv` (2,000 Records)
- **Domain:** Human Kinematics & Sports Biomechanics
- **Standard:** MoveNet Thunder / COCO 17-Keypoint Landmark Coordinates
- **Total Columns:** 54 fields

| Keypoint # | Joint Landmark | Coordinate Columns |
| :---: | :--- | :--- |
| **0** | Nose | `NOSE_x`, `NOSE_y`, `NOSE_score` |
| **1 - 2** | Left / Right Eye | `LEFT_EYE_x`, `LEFT_EYE_y`, `LEFT_EYE_score`, `RIGHT_EYE_...` |
| **3 - 4** | Left / Right Ear | `LEFT_EAR_x`, `LEFT_EAR_y`, `LEFT_EAR_score`, `RIGHT_EAR_...` |
| **5 - 6** | Left / Right Shoulder | `LEFT_SHOULDER_x`, `LEFT_SHOULDER_y`, `LEFT_SHOULDER_score`, `RIGHT_...` |
| **7 - 8** | Left / Right Elbow | `LEFT_ELBOW_x`, `LEFT_ELBOW_y`, `LEFT_ELBOW_score`, `RIGHT_...` |
| **9 - 10** | Left / Right Wrist | `LEFT_WRIST_x`, `LEFT_WRIST_y`, `LEFT_WRIST_score`, `RIGHT_...` |
| **11 - 12** | Left / Right Hip | `LEFT_HIP_x`, `LEFT_HIP_y`, `LEFT_HIP_score`, `RIGHT_...` |
| **13 - 14** | Left / Right Knee | `LEFT_KNEE_x`, `LEFT_KNEE_y`, `LEFT_KNEE_score`, `RIGHT_...` |
| **15 - 16** | Left / Right Ankle | `LEFT_ANKLE_x`, `LEFT_ANKLE_y`, `LEFT_ANKLE_score`, `RIGHT_...` |
| **Target** | Class Label | `class_no` (0–5), `class_name` (`chair`, `cobra`, `dog`, `tree`, `warrior`, `traingle`) |
