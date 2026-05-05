import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, deleteSubmission } from '../api/services';
import '../styles/HistoryPage.css';

const LANG_CONFIG = {
  python: { emoji: '🐍', label: 'Python', color: 'var(--amber)' },
  java:   { emoji: '☕', label: 'Java',   color: 'var(--red)' },
  cpp:    { emoji: '⚙️', label: 'C++',    color: 'var(--purple)' },
};

const STATUS_CONFIG = {
  SUCCESS: { label: 'Success', color: 'green' },
  ERROR:   { label: 'Error',   color: 'red'   },
  TIMEOUT: { label: 'Timeout', color: 'amber' },
};

const HistoryPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');  // 'all' | 'SUCCESS' | 'ERROR'
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const response = await getHistory();
      setSubmissions(response.data);
    } catch {
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this submission?')) return;
    setDeleting(id);
    try {
      await deleteSubmission(id);
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  // BUG FIX: Pass input along with code + language so EditorPage restores stdin too
  const handleReopen = (submission) => {
    navigate('/', {
      state: {
        code: submission.code,
        language: submission.language,
        input: submission.input || '',
      },
    });
  };

  const filtered = submissions.filter(s =>
    filter === 'all' || s.status === filter
  );

  const counts = {
    all: submissions.length,
    SUCCESS: submissions.filter(s => s.status === 'SUCCESS').length,
    ERROR: submissions.filter(s => s.status !== 'SUCCESS').length,
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="loading-spinner" />
        <p>Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-error">
        <p>{error}</p>
        <button onClick={fetchHistory} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-header">
        <div className="header-left">
          <h2 className="history-title">Submission History</h2>
          <span className="history-count">{submissions.length} total</span>
        </div>
        <button className="new-session-btn" onClick={() => navigate('/')}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 2l7 4-7 4V2z" fill="currentColor"/>
          </svg>
          New Session
        </button>
      </div>

      {/* Filter pills */}
      <div className="filter-bar">
        {[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'SUCCESS', label: 'Passed', count: counts.SUCCESS },
          { key: 'ERROR', label: 'Failed', count: counts.ERROR },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-pill ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="filter-count">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="history-empty">
          <div className="empty-illustration">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="12" width="32" height="28" rx="3" stroke="var(--border-bright)" strokeWidth="1.5"/>
              <path d="M16 20h16M16 26h10M16 32h12" stroke="var(--border-bright)" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="36" cy="12" r="8" fill="var(--bg-2)" stroke="var(--border)" strokeWidth="1.5"/>
              <path d="M33 12h6M36 9v6" stroke="var(--text-2)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="empty-label">
            {submissions.length === 0 ? 'No submissions yet' : 'No submissions match this filter'}
          </p>
          {submissions.length === 0 && (
            <button className="go-editor-btn" onClick={() => navigate('/')}>
              Go to Editor
            </button>
          )}
        </div>
      ) : (
        <div className="history-grid">
          {filtered.map(submission => {
            const lang = LANG_CONFIG[submission.language] || { emoji: '📄', label: submission.language, color: 'var(--text-1)' };
            const status = STATUS_CONFIG[submission.status] || STATUS_CONFIG.ERROR;
            const date = new Date(submission.createdAt);

            return (
              <div
                key={submission.id}
                className={`history-card status-${status.color}`}
                onClick={() => handleReopen(submission)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleReopen(submission)}
              >
                {/* Card top row */}
                <div className="card-top">
                  <div className="card-lang" style={{ color: lang.color }}>
                    <span>{lang.emoji}</span>
                    <span className="lang-label">{lang.label}</span>
                  </div>

                  <div className="card-meta">
                    <span className={`status-badge badge-${status.color}`}>
                      {status.label}
                    </span>
                    <button
                      className="delete-btn"
                      onClick={e => handleDelete(submission.id, e)}
                      disabled={deleting === submission.id}
                      title="Delete submission"
                    >
                      {deleting === submission.id ? '⋯' : (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 3h8M5 3V2h2v1M4.5 5v4M7.5 5v4M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code preview */}
                <pre className="card-code">
                  {submission.code.split('\n').slice(0, 4).join('\n')}
                  {submission.code.split('\n').length > 4 && '\n...'}
                </pre>

                {/* Footer */}
                <div className="card-footer">
                  <span className="card-date">
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    {' '}
                    {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {submission.executionTime != null && (
                    <span className="card-time">{submission.executionTime}ms</span>
                  )}
                  <span className="reopen-hint">Click to reopen →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;