import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'

import Navbar from './components/Navbar/Navbar'
import TopBar from './components/TopBar/TopBar'
import CommandPalette from './components/CommandPalette/CommandPalette'
import Home from './pages/Home/Home'
import Yoga from './pages/Yoga/Yoga'
import Gym from './pages/Gym/Gym'
import Dashboard from './pages/Dashboard/Dashboard'
import WorkoutHistory from './pages/WorkoutHistory/WorkoutHistory'
import WorkoutPlanner from './pages/WorkoutPlanner/WorkoutPlanner'
import VideoAnalysis from './pages/VideoAnalysis/VideoAnalysis'
import Nutrition from './pages/Nutrition/Nutrition'

import './App.css'

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  // Listen for Ctrl+K / Cmd+K global shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const sidebarWidth = sidebarCollapsed ? 68 : 240

  return (
    <Router>
      <div className="app-layout">
        <button className="mobile-menu-toggle" type="button" aria-label="Open navigation" onClick={() => setSidebarCollapsed(false)}>☰</button>

        <Navbar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        <main
          className="app-main page-content"
          style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}
        >
          <TopBar
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />

          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/start' element={<Yoga />} />
            <Route path='/gym' element={<Gym />} />
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/history' element={<WorkoutHistory />} />
            <Route path='/planner' element={<WorkoutPlanner />} />
            <Route path='/video-analysis' element={<VideoAnalysis />} />
            <Route path='/nutrition' element={<Nutrition />} />
            <Route path='/about' element={<Navigate to="/" replace />} />
            <Route path='/tutorials' element={<Navigate to="/" replace />} />
            <Route path='*' element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
      </div>
    </Router>
  )
}
