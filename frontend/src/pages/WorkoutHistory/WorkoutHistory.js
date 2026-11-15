import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getYogaHistory,
  getGymWorkoutHistory,
  deleteGymWorkout,
  deleteYogaSession,
  clearAllWorkoutHistory,
} from '../../utils/storage'
import './WorkoutHistory.css'

const EXERCISE_ICONS = {
  SQUAT: '🏋️',
  PUSHUP: '📌',
  BICEP_CURL: '💪',
  JUMPING_JACKS: '⚡',
  LUNGE: '🦵',
  SHOULDER_PRESS: '🏋️‍♂️',
  LATERAL_RAISE: '🦅',
  PLANK: '🧘',
  CRUNCHES: '🔥',
  HIGH_KNEES: '🏃',
  Squat: '🏋️',
  'Push-up': '📌',
  'Bicep Curl': '💪',
  'Jumping Jacks': '⚡',
  Lunge: '🦵',
  'Shoulder Press': '🏋️‍♂️',
  'Lateral Raise': '🦅',
  Plank: '🧘',
  Crunches: '🔥',
  'High Knees': '🏃',
  defaultGym: '💪',
  defaultYoga: '🧘',
}

const MUSCLE_GROUPS = {
  SQUAT: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
  PUSHUP: ['Chest (Pectorals)', 'Triceps', 'Anterior Deltoids', 'Core'],
  BICEP_CURL: ['Biceps Brachii', 'Brachialis', 'Forearms'],
  JUMPING_JACKS: ['Cardiovascular', 'Calves', 'Deltoids'],
  LUNGE: ['Quadriceps', 'Gluteus Maximus', 'Hamstrings'],
  SHOULDER_PRESS: ['Anterior/Lateral Deltoids', 'Triceps', 'Upper Trapezius'],
  LATERAL_RAISE: ['Lateral Deltoids', 'Supraspinatus'],
  PLANK: ['Transverse Abdominis', 'Rectus Abdominis', 'Spinal Erectors'],
  CRUNCHES: ['Rectus Abdominis', 'Obliques'],
  HIGH_KNEES: ['Hip Flexors', 'Quadriceps', 'Cardiovascular'],
  Yoga: ['Full Body Flexibility', 'Balance', 'Spine Mobility', 'Core Stability'],
}

