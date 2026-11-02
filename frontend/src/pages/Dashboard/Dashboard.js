import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getYogaHistory, getGymWorkoutHistory } from '../../utils/storage'
import './Dashboard.css'

const Dashboard = () => {
  const [yogaSessions, setYogaSessions] = useState([])
  const [gymWorkouts, setGymWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')

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
      } catch {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const getStats = () => {
    const totalSessions = yogaSessions.length + gymWorkouts.length
    const totalYogaSec = yogaSessions.reduce((s, x) => s + (x.duration || 0), 0)
    const totalGymReps = gymWorkouts.reduce((s, w) => s + (w.reps || 0), 0)
    const totalCalories = Math.round((totalYogaSec / 60 * 3) + (totalGymReps * 0.5))
    return { totalSessions, totalYogaSec, totalGymReps, totalCalories }
  }

  const getStreak = () => {
    const all = [
      ...yogaSessions.map(s => new Date(s.timestamp)),
      ...gymWorkouts.map(w => new Date(w.timestamp)),
    ].sort((a, b) => b - a)
    if (!all.length) return 0
    let streak = 1
    for (let i = 1; i < all.length; i++) {
      if ((all[i - 1] - all[i]) / 86400000 <= 1) streak++
      else break
    }
    return streak
  }

  const formatTime = (secs = 0) => {
    const m = Math.floor(secs / 60), s = Math.round(secs % 60)
    return `${m}m ${s}s`
  }

  const formatDate = (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="dash-page">
        <div className="dash-loading">
          <div className="spinner-ring" />
          <p>Loading your stats...</p>
        </div>
      </div>
    )
  }

  const stats = getStats()
  const streak = getStreak()

  const STAT_CARDS = [
    { icon: '🏋️', label: 'Total Sessions', value: stats.totalSessions, color: '#8b5cf6' },
    { icon: '🧘', label: 'Yoga Time', value: formatTime(stats.totalYogaSec), color: '#06b6d4' },
    { icon: '💪', label: 'Gym Reps', value: stats.totalGymReps, color: '#ef4444' },
    { icon: '🔥', label: 'Calories Est.', value: stats.totalCalories, color: '#f59e0b' },
    { icon: '⚡', label: 'Day Streak', value: `${streak} days`, color: '#10b981' },
    { icon: '📊', label: 'Yoga Sessions', value: yogaSessions.length, color: '#ec4899' },
  ]

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">📊 Dashboard</h1>
          <p className="dash-sub">Your fitness journey at a glance</p>
        </div>
        <div className="dash-header-actions">
          <Link to="/start">
            <button className="btn-primary-glow">+ New Yoga Session</button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dash-stats-grid">
        {STAT_CARDS.map((card, i) => (
          <div key={i} className="dash-stat-card" style={{ '--card-color': card.color }}>
            <div className="stat-card-icon" style={{ background: `${card.color}20`, border: `1px solid ${card.color}30` }}>
              {card.icon}
            </div>
            <div className="stat-card-body">
              <p className="stat-card-label">{card.label}</p>
              <p className="stat-card-value">{card.value}</p>
            </div>
            <div className="stat-card-glow" style={{ background: `radial-gradient(circle at 0% 100%, ${card.color}15, transparent 60%)` }} />
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="dash-tabs">
        {['overview', 'yoga', 'gym'].map(tab => (
          <button
            key={tab}
            className={`dash-tab ${selectedTab === tab ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab)}
          >
            {tab === 'overview' ? '📋 Overview' : tab === 'yoga' ? '🧘 Yoga Sessions' : '💪 Gym Workouts'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="dash-tab-content">
          <div className="dash-two-col">
            {/* Recent Activity */}
            <div className="dash-card">
              <h3 className="dash-card-title">Recent Activity</h3>
              {[...yogaSessions, ...gymWorkouts].length === 0 ? (
                <div className="dash-empty">
                  <p>No activity yet. Start training!</p>
                  <Link to="/start"><button className="btn-primary-glow" style={{ marginTop: 16 }}>Start Yoga</button></Link>
                </div>
              ) : (
                <div className="activity-list">
                  {[...yogaSessions, ...gymWorkouts]
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 10)
                    .map((item, i) => (
                      <div key={i} className="activity-item">
                        <span className="activity-emoji">
                          {item.pose ? '🧘' : '💪'}
                        </span>
                        <div className="activity-info">
                          <p className="activity-name">{item.pose || item.exerciseName || 'Workout'}</p>
                          <p className="activity-meta">
                            {item.duration ? formatTime(item.duration) : `${item.reps || 0} reps × ${item.sets || 0} sets`}
                          </p>
                        </div>
                        <span className="activity-date">{formatDate(item.timestamp)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Weekly Goals */}
            <div className="dash-card">
              <h3 className="dash-card-title">Weekly Goals</h3>
              <div className="goals-list">
                {[
                  { label: 'Yoga Sessions', current: Math.min(yogaSessions.length, 5), goal: 5, color: '#8b5cf6' },
                  { label: 'Gym Workouts', current: Math.min(gymWorkouts.length, 4), goal: 4, color: '#ef4444' },
                  { label: 'Active Days', current: Math.min(streak, 7), goal: 7, color: '#10b981' },
                  { label: 'Calories (est.)', current: Math.min(stats.totalCalories, 2000), goal: 2000, color: '#f59e0b' },
                ].map((goal, i) => (
                  <div key={i} className="goal-row">
                    <div className="goal-header-row">
                      <span className="goal-label">{goal.label}</span>
                      <span className="goal-progress" style={{ color: goal.color }}>
                        {goal.current}/{goal.goal}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill-custom"
                        style={{
                          width: `${Math.min((goal.current / goal.goal) * 100, 100)}%`,
                          background: `linear-gradient(90deg, ${goal.color}, ${goal.color}aa)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div className="dash-quick-links">
                <Link to="/start"><div className="quick-link-btn">🧘 Start Yoga</div></Link>
                <Link to="/gym"><div className="quick-link-btn">💪 Gym Mode</div></Link>
                <Link to="/video-analysis"><div className="quick-link-btn">🎬 Video Analysis</div></Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yoga Tab */}
      {selectedTab === 'yoga' && (
        <div className="dash-tab-content">
          <div className="dash-card-header-row">
            <h3 className="dash-section-title">Yoga Sessions ({yogaSessions.length})</h3>
            <Link to="/start">
              <button className="btn-primary-glow" style={{ padding: '8px 20px', fontSize: '13px' }}>
                + New Session
              </button>
            </Link>
          </div>
          {yogaSessions.length === 0 ? (
            <div className="dash-empty-full">
              <div className="dash-empty-icon">🧘</div>
              <h3>No yoga sessions yet</h3>
              <p>Start a yoga session to see your history here</p>
              <Link to="/start"><button className="btn-primary-glow" style={{ marginTop: 16 }}>Start First Session</button></Link>
            </div>
          ) : (
            <div className="sessions-grid">
              {yogaSessions.slice().reverse().map((session, i) => (
                <div key={i} className="session-card">
                  <div className="session-card-header">
                    <div className="session-pose-badge">🧘 {session.pose}</div>
                    <span className="session-date">{new Date(session.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="session-metrics">
                    <div className="session-metric">
                      <span className="sm-label">Duration</span>
                      <span className="sm-value">{formatTime(session.duration)}</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Confidence</span>
                      <span className="sm-value">{Math.round((session.confidence || 0.97) * 100)}%</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Time</span>
                      <span className="sm-value">{new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gym Tab */}
      {selectedTab === 'gym' && (
        <div className="dash-tab-content">
          <div className="dash-card-header-row">
            <h3 className="dash-section-title">Gym Workouts ({gymWorkouts.length})</h3>
            <Link to="/gym">
              <button className="btn-primary-glow" style={{ padding: '8px 20px', fontSize: '13px' }}>
                + New Workout
              </button>
            </Link>
          </div>
          {gymWorkouts.length === 0 ? (
            <div className="dash-empty-full">
              <div className="dash-empty-icon">💪</div>
              <h3>No gym workouts yet</h3>
              <p>Start tracking your gym exercises with AI</p>
              <Link to="/gym"><button className="btn-primary-glow" style={{ marginTop: 16 }}>Start Gym Mode</button></Link>
            </div>
          ) : (
            <div className="sessions-grid">
              {gymWorkouts.slice().reverse().map((w, i) => (
                <div key={i} className="session-card">
                  <div className="session-card-header">
                    <div className="session-pose-badge gym">💪 {w.exerciseName || w.exerciseType}</div>
                    <span className="session-date">{new Date(w.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="session-metrics">
                    <div className="session-metric">
                      <span className="sm-label">Reps</span>
                      <span className="sm-value">{w.reps}</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Sets</span>
                      <span className="sm-value">{w.sets}</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Duration</span>
                      <span className="sm-value">{formatTime(w.duration)}</span>
                    </div>
                    <div className="session-metric">
                      <span className="sm-label">Calories</span>
                      <span className="sm-value">{w.caloriesBurned || '—'}</span>
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

export default Dashboard
