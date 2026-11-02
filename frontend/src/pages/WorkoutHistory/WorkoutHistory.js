import React, { useEffect, useState } from 'react'
import { getYogaHistory, getGymWorkoutHistory } from '../../utils/storage'
import './WorkoutHistory.css'

const WorkoutHistoryPage = () => {
  const [yogaSessions, setYogaSessions] = useState([])
  const [gymWorkouts, setGymWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [yoga, gym] = await Promise.all([
          getYogaHistory(),
          getGymWorkoutHistory(),
        ])
        setYogaSessions(yoga || [])
        setGymWorkouts(gym || [])
        setLoading(false)
      } catch (err) {
        console.error('Error loading workout history:', err)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  /**
   * Combine and filter workouts
   */
  const getFilteredWorkouts = () => {
    let workouts = []

    if (filterType === 'all' || filterType === 'yoga') {
      workouts = workouts.concat(
        yogaSessions.map(s => ({
          ...s,
          type: 'yoga',
          displayName: s.poseName,
          displayDuration: `${s.duration}s`,
          displayReps: '—',
          displaySets: '—',
        }))
      )
    }

    if (filterType === 'all' || filterType === 'gym') {
      workouts = workouts.concat(
        gymWorkouts.map(w => ({
          ...w,
          type: 'gym',
          displayName: w.exerciseName,
          displayDuration: `${Math.floor(w.duration / 60)}m ${w.duration % 60}s`,
          displayReps: w.reps,
          displaySets: w.sets,
        }))
      )
    }

    // Sort
    if (sortBy === 'date') {
      workouts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    } else if (sortBy === 'name') {
      workouts.sort((a, b) => a.displayName.localeCompare(b.displayName))
    } else if (sortBy === 'duration') {
      const getDuration = w => w.duration || 0
      workouts.sort((a, b) => getDuration(b) - getDuration(a))
    }

    return workouts
  }

  /**
   * Get statistics
   */
  const getStats = () => {
    const filtered = getFilteredWorkouts()
    const totalWorkouts = filtered.length
    const totalTime = filtered.reduce((sum, w) => sum + (w.duration || 0), 0)
    const avgDuration = totalWorkouts > 0 ? Math.round(totalTime / totalWorkouts) : 0

    return { totalWorkouts, totalTime, avgDuration }
  }

  /**
   * Format date and time
   */
  const formatDateTime = dateStr => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let dateStr_ = ''
    if (date.toDateString() === today.toDateString()) {
      dateStr_ = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateStr_ = 'Yesterday'
    } else {
      dateStr_ = date.toLocaleDateString()
    }

    return `${dateStr_} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  /**
   * Format time
   */
  const formatTime = seconds => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  if (loading) {
    return (
      <div className="workout-history-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading workout history...</p>
        </div>
      </div>
    )
  }

  const filtered = getFilteredWorkouts()
  const stats = getStats()

  return (
    <div className="workout-history-container">
      <header className="history-header">
        <h1>📋 Workout History</h1>
        <p>Your complete fitness record</p>
      </header>

      {/* Statistics */}
      <section className="history-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <p className="stat-label">Total Workouts</p>
            <p className="stat-value">{stats.totalWorkouts}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div>
            <p className="stat-label">Total Time</p>
            <p className="stat-value">{formatTime(stats.totalTime)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div>
            <p className="stat-label">Average Duration</p>
            <p className="stat-value">{formatTime(stats.avgDuration)}</p>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="history-controls">
        <div className="control-group">
          <label htmlFor="filter">Filter:</label>
          <select
            id="filter"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="all">All Workouts</option>
            <option value="yoga">Yoga Only</option>
            <option value="gym">Gym Only</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="sort">Sort by:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="date">Date (Newest First)</option>
            <option value="name">Name (A-Z)</option>
            <option value="duration">Duration (Longest First)</option>
          </select>
        </div>
      </section>

      {/* Workouts List */}
      <section className="workouts-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No workouts found. Start training to see your history!</p>
          </div>
        ) : (
          <div className="workouts-table">
            <div className="table-header">
              <div className="col-type">Type</div>
              <div className="col-name">Workout</div>
              <div className="col-duration">Duration</div>
              <div className="col-reps">Reps</div>
              <div className="col-sets">Sets</div>
              <div className="col-date">Date & Time</div>
              <div className="col-calories">Calories</div>
            </div>

            {filtered.map((workout, idx) => (
              <div key={idx} className={`table-row ${workout.type}`}>
                <div className="col-type">
                  <span className="type-badge">
                    {workout.type === 'yoga' ? '🧘 Yoga' : '💪 Gym'}
                  </span>
                </div>
                <div className="col-name">{workout.displayName}</div>
                <div className="col-duration">{workout.displayDuration}</div>
                <div className="col-reps">{workout.displayReps}</div>
                <div className="col-sets">{workout.displaySets}</div>
                <div className="col-date">{formatDateTime(workout.timestamp)}</div>
                <div className="col-calories">
                  {workout.caloriesBurned ? `${workout.caloriesBurned}` : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default WorkoutHistoryPage
