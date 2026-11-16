import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import VoiceCoach from '../../utils/voiceCoach';
import './TopBar.css';

export default function TopBar({ sidebarCollapsed, onToggleSidebar, onOpenCommandPalette }) {
  const location = useLocation();
  const [voiceLang, setVoiceLang] = useState(() => VoiceCoach.getLanguage());
  const [voiceEnabled, setVoiceEnabled] = useState(() => VoiceCoach.getSettings().voiceEnabled);

  useEffect(() => {
    const handleStorage = () => {
      setVoiceLang(VoiceCoach.getLanguage());
      setVoiceEnabled(VoiceCoach.getSettings().voiceEnabled);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    VoiceCoach.configure({ voiceEnabled: next });
  };

  const handleToggleLang = () => {
    const next = VoiceCoach.toggleLanguage();
    setVoiceLang(next);
    VoiceCoach.testVoice(next);
  };

  return (
    <header className="optimus-topbar">
      {/* Sidebar toggle button */}
      <button
        type="button"
        className="topbar-sidebar-toggle"
        onClick={onToggleSidebar}
        title={sidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
        aria-label="Toggle navigation sidebar"
      >
        <span className="sidebar-toggle-glyph">{sidebarCollapsed ? '☰' : '◨'}</span>
      </button>

      {/* Search trigger button */}
      <button
        type="button"
        className="topbar-search-btn"
        onClick={onOpenCommandPalette}
        title="Open Global Search (Ctrl + K)"
      >
        <span className="search-icon-symbol">🔍</span>
        <span className="search-placeholder">Search 8 poses, 15 exercises, 256 foods...</span>
        <span className="search-shortcut-badge">⌘K / Ctrl+K</span>
      </button>

      {/* Quick discipline links */}
      <nav className="topbar-quick-nav">
        <Link
          to="/start"
          className={`quick-nav-pill ${location.pathname === '/start' ? 'active' : ''}`}
        >
          <span>🧘</span> Yoga (8)
        </Link>
        <Link
          to="/gym"
          className={`quick-nav-pill ${location.pathname === '/gym' ? 'active' : ''}`}
        >
          <span>💪</span> Gym AI (15)
        </Link>
        <Link
          to="/food-analyzer"
          className={`quick-nav-pill ${location.pathname === '/food-analyzer' || location.pathname === '/nutrition' ? 'active' : ''}`}
        >
          <span>🥗</span> Food Vision AI
        </Link>
        <Link
          to="/video-analysis"
          className={`quick-nav-pill ${location.pathname === '/video-analysis' ? 'active' : ''}`}
        >
          <span>🎬</span> Video Lab
        </Link>
      </nav>

      {/* Right controls: AI engine telemetry, voice toggle, language toggle */}
      <div className="topbar-right-controls">
        <div className="telemetry-chip">
          <span className="chip-dot-live" />
          <span className="chip-text">MoveNet 60FPS</span>
        </div>

        <button
          type="button"
          className={`topbar-pill-btn ${voiceEnabled ? 'active' : 'muted'}`}
          onClick={handleToggleVoice}
          title={voiceEnabled ? 'Voice Coach Active (Click to Mute)' : 'Voice Coach Muted (Click to Enable)'}
        >
          <span>{voiceEnabled ? '🔊' : '🔇'}</span>
          <span className="btn-hide-mobile">{voiceEnabled ? 'Voice' : 'Muted'}</span>
        </button>

        <button
          type="button"
          className="topbar-pill-btn lang-toggle"
          onClick={handleToggleLang}
          title="Switch Voice Coaching between English and Hindi"
        >
          <span>🌐</span>
          <span>{voiceLang === 'hi' ? 'हिंदी' : 'EN'}</span>
        </button>
      </div>
    </header>
  );
}
