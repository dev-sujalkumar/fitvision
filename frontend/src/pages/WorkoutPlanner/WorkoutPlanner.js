import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { saveUserPreferences, getUserPreferences } from '../../utils/storage'
import { YOGA_POSES } from '../../utils/yogaPoseLibrary'
import { EXERCISE_PATTERNS } from '../../utils/gymExercises'
import './WorkoutPlanner.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const PRESETS = [
  {
    id: 'mobility',
    name: '🌅 Morning Mobility (Yoga)',
    desc: 'Gentle spinal decompression, hip openers & grounding',
    schedule: {
      Monday: [
        { name: 'Tree Pose', type: 'yoga', duration: 45, poseId: 'Tree', muscles: 'Balance & Core' },
        { name: 'Downward-Facing Dog', type: 'yoga', duration: 60, poseId: 'Downward-Facing Dog', muscles: 'Hamstrings & Spine' },
      ],
      Wednesday: [
        { name: 'Warrior II', type: 'yoga', duration: 45, poseId: 'Warrior II', muscles: 'Quads & Shoulders' },
        { name: 'Triangle Pose', type: 'yoga', duration: 45, poseId: 'Triangle Pose', muscles: 'Hamstrings & Obliques' },
      ],
      Friday: [
        { name: 'Cobra Pose', type: 'yoga', duration: 45, poseId: 'Cobra Pose', muscles: 'Spine & Chest' },
        { name: 'Child\'s Pose', type: 'yoga', duration: 60, poseId: 'Child\'s Pose', muscles: 'Back & Restorative' },
      ],
    },
  },
  {
    id: 'hypertrophy',
    name: '🔥 Full Body Strength (Gym)',
    desc: 'Foundational compound resistance tracking & rep counting',
    schedule: {
      Monday: [
        { name: 'Squat', type: 'gym', sets: 4, reps: 12, gymId: 'SQUAT', muscles: 'Quads & Glutes' },
        { name: 'Push-up', type: 'gym', sets: 3, reps: 15, gymId: 'PUSHUP', muscles: 'Chest & Triceps' },
      ],
      Wednesday: [
        { name: 'Bicep Curl', type: 'gym', sets: 3, reps: 12, gymId: 'BICEP_CURL', muscles: 'Biceps & Forearms' },
        { name: 'Shoulder Press', type: 'gym', sets: 3, reps: 10, gymId: 'SHOULDER_PRESS', muscles: 'Deltoids' },
      ],
      Friday: [
        { name: 'Lunge', type: 'gym', sets: 3, reps: 12, gymId: 'LUNGE', muscles: 'Quads & Glutes' },
        { name: 'Plank', type: 'gym', sets: 3, reps: 45, gymId: 'PLANK', muscles: 'Core Stability' },
      ],
    },
  },
  {
    id: 'calisthenics',
    name: '⚡ Quick HIIT & Calisthenics',
    desc: 'High-energy bodyweight rep burning & cardio endurance',
    schedule: {
      Tuesday: [
        { name: 'Push-up', type: 'gym', sets: 3, reps: 15, gymId: 'PUSHUP', muscles: 'Upper Body' },
        { name: 'Squat', type: 'gym', sets: 3, reps: 20, gymId: 'SQUAT', muscles: 'Legs' },
        { name: 'Jumping Jacks', type: 'gym', sets: 3, reps: 30, gymId: 'JUMPING_JACKS', muscles: 'Cardio' },
      ],
      Thursday: [
        { name: 'High Knees', type: 'gym', sets: 3, reps: 30, gymId: 'HIGH_KNEES', muscles: 'Cardio & Core' },
        { name: 'Plank', type: 'gym', sets: 3, reps: 60, gymId: 'PLANK', muscles: 'Core' },
      ],
      Saturday: [
        { name: 'Push-up', type: 'gym', sets: 3, reps: 15, gymId: 'PUSHUP', muscles: 'Chest' },
        { name: 'Crunches', type: 'gym', sets: 3, reps: 25, gymId: 'CRUNCHES', muscles: 'Abs' },
      ],
    },
  },
  {
    id: 'zen',
    name: '🧘 Spine & Core Restoration',
    desc: 'Deep restorative asanas, spinal twisting & hip release',
    schedule: {
      Tuesday: [
        { name: 'Cat Pose', type: 'yoga', duration: 45, poseId: 'Cat Pose', muscles: 'Spine Flexibility' },
        { name: 'Cow Pose', type: 'yoga', duration: 45, poseId: 'Cow Pose', muscles: 'Spine Extension' },
        { name: 'Child\'s Pose', type: 'yoga', duration: 60, poseId: 'Child\'s Pose', muscles: 'Lower Back' },
      ],
      Thursday: [
        { name: 'Bridge Pose', type: 'yoga', duration: 45, poseId: 'Bridge Pose', muscles: 'Glutes & Spine' },
        { name: 'Boat Pose', type: 'yoga', duration: 30, poseId: 'Boat Pose', muscles: 'Deep Core' },
      ],
      Sunday: [
        { name: 'Shoulderstand', type: 'yoga', duration: 45, poseId: 'Shoulderstand', muscles: 'Inversion & Circulation' },
        { name: 'Pigeon Pose', type: 'yoga', duration: 60, poseId: 'Pigeon Pose', muscles: 'Deep Hip Flexor' },
      ],
    },
  },
]

