import React, { useState } from 'react';
import '../styles/OutputPanel.css';

// OutputPanel displays: execution results, AI error explanation, AI code analysis
const OutputPanel = ({ output, aiExplain, aiAnalysis, onExplain, onAnalyze, isAILoading }) => {
  const [activeTab, setActiveTab] = useState('output');

  const hasError = output?.status === 'ERROR' || output?.status === 'TIMEOUT' || output?.stderr;
  const hasOutput = !!output;

  const statusConfig = {
    SUCCESS: { label: 'Success', color: 'green', icon: '✓' },
    ERROR:   { label: 'Error',   color: 'red',   icon: '✗' },
    TIMEOUT: { label: 'Timeout', color: 'amber', icon: '⏱' },
  };

  const status = output ? (statusConfig[output.status] || statusConfig.ERROR) : null;

  // Render AI markdown-like text with basic formatting
  const renderAIText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} className="ai-bold">{line.slice(2, -2)}</div>;
      }
      if (line.match(/^\*\*(.+)\*\*/)) {
        return (
          <div key={i} className="ai-line">
            {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
              part.startsWith('**') ? <strong key={j}>{part.slice(2,-2)}</strong> : part
            )}
          </div>
        );
      }
      if (line.startsWith('```')) return <div key={i} className="ai-fence" />;
      if (line.match(/^\d+\./)) {
        return <div key={i} className="ai-numbered">{line}</div>;
      }
      if (line.startsWith('#')) {
        return <div key={i} className="ai-heading">{line.replace(/^#+\s*/, '')}</div>;
      }
      if (line === '') return <div key={i} className="ai-spacer" />;
      return <div key={i} className="ai-line">{line}</div>;
    });
  };

  return (
    <div className="output-panel">
      {/* Tab bar */}
      <div className="output-tabs">
        <button
          className={`otab ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3 5l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Output
          {hasError && <span className="error-dot" />}
        </button>

        <button
          className={`otab ${activeTab === 'explain' ? 'active' : ''} ${!hasError ? 'disabled' : ''}`}
          onClick={() => hasError && setActiveTab('explain')}
          disabled={!hasError}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6 5v3M6 3.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          AI Explain
          {aiExplain && <span className="has-data-dot" />}
        </button>

        <button
          className={`otab ${activeTab === 'analyze' ? 'active' : ''} ${!hasOutput ? 'disabled' : ''}`}
          onClick={() => hasOutput && setActiveTab('analyze')}
          disabled={!hasOutput}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 9l3-3 2 2 3-4 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          AI Analyze
          {aiAnalysis && <span className="has-data-dot" />}
        </button>
      </div>

      {/* Content */}
      <div className="output-body">

        {/* OUTPUT TAB */}
        {activeTab === 'output' && (
          <div className="tab-content">
            {!output ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 6l10 5.5v9L16 26 6 20.5v-9L16 6z" stroke="var(--border-bright)" strokeWidth="1.5"/>
                    <circle cx="16" cy="16" r="3" stroke="var(--border-bright)" strokeWidth="1.5"/>
                  </svg>
                </div>
                <p className="empty-label">Run your code to see output</p>
                <p className="empty-hint">Use the Run Code button or ⌘↵</p>
              </div>
            ) : (
              <div className="result-wrap">
                {/* Status bar */}
                <div className={`status-bar status-${status.color}`}>
                  <span className="status-icon">{status.icon}</span>
                  <span className="status-label">{status.label}</span>
                  {output.executionTime != null && (
                    <span className="exec-time">{output.executionTime}ms</span>
                  )}
                  {output.submissionId && (
                    <span className="submission-id">#{output.submissionId}</span>
                  )}
                </div>

                {/* stdout */}
                {output.stdout && (
                  <div className="output-section">
                    <div className="section-label stdout-label">
                      <span className="label-dot green-dot" />
                      stdout
                    </div>
                    <pre className="output-pre">{output.stdout}</pre>
                  </div>
                )}

                {/* stderr */}
                {output.stderr && (
                  <div className="output-section">
                    <div className="section-label stderr-label">
                      <span className="label-dot red-dot" />
                      stderr
                    </div>
                    <pre className="output-pre error-pre">{output.stderr}</pre>

                    <button
                      className="ai-trigger-btn"
                      onClick={() => {
                        setActiveTab('explain');
                        if (!aiExplain) onExplain();
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M6 5v3M6 3.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      Explain this error with AI
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI EXPLAIN TAB */}
        {activeTab === 'explain' && (
          <div className="tab-content">
            {isAILoading ? (
              <div className="ai-loading-state">
                <div className="ai-pulse">
                  <div className="pulse-ring" />
                  <div className="pulse-ring pulse-ring-2" />
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="var(--accent)" strokeWidth="1.5"/>
                    <path d="M10 6v4l2 2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="ai-loading-text">AI is analyzing your error...</p>
              </div>
            ) : aiExplain ? (
              <div className="ai-result">
                <div className="ai-result-header">
                  <span className="ai-badge">🤖 AI Explanation</span>
                  <button className="refresh-btn" onClick={onExplain}>Refresh</button>
                </div>
                <div className="ai-content">{renderAIText(aiExplain)}</div>
              </div>
            ) : (
              <div className="empty-state">
                <button className="ai-action-btn" onClick={onExplain}>
                  🤖 Get AI Explanation
                </button>
                <p className="empty-hint">AI will explain your error in plain English</p>
              </div>
            )}
          </div>
        )}

        {/* AI ANALYZE TAB */}
        {activeTab === 'analyze' && (
          <div className="tab-content">
            {isAILoading ? (
              <div className="ai-loading-state">
                <div className="ai-pulse">
                  <div className="pulse-ring" />
                  <div className="pulse-ring pulse-ring-2" />
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 14l4-4 3 3 4-5 3 3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="ai-loading-text">AI is analyzing complexity...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="ai-result">
                <div className="ai-result-header">
                  <span className="ai-badge">📊 Code Analysis</span>
                  <button className="refresh-btn" onClick={onAnalyze}>Refresh</button>
                </div>
                <div className="ai-content">{renderAIText(aiAnalysis)}</div>
              </div>
            ) : (
              <div className="empty-state">
                <button className="ai-action-btn" onClick={onAnalyze}>
                  📊 Analyze Code Complexity
                </button>
                <p className="empty-hint">Get Big-O complexity and optimization tips</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;