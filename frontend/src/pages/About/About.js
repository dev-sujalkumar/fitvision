import React from 'react'
import './About.css'

export default function About() {
  const TECH_STACK = [
    { name: 'TensorFlow.js', role: 'In-Browser Deep Learning' },
    { name: 'MoveNet Thunder', role: 'Real-time Pose Estimation' },
    { name: 'React 18', role: 'Modern UI & Component Architecture' },
    { name: 'Webcam API', role: 'Zero-Latency Stream Ingestion' },
    { name: 'HTML5 Canvas', role: 'Dynamic Skeletal Rendering' },
    { name: 'IndexedDB / Storage', role: 'Local Analytics & Session Logs' },
  ]

  return (
    <div className="about-page">
      <div className="about-header">
        <div className="about-badge">ℹ️ System Architecture & Credits</div>
        <h1 className="about-title">About FitVision AI</h1>
        <p className="about-sub">Next-generation computer vision fitness tracking directly inside your web browser.</p>
      </div>

      <div className="about-grid">
        {/* Main story card */}
        <div className="about-card story-card">
          <h2 className="card-heading">🎯 Project Mission</h2>
          <p className="about-text">
            <strong>FitVision AI</strong> is an intelligent, privacy-first computer vision fitness trainer designed to democratize professional movement feedback. By bringing deep learning models directly into client-side JavaScript, your video never leaves your device — offering instant feedback with zero cloud latency and complete privacy.
          </p>
          <p className="about-text">
            The pipeline leverages <strong>TensorFlow MoveNet Thunder</strong> to detect 17 precise anatomical keypoints at 30+ frames per second. An auxiliary classification neural network analyzes normalized joint angles and euclidean distances to validate yoga poses (with 95%+ precision) and track gym repetitions with form correction cues.
          </p>

          <h3 className="card-subheading">⚡ Core Technologies</h3>
          <div className="tech-chips-grid">
            {TECH_STACK.map((tech, idx) => (
              <div key={idx} className="tech-chip">
                <span className="tech-name">{tech.name}</span>
                <span className="tech-role">{tech.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Developer & Community Card */}
        <div className="about-card dev-card">
          <div className="dev-avatar">⚡</div>
          <h2 className="dev-name">Harsh Bhatt</h2>
          <p className="dev-title">Full Stack & AI Engineer</p>
          <p className="dev-bio">
            Passionate about bringing cutting-edge computer vision into accessible web applications. Content creator, developer, and open-source advocate.
          </p>

          <div className="about-divider" />

          <h3 className="card-subheading">🔗 Project Links</h3>
          <div className="links-list">
            <a href="https://github.com/harshbhatt7585/YogaIntelliJ" target="_blank" rel="noreferrer" className="about-link-pill">
              <span className="link-icon">📦</span>
              <span className="link-text">GitHub Repository</span>
              <span className="link-arrow">↗</span>
            </a>
            <a href="https://www.youtube.com/channel/UCiD7kslR7lKSaPGSQ-heOWg" target="_blank" rel="noreferrer" className="about-link-pill">
              <span className="link-icon">📺</span>
              <span className="link-text">YouTube Channel</span>
              <span className="link-arrow">↗</span>
            </a>
            <a href="https://www.instagram.com/codedharsh75/" target="_blank" rel="noreferrer" className="about-link-pill">
              <span className="link-icon">📸</span>
              <span className="link-text">Instagram</span>
              <span className="link-arrow">↗</span>
            </a>
          </div>

          <div className="open-source-badge">
            <span className="badge-pulse" />
            <span>Open Source & Community Driven</span>
          </div>
        </div>
      </div>
    </div>
  )
}
