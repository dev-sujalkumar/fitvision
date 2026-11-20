import React, { useState } from 'react'

const GROUPS = [
  {
    name: 'Chest',
    icon: '🛡️',
    detail: 'Pectoralis major and minor drive horizontal adduction, pressing power, and shoulder stability.',
    exercises: 'Push-ups · Chest Flyes · Incline Press',
    cues: 'Keep shoulder blades retracted and engaged.',
    muscles: ['Upper Pecs', 'Lower Pecs', 'Anterior Deltoids'],
  },
  {
    name: 'Arms',
    icon: '💪',
    detail: 'Biceps, triceps, and forearms control elbow flexion/extension and grip endurance.',
    exercises: 'Bicep Curls · Tricep Dips · Hammer Curls',
    cues: 'Avoid swinging; emphasize peak isometric contraction.',
    muscles: ['Biceps Brachii', 'Triceps Lateral', 'Brachioradialis'],
  },
  {
    name: 'Core',
    icon: '⚡',
    detail: 'Rectus abdominis, obliques, and transverse abdominis stabilize the spine and transfer kinetic force.',
    exercises: 'Planks · Mountain Climbers · Deadbugs',
    cues: 'Draw the navel inwards and avoid arching the lower lumbar spine.',
    muscles: ['Rectus Abdominis', 'Internal Obliques', 'Transverse Core'],
  },
  {
    name: 'Legs',
    icon: '🦵',
    detail: 'Quadriceps, hamstrings, glutes, and calves generate explosive power, balance, and locomotion.',
    exercises: 'Squats · Lunges · Glute Bridges',
    cues: 'Drive through mid-foot and maintain knee-tracking over toes.',
    muscles: ['Quadriceps', 'Hamstrings', 'Gluteus Maximus', 'Gastrocnemius'],
  },
]

