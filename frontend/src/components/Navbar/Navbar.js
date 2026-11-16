import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { VoiceCoach } from '../../utils/voiceCoach'
import './Navbar.css'

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/start', label: 'Yoga (8)', icon: '🧘' },
  { path: '/gym', label: 'Gym (15)', icon: '💪' },
  { path: '/food-analyzer', label: 'Food Vision (256)', icon: '🥗' },
  { path: '/video-analysis', label: 'Video Analysis', icon: '🎬' },
  { path: '/planner', label: 'Planner', icon: '📅' },
  { path: '/history', label: 'History', icon: '📋' },
]

export default function Navbar({ collapsed, setCollapsed }) {
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState(null)
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try {
      return VoiceCoach.getSettings().voiceEnabled
    } catch (e) {
      return true
    }
  })
  const [voiceLang, setVoiceLang] = useState(() => {
    try {
      return VoiceCoach.getLanguage()
    } catch (e) {
      return 'en'
    }
  })

  // Synchronize language state across windows/routes
  useEffect(() => {
    const handleStorage = () => {
      setVoiceLang(VoiceCoach.getLanguage())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const toggleVoice = () => {
    const next = !voiceEnabled
    setVoiceEnabled(next)
    VoiceCoach.configure({ voiceEnabled: next })
  }

  const toggleLanguage = () => {
    const next = VoiceCoach.toggleLanguage()
    setVoiceLang(next)
    VoiceCoach.testVoice(next)
  }

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="navbar-overlay"
          onClick={() => setCollapsed(true)}
        />
      )}

      <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Logo area */}
        <div className="sidebar-logo">
          {collapsed ? (
            <button
              className="sidebar-expand-toggle-btn"
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              type="button"
            >
              <span className="expand-logo-glow">⚡</span>
              <span className="expand-chevron">›</span>
            </button>
          ) : (
            <>
              <div className="logo-icon" title="FitVision AI Studio">
                <span>⚡</span>
              </div>
              <div className="logo-text">
                <span className="logo-name">FitVision</span>
                <span className="logo-sub">AI STUDIO</span>
              </div>
              <button
                className="collapse-btn"
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                type="button"
              >
                ‹
              </button>
            </>
          )}
        </div>

        <div className="sidebar-divider" />

        {/* Navigation items */}
        <ul className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                  title={collapsed ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                  {isActive && <span className="nav-active-dot" />}
                  {collapsed && hoveredItem === item.path && (
                    <div className="nav-tooltip">{item.label}</div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Bottom area */}
        <div className="sidebar-footer">
          <div className="ai-status">
            <span className="status-dot" />
            {!collapsed && <span className="status-text">MoveNet Thunder Live</span>}
          </div>
          {!collapsed ? (
            <div className="sidebar-voice-group">
              <button
                className={`voice-status-pill ${voiceEnabled ? '' : 'muted'}`}
                type="button"
                onClick={toggleVoice}
                title="Click to toggle AI Voice Coach across all workouts"
              >
                <span>{voiceEnabled ? '🔊' : '🔇'}</span>
                <span>{voiceEnabled ? 'Voice ON' : 'Voice OFF'}</span>
              </button>
              <button
                className="voice-lang-pill"
                type="button"
                onClick={toggleLanguage}
                title="Switch voice coaching language between English and Hindi (हिंदी)"
              >
                <span>🌐</span>
                <span>{voiceLang === 'hi' ? 'हिंदी' : 'English'}</span>
              </button>
            </div>
          ) : (
            <div className="sidebar-voice-group collapsed-voice-group">
              <button
                className={`voice-status-pill mini-pill ${voiceEnabled ? '' : 'muted'}`}
                type="button"
                onClick={toggleVoice}
                title={voiceEnabled ? 'AI Voice Coach: ON' : 'AI Voice Coach: Muted'}
              >
                <span>{voiceEnabled ? '🔊' : '🔇'}</span>
              </button>
              <button
                className="voice-lang-pill mini-pill"
                type="button"
                onClick={toggleLanguage}
                title={`Language: ${voiceLang === 'hi' ? 'हिंदी' : 'English'}`}
              >
                <span>{voiceLang === 'hi' ? 'हि' : 'EN'}</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