const WorkoutHistoryPage = () => {
  const [yogaSessions, setYogaSessions] = useState([])
  const [gymWorkouts, setGymWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all') // 'all' | 'gym' | 'yoga'
  const [sortBy, setSortBy] = useState('date_desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('all') // 'all' | 'week' | 'month'
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = msg => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Load data from IndexedDB
  const loadData = async () => {
    try {
      setLoading(true)
      const [yoga, gym] = await Promise.all([getYogaHistory(100), getGymWorkoutHistory(null, 100)])
      setYogaSessions(yoga || [])
      setGymWorkouts(gym || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading workout history:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Resolve workout name with fallbacks for legacy records
  const resolveWorkoutTitle = w => {
    if (w.exerciseName && w.exerciseName.trim()) return w.exerciseName
    if (w.exercise && typeof w.exercise === 'string' && w.exercise.trim()) return w.exercise
    if (w.exerciseType) {
      if (w.exerciseType === 'SQUAT') return 'Squats'
      if (w.exerciseType === 'PUSHUP') return 'Push-ups'
      if (w.exerciseType === 'BICEP_CURL') return 'Bicep Curls'
      return w.exerciseType
    }
    if (w.poseName && w.poseName.trim()) return w.poseName
    if (w.pose && typeof w.pose === 'string' && w.pose.trim()) return w.pose
    return w.type === 'yoga' ? 'Mindful Yoga Flow' : 'Strength Session'
  }

  // Calculate or fallback calories
  const resolveCalories = w => {
    if (w.caloriesBurned && Number(w.caloriesBurned) > 0) return Math.round(w.caloriesBurned)
    const duration = Number(w.duration) || 0
    const reps = Number(w.reps) || 0
    if (w.type === 'yoga') {
      return Math.max(10, Math.round(duration * 0.08 + 12))
    }
    return Math.max(12, Math.round(reps * 5 + duration * 0.35))
  }

  // Combine workouts into normalized array
  const allWorkouts = useMemo(() => {
    const list = []

    // 1. Gym workouts
    gymWorkouts.forEach(w => {
      const name = resolveWorkoutTitle(w)
      const cals = resolveCalories(w)
      list.push({
        ...w,
        id: w.id,
        type: 'gym',
        displayName: name,
        duration: Number(w.duration) || 0,
        reps: Number(w.reps) || 0,
        sets: Number(w.sets) || 1,
        caloriesBurned: cals,
        timestamp: w.timestamp || new Date().toISOString(),
        icon: EXERCISE_ICONS[w.exerciseType] || EXERCISE_ICONS[w.exercise] || EXERCISE_ICONS.defaultGym,
      })
    })

    // 2. Yoga sessions
    yogaSessions.forEach(s => {
      const name = resolveWorkoutTitle(s)
      const cals = resolveCalories({ ...s, type: 'yoga' })
      list.push({
        ...s,
        id: s.id,
        type: 'yoga',
        displayName: name,
        duration: Number(s.duration) || 0,
        reps: 0,
        sets: 1,
        caloriesBurned: cals,
        timestamp: s.timestamp || new Date().toISOString(),
        icon: EXERCISE_ICONS.defaultYoga,
      })
    })

    return list
  }, [gymWorkouts, yogaSessions])

  // Filter and sort workouts
  const filteredWorkouts = useMemo(() => {
    let list = [...allWorkouts]

    // Type filter
    if (filterType !== 'all') {
      list = list.filter(w => w.type === filterType)
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        w =>
          w.displayName.toLowerCase().includes(q) ||
          w.type.toLowerCase().includes(q)
      )
    }

    // Date range filter
    const now = new Date().getTime()
    if (dateRange === 'week') {
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
      list = list.filter(w => new Date(w.timestamp).getTime() >= oneWeekAgo)
    } else if (dateRange === 'month') {
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000
      list = list.filter(w => new Date(w.timestamp).getTime() >= oneMonthAgo)
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.timestamp) - new Date(a.timestamp)
      if (sortBy === 'date_asc') return new Date(a.timestamp) - new Date(b.timestamp)
      if (sortBy === 'duration_desc') return b.duration - a.duration
      if (sortBy === 'calories_desc') return b.caloriesBurned - a.caloriesBurned
      if (sortBy === 'reps_desc') return b.reps - a.reps
      if (sortBy === 'name_asc') return a.displayName.localeCompare(b.displayName)
      return 0
    })

    return list
  }, [allWorkouts, filterType, searchQuery, dateRange, sortBy])

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalWorkouts = allWorkouts.length
    const totalTime = allWorkouts.reduce((sum, w) => sum + w.duration, 0)
    const totalCalories = allWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0)
    const totalReps = allWorkouts.reduce((sum, w) => sum + w.reps, 0)
    const avgDuration = totalWorkouts > 0 ? Math.round(totalTime / totalWorkouts) : 0

    const gymCount = allWorkouts.filter(w => w.type === 'gym').length
    const yogaCount = allWorkouts.filter(w => w.type === 'yoga').length

    return {
      totalWorkouts,
      totalTime,
      totalCalories,
      totalReps,
      avgDuration,
      gymCount,
      yogaCount,
    }
  }, [allWorkouts])

  // Delete single workout
  const handleDeleteWorkout = async (e, workout) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${workout.displayName}" from your history?`)) return

    try {
      if (workout.type === 'gym' && workout.id) {
        await deleteGymWorkout(workout.id)
      } else if (workout.type === 'yoga' && workout.id) {
        await deleteYogaSession(workout.id)
      }
      showToast('Workout entry deleted.')
      if (selectedWorkout?.id === workout.id) setSelectedWorkout(null)
      await loadData()
    } catch (err) {
      console.error('Error deleting workout:', err)
      showToast('Could not delete workout.')
    }
  }

  // Clear all history
  const handleClearAll = async () => {
    if (allWorkouts.length === 0) return
    if (!window.confirm('Are you sure you want to permanently clear your complete workout history?')) {
      return
    }

    try {
      await clearAllWorkoutHistory()
      showToast('All workout history has been cleared.')
      setSelectedWorkout(null)
      await loadData()
    } catch (err) {
      console.error('Error clearing history:', err)
      showToast('Could not clear history.')
    }
  }

  // Export history to CSV
  const handleExportCSV = () => {
    if (allWorkouts.length === 0) {
      showToast('No workouts to export.')
      return
    }

    const headers = ['Type', 'Workout Name', 'Duration (seconds)', 'Reps', 'Sets', 'Calories Burned (kcal)', 'Date & Time']
    const rows = allWorkouts.map(w => [
      w.type.toUpperCase(),
      `"${w.displayName}"`,
      w.duration,
      w.reps,
      w.sets,
      w.caloriesBurned,
      `"${new Date(w.timestamp).toLocaleString()}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `fitvision_workouts_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('📥 Workout records exported to CSV!')
  }

  // Format date and time
  const formatDateTime = dateStr => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let prefix = ''
    if (date.toDateString() === today.toDateString()) {
      prefix = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      prefix = 'Yesterday'
    } else {
      prefix = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${prefix} · ${timeStr}`
  }

  // Format duration nicely
  const formatDuration = seconds => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}s`
    if (secs === 0) return `${mins}m`
    return `${mins}m ${secs}s`
  }

  // 7-Day Consistency Tracker (Last 7 days)
  const last7Days = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' })
      const dateKey = d.toDateString()

      const dayWorkouts = allWorkouts.filter(w => new Date(w.timestamp).toDateString() === dateKey)
      const dayMinutes = Math.round(dayWorkouts.reduce((sum, w) => sum + w.duration, 0) / 60)

      days.push({
        dayName: dayStr,
        count: dayWorkouts.length,
        minutes: dayMinutes,
        hasTrained: dayWorkouts.length > 0,
        isToday: i === 0,
      })
    }
    return days
  }, [allWorkouts])

  return (
    <div className="workout-history-page">
      {toast && <div className="toast-notification">{toast}</div>}

      {/* Header */}
      <header className="history-header">
        <div>
          <p className="history-eyebrow">FITVISION PERFORMANCE RECORD</p>
          <h1 className="history-title">
            📋 Workout <span className="highlight-text">History</span>
          </h1>
          <p className="history-sub">
            Track your reps, calories burned, set consistency, and pose analysis over time
          </p>
        </div>

        <div className="header-actions-row">
          <button type="button" className="btn-export-csv" onClick={handleExportCSV}>
            📥 Export to CSV
          </button>
          {allWorkouts.length > 0 && (
            <button type="button" className="btn-clear-history" onClick={handleClearAll}>
              🧹 Clear All
            </button>
          )}
        </div>
      </header>

      {/* 5 Rich Metric Cards */}
      <section className="history-stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon-wrap icon-workouts">📊</div>
          <div className="stat-info">
            <span className="stat-label">Total Workouts</span>
            <h3 className="stat-number">{stats.totalWorkouts}</h3>
            <span className="stat-sub">{stats.gymCount} Gym · {stats.yogaCount} Yoga</span>
          </div>
        </div>

        <div className="stat-card stat-time">
          <div className="stat-icon-wrap icon-time">⏱️</div>
          <div className="stat-info">
            <span className="stat-label">Total Active Time</span>
            <h3 className="stat-number">{formatDuration(stats.totalTime)}</h3>
            <span className="stat-sub">Across all sessions</span>
          </div>
        </div>

        <div className="stat-card stat-calories">
          <div className="stat-icon-wrap icon-calories">🔥</div>
          <div className="stat-info">
            <span className="stat-label">Calories Burned</span>
            <h3 className="stat-number">{stats.totalCalories}</h3>
            <span className="stat-sub">Estimated energy spent</span>
          </div>
        </div>

        <div className="stat-card stat-reps">
          <div className="stat-icon-wrap icon-reps">🎯</div>
          <div className="stat-info">
            <span className="stat-label">Total Reps Counted</span>
            <h3 className="stat-number">{stats.totalReps}</h3>
            <span className="stat-sub">MoveNet AI verified</span>
          </div>
        </div>

        <div className="stat-card stat-average">
          <div className="stat-icon-wrap icon-average">📈</div>
          <div className="stat-info">
            <span className="stat-label">Average Session</span>
            <h3 className="stat-number">{formatDuration(stats.avgDuration)}</h3>
            <span className="stat-sub">Per workout</span>
          </div>
        </div>
      </section>

      {/* Weekly Consistency & Ratio Banner */}
      <section className="consistency-banner">
        <div className="consistency-left">
          <span className="consistency-label">Weekly Activity Tracker:</span>
          <div className="days-strip">
            {last7Days.map((d, i) => (
              <div key={i} className={`day-chip ${d.hasTrained ? 'trained' : ''} ${d.isToday ? 'today' : ''}`}>
                <span className="day-name">{d.dayName}</span>
                <span className="day-dot"></span>
                <span className="day-stat">{d.hasTrained ? `${d.minutes}m` : '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {stats.totalWorkouts > 0 && (
          <div className="ratio-right">
            <span className="consistency-label">Workout Ratio:</span>
            <div className="ratio-bar-wrap">
              {(() => {
                const gymPct = Math.round((stats.gymCount / stats.totalWorkouts) * 100) || 0
                const yogaPct = 100 - gymPct
                return (
                  <div className="ratio-bar">
                    <div className="ratio-gym" style={{ width: `${gymPct}%` }} title={`Gym: ${gymPct}%`}>
                      {gymPct > 15 && `💪 ${gymPct}%`}
                    </div>
                    <div className="ratio-yoga" style={{ width: `${yogaPct}%` }} title={`Yoga: ${yogaPct}%`}>
                      {yogaPct > 15 && `🧘 ${yogaPct}%`}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </section>

      {/* Search, Filter & Sort Controls */}
      <section className="history-controls-card">
        <div className="controls-left">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="history-search-input"
              placeholder="Search by exercise name (e.g. Squat, Push-up, Bicep Curl)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({allWorkouts.length})
            </button>
            <button
              type="button"
              className={`filter-pill gym-pill ${filterType === 'gym' ? 'active' : ''}`}
              onClick={() => setFilterType('gym')}
            >
              💪 Gym Strength ({stats.gymCount})
            </button>
            <button
              type="button"
              className={`filter-pill yoga-pill ${filterType === 'yoga' ? 'active' : ''}`}
              onClick={() => setFilterType('yoga')}
            >
              🧘 Yoga ({stats.yogaCount})
            </button>
          </div>
        </div>

        <div className="controls-right">
          <div className="select-control">
            <label>Timeframe:</label>
            <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
              <option value="all">All Time</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>

          <div className="select-control">
            <label>Sort By:</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="duration_desc">Longest Duration</option>
              <option value="calories_desc">Most Calories Burned</option>
              <option value="reps_desc">Most Reps</option>
              <option value="name_asc">Name (A–Z)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Table / Empty State */}
      <section className="history-table-section">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your workout history...</p>
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="empty-history-state">
            <div className="empty-history-icon">🏋️‍♂️</div>
            <h3>No workouts matching your filters</h3>
            <p>
              {allWorkouts.length === 0
                ? "You haven't logged any workouts yet. Go to Gym Trainer or Yoga Studio to begin!"
                : 'Try adjusting your search query or switching filters.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <div className="workouts-modern-table">
              <div className="table-head-row">
                <div className="th-cell col-type">TYPE</div>
                <div className="th-cell col-workout">WORKOUT EXERCISE</div>
                <div className="th-cell col-duration">DURATION</div>
                <div className="th-cell col-reps">REPS</div>
                <div className="th-cell col-sets">SETS</div>
                <div className="th-cell col-calories">CALORIES</div>
                <div className="th-cell col-date">DATE & TIME</div>
                <div className="th-cell col-actions">ACTION</div>
              </div>

              <div className="table-body">
                {filteredWorkouts.map((workout, idx) => (
                  <div
                    key={workout.id || idx}
                    className={`table-row-item ${workout.type} ${
                      selectedWorkout?.id === workout.id ? 'active-row' : ''
                    }`}
                    onClick={() => setSelectedWorkout(workout)}
                  >
                    <div className="td-cell col-type">
                      <span className={`type-tag-badge ${workout.type}`}>
                        {workout.type === 'yoga' ? '🧘 Yoga' : '💪 Gym'}
                      </span>
                    </div>

                    <div className="td-cell col-workout">
                      <div className="workout-name-group">
                        <span className="workout-emoji">{workout.icon}</span>
                        <div>
                          <h4 className="workout-main-title">{workout.displayName}</h4>
                          <span className="workout-source-tag">
                            {workout.type === 'gym' ? 'MoveNet Pose Tracker' : 'MediaPipe Yoga AI'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="td-cell col-duration">
                      <span className="duration-badge">{formatDuration(workout.duration)}</span>
                    </div>

                    <div className="td-cell col-reps">
                      {workout.type === 'gym' ? (
                        <span className="reps-number-badge">{workout.reps} reps</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </div>

                    <div className="td-cell col-sets">
                      {workout.type === 'gym' ? (
                        <span className="sets-pill">{workout.sets} {workout.sets === 1 ? 'set' : 'sets'}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </div>

                    <div className="td-cell col-calories">
                      <span className="calories-pill">
                        🔥 <strong>{workout.caloriesBurned}</strong> kcal
                      </span>
                    </div>

                    <div className="td-cell col-date">
                      <span className="date-text">{formatDateTime(workout.timestamp)}</span>
                    </div>

                    <div className="td-cell col-actions" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-view-details"
                        onClick={() => setSelectedWorkout(workout)}
                        title="View detailed workout metrics"
                      >
                        👁️
                      </button>
                      <button
                        type="button"
                        className="btn-row-delete"
                        onClick={e => handleDeleteWorkout(e, workout)}
                        title="Delete workout entry"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Slide-Over Workout Inspection Modal */}
      {selectedWorkout && (
        <div className="modal-backdrop" onClick={() => setSelectedWorkout(null)}>
          <div className="workout-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <span className="modal-icon">{selectedWorkout.icon}</span>
                <div>
                  <h3 className="modal-title">{selectedWorkout.displayName}</h3>
                  <span className="modal-date">{formatDateTime(selectedWorkout.timestamp)}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setSelectedWorkout(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Top Stats Grid */}
              <div className="modal-stats-grid">
                <div className="m-stat-box">
                  <span className="ms-label">Total Duration</span>
                  <strong className="ms-value">{formatDuration(selectedWorkout.duration)}</strong>
                </div>
                <div className="m-stat-box">
                  <span className="ms-label">Calories Burned</span>
                  <strong className="ms-value highlight-fire">{selectedWorkout.caloriesBurned} kcal</strong>
                </div>
                {selectedWorkout.type === 'gym' ? (
                  <>
                    <div className="m-stat-box">
                      <span className="ms-label">Reps Completed</span>
                      <strong className="ms-value">{selectedWorkout.reps} reps</strong>
                    </div>
                    <div className="m-stat-box">
                      <span className="ms-label">Total Sets</span>
                      <strong className="ms-value">{selectedWorkout.sets}</strong>
                    </div>
                  </>
                ) : (
                  <div className="m-stat-box">
                    <span className="ms-label">Confidence</span>
                    <strong className="ms-value">{(Number(selectedWorkout.confidence || 0.95) * 100).toFixed(0)}%</strong>
                  </div>
                )}
              </div>

              {/* Muscles Targeted */}
              <div className="targeted-muscles-card">
                <h4 className="muscles-heading">Targeted Muscle Groups</h4>
                <div className="muscles-tags">
                  {(MUSCLE_GROUPS[selectedWorkout.exerciseType] ||
                    MUSCLE_GROUPS[selectedWorkout.displayName] ||
                    MUSCLE_GROUPS.Yoga
                  ).map((m, i) => (
                    <span key={i} className="muscle-pill">
                      💪 {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Training Tips & Insights */}
              <div className="training-insights-card">
                <h4 className="insights-heading">Coach AI Feedback</h4>
                <p className="insights-text">
                  {selectedWorkout.reps > 0
                    ? `Great job completing ${selectedWorkout.reps} reps across ${selectedWorkout.sets} set(s). Steady tempo maintained with accurate joint range-of-motion.`
                    : 'Consistent workout session recorded. Ensure you hit parallel depth on squats and maintain a tight core throughout.'}
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <Link
                to={
                  selectedWorkout.type === 'gym'
                    ? `/gym?exercise=${encodeURIComponent(selectedWorkout.exerciseType || selectedWorkout.displayName)}`
                    : `/start?pose=${encodeURIComponent(selectedWorkout.poseId || selectedWorkout.displayName)}`
                }
                className="btn-modal-relaunch"
              >
                🚀 Repeat This Session
              </Link>
              <button
                type="button"
                className="btn-modal-delete"
                onClick={e => handleDeleteWorkout(e, selectedWorkout)}
              >
                Delete Workout Record
              </button>
              <button
                type="button"
                className="btn-modal-done"
                onClick={() => setSelectedWorkout(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutHistoryPage
