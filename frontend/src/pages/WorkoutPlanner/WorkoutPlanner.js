import React, { useState, useEffect } from 'react'
import { saveUserPreferences, getUserPreferences } from '../../utils/storage'
import './WorkoutPlanner.css'

const WorkoutPlanner = () => {
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
    calorieGoal: 2000,
    weeklyWorkouts: 5,
    favoriteExercises: [],
  })

  const [selectedDay, setSelectedDay] = useState('Monday')
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [newExercise, setNewExercise] = useState({
    name: 'Squat',
    sets: 3,
    reps: 12,
    duration: 30,
    type: 'gym',
  })

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const yogaPoses = ['Tree', 'Chair', 'Cobra', 'Warrior', 'Dog', 'Shoulderstand', 'Triangle']
  const gymExercises = ['Squat', 'Push-up', 'Bicep Curl', 'Lunge', 'Shoulder Press', 'Deadlift']

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getUserPreferences()
        if (prefs) {
          if (prefs.weeklyPlan) setWeeklyPlan(prefs.weeklyPlan)
          if (prefs.userGoals) setUserGoals(prefs.userGoals)
        }
      } catch (err) {
        console.error('Error loading preferences:', err)
      }
    }
    loadPreferences()
  }, [])

  /**
   * Add exercise to day
   */
  const addExerciseToDay = async () => {
    if (!newExercise.name) return

    const updated = {
      ...weeklyPlan,
      [selectedDay]: [...weeklyPlan[selectedDay], { ...newExercise, id: Date.now() }],
    }

    setWeeklyPlan(updated)
    await saveUserPreferences({ weeklyPlan: updated, userGoals })
    setNewExercise({
      name: 'Squat',
      sets: 3,
      reps: 12,
      duration: 30,
      type: 'gym',
    })
    setShowAddExercise(false)
  }

  /**
   * Remove exercise from day
   */
  const removeExerciseFromDay = async (day, id) => {
    const updated = {
      ...weeklyPlan,
      [day]: weeklyPlan[day].filter(ex => ex.id !== id),
    }

    setWeeklyPlan(updated)
    await saveUserPreferences({ weeklyPlan: updated, userGoals })
  }

  /**
   * Update goals
   */
  const updateGoals = async () => {
    await saveUserPreferences({ weeklyPlan, userGoals })
  }

  /**
   * Get total exercises for week
   */
  const getTotalExercises = () => {
    return Object.values(weeklyPlan).reduce((sum, day) => sum + day.length, 0)
  }

  /**
   * Get exercises by type
   */
  const getExercisesByType = type => {
    let count = 0
    Object.values(weeklyPlan).forEach(day => {
      count += day.filter(ex => ex.type === type).length
    })
    return count
  }

  return (
    <div className="workout-planner-container">
      <header className="planner-header">
        <h1>📅 Workout Planner</h1>
        <p>Plan your weekly fitness routine</p>
      </header>

      {/* Goals Section */}
      <section className="goals-section">
        <h2>Weekly Goals</h2>
        <div className="goals-grid">
          <div className="goal-card">
            <label htmlFor="calorie-goal">Daily Calorie Goal</label>
            <div className="input-group">
              <input
                id="calorie-goal"
                type="number"
                value={userGoals.calorieGoal}
                onChange={e => setUserGoals({ ...userGoals, calorieGoal: parseInt(e.target.value) })}
                min="1000"
                max="5000"
              />
              <span>cal</span>
            </div>
          </div>

          <div className="goal-card">
            <label htmlFor="weekly-workouts">Weekly Workouts</label>
            <div className="input-group">
              <input
                id="weekly-workouts"
                type="number"
                value={userGoals.weeklyWorkouts}
                onChange={e => setUserGoals({ ...userGoals, weeklyWorkouts: parseInt(e.target.value) })}
                min="1"
                max="7"
              />
              <span>days</span>
            </div>
          </div>

          <button className="btn-save" onClick={updateGoals}>
            ✅ Save Goals
          </button>
        </div>
      </section>

      {/* Statistics */}
      <section className="planner-stats">
        <div className="stat-box">
          <div className="stat-number">{getTotalExercises()}</div>
          <div className="stat-label">Total Exercises</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{getExercisesByType('yoga')}</div>
          <div className="stat-label">Yoga Sessions</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{getExercisesByType('gym')}</div>
          <div className="stat-label">Gym Workouts</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{Object.values(weeklyPlan).filter(day => day.length > 0).length}</div>
          <div className="stat-label">Active Days</div>
        </div>
      </section>

      {/* Weekly Plan */}
      <section className="weekly-plan">
        <h2>Weekly Schedule</h2>
        <div className="week-grid">
          {days.map(day => (
            <div key={day} className="day-card">
              <h3>{day}</h3>
              <div className="exercises-list">
                {weeklyPlan[day].length === 0 ? (
                  <p className="no-exercises">Rest day</p>
                ) : (
                  weeklyPlan[day].map(ex => (
                    <div key={ex.id} className={`exercise-item ${ex.type}`}>
                      <div className="exercise-info">
                        <p className="exercise-name">{ex.name}</p>
                        <p className="exercise-details">
                          {ex.type === 'gym'
                            ? `${ex.sets} × ${ex.reps} reps`
                            : `${ex.duration}s`}
                        </p>
                      </div>
                      <button
                        className="btn-remove"
                        onClick={() => removeExerciseFromDay(day, ex.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button
                className="btn-add-exercise"
                onClick={() => {
                  setSelectedDay(day)
                  setShowAddExercise(true)
                }}
              >
                + Add Exercise
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Add Exercise Modal */}
      {showAddExercise && (
        <div className="modal-overlay" onClick={() => setShowAddExercise(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Exercise to {selectedDay}</h2>

            <div className="form-group">
              <label htmlFor="exercise-type">Type:</label>
              <select
                id="exercise-type"
                value={newExercise.type}
                onChange={e => {
                  setNewExercise({
                    ...newExercise,
                    type: e.target.value,
                    name: e.target.value === 'yoga' ? yogaPoses[0] : gymExercises[0],
                  })
                }}
              >
                <option value="yoga">🧘 Yoga</option>
                <option value="gym">💪 Gym</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="exercise-name">Exercise:</label>
              <select
                id="exercise-name"
                value={newExercise.name}
                onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
              >
                {(newExercise.type === 'yoga' ? yogaPoses : gymExercises).map(ex => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>

            {newExercise.type === 'gym' && (
              <>
                <div className="form-group">
                  <label htmlFor="sets">Sets:</label>
                  <input
                    id="sets"
                    type="number"
                    value={newExercise.sets}
                    onChange={e => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) })}
                    min="1"
                    max="10"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reps">Reps:</label>
                  <input
                    id="reps"
                    type="number"
                    value={newExercise.reps}
                    onChange={e => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) })}
                    min="1"
                    max="50"
                  />
                </div>
              </>
            )}

            {newExercise.type === 'yoga' && (
              <div className="form-group">
                <label htmlFor="duration">Duration (seconds):</label>
                <input
                  id="duration"
                  type="number"
                  value={newExercise.duration}
                  onChange={e => setNewExercise({ ...newExercise, duration: parseInt(e.target.value) })}
                  min="10"
                  max="300"
                  step="10"
                />
              </div>
            )}

            <div className="modal-buttons">
              <button
                className="btn-primary"
                onClick={addExerciseToDay}
              >
                Add Exercise
              </button>
              <button
                className="btn-secondary"
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

export default WorkoutPlanner
