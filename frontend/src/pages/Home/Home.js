import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { VoiceCoach, AudioSynthesizer } from '../../utils/voiceCoach'
import './Home.css'
import AnatomyExperience from '../../components/AnatomyExperience'

const FEATURE_CARDS = [
  {
    icon: '🧘',
    title: 'Movement & Yoga Studio',
    desc: 'Real-time MoveNet Thunder AI with 28 Yoga disciplines. Sanskrit taxonomy, live joint angle badges, depth ROM, and spoken voice coaching.',
    path: '/start',
    color: '#8b5cf6',
    badge: '28 Poses Active',
  },
  {
    icon: '💪',
    title: 'Gym AI Strength Trainer',
    desc: 'Intelligent rep counter for 10 foundational strength exercises with form guidance, set telemetry, rest countdowns, and 3 skeleton themes.',
    path: '/gym',
    color: '#ef4444',
    badge: '10 Exercises',
  },
  {
    icon: '🎬',
    title: 'Video Biomechanics Lab',
    desc: 'Upload workout videos or record practice. Features 0.25x–2.0x playback, frame-by-frame stepper, native fullscreen theater, and exportable reports.',
    path: '/video-analysis',
    color: '#06b6d4',
    badge: 'Fullscreen Studio',
  },
  {
    icon: '📊',
    title: 'Fitness Intelligence Hub',
    desc: 'Visualize training streaks, yoga hold time, gym rep volume, calorie telemetry, and daily hydration tracking in one high-tech dashboard.',
    path: '/dashboard',
    color: '#10b981',
    badge: 'Analytics',
  },
  {
    icon: '📅',
    title: 'Smart Workout Planner',
    desc: 'Build weekly schedules with one-click routine presets (Mobility, Hypertrophy, Core Reset, HIIT), goal tracking, and direct exercise launches.',
    path: '/planner',
    color: '#f59e0b',
    badge: 'Auto-Presets',
  },
  {
    icon: '🥗',
    title: 'AI Vision Nutrition Studio',
    desc: 'Deep learning food recognition with spatial plate decomposition, Open Food Facts global database, macro gauges, and clinical Nutri-Score.',
    path: '/nutrition',
    color: '#10b981',
    badge: '100M+ Foods',
  },
]

const STATS = [
  { value: '28', label: 'Yoga Postures' },
  { value: '10', label: 'Gym Exercises' },
  { value: 'Thunder AI', label: 'MoveNet Precision' },
  { value: 'Voice Coach', label: 'Spoken AI Guidance' },
]

const HIGHLIGHTS = [
  {
    icon: '⚡',
    title: 'Real-Time Biomechanical Telemetry',
    text: 'MoveNet Thunder detects 17 skeletal keypoints at 30+ FPS, calculating precise joint angles and alignment accuracy on-device.',
    tone: '#8b5cf6',
  },
  {
    icon: '🗣️',
    title: 'Natural AI Voice Instruction',
    text: 'Hear hands-free posture cues, rep cadences, form error warnings, hold milestones, and rest timers without looking at your screen.',
    tone: '#06b6d4',
  },
  {
    icon: '🎥',
    title: 'Theater Video Biomechanics Lab',
    text: 'Inspect your movement frame-by-frame at 0.25x speed, verify range of motion, and export diagnostic PDF/JSON reports.',
    tone: '#10b981',
  },
]

