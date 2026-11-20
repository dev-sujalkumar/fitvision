import React, { useState, useEffect } from 'react';
import { getYogaHistory } from '../../utils/storage';
import './YogaHistory.css';

/**
 * Component to display yoga session history
 */
function YogaHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const sessions = await getYogaHistory(20);
        setHistory(sessions);
      } catch (err) {
        console.error('Error loading yoga history:', err);
        setError('Failed to load yoga history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(1);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return <div className="yoga-history-container"><p>Loading history...</p></div>;
  }

  if (error) {
    return <div className="yoga-history-container"><p className="error-text">{error}</p></div>;
  }

  if (history.length === 0) {
    return (
      <div className="yoga-history-container">
        <p className="empty-text">No yoga sessions recorded yet. Start practicing!</p>
      </div>
    );
  }

  // Calculate statistics
  const totalSessions = history.length;
  const totalDuration = history.reduce((sum, session) => sum + session.duration, 0);
  const averageDuration = totalDuration / totalSessions;
  const bestDuration = Math.max(...history.map(s => s.duration));

  return (
    <div className="yoga-history-container">
      <h3>Yoga Session History</h3>

      <div className="statistics-grid">
        <div className="stat-card">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{totalSessions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Duration</div>
          <div className="stat-value">{formatDuration(totalDuration)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Duration</div>
          <div className="stat-value">{formatDuration(averageDuration)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Best Duration</div>
          <div className="stat-value">{formatDuration(bestDuration)}</div>
        </div>
      </div>

      <div className="history-list">
        <h4>Recent Sessions</h4>
        {history.map((session, index) => (
          <div key={index} className="history-item">
            <div className="session-info">
              <div className="session-pose">{session.pose}</div>
              <div className="session-date">{formatDate(session.timestamp)}</div>
            </div>
            <div className="session-metrics">
              <div className="metric">
                <span className="metric-label">Duration:</span>
                <span className="metric-value">{formatDuration(session.duration)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Confidence:</span>
                <span className="metric-value">{(session.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default YogaHistory;
