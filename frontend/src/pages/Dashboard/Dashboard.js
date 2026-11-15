import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getYogaHistory,
  getGymWorkoutHistory,
  getFoodDiary,
  getUserPreference,
  saveUserPreference,
  saveGymWorkout,
  saveYogaSession,
  deleteGymWorkout,
  deleteYogaSession,
} from '../../utils/storage'
import './Dashboard.css'

const DEFAULT_GOALS = {
  yoga: 5,
  gym: 4,
  days: 5,
  calories: 1800,
  water: 2500,
}

const MUSCLE_TARGETS = [
  { group: 'Legs & Glutes', exercises: ['SQUAT', 'Squats', 'LUNGE', 'Lunges', 'HIGH_KNEES', 'Chair', 'Warrior'], color: '#ef4444' },
  { group: 'Chest & Arms', exercises: ['PUSHUP', 'Push-ups', 'BICEP_CURL', 'Bicep Curls', 'SHOULDER_PRESS', 'LATERAL_RAISE'], color: '#f59e0b' },
  { group: 'Core & Spine', exercises: ['Cobra', 'PLANK', 'Plank', 'CRUNCHES', 'Crunches', 'Boat'], color: '#10b981' },
  { group: 'Mobility & Balance', exercises: ['Tree', 'Warrior', 'Triangle', 'Dog', 'Bridge', 'Camel'], color: '#8b5cf6' },
]

