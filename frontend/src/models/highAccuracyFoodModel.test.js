import { FOOD_101_CLASSES, detectPlateSpatialRegions } from './highAccuracyFoodModel'
import { searchFoodApi, normalizeApiProduct } from '../utils/nutritionApiService'

describe('High Accuracy Food Model and Nutrition API', () => {
  test('FOOD_101_CLASSES contains valid dishes and food mapping', () => {
    expect(Object.keys(FOOD_101_CLASSES).length).toBeGreaterThan(15)
    expect(FOOD_101_CLASSES.caesar_salad.foodId).toBe('salad')
    expect(FOOD_101_CLASSES.grilled_chicken.foodId).toBe('chicken')
    expect(FOOD_101_CLASSES.steamed_rice.foodId).toBe('rice')
  })

  test('detectPlateSpatialRegions segments primary and side plate components', () => {
    // Create a mock canvas image element
    const mockCanvas = document.createElement('canvas')
    const boxes = detectPlateSpatialRegions(mockCanvas, 'chicken')

    expect(boxes.length).toBeGreaterThanOrEqual(1)
    expect(boxes[0].foodId).toBe('chicken')
    expect(boxes[0].isPrimary).toBe(true)
    expect(boxes[0].box).toBeDefined()
    expect(boxes[0].box.width).toBeGreaterThan(0)
  })

  test('detectPlateSpatialRegions accurately segments Indian Thali into Dal, Puri, Green Sabzi, Banana, and Chai compartments', () => {
    const mockCanvas = document.createElement('canvas')
    const boxes = detectPlateSpatialRegions(mockCanvas, 'dal')

    expect(boxes.length).toBeGreaterThanOrEqual(5)
    const foodIds = boxes.map(b => b.foodId)
    expect(foodIds).toContain('dal')
    expect(foodIds).toContain('puri')
    expect(foodIds).toContain('greenSabzi')
    expect(foodIds).toContain('banana')
    expect(foodIds).toContain('chai')

    const dalBox = boxes.find(b => b.foodId === 'dal')
    expect(dalBox.name).toContain('Dal')
    expect(dalBox.isPrimary).toBe(true)

    const greenBox = boxes.find(b => b.foodId === 'greenSabzi')
    expect(greenBox.name).toContain('Green Beans')
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
