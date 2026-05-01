import React, { useState } from 'react';
import '../styles/OutputPanel.css';

// OutputPanel — displays everything after code execution:
//   1. Execution output (stdout) or errors (stderr)
//   2. AI error explanation (if there was an error)
//   3. AI code analysis (complexity, optimizations)
//
// Props:
//   output      — { stdout, stderr, executionTime, status } from backend
//   aiExplain   — string: AI explanation of any error
//   aiAnalysis  — string: AI complexity + optimization suggestions
//   onExplain   — function: triggers AI error explanation call
//   onAnalyze   — function: triggers AI code analysis call
//   isAILoading — true while waiting for AI response
const OutputPanel = ({ output, aiExplain, aiAnalysis, onExplain, onAnalyze, isAILoading }) => {
  // Controls which tab is shown: 'output' | 'explain' | 'analyze'
  const [activeTab, setActiveTab] = useState('output');

  const hasError = output?.status === 'ERROR' || output?.stderr;

  return (
    <div className="output-panel">
      {/* Tab bar */}
      <div className="output-tabs">
        <button
          className={`tab-btn ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          Output
          {/* Red dot indicator if there's an error */}
          {hasError && <span className="error-dot">●</span>}
        </button>

        <button
          className={`tab-btn ${activeTab === 'explain' ? 'active' : ''}`}
          onClick={() => setActiveTab('explain')}
          disabled={!hasError} // Only clickable when there's an error to explain
        >
          🤖 AI Explain
        </button>

        <button
          className={`tab-btn ${activeTab === 'analyze' ? 'active' : ''}`}
          onClick={() => setActiveTab('analyze')}
          disabled={!output} // Only clickable after code has run
        >
          📊 AI Analyze
        </button>
      </div>

      {/* Tab content */}
      <div className="output-content">

        {/* OUTPUT TAB: raw execution results */}
        {activeTab === 'output' && (
          <div className="output-body">
            {!output ? (
              <p className="placeholder-text">Run your code to see output here...</p>
            ) : (
              <>
                {/* Execution metadata */}
                <div className="exec-meta">
                  <span className={`status-badge ${output.status === 'SUCCESS' ? 'success' : 'error'}`}>
                    {output.status === 'SUCCESS' ? '✅ Success' : '❌ Error'}
                  </span>
                  {output.executionTime && (
                    <span className="exec-time">⏱ {output.executionTime}ms</span>
                  )}
                </div>

                {/* Standard output */}
                {output.stdout && (
                  <div className="output-section">
                    <label>stdout:</label>
                    <pre className="output-pre success-text">{output.stdout}</pre>
                  </div>
                )}

                {/* Standard error */}
                {output.stderr && (
                  <div className="output-section">
                    <label>stderr:</label>
                    <pre className="output-pre error-text">{output.stderr}</pre>
                    {/* Prompt user to use AI explain */}
                    <button className="ai-action-btn" onClick={() => {
                      setActiveTab('explain');
                      onExplain();
                    }}>
                      🤖 Explain this error with AI
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* AI EXPLAIN TAB: OpenAI explanation of the error */}
        {activeTab === 'explain' && (
          <div className="output-body">
            {isAILoading ? (
              <div className="ai-loading">
                <div className="spinner" />
                <p>AI is analyzing your error...</p>
              </div>
            ) : aiExplain ? (
              <div className="ai-response">
                <h4>🤖 AI Error Explanation</h4>
                {/* Render explanation with line breaks preserved */}
                <p style={{ whiteSpace: 'pre-wrap' }}>{aiExplain}</p>
              </div>
            ) : (
              <div className="placeholder-text">
                <button className="ai-action-btn" onClick={onExplain}>
                  🤖 Get AI Explanation
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI ANALYZE TAB: complexity + optimization suggestions */}
        {activeTab === 'analyze' && (
          <div className="output-body">
            {isAILoading ? (
              <div className="ai-loading">
                <div className="spinner" />
                <p>AI is analyzing your code...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="ai-response">
                <h4>📊 Code Analysis</h4>
                <p style={{ whiteSpace: 'pre-wrap' }}>{aiAnalysis}</p>
              </div>
            ) : (
              <div className="placeholder-text">
                <button className="ai-action-btn" onClick={onAnalyze}>
                  📊 Analyze Code Complexity
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
