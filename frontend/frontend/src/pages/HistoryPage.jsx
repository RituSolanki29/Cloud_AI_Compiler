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
  SUCCESS: { label: 'Passed', color: 'green' },
  ERROR:   { label: 'Failed', color: 'red' },
  TIMEOUT: { label: 'Timeout', color: 'amber' },
};

const HistoryPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Controls & Filtering states
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'SUCCESS' | 'ERROR'
  const [langFilter, setLangFilter] = useState('all');     // 'all' | 'python' | 'java' | 'cpp'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const response = await getHistory();
      setSubmissions(response.data || []);
    } catch {
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Avoid triggering row click restore
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

  const handleReopen = (submission) => {
    navigate('/', {
      state: {
        code: submission.code,
        language: submission.language,
        input: submission.input || '',
      },
    });
  };

  // Live multi-layered filter logic
  const filteredSubmissions = submissions.filter(s => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesLang = langFilter === 'all' || s.language === langFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.language.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesLang && matchesSearch;
  });

  // Dynamic status counters based on the entire set
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
      <div className="history-container">
        
        {/* Modernized Table Header */}
        <div className="history-header">
          <div className="header-left">
            <h2 className="history-title">Submission History</h2>
            <p className="history-subtitle">Review, search, and restore your previous executions</p>
          </div>
        </div>

        {/* Complete Control and Toolbar Panel */}
        <div className="history-toolbar">
          <div className="search-bar-container">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              className="toolbar-search" 
              placeholder="Search code snippets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="toolbar-filters">
            {/* Language Dropdown Selector */}
            <select 
              className="toolbar-select" 
              value={langFilter} 
              onChange={(e) => setLangFilter(e.target.value)}
            >
              <option value="all">All Languages</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>

            {/* Status Segmented Pills */}
            <div className="filter-bar">
              {[
                { key: 'all', label: 'All', count: counts.all },
                { key: 'SUCCESS', label: 'Passed', count: counts.SUCCESS },
                { key: 'ERROR', label: 'Failed', count: counts.ERROR },
              ].map(f => (
                <button
                  key={f.key}
                  className={`filter-pill ${statusFilter === f.key ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                  <span className="filter-count">{f.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modern List Layout (Structured Table) */}
        {filteredSubmissions.length === 0 ? (
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
              {submissions.length === 0 ? 'No submissions yet' : 'No executions match your filters'}
            </p>
            {submissions.length === 0 && (
              <button className="go-editor-btn" onClick={() => navigate('/')}>
                Go to Editor
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Code Preview</th>
                  <th>Runtime</th>
                  <th>Timestamp</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map(submission => {
                  const lang = LANG_CONFIG[submission.language] || { emoji: '📄', label: submission.language, color: 'var(--text-1)' };
                  const status = STATUS_CONFIG[submission.status] || STATUS_CONFIG.ERROR;
                  const date = new Date(submission.createdAt);

                  return (
                    <tr 
                      key={submission.id} 
                      className="history-row"
                      onClick={() => handleReopen(submission)}
                    >
                      {/* Language cell */}
                      <td>
                        <div className="table-lang" style={{ color: lang.color }}>
                          <span className="lang-emoji">{lang.emoji}</span>
                          <span className="lang-label">{lang.label}</span>
                        </div>
                      </td>

                      {/* Status cell */}
                      <td>
                        <span className={`status-badge badge-${status.color}`}>
                          {status.label}
                        </span>
                      </td>

                      {/* Line-flattened code preview cell */}
                      <td className="code-preview-cell">
                        <code className="table-code-preview">
                          {submission.code.trim().replace(/\s+/g, ' ').substring(0, 60)}
                          {submission.code.length > 60 && '...'}
                        </code>
                      </td>

                      {/* Runtime cell */}
                      <td className="runtime-cell">
                        {submission.executionTime != null ? (
                          <span className="table-runtime">{submission.executionTime}ms</span>
                        ) : (
                          <span className="table-runtime-null">—</span>
                        )}
                      </td>

                      {/* Date/Time cell */}
                      <td className="date-cell">
                        <span className="table-date">
                          {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          <span className="table-time-split">
                            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                        </span>
                      </td>

                      {/* Interactive Actions cell */}
                      <td className="actions-cell" onClick={e => e.stopPropagation()}>
                        <div className="actions-group">
                          <button 
                            className="restore-btn"
                            onClick={() => handleReopen(submission)}
                            title="Restore in Editor"
                          >
                            Restore
                          </button>
                          <button
                            className="delete-btn-table"
                            onClick={e => handleDelete(submission.id, e)}
                            disabled={deleting === submission.id}
                            title="Delete entry"
                          >
                            {deleting === submission.id ? '⋯' : (
                              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                                <path d="M2 3h8M5 3V2h2v1M4.5 5v4M7.5 5v4M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;