import {
  loadBenchmarkPlate,
  recalibratePlateDiameter,
  updateDishInAnalysis,
  removeDishFromAnalysis,
  addDishToAnalysis,
  getFoodEmoji,
  getGeminiApiKey,
  setGeminiApiKey,
} from './foodAnalyzerService';

describe('foodAnalyzerService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('loadBenchmarkPlate loads meal #12082 accurately with normalized dishes', () => {
    const analysis = loadBenchmarkPlate('meal_12082', 16.0);
    expect(analysis).toBeDefined();
    expect(analysis.plate_diameter_cm).toBe(16.0);
    expect(analysis.dishes.length).toBeGreaterThan(0);
    expect(analysis.totals.calories).toBeGreaterThan(0);
    expect(analysis.totals.protein).toBeGreaterThan(0);
    expect(analysis.nutriScore).toBeDefined();
    expect(analysis.nutriScore.grade).toMatch(/^[A-E]$/);
  });

  test('recalibratePlateDiameter scales dish weights and calories accurately by diameter squared', () => {
    const initial = loadBenchmarkPlate('meal_12082', 16.0);
    const initialWeight = initial.totals.weight_g;
    const initialCalories = initial.totals.calories;

    // Scale up to 20cm plate
    const scaled = recalibratePlateDiameter(initial, 20.0);
    expect(scaled.plate_diameter_cm).toBe(20.0);

    const expectedFactor = Math.pow(20.0 / 16.0, 2); // 1.5625
    expect(scaled.totals.weight_g).toBeGreaterThan(initialWeight);
    expect(scaled.totals.calories).toBeGreaterThan(initialCalories);
    expect(Math.abs(scaled.totals.weight_g / initialWeight - expectedFactor)).toBeLessThan(0.05);
  });

  test('updateDishInAnalysis updates grams and recalculates macros', () => {
    const initial = loadBenchmarkPlate('meal_12082', 16.0);
    const dishToUpdate = initial.dishes[0];

    const updated = updateDishInAnalysis(initial, dishToUpdate.id, { weight_g: 300 });
    const updatedDish = updated.dishes.find((d) => d.id === dishToUpdate.id);

    expect(updatedDish.weight_g).toBe(300);
    expect(updatedDish.calories).toBeGreaterThan(0);
    expect(updated.totals.weight_g).toBeGreaterThan(0);
  });

  test('addDishToAnalysis and removeDishFromAnalysis manipulate plate contents correctly', () => {
    const initial = loadBenchmarkPlate('meal_12082', 16.0);
    const originalCount = initial.dishes.length;

    const withAdded = addDishToAnalysis(initial, 'chicken', 150);
    expect(withAdded.dishes.length).toBe(originalCount + 1);

    const addedDish = withAdded.dishes[withAdded.dishes.length - 1];
    expect(addedDish.food).toBe('chicken');
    expect(addedDish.weight_g).toBe(150);

    const withRemoved = removeDishFromAnalysis(withAdded, addedDish.id);
    expect(withRemoved.dishes.length).toBe(originalCount);
  });

  test('getFoodEmoji returns intuitive icons for common foods', () => {
    expect(getFoodEmoji('steamed rice')).toBe('🍚');
    expect(getFoodEmoji('grilled chicken breast')).toBe('🍗');
    expect(getFoodEmoji('fresh salmon sashimi')).toBe('🐟');
    expect(getFoodEmoji('miso soup')).toBe('🥣');
    expect(getFoodEmoji('broccoli')).toBe('🥦');
  });

  test('setGeminiApiKey and getGeminiApiKey persist to localStorage', () => {
    expect(getGeminiApiKey()).toBe('');
    setGeminiApiKey('AIzaSyTestKey12345');
    expect(getGeminiApiKey()).toBe('AIzaSyTestKey12345');
    setGeminiApiKey('');
    expect(getGeminiApiKey()).toBe('');
  });
});
