import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { YOGA_POSES } from '../../utils/yogaPoseLibrary';
import { EXERCISE_PATTERNS } from '../../utils/gymExercises';
import { FOOD_NUTRIENTS } from '../../utils/foodNutrition';
import './CommandPalette.css';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Aggregate all searchable items
  const allCommands = [
    // Core App Destinations
    { id: 'dest-home', title: 'Home Studio', category: 'Navigation', icon: '🏠', path: '/' },
    { id: 'dest-dash', title: 'Personal Dashboard & Stats', category: 'Navigation', icon: '📊', path: '/dashboard' },
    { id: 'dest-yoga', title: 'Movement & Yoga Studio (28 Poses)', category: 'Discipline', icon: '🧘', path: '/start' },
    { id: 'dest-gym', title: 'Gym AI Strength Trainer (10 Exercises)', category: 'Discipline', icon: '💪', path: '/gym' },
    { id: 'dest-nutrition', title: 'Food Recognition & Nutrition Studio (100M+ Database)', category: 'Discipline', icon: '🥗', path: '/nutrition' },
    { id: 'dest-video', title: 'Video Motion Biomechanics Lab', category: 'Discipline', icon: '🎬', path: '/video-analysis' },
    { id: 'dest-plan', title: 'AI Workout Planner', category: 'Tool', icon: '📅', path: '/planner' },
    { id: 'dest-hist', title: 'Workout History & Analytics', category: 'Analytics', icon: '📋', path: '/history' },

    // 28 Yoga Poses
    ...YOGA_POSES.map(p => ({
      id: `yoga-${p.id}`,
      title: `${p.name} (${p.sanskrit})`,
      category: `Yoga · ${p.difficulty}`,
      icon: '🧘',
      path: `/start?pose=${p.id}`,
      badge: `${p.caloriesPerMin} kcal/m`,
    })),

    // 10 Gym Exercises
    ...Object.values(EXERCISE_PATTERNS).map(e => ({
      id: `gym-${e.id}`,
      title: `${e.name} (${e.targetJoint})`,
      category: `Gym · ${e.category.toUpperCase()}`,
      icon: '🏋️',
      path: `/gym?exercise=${e.id}`,
      badge: `${e.caloriesPerRep} kcal/rep`,
    })),

    // Food & Nutrition Database
    ...Object.entries(FOOD_NUTRIENTS).map(([k, f]) => ({
      id: `food-${k}`,
      title: `${f.name} (${f.calories} kcal/100g)`,
      category: 'Nutrition · Food',
      icon: f.icon || '🥗',
      path: '/nutrition',
      badge: `${f.protein}g protein`,
    })),
  ];

  // Filter commands by query
  const filtered = allCommands.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.badge && item.badge.toLowerCase().includes(q))
    );
  }).slice(0, 12);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1 < filtered.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          navigate(filtered[selectedIndex].path);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, navigate, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-backdrop" onClick={onClose}>
      <div className="cmd-palette-container" onClick={e => e.stopPropagation()}>
        {/* Top Search Field */}
        <div className="cmd-search-header">
          <span className="cmd-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command, yoga pose, or gym workout..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span className="cmd-kbd-badge">ESC</span>
        </div>

        {/* Quick Action Badges */}
        <div className="cmd-quick-pills">
          <button
            type="button"
            className="cmd-pill"
            onClick={() => {
              navigate('/start?pose=Warrior');
              onClose();
            }}
          >
            🧘 Warrior II
          </button>
          <button
            type="button"
            className="cmd-pill"
            onClick={() => {
              navigate('/gym?exercise=SQUAT');
              onClose();
            }}
          >
            🏋️ Squat Live
          </button>
          <button
            type="button"
            className="cmd-pill"
            onClick={() => {
              navigate('/video-analysis');
              onClose();
            }}
          >
            🎬 Video Lab
          </button>
        </div>

        {/* Results List */}
        <ul className="cmd-results-list" ref={listRef}>
          {filtered.map((item, idx) => (
            <li
              key={item.id}
              className={`cmd-result-item ${selectedIndex === idx ? 'selected' : ''}`}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="cmd-item-left">
                <span className="cmd-item-icon">{item.icon}</span>
                <div className="cmd-item-text">
                  <span className="cmd-item-title">{item.title}</span>
                  <span className="cmd-item-cat">{item.category}</span>
                </div>
              </div>
              <div className="cmd-item-right">
                {item.badge && <span className="cmd-item-badge">{item.badge}</span>}
                <span className="cmd-item-arrow">➔</span>
              </div>
            </li>
          ))}

          {filtered.length === 0 && (
            <div className="cmd-empty-state">
              <span className="cmd-empty-icon">🔎</span>
              <p>No matches found for "{query}". Try "Warrior", "Squat", or "Planner".</p>
            </div>
          )}
        </ul>

        {/* Footer Hints */}
        <div className="cmd-footer-bar">
          <div className="cmd-hint-item">
            <kbd className="cmd-kbd">↑</kbd> <kbd className="cmd-kbd">↓</kbd> to navigate
          </div>
          <div className="cmd-hint-item">
            <kbd className="cmd-kbd">↵</kbd> to select
          </div>
          <div className="cmd-hint-item">
            <kbd className="cmd-kbd">esc</kbd> to close
          </div>
          <div className="cmd-footer-status">
            <span className="dot-green" /> MoveNet 60FPS
          </div>
        </div>
      </div>
    </div>
  );
}
