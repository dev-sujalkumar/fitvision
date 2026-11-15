import { FOOD_101_CLASSES, detectPlateSpatialRegions } from './highAccuracyFoodModel'
import {
  searchFoodApi,
  normalizeApiProduct,
  getGeminiApiKey,
  setGeminiApiKey,
  getAccurateIndianThaliPreset,
  GEMINI_API_STORAGE_KEY,
} from '../utils/nutritionApiService'

describe('High Accuracy Food Model and Nutrition API', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('FOOD_101_CLASSES contains valid dishes and food mapping', () => {
    expect(Object.keys(FOOD_101_CLASSES).length).toBeGreaterThan(15)
    expect(FOOD_101_CLASSES.caesar_salad.foodId).toBe('salad')
    expect(FOOD_101_CLASSES.grilled_chicken.foodId).toBe('chicken')
    expect(FOOD_101_CLASSES.steamed_rice.foodId).toBe('rice')
  })

  test('detectPlateSpatialRegions segments primary and side plate components', () => {
    const mockCanvas = document.createElement('canvas')
    const boxes = detectPlateSpatialRegions(mockCanvas, 'chicken')

    expect(boxes.length).toBeGreaterThanOrEqual(1)
    expect(boxes[0].foodId).toBe('chicken')
    expect(boxes[0].isPrimary).toBe(true)
    expect(boxes[0].box).toBeDefined()
    expect(boxes[0].box.width).toBeGreaterThan(0)
  })

  test('detectPlateSpatialRegions segments culinary items without phantom bananas or chai', () => {
    const mockCanvas = document.createElement('canvas')
    const boxes = detectPlateSpatialRegions(mockCanvas, 'dal')

    expect(boxes.length).toBeGreaterThanOrEqual(1)
    const foodIds = boxes.map(b => b.foodId)
    // Must contain Dal, but never blindly hallucinate banana or chai
    expect(foodIds).toContain('dal')
    expect(foodIds).not.toContain('banana')
    expect(foodIds).not.toContain('chai')

    const dalBox = boxes.find(b => b.foodId === 'dal')
    expect(dalBox.name).toContain('Dal')
  })

  test('getAccurateIndianThaliPreset decomposes meal with 100% accurate dishes', () => {
    const preset = getAccurateIndianThaliPreset()
    expect(preset.detectedBoxes.length).toBe(5)

    const foodIds = preset.detectedBoxes.map(b => b.foodId)
    expect(foodIds).toContain('roti')
    expect(foodIds).toContain('dal')
    expect(foodIds).toContain('mixedCurry')
    expect(foodIds).toContain('papad')
    expect(foodIds).toContain('curd')

    // Confirm no bananas or chai hallucinated
    expect(foodIds).not.toContain('banana')
    expect(foodIds).not.toContain('chai')

    expect(preset.nutritionTotals.calories).toBeGreaterThan(500)
    expect(preset.nutritionTotals.protein).toBeGreaterThan(20)
    expect(preset.accuracyTelemetry.confidencePercent).toBe(99)
  })

  test('Gemini API key management functions save and retrieve key from storage', () => {
    expect(getGeminiApiKey()).toBe('')
    setGeminiApiKey('AIzaSyTestKey_12345')
    expect(getGeminiApiKey()).toBe('AIzaSyTestKey_12345')
    expect(localStorage.getItem(GEMINI_API_STORAGE_KEY)).toBe('AIzaSyTestKey_12345')

    setGeminiApiKey('')
    expect(getGeminiApiKey()).toBe('')
  })

  test('searchFoodApi returns verified branded products with complete nutrients', async () => {
    const results = await searchFoodApi('Chobani')
    expect(results.length).toBeGreaterThan(0)

    const chobani = results[0]
    expect(chobani.name).toContain('Chobani')
    expect(chobani.nutriments.protein).toBeGreaterThan(5)
    expect(chobani.nutriments.calories).toBeGreaterThan(0)
  })

  test('normalizeApiProduct maps raw Open Food Facts payload to 18-nutrient standard', () => {
    const mockProduct = {
      product_name: 'Test Protein Bar',
      brands: 'FitVision Nutrition',
      nutriments: {
        'energy-kcal_100g': 380,
        proteins_100g: 22.5,
        carbohydrates_100g: 45,
        fat_100g: 10,
        fiber_100g: 8,
        sodium_100g: 0.25,
      },
    }

    const normalized = normalizeApiProduct(mockProduct)
    expect(normalized.name).toBe('Test Protein Bar')
    expect(normalized.nutriments.calories).toBe(380)
    expect(normalized.nutriments.protein).toBe(22.5)
    expect(normalized.nutriments.sodiumMg).toBe(250)
  })
})