const SAMPLE_INTERACTIVE_ITEMS = {
  yoga: [
    {
      id: 'tree',
      name: 'Tree Pose',
      sanskrit: 'Vrikshasana',
      level: 'Beginner',
      focus: 'Balance, hip stability & core grounding',
      angles: 'Knee 90° · Standing Leg 180° · Hips Level',
      muscles: ['Ankles', 'Calves', 'Core', 'Glutes'],
      cals: '4.5 kcal/min',
      cue: 'Stand tall on your grounded foot. Place sole against inner thigh or calf, never on knee joint. Hands at heart center.',
    },
    {
      id: 'warrior2',
      name: 'Warrior II',
      sanskrit: 'Virabhadrasana II',
      level: 'Beginner',
      focus: 'Hip opening, shoulder stamina & leg power',
      angles: 'Front Knee 90° · Back Leg 180° · Arms 180°',
      muscles: ['Quadriceps', 'Glutes', 'Deltoids', 'Pectorals'],
      cals: '5.8 kcal/min',
      cue: 'Sink deep into front thigh until parallel with floor. Gaze past front fingertips. Keep torso tall and centered.',
    },
    {
      id: 'dog',
      name: 'Downward Dog',
      sanskrit: 'Adho Mukha Svanasana',
      level: 'Beginner',
      focus: 'Hamstring length, spine decompression & shoulders',
      angles: 'Hip Flexion 70° · Arms 180° · Legs 175°',
      muscles: ['Hamstrings', 'Latissimus', 'Calves', 'Shoulders'],
      cals: '5.2 kcal/min',
      cue: 'Press palms flat and drive hips toward ceiling. Lengthen through your spine and press heels gently down.',
    },
    {
      id: 'cobra',
      name: 'Cobra Pose',
      sanskrit: 'Bhujangasana',
      level: 'Intermediate',
      focus: 'Spine extension, chest opening & posture alignment',
      angles: 'Spine Extension 140° · Elbows 150°',
      muscles: ['Erector Spinae', 'Chest', 'Shoulders', 'Glutes'],
      cals: '4.8 kcal/min',
      cue: 'Press the tops of feet down. Inhale as you lift chest using back strength, keeping elbows softly bent hugging ribs.',
    },
  ],
  gym: [
    {
      id: 'squat',
      name: 'Barbell/Bodyweight Squat',
      sanskrit: 'Lower Body Compound',
      level: 'All Levels',
      focus: 'Quad hypertrophy, glute power & knee tracking',
      angles: 'Knee Depth 80°-90° · Hip Drive 85°',
      muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
      cals: '8.2 kcal/min',
      cue: 'Feet shoulder-width apart. Break at hips and knees simultaneously. Keep chest elevated and drive through midfoot.',
    },
    {
      id: 'pushup',
      name: 'Standard Push-up',
      sanskrit: 'Upper Body Compound',
      level: 'All Levels',
      focus: 'Chest development, tricep lockout & rigid plank core',
      angles: 'Elbow Flexion 90° · Body Plank 180°',
      muscles: ['Pectorals', 'Triceps', 'Anterior Deltoids', 'Core'],
      cals: '7.5 kcal/min',
      cue: 'Maintain a rigid straight line from crown to heels. Lower until chest hovers an inch above ground, then press up decisively.',
    },
    {
      id: 'bicep_curl',
      name: 'Dumbbell Bicep Curl',
      sanskrit: 'Arm Isolation',
      level: 'Beginner',
      focus: 'Peak biceps contraction & strict elbow pinning',
      angles: 'ROM 40° to 160° · Elbow Pinning < 15° sway',
      muscles: ['Biceps Brachii', 'Brachialis', 'Forearms'],
      cals: '5.5 kcal/min',
      cue: 'Keep elbows tucked tightly to ribs. Curl weights upward with no hip swing, squeeze biceps hard at top, lower slowly.',
    },
    {
      id: 'plank',
      name: 'Isometric Core Plank',
      sanskrit: 'Anti-Extension Stability',
      level: 'All Levels',
      focus: 'Deep transverse abdominal bracing & spine stability',
      angles: 'Torso-Leg Angle 180° · Elbows 90°',
      muscles: ['Transverse Abdominis', 'Rectus Abdominis', 'Glutes'],
      cals: '6.0 kcal/min',
      cue: 'Elbows under shoulders. Brace core as if anticipating a punch. Keep glutes tight and prevent hips from sagging or hiking.',
    },
  ],
}

