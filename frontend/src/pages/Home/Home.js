import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

const FEATURE_CARDS = [
  {
    icon: '🧘',
    title: 'Live Yoga Detection',
    desc: 'Real-time AI pose detection with skeleton overlay and confidence scoring. Master 7 yoga poses with instant feedback.',
    path: '/start',
    color: '#8b5cf6',
    badge: 'MoveNet AI',
  },
  {
    icon: '💪',
    title: 'Gym Workout Tracker',
    desc: 'AI-powered rep counting for squats, push-ups & bicep curls. Get real-time form feedback to prevent injuries.',
    path: '/gym',
    color: '#ef4444',
    badge: 'Rep Counter',
  },
  {
    icon: '🎬',
    title: 'Video Analysis',
    desc: 'Upload any workout video and let AI analyze your pose frame-by-frame. Get detailed performance reports.',
    path: '/video-analysis',
    color: '#06b6d4',
    badge: 'New ✨',
  },
  {
    icon: '📊',
    title: 'Dashboard',
    desc: 'Visualize your fitness journey with comprehensive analytics, streak tracking, and progress charts.',
    path: '/dashboard',
    color: '#10b981',
    badge: 'Analytics',
  },
  {
    icon: '📅',
    title: 'Workout Planner',
    desc: 'Plan your entire week with smart scheduling. Set goals and get personalized workout recommendations.',
    path: '/planner',
    color: '#f59e0b',
    badge: 'Planner',
  },
  {
    icon: '🥗',
    title: 'Nutrition Tracker',
    desc: 'Log meals, track calories, macros and micronutrients. Sync with your workout data for optimal results.',
    path: '/nutrition',
    color: '#ec4899',
    badge: 'Nutrition',
  },
]

const STATS = [
  { value: '7+', label: 'Yoga Poses' },
  { value: '3+', label: 'Gym Exercises' },
  { value: 'Real-time', label: 'AI Detection' },
  { value: '100%', label: 'Browser-based' },
]

export default function Home() {
  const heroRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-content">
          <div className="hero-badge animate-on-scroll">
            <span className="badge-dot" />
            Powered by TensorFlow.js & MoveNet AI
          </div>

          <h1 className="hero-title animate-on-scroll">
            Your AI-Powered
            <span className="hero-title-gradient"> Fitness Trainer</span>
            <br />Is Here
          </h1>

          <p className="hero-subtitle animate-on-scroll">
            Real-time pose detection, workout tracking, and video analysis — 
            all powered by cutting-edge computer vision. No app, no equipment. 
            Just your browser and camera.
          </p>

          <div className="hero-actions animate-on-scroll">
            <Link to="/start">
              <button className="btn-primary-glow hero-cta-btn">
                🧘 Start Yoga Training
              </button>
            </Link>
            <Link to="/video-analysis">
              <button className="btn-ghost hero-secondary-btn">
                🎬 Analyze a Video
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

        {/* Hero visual */}
        <div className="hero-visual animate-on-scroll">
          <div className="hero-visual-card">
            <div className="skeleton-demo">
              <div className="skeleton-figure">
                {/* Animated skeleton lines */}
                <div className="skel-head" />
                <div className="skel-torso" />
                <div className="skel-arm-l" />
                <div className="skel-arm-r" />
                <div className="skel-leg-l" />
                <div className="skel-leg-r" />
                {/* Glowing dots at joints */}
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
                <span className="detection-status">✓ Pose Detected</span>
                <span className="detection-pose">Tree Pose — 97%</span>
              </div>
            </div>
          </div>
          <div className="hero-visual-glow" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-header animate-on-scroll">
          <h2 className="section-title">Everything You Need</h2>
          <p className="section-subtitle">Complete AI fitness platform in your browser</p>
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
                  Launch →
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
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Three simple steps to start your AI fitness journey</p>
        </div>

        <div className="steps-row">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon">📷</div>
            <h3>Allow Camera</h3>
            <p>Grant camera permission to enable real-time pose detection</p>
          </div>
          <div className="step-connector">
            <div className="connector-line" />
            <div className="connector-dot" />
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon">🤸</div>
            <h3>Perform Exercises</h3>
            <p>Do yoga poses or gym exercises — AI detects and analyzes in real-time</p>
          </div>
          <div className="step-connector">
            <div className="connector-line" />
            <div className="connector-dot" />
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon">📈</div>
            <h3>Track Progress</h3>
            <p>View detailed analytics, history, and improve with AI feedback</p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-section animate-on-scroll">
        <div className="cta-content">
          <h2>Ready to Train Smarter?</h2>
          <p>Join thousands using FitVision AI to perfect their form</p>
          <div className="cta-actions">
            <Link to="/start">
              <button className="btn-primary-glow">🧘 Start Yoga</button>
            </Link>
            <Link to="/video-analysis">
              <button className="btn-ghost">🎬 Upload Video</button>
            </Link>
            <Link to="/gym">
              <button className="btn-ghost">💪 Gym Mode</button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
