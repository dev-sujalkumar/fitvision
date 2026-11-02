import { calculateMealNutrition, FOOD_NUTRIENTS, NUTRIENT_LABELS } from './foodNutrition'

describe('calculateMealNutrition', () => {
  test('scales nutrients by serving grams and sums multiple foods', () => {
    const totals = calculateMealNutrition([
      { foodId: 'rice', grams: 200 },
      { foodId: 'chicken', grams: 100 },
    ])

    expect(totals.calories).toBeCloseTo(425)
    expect(totals.protein).toBeCloseTo(36.4)
    expect(totals.carbs).toBeCloseTo(56.4)
    expect(totals.fat).toBeCloseTo(4.2)
    expect(totals.potassiumMg).toBeCloseTo(326)
  })

  test('ignores invalid foods and non-positive serving sizes', () => {
    const totals = calculateMealNutrition([
      { foodId: 'not-in-database', grams: 120 },
      { foodId: 'banana', grams: 0 },
    ])

    expect(totals.calories).toBe(0)
    expect(totals.vitaminCMg).toBe(0)
  })

  test('provides values for every displayed nutrient in each food profile', () => {
    Object.values(FOOD_NUTRIENTS).forEach(food => {
      Object.keys(NUTRIENT_LABELS).forEach(nutrient => {
        expect(Number.isFinite(food[nutrient])).toBe(true)
      })
    })
  })
})