export default function AnatomyExperience() {
  const [selected, setSelected] = useState('Chest')
  const [viewAngle, setViewAngle] = useState('front') // 'front' or 'back'

  const active = GROUPS.find((g) => g.name === selected) || GROUPS[0]

  return (
    <section className="anatomy-section" aria-labelledby="anatomy-title">
      <div className="anatomy-copy">
        <span className="eyebrow">
          <i /> MOVEMENT, UNDER THE SURFACE
        </span>
        <h2 id="anatomy-title">
          Know what<br />
          <em>you’re training.</em>
        </h2>
        <p>Explore biomechanics, select a target muscle group, and optimize movement patterns for maximum hypertrophy and injury prevention.</p>

        <div className="muscle-picker" aria-label="Select a muscle group">
          {GROUPS.map((group) => (
            <button
              key={group.name}
              type="button"
              className={selected === group.name ? 'selected' : ''}
              onClick={() => setSelected(group.name)}
            >
              <span style={{ marginRight: 6 }}>{group.icon}</span>
              {group.name}
            </button>
          ))}
        </div>

        <div className="anatomy-detail" aria-live="polite">
          <span className="detail-index">TRAINING FOCUS · {active.name.toUpperCase()}</span>
          <strong>{active.name} Biomechanics</strong>
          <p>{active.detail}</p>
          <div style={{ marginTop: 8 }}>
            <small style={{ display: 'block', color: '#c4b5fd', marginBottom: 4 }}>
              <strong>Key Exercises:</strong> {active.exercises}
            </small>
            <small style={{ display: 'block', color: '#34d399' }}>
              <strong>Form Cue:</strong> {active.cues}
            </small>
          </div>
        </div>
      </div>

      <div className="anatomy-stage">
        <div className="stage-topline">
          <span>ANATOMY MATRIX / 01</span>
          <span>{viewAngle === 'front' ? 'FRONT ANTERIOR' : 'BACK POSTERIOR'}</span>
        </div>

        <div className="anatomy-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative' }}>
          {/* Stylized Anatomical SVG Model with Dynamic Muscle Highlights */}
          <svg viewBox="0 0 300 440" style={{ width: '100%', height: '85%', filter: 'drop-shadow(0 0 25px rgba(139,92,246,0.3))' }}>
            <defs>
              <radialGradient id="grad-core" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
              </radialGradient>
              <radialGradient id="grad-active" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
              </radialGradient>
            </defs>

            {/* Base Body Silhouette */}
            <path
              d="M150 25 C162 25 170 35 170 48 C170 60 162 70 150 70 C138 70 130 60 130 48 C130 35 138 25 150 25 Z"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
            />
            {/* Neck */}
            <rect x="144" y="68" width="12" height="18" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" />

            {/* Torso outline */}
            <path
              d="M110 86 L190 86 L175 180 L125 180 Z"
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
            />

            {/* Pelvis */}
            <polygon points="125,180 175,180 165,220 135,220" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" />

            {/* Arms - Left */}
            <path
              d="M108 88 L85 150 L75 220"
              stroke={selected === 'Arms' ? '#8b5cf6' : 'rgba(255,255,255,0.2)'}
              strokeWidth={selected === 'Arms' ? '14' : '10'}
              strokeLinecap="round"
              fill="none"
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => setSelected('Arms')}
            />
            {/* Arms - Right */}
            <path
              d="M192 88 L215 150 L225 220"
              stroke={selected === 'Arms' ? '#8b5cf6' : 'rgba(255,255,255,0.2)'}
              strokeWidth={selected === 'Arms' ? '14' : '10'}
              strokeLinecap="round"
              fill="none"
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => setSelected('Arms')}
            />

            {/* Legs - Left */}
            <path
              d="M135 220 L130 310 L125 410"
              stroke={selected === 'Legs' ? '#10b981' : 'rgba(255,255,255,0.2)'}
              strokeWidth={selected === 'Legs' ? '16' : '12'}
              strokeLinecap="round"
              fill="none"
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => setSelected('Legs')}
            />
            {/* Legs - Right */}
            <path
              d="M165 220 L170 310 L175 410"
              stroke={selected === 'Legs' ? '#10b981' : 'rgba(255,255,255,0.2)'}
              strokeWidth={selected === 'Legs' ? '16' : '12'}
              strokeLinecap="round"
              fill="none"
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => setSelected('Legs')}
            />

            {/* Chest Highlight */}
            <path
              d="M120 95 C135 90 145 92 150 98 C155 92 165 90 180 95 C176 125 158 135 150 135 C142 135 124 125 120 95 Z"
              fill={selected === 'Chest' ? 'url(#grad-active)' : 'rgba(255,255,255,0.06)'}
              stroke={selected === 'Chest' ? '#8b5cf6' : 'rgba(255,255,255,0.2)'}
              strokeWidth="2"
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => setSelected('Chest')}
            />

            {/* Core Highlight */}
            <rect
              x="132"
              y="140"
              width="36"
              height="38"
              rx="6"
              fill={selected === 'Core' ? 'url(#grad-core)' : 'rgba(255,255,255,0.04)'}
              stroke={selected === 'Core' ? '#3b82f6' : 'rgba(255,255,255,0.2)'}
              strokeWidth="2"
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onClick={() => setSelected('Core')}
            />

            {/* Joint Nodes */}
            <circle cx="150" cy="48" r="4" fill="#ffffff" />
            <circle cx="108" cy="88" r="4" fill={selected === 'Arms' ? '#8b5cf6' : '#ffffff'} />
            <circle cx="192" cy="88" r="4" fill={selected === 'Arms' ? '#8b5cf6' : '#ffffff'} />
            <circle cx="85" cy="150" r="3.5" fill={selected === 'Arms' ? '#8b5cf6' : '#ffffff'} />
            <circle cx="215" cy="150" r="3.5" fill={selected === 'Arms' ? '#8b5cf6' : '#ffffff'} />
            <circle cx="130" cy="310" r="4.5" fill={selected === 'Legs' ? '#10b981' : '#ffffff'} />
            <circle cx="170" cy="310" r="4.5" fill={selected === 'Legs' ? '#10b981' : '#ffffff'} />
          </svg>

          {/* Active Muscle Floating Tag */}
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              background: 'rgba(12, 12, 28, 0.92)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: 100,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 700,
              color: '#c4b5fd',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            Active Target: {active.name}
          </div>
        </div>

        <div className="model-controls">
          <span>CLICK REGION TO INSPECT</span>
          <button type="button" onClick={() => setViewAngle(viewAngle === 'front' ? 'back' : 'front')}>
            {viewAngle === 'front' ? '01 / ANTERIOR VIEW' : '02 / POSTERIOR VIEW'} <b>↻</b>
          </button>
        </div>
      </div>
    </section>
  )
}
