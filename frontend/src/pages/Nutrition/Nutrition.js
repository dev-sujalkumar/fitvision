import React, { useState, useEffect, useRef, useCallback } from 'react'
import { saveFoodEntry, getFoodDiary } from '../../utils/storage'
import { FOOD_NUTRIENTS, NUTRIENT_LABELS, calculateMealNutrition } from '../../utils/foodNutrition'
import './Nutrition.css'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

const QUICK_FOODS = [
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Brown Rice (cup)', calories: 216, protein: 5, carbs: 45, fat: 1.8 },
  { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7 },
  { name: 'Oats (100g)', calories: 389, protein: 17, carbs: 66, fat: 7 },
  { name: 'Egg', calories: 78, protein: 6, carbs: 0.6, fat: 5 },
]

const DAILY_GOALS = { calories: 2200, protein: 150, carbs: 270, fat: 73 }

export default function Nutrition() {
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', mealType: 'lunch' })
  const [diary, setDiary] = useState([])
  const [today] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoMealType, setPhotoMealType] = useState('lunch')
  const [selectedFood, setSelectedFood] = useState(Object.keys(FOOD_NUTRIENTS)[0])
  const [portionGrams, setPortionGrams] = useState('100')
  const [mealItems, setMealItems] = useState([])
  const fileInputRef = useRef(null)
  const itemIdRef = useRef(0)

  const loadDiary = useCallback(async () => {
    const entries = await getFoodDiary(today)
    setDiary(entries || [])
  }, [today])

  const showToast = useCallback(msg => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    loadDiary().catch(error => {
      console.error('Error loading food diary:', error)
      showToast('Unable to load food diary.')
    })
  }, [loadDiary, showToast])

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const handlePhotoSelected = event => {
    const file = event.target.files && event.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.')
      event.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be 10 MB or smaller.')
      event.target.value = ''
      return
    }
    setPhotoPreview(URL.createObjectURL(file))
    setMealItems([])
  }

  const addPhotoFood = () => {
    const grams = Number(portionGrams)
    if (!Number.isFinite(grams) || grams <= 0) {
      showToast('Enter a serving amount greater than 0 grams.')
      return
    }
    setMealItems(items => [...items, {
      id: itemIdRef.current++,
      foodId: selectedFood,
      grams,
    }])
  }

  const mealTotals = calculateMealNutrition(mealItems)

  const savePhotoMeal = async () => {
    if (!photoPreview || mealItems.length === 0) return

    const items = mealItems.map(item => ({
      name: FOOD_NUTRIENTS[item.foodId].name,
      grams: item.grams,
    }))
    const name = items.map(item => `${item.name} (${item.grams}g)`).join(', ')

    setSaving(true)
    try {
      await saveFoodEntry({
        ...mealTotals,
        name,
        items,
        mealType: photoMealType,
        date: today,
        estimateSource: 'photo-confirmed-estimate',
      })
      setPhotoPreview(null)
      setMealItems([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      showToast('Meal estimate saved to your diary.')
      loadDiary().catch(error => {
        console.error('Error refreshing food diary after meal save:', error)
        showToast('Meal saved, but the diary could not be refreshed.')
      })
    } catch (error) {
      console.error('Error saving photo meal estimate:', error)
      showToast('Could not save this meal. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.calories) return
    setSaving(true)
    try {
      await saveFoodEntry({ ...form, calories: +form.calories, protein: +form.protein || 0, carbs: +form.carbs || 0, fat: +form.fat || 0, date: today })
      setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', mealType: 'lunch' })
      await loadDiary()
      showToast('✅ Food entry saved!')
    } catch (error) {
      console.error('Error saving food entry:', error)
      showToast('❌ Error saving entry')
    } finally {
      setSaving(false)
    }
  }

  const handleQuickAdd = async (food) => {
    setSaving(true)
    try {
      await saveFoodEntry({ ...food, mealType: 'snack', date: today })
      await loadDiary()
      showToast(`✅ Added ${food.name}`)
    } catch (error) {
      console.error('Error adding quick food:', error)
      showToast('Could not add this food.')
    } finally {
      setSaving(false)
    }
  }

  const totals = diary.reduce((acc, e) => ({
    calories: acc.calories + (e.calories || 0),
    protein: acc.protein + (e.protein || 0),
    carbs: acc.carbs + (e.carbs || 0),
    fat: acc.fat + (e.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const photoEstimateEntries = diary.filter(entry => entry.estimateSource === 'photo-confirmed-estimate')
  const dailyNutrients = Object.keys(NUTRIENT_LABELS).reduce((acc, key) => {
    acc[key] = photoEstimateEntries.reduce((sum, entry) => sum + (Number(entry[key]) || 0), 0)
    return acc
  }, {})

  const grouped = MEAL_TYPES.reduce((acc, mt) => {
    acc[mt] = diary.filter(e => e.mealType === mt)
    return acc
  }, {})

  return (
    <div className="nutrition-page">
      {toast && <div className="toast">{toast}</div>}

      <div className="nutrition-header">
        <div>
          <h1 className="nutrition-title">🥗 Nutrition <span style={{ color: '#10b981' }}>Tracker</span></h1>
          <p className="nutrition-sub">Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="nutrition-summary">
        {[
          { label: 'Calories', value: Math.round(totals.calories), goal: DAILY_GOALS.calories, unit: 'kcal', color: '#f59e0b' },
          { label: 'Protein', value: Math.round(totals.protein), goal: DAILY_GOALS.protein, unit: 'g', color: '#8b5cf6' },
          { label: 'Carbs', value: Math.round(totals.carbs), goal: DAILY_GOALS.carbs, unit: 'g', color: '#3b82f6' },
          { label: 'Fat', value: Math.round(totals.fat), goal: DAILY_GOALS.fat, unit: 'g', color: '#ec4899' },
        ].map((m, i) => (
          <div key={i} className="nutrition-macro-card">
            <div className="macro-ring-wrap">
              <svg viewBox="0 0 36 36" className="macro-ring">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke={m.color}
                  strokeWidth="3"
                  strokeDasharray={`${Math.min((m.value / m.goal) * 100, 100)} 100`}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                  style={{ filter: `drop-shadow(0 0 4px ${m.color})` }}
                />
              </svg>
              <div className="macro-ring-center">
                <span className="macro-value">{m.value}</span>
                <span className="macro-unit">{m.unit}</span>
              </div>
            </div>
            <p className="macro-label">{m.label}</p>
            <p className="macro-goal">Goal: {m.goal}{m.unit}</p>
          </div>
        ))}
      </div>

      <section className="daily-nutrient-summary">
        <h3>Micronutrients from photo estimates today</h3>
        <p className="daily-value-note">
          Manual and quick-add diary entries are excluded because their micronutrient values were not entered.
        </p>
        <div className="daily-nutrient-grid">
          {Object.entries(NUTRIENT_LABELS)
            .filter(([key]) => !['calories', 'protein', 'carbs', 'fat'].includes(key))
            .map(([key, nutrient]) => (
              <div className="daily-nutrient-item" key={key}>
                <span>{nutrient.label}</span>
                <strong>
                  {nutrient.unit === 'mg' || nutrient.unit === 'mcg'
                    ? Math.round(dailyNutrients[key])
                    : dailyNutrients[key].toFixed(1)} {nutrient.unit}
                </strong>
              </div>
            ))}
        </div>
      </section>

      <div className="nutrition-body">
        {/* Left: Log food */}
        <div className="nutrition-left">
          {/* Photo-based meal estimate */}
          <div className="nutrition-card photo-nutrition-card">
            <h3 className="nutrition-card-title">Estimate Nutrition from a Food Photo</h3>
            <p className="photo-estimate-note">
              Add a meal photo, then select each visible food and enter its approximate cooked serving weight.
              The photo stays in your browser; it is not automatically recognized or uploaded.
            </p>
            <label className="photo-upload-button">
              {photoPreview ? 'Choose a different photo' : 'Choose meal photo'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelected}
              />
            </label>
            {photoPreview && (
              <img className="food-photo-preview" src={photoPreview} alt="Selected meal" />
            )}

            <div className="photo-food-controls">
              <div className="form-group">
                <label htmlFor="photo-food-select">Food item</label>
                <select
                  id="photo-food-select"
                  className="select-dark"
                  value={selectedFood}
                  onChange={event => setSelectedFood(event.target.value)}
                  disabled={!photoPreview}
                >
                  {Object.entries(FOOD_NUTRIENTS).map(([id, food]) => (
                    <option key={id} value={id}>{food.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="photo-food-grams">Serving (grams)</label>
                <input
                  id="photo-food-grams"
                  className="input-dark"
                  type="number"
                  min="1"
                  max="5000"
                  step="1"
                  value={portionGrams}
                  onChange={event => setPortionGrams(event.target.value)}
                  disabled={!photoPreview}
                />
              </div>
              <button
                type="button"
                className="btn-primary-glow"
                onClick={addPhotoFood}
                disabled={!photoPreview}
              >
                Add food
              </button>
            </div>

            {mealItems.length > 0 && (
              <>
                <ul className="photo-meal-items">
                  {mealItems.map(item => (
                    <li key={item.id}>
                      <span>{FOOD_NUTRIENTS[item.foodId].name} · {item.grams} g</span>
                      <button
                        type="button"
                        aria-label={`Remove ${FOOD_NUTRIENTS[item.foodId].name}`}
                        onClick={() => setMealItems(items => items.filter(entry => entry.id !== item.id))}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="photo-meal-type">
                  <label htmlFor="photo-meal-type">Meal</label>
                  <select
                    id="photo-meal-type"
                    className="select-dark"
                    value={photoMealType}
                    onChange={event => setPhotoMealType(event.target.value)}
                  >
                    {MEAL_TYPES.map(meal => (
                      <option key={meal} value={meal}>{MEAL_ICONS[meal]} {meal}</option>
                    ))}
                  </select>
                </div>
                <div className="nutrient-estimate">
                  <h4>Estimated nutrients for this meal</h4>
                  <p className="daily-value-note">
                    %DV uses general FDA adult reference values and is not personalized.
                  </p>
                  <div className="nutrient-estimate-grid">
                    {Object.entries(NUTRIENT_LABELS).map(([key, nutrient]) => (
                      <div className="nutrient-estimate-item" key={key}>
                        <span>{nutrient.label}</span>
                        <strong>
                          {nutrient.unit === 'mg' || nutrient.unit === 'mcg'
                            ? Math.round(mealTotals[key])
                            : mealTotals[key].toFixed(1)} {nutrient.unit}
                        </strong>
                        {nutrient.dailyValue && (
                          <small>{Math.round((mealTotals[key] / nutrient.dailyValue) * 100)}% DV</small>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary-glow"
                  onClick={savePhotoMeal}
                  disabled={saving || !photoPreview}
                  style={{ width: '100%', padding: '13px' }}
                >
                  {saving ? 'Saving...' : 'Save estimated meal to diary'}
                </button>
              </>
            )}
            <p className="photo-estimate-disclaimer">
              Values are approximate per 100 g reference data. Photo alone cannot reveal exact portion,
              added oil, salt, sauces, recipe, or cooking method. Weigh portions and adjust for best results.
              Nutrition estimates are informational, not medical advice.
            </p>
          </div>

          {/* Log Form */}
          <div className="nutrition-card">
            <h3 className="nutrition-card-title">Log Food</h3>
            <form onSubmit={handleSubmit} className="food-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Food Name *</label>
                  <input className="input-dark" placeholder="e.g. Chicken Rice" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Meal Type</label>
                  <select className="select-dark" value={form.mealType}
                    onChange={e => setForm(f => ({ ...f, mealType: e.target.value }))}>
                    {MEAL_TYPES.map(m => <option key={m} value={m}>{MEAL_ICONS[m]} {m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row four-col">
                {[
                  { key: 'calories', label: 'Calories (kcal)', required: true },
                  { key: 'protein', label: 'Protein (g)' },
                  { key: 'carbs', label: 'Carbs (g)' },
                  { key: 'fat', label: 'Fat (g)' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label>{f.label} {f.required && '*'}</label>
                    <input className="input-dark" type="number" min="0" step="0.1"
                      placeholder="0"
                      value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      required={f.required}
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="btn-primary-glow" disabled={saving} style={{ width: '100%', padding: '13px' }}>
                {saving ? 'Saving...' : '+ Add to Diary'}
              </button>
            </form>
          </div>

          {/* Quick Add */}
          <div className="nutrition-card">
            <h3 className="nutrition-card-title">Quick Add</h3>
            <div className="quick-foods-grid">
              {QUICK_FOODS.map((food, i) => (
                <div key={i} className="quick-food-card" onClick={() => handleQuickAdd(food)}>
                  <p className="quick-food-name">{food.name}</p>
                  <p className="quick-food-cals">{food.calories} kcal</p>
                  <p className="quick-food-macros">P: {food.protein}g · C: {food.carbs}g · F: {food.fat}g</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Today's diary */}
        <div className="nutrition-right">
          <div className="nutrition-card">
            <h3 className="nutrition-card-title">Today's Diary</h3>
            {diary.length === 0 ? (
              <div className="nutrition-empty">
                <p>📝 No entries yet today. Start logging!</p>
              </div>
            ) : (
              MEAL_TYPES.map(mt => grouped[mt].length > 0 && (
                <div key={mt} className="meal-group">
                  <div className="meal-group-header">
                    <span className="meal-group-icon">{MEAL_ICONS[mt]}</span>
                    <span className="meal-group-name">{mt.charAt(0).toUpperCase() + mt.slice(1)}</span>
                    <span className="meal-group-cals">
                      {grouped[mt].reduce((s, e) => s + (e.calories || 0), 0)} kcal
                    </span>
                  </div>
                  {grouped[mt].map((entry, i) => (
                    <div key={i} className="diary-entry">
                      <div>
                        <p className="diary-name">{entry.name}</p>
                        <p className="diary-macros">
                          P: {entry.protein}g · C: {entry.carbs}g · F: {entry.fat}g · Fiber: {entry.fiber || 0}g
                        </p>
                        {entry.estimateSource === 'photo-confirmed-estimate' && (
                          <details className="diary-nutrients">
                            <summary>Estimated micronutrients</summary>
                            {Object.entries(NUTRIENT_LABELS)
                              .filter(([key]) => !['calories', 'protein', 'carbs', 'fat'].includes(key))
                              .map(([key, nutrient]) => (
                                <span key={key}>
                                  {nutrient.label}: {nutrient.unit === 'mg' || nutrient.unit === 'mcg'
                                    ? Math.round(entry[key] || 0)
                                    : Number(entry[key] || 0).toFixed(1)} {nutrient.unit}
                                </span>
                              ))}
                          </details>
                        )}
                      </div>
                      <span className="diary-cals">{entry.calories} kcal</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