export default function Home() {
  const heroRef = useRef(null)
  const [activeTab, setActiveTab] = useState('yoga')
  const [selectedItem, setSelectedItem] = useState(SAMPLE_INTERACTIVE_ITEMS.yoga[0])
  const [isPlayingCue, setIsPlayingCue] = useState(false)
  const [voiceLang, setVoiceLang] = useState(() => VoiceCoach.getLanguage())

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Switch explorer tab
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSelectedItem(SAMPLE_INTERACTIVE_ITEMS[tab][0])
  }

  // Play audio cue
  const handlePlayVoiceCue = (item) => {
    try {
      setIsPlayingCue(true)
      AudioSynthesizer.playSuccessChime()
      if (activeTab === 'yoga') {
        VoiceCoach.instructYogaPoseStart({
          id: item.id,
          name: item.name,
          sanskrit: item.sanskrit,
          instructions: [item.cue],
        })
      } else {
        VoiceCoach.instructGymExerciseStart({ id: item.id, name: item.name }, { summary: item.cue })
      }
      setTimeout(() => setIsPlayingCue(false), 3800)
    } catch (e) {
      setIsPlayingCue(false)
    }
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-content">
          <div className="hero-badge animate-on-scroll">
            <span className="badge-dot" />
            MoveNet Thunder AI · 28 Yoga & 10 Gym Movements · Voice Coach
          </div>

          <h1 className="hero-title animate-on-scroll">
            Your AI-Powered
            <span className="hero-title-gradient"> Biomechanics Coach</span>
            <br />In Full Vision
          </h1>

          <p className="hero-subtitle animate-on-scroll">
            Real-time joint angle tracking, spoken voice coaching, rep counting, and multi-discipline video analysis. 
            Zero equipment required — runs 100% privately in your browser at 30+ FPS.
          </p>

          <div className="hero-actions animate-on-scroll">
            <Link to="/start">
              <button className="btn-primary-glow hero-cta-btn">
                🧘 Start Yoga (28 Poses)
              </button>
            </Link>
            <Link to="/gym">
              <button className="btn-ghost hero-secondary-btn">
                💪 Gym Trainer (10 Modes)
              </button>
            </Link>
            <Link to="/video-analysis">
              <button className="btn-ghost hero-secondary-btn">
                🎬 Video Biomechanics Lab
              </button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="hero-stats animate-on-scroll">
            {STATS.map((stat, i) => (
              <div key={i} className="hero-stat">
                <span className="hero-stat-value">{stat.value}</span>
                <span className="hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual with live simulated skeleton HUD */}
        <div className="hero-visual animate-on-scroll">
          <div className="hero-visual-card">
            <div className="skeleton-demo">
              <div className="skeleton-figure">
                <div className="skel-head" />
                <div className="skel-torso" />
                <div className="skel-arm-l" />
                <div className="skel-arm-r" />
                <div className="skel-leg-l" />
                <div className="skel-leg-r" />
                <div className="skel-dot" style={{ top: '10%', left: '50%' }} />
                <div className="skel-dot" style={{ top: '22%', left: '35%' }} />
                <div className="skel-dot" style={{ top: '22%', left: '65%' }} />
                <div className="skel-dot" style={{ top: '45%', left: '30%' }} />
                <div className="skel-dot" style={{ top: '45%', left: '70%' }} />
                <div className="skel-dot" style={{ top: '62%', left: '40%' }} />
                <div className="skel-dot" style={{ top: '62%', left: '60%' }} />
                <div className="skel-dot" style={{ top: '80%', left: '38%' }} />
                <div className="skel-dot" style={{ top: '80%', left: '62%' }} />
              </div>
              <div className="detection-label">
                <span className="detection-status">✓ MoveNet Thunder Locked</span>
                <span className="detection-pose">Tree Pose (Vrikshasana) — 98% Match</span>
              </div>
            </div>
          </div>
          <div className="hero-visual-glow" />
        </div>
      </section>

      {/* Insight Highlight Band */}
      <section className="insight-band animate-on-scroll">
        <div className="insight-grid">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="insight-card" style={{ '--tone': item.tone }}>
              <div className="insight-icon" style={{ background: `${item.tone}22`, borderColor: `${item.tone}55` }}>
                <span>{item.icon}</span>
              </div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Movement Explorer Preview */}
      <section className="interactive-explorer-section animate-on-scroll">
        <div className="section-header">
          <div className="studio-eyebrow">Interactive Biomechanics Lab</div>
          <h2 className="section-title">Explore Movements & Live Voice Cues</h2>
          <p className="section-subtitle">
            Click any movement to inspect its joint angles, active muscular engagement, and hear the AI Voice Coach cue.
          </p>
        </div>

        <div className="explorer-container glass-card">
          <div className="explorer-tabs">
            <button
              type="button"
              className={`explorer-tab-btn ${activeTab === 'yoga' ? 'active' : ''}`}
              onClick={() => handleTabChange('yoga')}
            >
              🧘 28 Yoga Postures
            </button>
            <button
              type="button"
              className={`explorer-tab-btn ${activeTab === 'gym' ? 'active' : ''}`}
              onClick={() => handleTabChange('gym')}
            >
              💪 10 Gym Movements
            </button>
          </div>

          <div className="explorer-grid">
            {/* Left list of items */}
            <div className="explorer-items-list">
              {SAMPLE_INTERACTIVE_ITEMS[activeTab].map((item) => {
                const isSelected = selectedItem.id === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`explorer-item-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="item-pill-header">
                      <span className="item-pill-name">{item.name}</span>
                      <span className="item-pill-level">{item.level}</span>
                    </div>
                    <span className="item-pill-sub">{item.sanskrit}</span>
                  </button>
                )
              })}
            </div>

            {/* Right detail showcase */}
            <div className="explorer-detail-pane">
              <div className="explorer-detail-header">
                <div>
                  <h3 className="explorer-detail-title">{selectedItem.name}</h3>
                  <p className="explorer-detail-sanskrit">{selectedItem.sanskrit}</p>
                </div>
                <div className="explorer-cals-badge">
                  <span>🔥 {selectedItem.cals}</span>
                </div>
              </div>

              <div className="explorer-telemetry-box">
                <div className="telemetry-box-row">
                  <span className="telemetry-label">📐 Target Joint Angles</span>
                  <span className="telemetry-val">{selectedItem.angles}</span>
                </div>
                <div className="telemetry-box-row">
                  <span className="telemetry-label">🎯 Movement Focus</span>
                  <span className="telemetry-val">{selectedItem.focus}</span>
                </div>
              </div>

              <div className="explorer-muscles-row">
                <span className="muscles-label">Muscles Activated:</span>
                <div className="muscles-chips">
                  {selectedItem.muscles.map((m) => (
                    <span key={m} className="muscle-chip">{m}</span>
                  ))}
                </div>
              </div>

              <div className="explorer-cue-box">
                <span className="cue-box-header">🗣️ AI Voice Coach Cue:</span>
                <p className="cue-box-text">"{selectedItem.cue}"</p>
              </div>

              <div className="explorer-action-row">
                <button
                  type="button"
                  className={`btn-ghost cue-sound-btn ${isPlayingCue ? 'playing' : ''}`}
                  onClick={() => handlePlayVoiceCue(selectedItem)}
                  disabled={isPlayingCue}
                >
                  <span>
                    {isPlayingCue
                      ? (voiceLang === 'hi' ? '🔊 बोल रहे हैं...' : '🔊 Speaking...')
                      : (voiceLang === 'hi' ? '🔊 हिंदी आवाज़ सुनें' : '🔊 Hear Voice Cue')}
                  </span>
                </button>

                <button
                  type="button"
                  className="btn-ghost lang-switch-pill"
                  onClick={() => {
                    const next = VoiceCoach.toggleLanguage()
                    setVoiceLang(next)
                    VoiceCoach.testVoice(next)
                  }}
                  title="Switch Voice Coach between English and Hindi"
                >
                  <span>🌐 {voiceLang === 'hi' ? 'हिंदी (Hindi)' : 'English (EN)'}</span>
                </button>

                <Link to={activeTab === 'yoga' ? '/start' : '/gym'}>
                  <button type="button" className="btn-primary-glow">
                    🚀 Launch Practice
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Anatomy Visualizer Section */}
      <AnatomyExperience />

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-header animate-on-scroll">
          <div className="studio-eyebrow">Comprehensive Platform</div>
          <h2 className="section-title">Everything You Need To Master Form</h2>
          <p className="section-subtitle">A state-of-the-art AI fitness laboratory built directly into your browser</p>
        </div>

        <div className="features-grid">
          {FEATURE_CARDS.map((card, i) => (
            <Link to={card.path} key={i} className="feature-link">
              <div
                className="feature-card-new animate-on-scroll"
                style={{ '--card-color': card.color, '--delay': `${i * 0.08}s` }}
              >
                <div className="feature-card-header">
                  <div className="feature-icon-wrap" style={{ background: `${card.color}20`, border: `1px solid ${card.color}40` }}>
                    <span className="feature-icon-emoji">{card.icon}</span>
                  </div>
                  <span className="feature-badge" style={{ color: card.color, background: `${card.color}15`, border: `1px solid ${card.color}30` }}>
                    {card.badge}
                  </span>
                </div>
                <h3 className="feature-title">{card.title}</h3>
                <p className="feature-desc">{card.desc}</p>
                <div className="feature-arrow" style={{ color: card.color }}>
                  Launch Studio →
                </div>
                <div className="feature-card-glow" style={{ background: `radial-gradient(circle at 0% 100%, ${card.color}20, transparent 60%)` }} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-section animate-on-scroll">
        <div className="section-header">
          <div className="studio-eyebrow">Simple Workflow</div>
          <h2 className="section-title">How FitVision Works</h2>
          <p className="section-subtitle">Three effortless steps to instant AI posture feedback</p>
        </div>

        <div className="steps-row">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon">📷</div>
            <h3>Allow Camera or Upload</h3>
            <p>Grant camera permission for live training or drop any recorded workout video.</p>
          </div>
          <div className="step-connector">
            <div className="connector-line" />
            <div className="connector-dot" />
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon">🤸</div>
            <h3>Perform & Listen</h3>
            <p>MoveNet AI locks your skeleton in real-time while Voice Coach speaks cues and counts reps.</p>
          </div>
          <div className="step-connector">
            <div className="connector-line" />
            <div className="connector-dot" />
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon">📈</div>
            <h3>Analyze & Improve</h3>
            <p>Review hold stability, rep velocity, and joint angles seamlessly.</p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-section animate-on-scroll">
        <div className="cta-content">
          <h2>Ready to Train with AI Precision?</h2>
          <p>Experience real-time biomechanics feedback, spoken voice coaching, and complete fitness tracking.</p>
          <div className="cta-actions">
            <Link to="/start">
              <button className="btn-primary-glow">🧘 Start Yoga (28)</button>
            </Link>
            <Link to="/gym">
              <button className="btn-primary-glow" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
                💪 Gym Rep Tracker (10)
              </button>
            </Link>
            <Link to="/video-analysis">
              <button className="btn-ghost">🎬 Fullscreen Video Lab</button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
