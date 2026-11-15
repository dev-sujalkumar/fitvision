import React from 'react'
import './Tutorials.css'
import { tutorials, fixCamera } from '../../utils/data'

export default function Tutorials() {
  const BEST_PRACTICES = [
    { icon: '💡', title: 'Lighting', tip: 'Face a soft light source. Avoid strong backlighting or dark shadows that obscure your limbs.' },
    { icon: '📏', title: 'Distance', tip: 'Stand 6 to 9 feet (2 to 3 meters) away so your entire body from head to feet is inside the camera frame.' },
    { icon: '🧘', title: 'Clothing', tip: 'Fitted workout clothing helps MoveNet distinguish joint articulations with higher precision.' },
    { icon: '🎯', title: 'Camera Angle', tip: 'Position your device at roughly chest or waist height on a stable surface for consistent tracking.' },
  ]

  return (
    <div className="tut-page">
      <div className="tut-header">
        <div className="tut-badge">📚 Guides & Best Practices</div>
        <h1 className="tut-title">How to Use FitVision AI</h1>
        <p className="tut-sub">Master your workout with real-time computer vision guidance and camera setup tips.</p>
      </div>

      <div className="tut-grid">
        {/* Step by step guide */}
        <div className="tut-card">
          <h2 className="tut-section-heading">⚡ Quick Start Tutorial</h2>
          <div className="tut-steps-list">
            {tutorials.map((step, idx) => {
              // Strip leading number if present
              const cleanText = step.replace(/^\d+\.\s*/, '')
              return (
                <div key={idx} className="tut-step-item">
                  <div className="tut-step-num">{idx + 1}</div>
                  <p className="tut-step-text">{cleanText}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right side: Best practices & Camera Troubleshooting */}
        <div className="tut-side-col">
          {/* Best Practices */}
          <div className="tut-card">
            <h2 className="tut-section-heading">🎯 Optimal Tracking Setup</h2>
            <div className="tut-practices-grid">
              {BEST_PRACTICES.map((bp, i) => (
                <div key={i} className="tut-practice-item">
                  <span className="practice-icon">{bp.icon}</span>
                  <div>
                    <h4 className="practice-title">{bp.title}</h4>
                    <p className="practice-tip">{bp.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Camera Troubleshooter */}
          <div className="tut-card camera-trouble-card">
            <h2 className="tut-section-heading">📷 Camera Not Working?</h2>
            <div className="trouble-list">
              {fixCamera.map((fix, idx) => {
                const parts = fix.split(':')
                const solLabel = parts[0] || `Step ${idx + 1}`
                const solDesc = parts[1] || fix
                return (
                  <div key={idx} className="trouble-item">
                    <span className="trouble-badge">{solLabel}</span>
                    <p className="trouble-desc">{solDesc.trim()}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
