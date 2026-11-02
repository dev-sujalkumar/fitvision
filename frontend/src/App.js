import React, { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import Navbar from './components/Navbar/Navbar'
import Home from './pages/Home/Home'
import Yoga from './pages/Yoga/Yoga'
import Gym from './pages/Gym/Gym'
import Dashboard from './pages/Dashboard/Dashboard'
import WorkoutHistory from './pages/WorkoutHistory/WorkoutHistory'
import WorkoutPlanner from './pages/WorkoutPlanner/WorkoutPlanner'
import Nutrition from './pages/Nutrition/Nutrition'
import About from './pages/About/About'
import Tutorials from './pages/Tutorials/Tutorials'
import VideoAnalysis from './pages/VideoAnalysis/VideoAnalysis'

import './App.css'

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const sidebarWidth = sidebarCollapsed ? 68 : 240

  return (
    <Router>
      <div className="app-layout">
        {/* Background orbs */}
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />

        <Navbar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        <main
          className="app-main page-content"
          style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}
        >
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/start' element={<Yoga />} />
            <Route path='/gym' element={<Gym />} />
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/history' element={<WorkoutHistory />} />
            <Route path='/planner' element={<WorkoutPlanner />} />
            <Route path='/nutrition' element={<Nutrition />} />
            <Route path='/about' element={<About />} />
            <Route path='/tutorials' element={<Tutorials />} />
            <Route path='/video-analysis' element={<VideoAnalysis />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