export default function Dashboard() {
  const [yogaSessions, setYogaSessions] = useState([])
  const [gymWorkouts, setGymWorkouts] = useState([])
  const [foodEntries, setFoodEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview') // 'overview' | 'yoga' | 'gym' | 'nutrition'
  const [activityFilter, setActivityFilter] = useState('all') // 'all' | 'gym' | 'yoga'
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [isEditingGoals, setIsEditingGoals] = useState(false)
  const [tempGoals, setTempGoals] = useState(DEFAULT_GOALS)
  const [waterMl, setWaterMl] = useState(0)
  const [toast, setToast] = useState(null)
  const [hoveredBar, setHoveredBar] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  // Load all fitness, nutrition, and preference data
  const loadAllData = async () => {
    try {
      setLoading(true)
      const todayStr = new Date().toISOString().split('T')[0]

      const [yoga, gym, food, savedGoals, savedWater] = await Promise.all([
        getYogaHistory(100),
        getGymWorkoutHistory(null, 100),
        getFoodDiary(todayStr),
        getUserPreference('dashboard_goals'),
        getUserPreference(`water_${todayStr}`),
      ])

      setYogaSessions(yoga || [])
      setGymWorkouts(gym || [])
      setFoodEntries(food || [])
      if (savedGoals && typeof savedGoals === 'object') {
        setGoals(savedGoals)
        setTempGoals(savedGoals)
      }
      if (typeof savedWater === 'number') {
        setWaterMl(savedWater)
      }
      setLoading(false)
    } catch (err) {
      console.warn('Dashboard data load warning:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // Resolve workout name with fallbacks
  const resolveTitle = (item) => {
    if (item.pose) return item.pose
    if (item.poseName) return item.poseName
    if (item.exerciseName && item.exerciseName.trim()) return item.exerciseName
    if (item.exercise && typeof item.exercise === 'string' && item.exercise.trim()) return item.exercise
    if (item.exerciseType) {
      const typeMap = {
        SQUAT: 'Squats',
        PUSHUP: 'Push-ups',
        BICEP_CURL: 'Bicep Curls',
        JUMPING_JACKS: 'Jumping Jacks',
        LUNGE: 'Lunges',
        SHOULDER_PRESS: 'Shoulder Press',
        LATERAL_RAISE: 'Lateral Raise',
        PLANK: 'Plank Hold',
        CRUNCHES: 'Crunches',
        HIGH_KNEES: 'High Knees',
      }
      if (typeMap[item.exerciseType]) return typeMap[item.exerciseType]
      return item.exerciseType
    }
    return item.type === 'yoga' ? 'Mindful Yoga Flow' : 'Strength Session'
  }

  // Resolve estimated calories for a workout
  const resolveWorkoutCalories = (w) => {
    if (typeof w.caloriesBurned === 'number' && w.caloriesBurned > 0) return w.caloriesBurned
    if (w.pose || w.poseName) {
      return Math.max(12, Math.round(((w.duration || 60) / 60) * 4.2))
    }
    const reps = w.reps || 0
    const duration = w.duration || 60
    return Math.max(15, Math.round(reps * 4.5 + (duration / 60) * 8 + 10))
  }

  // Format helpers
  const formatTime = (secs = 0) => {
    const s = Math.round(secs)
    const m = Math.floor(s / 60)
    const remS = s % 60
    if (m === 0) return `${remS}s`
    return `${m}m ${remS}s`
  }

  const formatDate = (ts) => {
    if (!ts) return 'Recent'
    const d = new Date(ts)
    return (
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  }

  // Quick Water logger
  const handleAddWater = async (amount) => {
    const todayStr = new Date().toISOString().split('T')[0]
    const updated = Math.max(0, waterMl + amount)
    setWaterMl(updated)
    try {
      await saveUserPreference(`water_${todayStr}`, updated)
      showToast(`💧 ${amount > 0 ? '+' + amount : amount}ml Hydration logged (${updated}ml total)`)
    } catch {
      // Local fallback
    }
  }

  // Quick Starter Pack loader (for new or testing users)
  const handleLoadStarterPack = async () => {
    try {
      const now = Date.now()
      await saveGymWorkout({
        exercise: 'Squats',
        exerciseName: 'Squats',
        exerciseType: 'SQUAT',
        reps: 15,
        sets: 3,
        duration: 180,
        caloriesBurned: 95,
        timestamp: now - 3600000 * 3,
        formQuality: 96,
        notes: 'Great depth and stable balance.',
      })

      await saveGymWorkout({
        exercise: 'Push-ups',
        exerciseName: 'Push-ups',
        exerciseType: 'PUSHUP',
        reps: 20,
        sets: 2,
        duration: 120,
        caloriesBurned: 78,
        timestamp: now - 3600000 * 24,
        formQuality: 92,
        notes: 'Good chest touch and core alignment.',
      })

      await saveYogaSession({
        pose: 'Warrior II',
        poseName: 'Warrior II',
        duration: 240,
        confidence: 0.98,
        timestamp: now - 3600000 * 48,
        notes: 'Consistent arm level and deep hip lunge.',
      })

      showToast('🎉 Sample training pack loaded!')
      await loadAllData()
    } catch (err) {
      console.error(err)
      showToast('Failed to load sample pack')
    }
  }

  // Delete a session
  const handleDeleteSession = async (item) => {
    try {
      if (item.pose || item.poseName) {
        await deleteYogaSession(item.id)
      } else {
        await deleteGymWorkout(item.id)
      }
      showToast('🗑️ Session removed')
      await loadAllData()
    } catch (err) {
      console.error(err)
      showToast('Failed to delete session')
    }
  }

  // Save Goals
  const handleSaveGoals = async (e) => {
    e.preventDefault()
    setGoals(tempGoals)
    setIsEditingGoals(false)
    try {
      await saveUserPreference('dashboard_goals', tempGoals)
      showToast('🎯 Weekly goals updated!')
    } catch {
      showToast('Goals updated locally')
    }
  }

  // High level aggregated statistics
  const stats = useMemo(() => {
    const totalSessions = yogaSessions.length + gymWorkouts.length
    const totalYogaSec = yogaSessions.reduce((s, x) => s + (x.duration || 0), 0)
    const totalGymSec = gymWorkouts.reduce((s, w) => s + (w.duration || 0), 0)
    const totalActiveMins = Math.round((totalYogaSec + totalGymSec) / 60)
    const totalGymReps = gymWorkouts.reduce((s, w) => s + (w.reps || 0), 0)

    const totalCaloriesBurned =
      gymWorkouts.reduce((s, w) => s + resolveWorkoutCalories(w), 0) +
      yogaSessions.reduce((s, y) => s + resolveWorkoutCalories(y), 0)

    // Today's calories burned
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartMs = todayStart.getTime()

    const todayBurned =
      gymWorkouts
        .filter((w) => (w.timestamp || 0) >= todayStartMs)
        .reduce((s, w) => s + resolveWorkoutCalories(w), 0) +
      yogaSessions
        .filter((y) => (y.timestamp || 0) >= todayStartMs)
        .reduce((s, y) => s + resolveWorkoutCalories(y), 0)

    // Today's nutrition intake
    const todayFoodCalories = foodEntries.reduce((s, f) => s + (f.calories || 0), 0)
    const todayProtein = foodEntries.reduce((s, f) => s + (f.protein || 0), 0)
    const todayCarbs = foodEntries.reduce((s, f) => s + (f.carbs || 0), 0)
    const todayFat = foodEntries.reduce((s, f) => s + (f.fat || 0), 0)
    const netCalories = todayFoodCalories - todayBurned

    // Streak calculation
    const allTimestamps = [
      ...yogaSessions.map((s) => s.timestamp),
      ...gymWorkouts.map((w) => w.timestamp),
    ]
      .filter(Boolean)
      .sort((a, b) => b - a)

    let streak = 0
    if (allTimestamps.length > 0) {
      streak = 1
      for (let i = 1; i < allTimestamps.length; i++) {
        const diffDays = (allTimestamps[i - 1] - allTimestamps[i]) / (1000 * 60 * 60 * 24)
        if (diffDays <= 1.5) {
          streak++
        } else {
          break
        }
      }
    }

    // Average AI Accuracy / Form score
    let totalScore = 0
    let scoreCount = 0
    gymWorkouts.forEach((w) => {
      if (w.formQuality) {
        totalScore += w.formQuality > 1 ? w.formQuality : w.formQuality * 100
        scoreCount++
      }
    })
    yogaSessions.forEach((y) => {
      if (y.confidence) {
        totalScore += y.confidence > 1 ? y.confidence : y.confidence * 100
        scoreCount++
      }
    })
    const avgFormAccuracy = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 96

    return {
      totalSessions,
      totalYogaSec,
      totalGymSec,
      totalActiveMins,
      totalGymReps,
      totalCaloriesBurned,
      todayBurned,
      todayFoodCalories,
      todayProtein,
      todayCarbs,
      todayFat,
      netCalories,
      streak,
      avgFormAccuracy,
    }
  }, [yogaSessions, gymWorkouts, foodEntries])

  // 7-day activity timeline computation
  const weeklyData = useMemo(() => {
    const days = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dayStart = new Date(d)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(d)
      dayEnd.setHours(23, 59, 59, 999)

      const startMs = dayStart.getTime()
      const endMs = dayEnd.getTime()

      const dayGym = gymWorkouts.filter((w) => w.timestamp >= startMs && w.timestamp <= endMs)
      const dayYoga = yogaSessions.filter((y) => y.timestamp >= startMs && y.timestamp <= endMs)

      const gymMins = Math.round(dayGym.reduce((s, w) => s + (w.duration || 0), 0) / 60)
      const yogaMins = Math.round(dayYoga.reduce((s, y) => s + (y.duration || 0), 0) / 60)
      const calories =
        dayGym.reduce((s, w) => s + resolveWorkoutCalories(w), 0) +
        dayYoga.reduce((s, y) => s + resolveWorkoutCalories(y), 0)

      days.push({
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        gymMins,
        yogaMins,
        totalMins: gymMins + yogaMins,
        calories,
        isToday: i === 0,
      })
    }

    const maxMins = Math.max(30, ...days.map((d) => d.totalMins))
    return { days, maxMins }
  }, [gymWorkouts, yogaSessions])

  // Combined recent activities sorted newest first
  const recentActivities = useMemo(() => {
    const list = [
      ...yogaSessions.map((y) => ({ ...y, type: 'yoga' })),
      ...gymWorkouts.map((g) => ({ ...g, type: 'gym' })),
    ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

    if (activityFilter === 'gym') return list.filter((x) => x.type === 'gym')
    if (activityFilter === 'yoga') return list.filter((x) => x.type === 'yoga')
    return list
  }, [yogaSessions, gymWorkouts, activityFilter])

  // Greeting & Readiness Level
  const getReadinessStatus = () => {
    if (stats.streak >= 3) {
      return { text: '🔥 High Momentum · Streak Active', tone: '#10b981', badge: 'Optimal Readiness' }
    }
    if (stats.todayBurned > 150) {
      return { text: '⚡ Training Zone Active · Goal Crushed', tone: '#8b5cf6', badge: 'Active Today' }
    }
    if (stats.totalSessions === 0) {
      return { text: '🌱 Fresh Start · Ready for First Session', tone: '#06b6d4', badge: 'Kickoff Ready' }
    }
    return { text: '🔋 Good Recovery · Primed for Training', tone: '#f59e0b', badge: 'Ready' }
  }

  const readiness = getReadinessStatus()

  if (loading) {
    return (
      <div className="dash-page">
        <div className="dash-loading">
          <div className="spinner-ring" />
          <p>Syncing your fitness telemetry...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-page">
      {/* Toast Notification */}
      {toast && <div className="dash-toast">{toast}</div>}

      {/* Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-readiness-pill" style={{ borderColor: `${readiness.tone}50` }}>
            <span className="readiness-dot" style={{ background: readiness.tone }} />
            <span className="readiness-text">{readiness.text}</span>
          </div>
          <h1 className="dash-title">📊 Fitness Command Center</h1>
          <p className="dash-sub">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Real-time AI
            telemetry & energy balance
          </p>
        </div>

        {/* Quick Launch Action Suite */}
        <div className="dash-header-actions">
          <Link to="/start">
            <button className="btn-dash-action yoga-glow" title="Start real-time MoveNet Yoga detection">
              🧘 Start Yoga
            </button>
          </Link>
          <Link to="/gym">
            <button className="btn-dash-action gym-glow" title="Start AI Gym Rep Counter">
              💪 Start Gym
            </button>
          </Link>
          <Link to="/nutrition">
            <button className="btn-dash-action nutrition-glow" title="Log food with photo AI">
              🥗 Nutrition Studio
            </button>
          </Link>
          {stats.totalSessions === 0 && (
            <button className="btn-dash-action demo-glow" onClick={handleLoadStarterPack} title="Load sample workouts">
              ⚡ Load Demo Pack
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Hero Strip: Net Energy & Hydration */}
      <div className="dash-telemetry-strip">
        <div className="telemetry-card energy-balance-card">
          <div className="telemetry-header">
            <span className="telemetry-title">⚡ Today's Energy Balance</span>
            <span className="telemetry-badge">
              {stats.netCalories >= 0 ? `+${stats.netCalories} kcal Surplus` : `${stats.netCalories} kcal Deficit`}
            </span>
          </div>
          <div className="energy-meter-row">
            <div className="energy-item">
              <span className="energy-label">🍽️ Nutrition Intake</span>
              <span className="energy-val in">{stats.todayFoodCalories} kcal</span>
            </div>
            <div className="energy-divider">−</div>
            <div className="energy-item">
              <span className="energy-label">🔥 Active Burned</span>
              <span className="energy-val out">{stats.todayBurned} kcal</span>
            </div>
            <div className="energy-divider">=</div>
            <div className="energy-item">
              <span className="energy-label">⚖️ Net Balance</span>
              <span className="energy-val net">{stats.netCalories} kcal</span>
            </div>
          </div>
          <div className="energy-progress-bar">
            <div
              className="energy-fill"
              style={{
                width: `${Math.min(100, Math.max(10, (stats.todayBurned / (goals.calories / 7 || 300)) * 100))}%`,
              }}
            />
          </div>
        </div>

        <div className="telemetry-card hydration-card">
          <div className="telemetry-header">
            <span className="telemetry-title">💧 Today's Hydration</span>
            <span className="telemetry-badge">
              {waterMl} / {goals.water} ml
            </span>
          </div>
          <div className="hydration-meter-row">
            <div className="hydration-progress-track">
              <div
                className="hydration-fill"
                style={{ width: `${Math.min(100, (waterMl / (goals.water || 2500)) * 100)}%` }}
              />
            </div>
            <div className="hydration-actions">
              <button className="btn-water-pill" onClick={() => handleAddWater(250)}>
                +250ml
              </button>
              <button className="btn-water-pill" onClick={() => handleAddWater(500)}>
                +500ml
              </button>
              {waterMl > 0 && (
                <button className="btn-water-reset" onClick={() => handleAddWater(-waterMl)} title="Reset hydration">
                  ↺
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card" style={{ '--card-color': '#8b5cf6' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', borderColor: '#8b5cf640' }}>
            🏋️
          </div>
          <div className="stat-card-body">
            <p className="stat-card-label">Total Workouts</p>
            <p className="stat-card-value">{stats.totalSessions}</p>
            <span className="stat-card-sub">
              {gymWorkouts.length} Gym · {yogaSessions.length} Yoga
            </span>
          </div>
          <div className="stat-card-glow" />
        </div>

        <div className="dash-stat-card" style={{ '--card-color': '#06b6d4' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d440' }}>
            ⏱️
          </div>
          <div className="stat-card-body">
            <p className="stat-card-label">Total Active Time</p>
            <p className="stat-card-value">{stats.totalActiveMins}m</p>
            <span className="stat-card-sub">{formatTime(stats.totalYogaSec + stats.totalGymSec)} recorded</span>
          </div>
          <div className="stat-card-glow" />
        </div>

        <div className="dash-stat-card" style={{ '--card-color': '#ef4444' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef444440' }}>
            💪
          </div>
          <div className="stat-card-body">
            <p className="stat-card-label">Gym Reps Logged</p>
            <p className="stat-card-value">{stats.totalGymReps}</p>
            <span className="stat-card-sub">From {gymWorkouts.length} lifting sets</span>
          </div>
          <div className="stat-card-glow" />
        </div>

        <div className="dash-stat-card" style={{ '--card-color': '#f59e0b' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b40' }}>
            🔥
          </div>
          <div className="stat-card-body">
            <p className="stat-card-label">Total Calories Burned</p>
            <p className="stat-card-value">{stats.totalCaloriesBurned}</p>
            <span className="stat-card-sub">+{stats.todayBurned} burned today</span>
          </div>
          <div className="stat-card-glow" />
        </div>

        <div className="dash-stat-card" style={{ '--card-color': '#10b981' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b98140' }}>
            ⚡
          </div>
          <div className="stat-card-body">
            <p className="stat-card-label">Training Streak</p>
            <p className="stat-card-value">{stats.streak} Days</p>
            <span className="stat-card-sub">{stats.streak > 0 ? 'Consistency on point' : 'Log a session to ignite'}</span>
          </div>
          <div className="stat-card-glow" />
        </div>

        <div className="dash-stat-card" style={{ '--card-color': '#ec4899' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', borderColor: '#ec489940' }}>
            🎯
          </div>
          <div className="stat-card-body">
            <p className="stat-card-label">AI Form Precision</p>
            <p className="stat-card-value">{stats.avgFormAccuracy}%</p>
            <span className="stat-card-sub">MoveNet skeleton verification</span>
          </div>
          <div className="stat-card-glow" />
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        <button
          className={`dash-tab ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          📋 Executive Overview
        </button>
        <button className={`dash-tab ${selectedTab === 'gym' ? 'active' : ''}`} onClick={() => setSelectedTab('gym')}>
          💪 Gym Logs ({gymWorkouts.length})
        </button>
        <button
          className={`dash-tab ${selectedTab === 'yoga' ? 'active' : ''}`}
          onClick={() => setSelectedTab('yoga')}
        >
          🧘 Yoga Sessions ({yogaSessions.length})
        </button>
        <button
          className={`dash-tab ${selectedTab === 'nutrition' ? 'active' : ''}`}
          onClick={() => setSelectedTab('nutrition')}
        >
          🥗 Nutrition Snapshot ({foodEntries.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {selectedTab === 'overview' && (
        <div className="dash-tab-content">
          {/* Top Row: Weekly Activity Chart + Weekly Goals */}
          <div className="dash-two-col">
            {/* Weekly Activity Visualizer */}
            <div className="dash-card">
              <div className="dash-card-header-row">
                <div>
                  <h3 className="dash-card-title">📈 7-Day Activity & Calorie Burn</h3>
                  <p className="dash-card-sub">Hover on days to inspect active duration and estimated burn</p>
                </div>
                <div className="chart-legend">
                  <span className="legend-dot gym" /> Gym
                  <span className="legend-dot yoga" /> Yoga
                </div>
              </div>

              <div className="activity-chart-container">
                <div className="chart-bars-row">
                  {weeklyData.days.map((d, idx) => {
                    const gymHeight = (d.gymMins / weeklyData.maxMins) * 100
                    const yogaHeight = (d.yogaMins / weeklyData.maxMins) * 100
                    const totalHeight = Math.min(100, Math.max(6, gymHeight + yogaHeight))

                    return (
                      <div
                        key={idx}
                        className={`chart-bar-group ${d.isToday ? 'is-today' : ''}`}
                        onMouseEnter={() => setHoveredBar(d)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        <div className="bar-track">
                          <div className="bar-stacked" style={{ height: `${totalHeight}%` }}>
                            {d.gymMins > 0 && (
                              <div
                                className="bar-segment gym-seg"
                                style={{ height: `${(d.gymMins / (d.totalMins || 1)) * 100}%` }}
                              />
                            )}
                            {d.yogaMins > 0 && (
                              <div
                                className="bar-segment yoga-seg"
                                style={{ height: `${(d.yogaMins / (d.totalMins || 1)) * 100}%` }}
                              />
                            )}
                          </div>
                        </div>
                        <span className="bar-day-label">{d.dayName}</span>
                        {d.isToday && <span className="today-indicator">TODAY</span>}
                      </div>
                    )
                  })}
                </div>

                {/* Hover Tooltip Box */}
                {hoveredBar && (
                  <div className="chart-tooltip">
                    <strong>{hoveredBar.dateStr}</strong>
                    <span>⏱️ Total Active: {hoveredBar.totalMins} mins</span>
                    <span>💪 Gym: {hoveredBar.gymMins}m · 🧘 Yoga: {hoveredBar.yogaMins}m</span>
                    <span>🔥 Burned: {hoveredBar.calories} kcal</span>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Targets & Goals */}
            <div className="dash-card">
              <div className="dash-card-header-row">
                <div>
                  <h3 className="dash-card-title">🎯 Weekly Targets</h3>
                  <p className="dash-card-sub">Track your progress toward consistent habits</p>
                </div>
                <button
                  className="btn-edit-goals"
                  onClick={() => {
                    setTempGoals(goals)
                    setIsEditingGoals(!isEditingGoals)
                  }}
                >
                  {isEditingGoals ? '✕ Cancel' : '⚙️ Edit Goals'}
                </button>
              </div>

              {isEditingGoals ? (
                <form className="goals-edit-form" onSubmit={handleSaveGoals}>
                  <div className="form-group-row">
                    <label>Gym Workouts / week</label>
                    <input
                      type="number"
                      min="1"
                      max="14"
                      value={tempGoals.gym}
                      onChange={(e) => setTempGoals({ ...tempGoals, gym: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="form-group-row">
                    <label>Yoga Sessions / week</label>
                    <input
                      type="number"
                      min="1"
                      max="14"
                      value={tempGoals.yoga}
                      onChange={(e) => setTempGoals({ ...tempGoals, yoga: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="form-group-row">
                    <label>Weekly Calorie Burn (kcal)</label>
                    <input
                      type="number"
                      step="100"
                      min="500"
                      max="10000"
                      value={tempGoals.calories}
                      onChange={(e) => setTempGoals({ ...tempGoals, calories: parseInt(e.target.value) || 500 })}
                    />
                  </div>
                  <div className="form-group-row">
                    <label>Daily Water Goal (ml)</label>
                    <input
                      type="number"
                      step="250"
                      min="1000"
                      max="5000"
                      value={tempGoals.water}
                      onChange={(e) => setTempGoals({ ...tempGoals, water: parseInt(e.target.value) || 1000 })}
                    />
                  </div>
                  <button type="submit" className="btn-primary-glow" style={{ width: '100%', marginTop: 8 }}>
                    💾 Save Goals
                  </button>
                </form>
              ) : (
                <div className="goals-list">
                  {[
                    {
                      label: 'Gym Workouts',
                      current: Math.min(gymWorkouts.length, goals.gym),
                      goal: goals.gym,
                      color: '#ef4444',
                      icon: '💪',
                    },
                    {
                      label: 'Yoga Sessions',
                      current: Math.min(yogaSessions.length, goals.yoga),
                      goal: goals.yoga,
                      color: '#8b5cf6',
                      icon: '🧘',
                    },
                    {
                      label: 'Active Days / Streak',
                      current: Math.min(stats.streak, goals.days),
                      goal: goals.days,
                      color: '#10b981',
                      icon: '⚡',
                    },
                    {
                      label: 'Weekly Calories Burned',
                      current: Math.min(stats.totalCaloriesBurned, goals.calories),
                      goal: goals.calories,
                      color: '#f59e0b',
                      icon: '🔥',
                      unit: ' kcal',
                    },
                  ].map((goal, i) => (
                    <div key={i} className="goal-row">
                      <div className="goal-header-row">
                        <span className="goal-label">
                          {goal.icon} {goal.label}
                        </span>
                        <span className="goal-progress" style={{ color: goal.color }}>
                          {goal.current}/{goal.goal}
                          {goal.unit || ''}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill-custom"
                          style={{
                            width: `${Math.min((goal.current / goal.goal) * 100, 100)}%`,
                            background: `linear-gradient(90deg, ${goal.color}, ${goal.color}bb)`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick links footer */}
              <div className="dash-quick-links" style={{ marginTop: 20 }}>
                <Link to="/planner">
                  <div className="quick-link-btn">📅 Weekly Planner</div>
                </Link>
                <Link to="/video-analysis">
                  <div className="quick-link-btn">🎬 Upload Video</div>
                </Link>
                <Link to="/history">
                  <div className="quick-link-btn">📋 Full History</div>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Row: Recent Activity Feed + Muscle Groups */}
          <div className="dash-two-col" style={{ marginTop: 24 }}>
            {/* Recent Activity List */}
            <div className="dash-card">
              <div className="dash-card-header-row">
                <div>
                  <h3 className="dash-card-title">🕒 Recent Activity Telemetry</h3>
                  <p className="dash-card-sub">Live session history with reps, sets, and calorie metrics</p>
                </div>
                <div className="feed-filter-pills">
                  <button
                    className={`feed-pill ${activityFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActivityFilter('all')}
                  >
                    All ({recentActivities.length})
                  </button>
                  <button
                    className={`feed-pill ${activityFilter === 'gym' ? 'active' : ''}`}
                    onClick={() => setActivityFilter('gym')}
                  >
                    💪 Gym
                  </button>
                  <button
                    className={`feed-pill ${activityFilter === 'yoga' ? 'active' : ''}`}
                    onClick={() => setActivityFilter('yoga')}
                  >
                    🧘 Yoga
                  </button>
                </div>
              </div>

              {recentActivities.length === 0 ? (
                <div className="dash-empty-vibrant">
                  <div className="empty-sparkle">✨</div>
                  <h4>No sessions recorded yet</h4>
                  <p>Start a workout or load the starter demo to preview full dashboard analytics.</p>
                  <div className="empty-actions-row">
                    <button className="btn-dash-action demo-glow" onClick={handleLoadStarterPack}>
                      ⚡ Load Starter Pack
                    </button>
                    <Link to="/start">
                      <button className="btn-primary-glow">🧘 Start Yoga</button>
                    </Link>
                    <Link to="/gym">
                      <button className="btn-ghost">💪 Start Gym</button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="activity-list-rich">
                  {recentActivities.slice(0, 7).map((item, i) => {
                    const isYoga = item.type === 'yoga' || item.pose || item.poseName
                    const calories = resolveWorkoutCalories(item)
                    const title = resolveTitle(item)

                    return (
                      <div key={item.id || i} className="activity-item-rich">
                        <div className={`activity-icon-rich ${isYoga ? 'yoga' : 'gym'}`}>
                          {isYoga ? '🧘' : '💪'}
                        </div>
                        <div className="activity-details">
                          <div className="activity-title-row">
                            <span className="activity-item-name">{title}</span>
                            <span className="activity-badge-form">
                              {Math.round(item.formQuality || (item.confidence || 0.95) * 100)}% Accuracy
                            </span>
                          </div>
                          <div className="activity-meta-pills">
                            <span className="meta-pill">⏱️ {formatTime(item.duration)}</span>
                            {!isYoga && (
                              <span className="meta-pill">
                                🔄 {item.reps || 0} reps · {item.sets || 1} sets
                              </span>
                            )}
                            <span className="meta-pill calorie">🔥 {calories} kcal</span>
                            <span className="meta-pill date">{formatDate(item.timestamp)}</span>
                          </div>
                        </div>
                        <button
                          className="btn-trash-quick"
                          onClick={() => handleDeleteSession(item)}
                          title="Delete workout"
                        >
                          🗑️
                        </button>
                      </div>
                    )
                  })}

                  <div className="feed-footer-link">
                    <Link to="/history">View all {stats.totalSessions} sessions in History →</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Muscle Group Focus & AI Coaching Recommendation */}
            <div className="dash-card">
              <h3 className="dash-card-title">🦾 Anatomical Muscle Group Focus</h3>
              <p className="dash-card-sub">Distribution of movement patterns across body zones</p>

              <div className="muscle-bars-list">
                {MUSCLE_TARGETS.map((m, idx) => {
                  const matchCount = gymWorkouts.filter((w) =>
                    m.exercises.some((e) => (w.exerciseType || '').includes(e) || (w.exerciseName || '').includes(e))
                  ).length + (idx === 2 || idx === 3 ? yogaSessions.length : 0)

                  const pct = stats.totalSessions > 0 ? Math.min(100, Math.round((matchCount / stats.totalSessions) * 100)) : 25

                  return (
                    <div key={m.group} className="muscle-bar-item">
                      <div className="muscle-header">
                        <span className="muscle-name">{m.group}</span>
                        <span className="muscle-pct" style={{ color: m.color }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="muscle-track">
                        <div
                          className="muscle-fill"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${m.color}, ${m.color}88)`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* AI Coach Insight */}
              <div className="ai-coach-card">
                <div className="ai-coach-header">
                  <span className="ai-coach-icon">🧠</span>
                  <span className="ai-coach-title">FitVision AI Dynamic Coach</span>
                </div>
                <p className="ai-coach-tip">
                  {stats.totalSessions === 0
                    ? 'Welcome! Begin with a 3-minute Squat check or a Warrior II yoga pose to establish baseline form accuracy.'
                    : stats.streak >= 2
                    ? 'Outstanding consistency! Your form accuracy is averaging ' +
                      stats.avgFormAccuracy +
                      '%. Consider a 10-minute yoga cool-down to accelerate recovery.'
                    : 'Targeting balanced push/pull volume this week will safeguard your shoulder posture. Keep up the high energy!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Gym Logs */}
      {selectedTab === 'gym' && (
        <div className="dash-tab-content">
          <div className="dash-card-header-row">
            <div>
              <h3 className="dash-section-title">💪 Gym Strength Workouts ({gymWorkouts.length})</h3>
              <p className="dash-card-sub">Repetition telemetry, estimated tonnage, and set tracking</p>
            </div>
            <Link to="/gym">
              <button className="btn-primary-glow">+ New Gym Workout</button>
            </Link>
          </div>

          {gymWorkouts.length === 0 ? (
            <div className="dash-empty-vibrant">
              <div className="empty-sparkle">🏋️</div>
              <h4>No Gym Workouts Logged Yet</h4>
              <p>Practice squats, push-ups, or bicep curls with real-time AI rep counting.</p>
              <Link to="/gym">
                <button className="btn-primary-glow" style={{ marginTop: 12 }}>
                  Start Gym Mode
                </button>
              </Link>
            </div>
          ) : (
            <div className="sessions-grid">
              {gymWorkouts.map((w, i) => (
                <div key={w.id || i} className="session-card gym-theme">
                  <div className="session-card-header">
                    <div className="session-pose-badge gym">💪 {resolveTitle(w)}</div>
                    <span className="session-date">{formatDate(w.timestamp)}</span>
                  </div>
                  <div className="session-metrics">
                    <div className="session-metric">
                      <span className="sm-label">Reps</span>
                      <span className="sm-value">{w.reps || 0}</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Sets</span>
                      <span className="sm-value">{w.sets || 1}</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Duration</span>
                      <span className="sm-value">{formatTime(w.duration)}</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Burned</span>
                      <span className="sm-value fire">{resolveWorkoutCalories(w)} kcal</span>
                    </div>
                  </div>
                  {w.notes && <p className="session-notes-preview">💬 {w.notes}</p>}
                  <div className="session-card-actions">
                    <button className="btn-trash-inline" onClick={() => handleDeleteSession(w)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Yoga Sessions */}
      {selectedTab === 'yoga' && (
        <div className="dash-tab-content">
          <div className="dash-card-header-row">
            <div>
              <h3 className="dash-section-title">🧘 Mindful Yoga Sessions ({yogaSessions.length})</h3>
              <p className="dash-card-sub">Pose stability, hold duration, and alignment confidence</p>
            </div>
            <Link to="/start">
              <button className="btn-primary-glow">+ New Yoga Flow</button>
            </Link>
          </div>

          {yogaSessions.length === 0 ? (
            <div className="dash-empty-vibrant">
              <div className="empty-sparkle">🧘</div>
              <h4>No Yoga Sessions Logged Yet</h4>
              <p>Practice Tree Pose, Warrior, Cobra, and more with camera-guided alignment.</p>
              <Link to="/start">
                <button className="btn-primary-glow" style={{ marginTop: 12 }}>
                  Start Yoga Session
                </button>
              </Link>
            </div>
          ) : (
            <div className="sessions-grid">
              {yogaSessions.map((y, i) => (
                <div key={y.id || i} className="session-card yoga-theme">
                  <div className="session-card-header">
                    <div className="session-pose-badge">🧘 {resolveTitle(y)}</div>
                    <span className="session-date">{formatDate(y.timestamp)}</span>
                  </div>
                  <div className="session-metrics">
                    <div className="session-metric">
                      <span className="sm-label">Duration</span>
                      <span className="sm-value">{formatTime(y.duration)}</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Pose Confidence</span>
                      <span className="sm-value">{Math.round((y.confidence || 0.95) * 100)}%</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Burned</span>
                      <span className="sm-value fire">{resolveWorkoutCalories(y)} kcal</span>
                    </div>
                  </div>
                  {y.notes && <p className="session-notes-preview">💬 {y.notes}</p>}
                  <div className="session-card-actions">
                    <button className="btn-trash-inline" onClick={() => handleDeleteSession(y)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Nutrition Snapshot */}
      {selectedTab === 'nutrition' && (
        <div className="dash-tab-content">
          <div className="dash-card-header-row">
            <div>
              <h3 className="dash-section-title">🥗 Today's Nutrition Telemetry</h3>
              <p className="dash-card-sub">Real-time macro balance logged in Nutrition Studio</p>
            </div>
            <Link to="/nutrition">
              <button className="btn-primary-glow">+ Open Nutrition Studio</button>
            </Link>
          </div>

          <div className="dash-stats-grid" style={{ padding: '0 0 24px 0' }}>
            <div className="dash-stat-card" style={{ '--card-color': '#ec4899' }}>
              <div className="stat-card-icon" style={{ background: '#ec489920', borderColor: '#ec489940' }}>
                🔥
              </div>
              <div className="stat-card-body">
                <p className="stat-card-label">Calories Today</p>
                <p className="stat-card-value">{stats.todayFoodCalories} kcal</p>
              </div>
            </div>
            <div className="dash-stat-card" style={{ '--card-color': '#3b82f6' }}>
              <div className="stat-card-icon" style={{ background: '#3b82f620', borderColor: '#3b82f640' }}>
                🥩
              </div>
              <div className="stat-card-body">
                <p className="stat-card-label">Protein</p>
                <p className="stat-card-value">{stats.todayProtein}g</p>
              </div>
            </div>
            <div className="dash-stat-card" style={{ '--card-color': '#f59e0b' }}>
              <div className="stat-card-icon" style={{ background: '#f59e0b20', borderColor: '#f59e0b40' }}>
                🍞
              </div>
              <div className="stat-card-body">
                <p className="stat-card-label">Carbs</p>
                <p className="stat-card-value">{stats.todayCarbs}g</p>
              </div>
            </div>
            <div className="dash-stat-card" style={{ '--card-color': '#10b981' }}>
              <div className="stat-card-icon" style={{ background: '#10b98120', borderColor: '#10b98140' }}>
                🥑
              </div>
              <div className="stat-card-body">
                <p className="stat-card-label">Fats</p>
                <p className="stat-card-value">{stats.todayFat}g</p>
              </div>
            </div>
          </div>

          {foodEntries.length === 0 ? (
            <div className="dash-empty-vibrant">
              <div className="empty-sparkle">🥗</div>
              <h4>No Meals Logged Today</h4>
              <p>Upload a food photo or search Open Food Facts to automatically log macros.</p>
              <Link to="/nutrition">
                <button className="btn-primary-glow" style={{ marginTop: 12 }}>
                  Log Food Photo
                </button>
              </Link>
            </div>
          ) : (
            <div className="sessions-grid">
              {foodEntries.map((f, i) => (
                <div key={f.id || i} className="session-card nutrition-theme">
                  <div className="session-card-header">
                    <div className="session-pose-badge nutrition">🥗 {f.name}</div>
                    <span className="session-date">{f.mealType || 'Meal'}</span>
                  </div>
                  <div className="session-metrics">
                    <div className="session-metric">
                      <span className="sm-label">Calories</span>
                      <span className="sm-value fire">{f.calories} kcal</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Protein</span>
                      <span className="sm-value">{f.protein}g</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Carbs</span>
                      <span className="sm-value">{f.carbs}g</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Fat</span>
                      <span className="sm-value">{f.fat}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
