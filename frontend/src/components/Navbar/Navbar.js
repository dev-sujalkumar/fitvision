import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/start', label: 'Yoga', icon: '🧘' },
  { path: '/gym', label: 'Gym', icon: '💪' },
  { path: '/video-analysis', label: 'Video Analysis', icon: '🎬' },
  { path: '/planner', label: 'Planner', icon: '📅' },
  { path: '/nutrition', label: 'Nutrition', icon: '🥗' },
  { path: '/history', label: 'History', icon: '📋' },
  { path: '/tutorials', label: 'Tutorials', icon: '📚' },
  { path: '/about', label: 'About', icon: 'ℹ️' },
]

export default function Navbar({ collapsed, setCollapsed }) {
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState(null)

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
          <div className="logo-icon">
            <span>⚡</span>
          </div>
          {!collapsed && (
            <div className="logo-text">
              <span className="logo-name">FitVision</span>
              <span className="logo-sub">AI</span>
            </div>
          )}
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>
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
            {!collapsed && <span className="status-text">AI Ready</span>}
          </div>
        </div>
      </nav>
    </>
  )
}