export default function WorkoutPlanner() {
  const [weeklyPlan, setWeeklyPlan] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  })

  const [userGoals, setUserGoals] = useState({
    calorieGoal: 2200,
    weeklyWorkouts: 5,
    favoriteExercises: [],
  })

  const [completedItems, setCompletedItems] = useState({})
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const [newExercise, setNewExercise] = useState({
    name: 'Tree Pose',
    type: 'yoga',
    poseId: 'Tree',
    gymId: 'SQUAT',
    sets: 3,
    reps: 12,
    duration: 45,
    muscles: 'Balance & Core',
  })

  const gymExerciseList = useMemo(() => {
    return Object.values(EXERCISE_PATTERNS).map((item) => ({
      id: item.id,
      name: item.name,
      muscles: item.targetMuscle,
    }))
  }, [])

  const yogaPoseList = useMemo(() => {
    return YOGA_POSES.map((pose) => ({
      id: pose.id,
      name: pose.name,
      sanskrit: pose.sanskrit,
      muscles: (pose.targetMuscles || []).join(', '),
    }))
  }, [])

  // Show auto-dismissing toast
  const triggerToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getUserPreferences()
        if (prefs) {
          if (prefs.weeklyPlan) setWeeklyPlan(prefs.weeklyPlan)
          if (prefs.userGoals) setUserGoals(prefs.userGoals)
          if (prefs.completedItems) setCompletedItems(prefs.completedItems)
        }
      } catch (err) {
        console.error('Error loading preferences:', err)
      }
    }
    loadPreferences()
  }, [])

  // Apply a smart preset routine
  const applyPreset = async (preset) => {
    const updated = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    }

    Object.keys(preset.schedule).forEach((day) => {
      updated[day] = preset.schedule[day].map((item, idx) => ({
        ...item,
        id: `${Date.now()}_${day}_${idx}`,
      }))
    })

    setWeeklyPlan(updated)
    await saveUserPreferences({ weeklyPlan: updated, userGoals, completedItems })
    triggerToast(`✨ Applied "${preset.name}" to your weekly schedule!`)
  }

  // Add exercise to selected day
  const addExerciseToDay = async () => {
    if (!newExercise.name) return

    const exerciseToAdd = {
      ...newExercise,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    }

    const updated = {
      ...weeklyPlan,
      [selectedDay]: [...(weeklyPlan[selectedDay] || []), exerciseToAdd],
    }

    setWeeklyPlan(updated)
    await saveUserPreferences({ weeklyPlan: updated, userGoals, completedItems })
    setShowAddExercise(false)
    triggerToast(`Added ${newExercise.name} to ${selectedDay}!`)
  }

  // Remove exercise from day
  const removeExerciseFromDay = async (day, id) => {
    const updated = {
      ...weeklyPlan,
      [day]: weeklyPlan[day].filter((ex) => ex.id !== id),
    }

    setWeeklyPlan(updated)
    await saveUserPreferences({ weeklyPlan: updated, userGoals, completedItems })
    triggerToast('Exercise removed from schedule.')
  }

  // Toggle exercise completion check
  const toggleComplete = async (id) => {
    const updated = {
      ...completedItems,
      [id]: !completedItems[id],
    }
    setCompletedItems(updated)
    await saveUserPreferences({ weeklyPlan, userGoals, completedItems: updated })
  }

  // Save modified goals
  const updateGoals = async () => {
    await saveUserPreferences({ weeklyPlan, userGoals, completedItems })
    triggerToast('Weekly goals updated successfully! ✅')
  }

  // Aggregate metrics
  const totalExercises = useMemo(() => {
    return Object.values(weeklyPlan).reduce((sum, day) => sum + (day ? day.length : 0), 0)
  }, [weeklyPlan])

  const completedCount = useMemo(() => {
    let count = 0
    Object.values(weeklyPlan).forEach((dayList) => {
      (dayList || []).forEach((item) => {
        if (completedItems[item.id]) count++
      })
    })
    return count
  }, [weeklyPlan, completedItems])

  const completionPct = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0

  return (
    <div className="workout-planner-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="planner-toast">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="planner-header">
        <div className="studio-eyebrow">Smart AI Scheduling</div>
        <h1>📅 Weekly Workout & Movement Planner</h1>
        <p>
          Organize your 28 yoga postures and 10 gym movements across the week. Launch practice directly from your calendar.
        </p>
      </header>

      {/* Presets Bar */}
      <section className="presets-section glass-card">
        <div className="presets-header">
          <span className="presets-title">⚡ Instant Smart Routine Presets:</span>
          <span className="presets-sub">Click any preset to auto-populate your entire week</span>
        </div>
        <div className="presets-buttons-grid">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="preset-btn"
              onClick={() => applyPreset(p)}
              title={p.desc}
            >
              <span className="preset-name">{p.name}</span>
              <span className="preset-desc">{p.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Weekly Progress & Telemetry Strip */}
      <section className="planner-stats-strip">
        <div className="stat-box glass-card">
          <div className="stat-number">{totalExercises}</div>
          <div className="stat-label">Planned Exercises</div>
        </div>
        <div className="stat-box glass-card">
          <div className="stat-number" style={{ color: '#10b981' }}>{completedCount}</div>
          <div className="stat-label">Completed This Week</div>
        </div>
        <div className="stat-box glass-card">
          <div className="stat-number" style={{ color: '#38bdf8' }}>{completionPct}%</div>
          <div className="stat-label">Adherence Rate</div>
        </div>
        <div className="stat-box glass-card">
          <div className="stat-number" style={{ color: '#a78bfa' }}>
            {Object.values(weeklyPlan).filter((d) => d && d.length > 0).length} / 7
          </div>
          <div className="stat-label">Active Training Days</div>
        </div>
      </section>

      {/* Goals Card */}
      <section className="goals-section glass-card">
        <h2>🎯 Calorie & Volume Targets</h2>
        <div className="goals-grid">
          <div className="goal-card">
            <label htmlFor="calorie-goal">Daily Calorie Target</label>
            <div className="input-group">
              <input
                id="calorie-goal"
                type="number"
                value={userGoals.calorieGoal}
                onChange={(e) => setUserGoals({ ...userGoals, calorieGoal: parseInt(e.target.value) || 2000 })}
                min="1000"
                max="5000"
              />
              <span>kcal</span>
            </div>
          </div>

          <div className="goal-card">
            <label htmlFor="weekly-workouts">Target Active Days</label>
            <div className="input-group">
              <input
                id="weekly-workouts"
                type="number"
                value={userGoals.weeklyWorkouts}
                onChange={(e) => setUserGoals({ ...userGoals, weeklyWorkouts: parseInt(e.target.value) || 5 })}
                min="1"
                max="7"
              />
              <span>days / week</span>
            </div>
          </div>

          <button type="button" className="btn-save btn-primary-glow" onClick={updateGoals}>
            💾 Save Targets
          </button>
        </div>
      </section>

      {/* Weekly Schedule Grid */}
      <section className="weekly-plan">
        <div className="section-title-row">
          <h2>Weekly Schedule</h2>
          <span className="schedule-hint">Click "+ Add Exercise" or hit "🚀 Start" to jump into live camera studio</span>
        </div>

        <div className="week-grid">
          {DAYS.map((day) => {
            const dayExercises = weeklyPlan[day] || []
            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day

            return (
              <div key={day} className={`day-card glass-card ${isToday ? 'current-day' : ''}`}>
                <div className="day-card-header">
                  <div>
                    <h3>{day}</h3>
                    {isToday && <span className="today-badge">TODAY</span>}
                  </div>
                  <span className="exercise-count-tag">{dayExercises.length} items</span>
                </div>

                <div className="exercises-list">
                  {dayExercises.length === 0 ? (
                    <div className="no-exercises">
                      <span>🛋️</span>
                      <p>Rest & Recovery Day</p>
                    </div>
                  ) : (
                    dayExercises.map((ex) => {
                      const isDone = completedItems[ex.id]
                      const launchUrl = ex.type === 'yoga'
                        ? `/start?pose=${encodeURIComponent(ex.poseId || ex.name)}`
                        : `/gym?exercise=${encodeURIComponent(ex.gymId || ex.name)}`

                      return (
                        <div
                          key={ex.id}
                          className={`exercise-item ${ex.type} ${isDone ? 'completed' : ''}`}
                        >
                          <button
                            type="button"
                            className={`complete-checkbox ${isDone ? 'checked' : ''}`}
                            onClick={() => toggleComplete(ex.id)}
                            title="Mark completed"
                          >
                            {isDone ? '✓' : ''}
                          </button>

                          <div className="exercise-info">
                            <div className="exercise-name-row">
                              <span className="exercise-type-tag">{ex.type === 'yoga' ? '🧘' : '💪'}</span>
                              <span className={`exercise-name ${isDone ? 'line-through' : ''}`}>
                                {ex.name}
                              </span>
                            </div>
                            <span className="exercise-details">
                              {ex.type === 'gym'
                                ? `${ex.sets} sets × ${ex.reps} reps`
                                : `${ex.duration}s hold`}
                              {ex.muscles ? ` · ${ex.muscles}` : ''}
                            </span>
                          </div>

                          <div className="exercise-actions">
                            <Link to={launchUrl} className="btn-launch-pill" title="Launch practice now">
                              🚀
                            </Link>
                            <button
                              type="button"
                              className="btn-remove"
                              onClick={() => removeExerciseFromDay(day, ex.id)}
                              title="Delete from plan"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <button
                  type="button"
                  className="btn-add-exercise"
                  onClick={() => {
                    setSelectedDay(day)
                    setShowAddExercise(true)
                  }}
                >
                  + Add Exercise
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Add Exercise Modal */}
      {showAddExercise && (
        <div className="modal-overlay" onClick={() => setShowAddExercise(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Movement to {selectedDay}</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddExercise(false)}
              >
                ✕
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="exercise-type">Training Discipline:</label>
              <select
                id="exercise-type"
                className="select-dark"
                value={newExercise.type}
                onChange={(e) => {
                  const type = e.target.value
                  if (type === 'yoga') {
                    const first = yogaPoseList[0]
                    setNewExercise({
                      ...newExercise,
                      type: 'yoga',
                      name: first.name,
                      poseId: first.id,
                      muscles: first.muscles,
                      duration: 45,
                    })
                  } else {
                    const first = gymExerciseList[0]
                    setNewExercise({
                      ...newExercise,
                      type: 'gym',
                      name: first.name,
                      gymId: first.id,
                      muscles: first.muscles,
                      sets: 3,
                      reps: 12,
                    })
                  }
                }}
              >
                <option value="yoga">🧘 Movement & Yoga (28 Postures)</option>
                <option value="gym">💪 Gym AI Strength (10 Exercises)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="exercise-name">Select Movement:</label>
              <select
                id="exercise-name"
                className="select-dark"
                value={newExercise.name}
                onChange={(e) => {
                  const name = e.target.value
                  if (newExercise.type === 'yoga') {
                    const match = yogaPoseList.find((p) => p.name === name)
                    setNewExercise({
                      ...newExercise,
                      name,
                      poseId: match ? match.id : name,
                      muscles: match ? match.muscles : '',
                    })
                  } else {
                    const match = gymExerciseList.find((p) => p.name === name)
                    setNewExercise({
                      ...newExercise,
                      name,
                      gymId: match ? match.id : name,
                      muscles: match ? match.muscles : '',
                    })
                  }
                }}
              >
                {newExercise.type === 'yoga'
                  ? yogaPoseList.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.sanskrit})
                      </option>
                    ))
                  : gymExerciseList.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name} — {g.muscles}
                      </option>
                    ))}
              </select>
            </div>

            {newExercise.type === 'gym' ? (
              <div className="modal-input-row">
                <div className="form-group">
                  <label htmlFor="sets">Sets:</label>
                  <input
                    id="sets"
                    className="input-dark"
                    type="number"
                    value={newExercise.sets}
                    onChange={(e) =>
                      setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 1 })
                    }
                    min="1"
                    max="10"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reps">Reps per set:</label>
                  <input
                    id="reps"
                    className="input-dark"
                    type="number"
                    value={newExercise.reps}
                    onChange={(e) =>
                      setNewExercise({ ...newExercise, reps: parseInt(e.target.value) || 1 })
                    }
                    min="1"
                    max="50"
                  />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="duration">Target Hold Duration (seconds):</label>
                <input
                  id="duration"
                  className="input-dark"
                  type="number"
                  value={newExercise.duration}
                  onChange={(e) =>
                    setNewExercise({ ...newExercise, duration: parseInt(e.target.value) || 10 })
                  }
                  min="10"
                  max="300"
                  step="5"
                />
              </div>
            )}

            <div className="modal-buttons">
              <button
                type="button"
                className="btn-primary-glow"
                onClick={addExerciseToDay}
              >
                ✓ Add to {selectedDay}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowAddExercise(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
