import React, { useState } from 'react';
import InteractiveTerminal from './InteractiveTerminal';
import '../styles/OutputPanel.css';

const OutputPanel = ({ output, aiExplain, aiAnalysis, onExplain, onAnalyze, isAILoading, activeSession, onTerminalFinish, onTerminalError }) => {
  const [activeTab, setActiveTab] = useState('output');

  const hasError = output?.status === 'ERROR' || output?.status === 'TIMEOUT' || output?.stderr;
  const hasOutput = !!output;

  const statusConfig = {
    SUCCESS: { label: 'Success', color: 'green', icon: '✓' },
    ERROR:   { label: 'Error',   color: 'red',   icon: '✗' },
    TIMEOUT: { label: 'Timeout', color: 'amber', icon: '⏱' },
  };

  const status = output ? (statusConfig[output.status] || statusConfig.ERROR) : null;

  // Rich inline text tokenizer to properly style code blocks, bold text, and plain prose
  const parseInlineElements = (text, lineKey) => {
    // Regex matches text bounded by double asterisks ** or backticks `
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${lineKey}-${index}`} className="ai-inline-strong">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={`${lineKey}-${index}`} className="ai-inline-code">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const renderAIText = (rawText) => {
      if (!rawText) return null;

      const lines = rawText.split('\n');
      const elements = [];
      let inCodeBlock = false;
      let codeBlockLines = [];
      let currentListType = null; // 'ul' | 'ol' | null
      let listItems = [];

      // Helper to clear list structures out safely before running block elements
      const flushList = (key) => {
        if (listItems.length > 0) {
          if (currentListType === 'ol') {
            elements.push(<ol key={`ol-${key}`} className="ai-ol-list">{listItems}</ol>);
          } else {
            elements.push(<ul key={`ul-${key}`} className="ai-ul-list">{listItems}</ul>);
          }
          listItems = [];
          currentListType = null;
        }
      };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle multi-line fenced code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // Closing code fence
          elements.push(
            <pre key={`code-${i}`} className="ai-code-block">
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          );
          codeBlockLines = [];
          inCodeBlock = false;
        } else {
          // Opening code fence
          flushList(i);
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockLines.push(line);
        continue;
      }

      // Handle Headings
      if (line.startsWith('#')) {
        flushList(i);
        const depth = (line.match(/^#+/) || ['#'])[0].length;
        const cleanHeading = line.replace(/^#+\s*/, '');
        const HeadingTag = depth <= 2 ? 'h3' : 'h4'; // Maps markdown # and ## to h3, rest to h4 inside our panel
        elements.push(
          <HeadingTag key={`h-${i}`} className={`ai-doc-heading heading-depth-${depth}`}>
            {parseInlineElements(cleanHeading, i)}
          </HeadingTag>
        );
        continue;
      }

      // Handle Ordered Lists (e.g., 1. Item)
      const orderedMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
      if (orderedMatch) {
        if (currentListType !== 'ol') {
          flushList(i);
          currentListType = 'ol';
        }
        listItems.push(<li key={`li-${i}`}>{parseInlineElements(orderedMatch[2], i)}</li>);
        continue;
      }

      // Handle Unordered Lists (e.g., * Item or - Item)
      const unorderedMatch = line.match(/^\s*[*|-]\s+(.+)/);
      if (unorderedMatch) {
        if (currentListType !== 'ul') {
          flushList(i);
          currentListType = 'ul';
        }
        listItems.push(<li key={`li-${i}`}>{parseInlineElements(unorderedMatch[1], i)}</li>);
        continue;
      }

      // Handle Empty Spacers/Newlines
      if (line.trim() === '') {
        flushList(i);
        // Conditionally adds structured vertical rhythm safely without excessive breaks
        if (elements.length > 0 && elements[elements.length - 1].type !== 'span') {
          elements.push(<span key={`spacer-${i}`} className="ai-prose-spacer" />);
        }
        continue;
      }

      // Fallback: Standard Body Paragraphs
      flushList(i);
      elements.push(
        <p key={`p-${i}`} className="ai-prose-paragraph">
          {parseInlineElements(line, i)}
        </p>
      );
    }

    // Flush any leftover open list components
    flushList(lines.length);
    return elements;
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
          <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {activeSession ? (
              <InteractiveTerminal
                code={activeSession.code}
                language={activeSession.language}
                token={activeSession.token}
                onFinish={onTerminalFinish}
                onError={onTerminalError}
              />
            ) : !output ? (
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

                {output.stdout && (
                  <div className="output-section">
                    <div className="section-label stdout-label">
                      <span className="label-dot green-dot" />
                      stdout
                    </div>
                    <pre className="output-pre">{output.stdout}</pre>
                  </div>
                )}

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
                <div className="ai-content-clean">{renderAIText(aiExplain)}</div>
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
                  <span className="ai-badge">Code Analysis</span>
                  <button className="refresh-btn" onClick={onAnalyze}>Refresh</button>
                </div>
                <div className="ai-content-clean">{renderAIText(aiAnalysis)}</div>
              </div>
            ) : (
              <div className="empty-state">
                <button className="ai-action-btn" onClick={onAnalyze}>
                  Analyze Code Complexity
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