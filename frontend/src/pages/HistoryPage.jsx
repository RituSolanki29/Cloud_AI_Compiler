import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, deleteSubmission } from '../api/services';
import '../styles/HistoryPage.css';

// HistoryPage — shows all past code submissions for the logged-in user
// Each card shows: language, date, status, first few lines of code
// User can: re-open a submission in editor, or delete it
const HistoryPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await getHistory();
      setSubmissions(response.data);
    } catch (err) {
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete a submission and refresh the list
  const handleDelete = async (id, e) => {
    e.stopPropagation(); // prevent card click from firing
    if (!window.confirm('Delete this submission?')) return;
    try {
      await deleteSubmission(id);
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch {
      alert('Failed to delete. Please try again.');
    }
  };

  // Re-open submission in editor
  // Navigates to / with state, EditorPage reads it to pre-fill code
  const handleReopen = (submission) => {
    navigate('/', {
      state: {
        code: submission.code,
        language: submission.language,
      }
    });
  };

  // Language icon helper
  const getLangIcon = (lang) => ({ python: '🐍', java: '☕', cpp: '⚙️' }[lang] || '📄');

  if (loading) return <div className="history-loading">Loading your history...</div>;
  if (error) return <div className="history-error">{error}</div>;

  return (
    <div className="history-page">
      <div className="history-header">
        <h2>📋 Submission History</h2>
        <span className="history-count">{submissions.length} submissions</span>
      </div>

      {submissions.length === 0 ? (
        <div className="history-empty">
          <p>No submissions yet. Run some code first!</p>
          <button className="go-editor-btn" onClick={() => navigate('/')}>
            Go to Editor
          </button>
        </div>
      ) : (
        <div className="history-grid">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className={`history-card ${submission.status === 'SUCCESS' ? 'success' : 'error'}`}
              onClick={() => handleReopen(submission)}
            >
              {/* Card header: language + status badge */}
              <div className="card-header">
                <span className="card-lang">
                  {getLangIcon(submission.language)} {submission.language.toUpperCase()}
                </span>
                <span className={`card-status ${submission.status === 'SUCCESS' ? 'success' : 'error'}`}>
                  {submission.status === 'SUCCESS' ? '✅' : '❌'}
                </span>
              </div>

              {/* Code preview — first 3 lines */}
              <pre className="card-code-preview">
                {submission.code.split('\n').slice(0, 3).join('\n')}
                {submission.code.split('\n').length > 3 && '\n...'}
              </pre>

              {/* Card footer: date + execution time + delete button */}
              <div className="card-footer">
                <span className="card-date">
                  {new Date(submission.createdAt).toLocaleDateString()}
                </span>
                {submission.executionTime && (
                  <span className="card-time">⏱ {submission.executionTime}ms</span>
                )}
                <button
                  className="card-delete-btn"
                  onClick={(e) => handleDelete(submission.id, e)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
