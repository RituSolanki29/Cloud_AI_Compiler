import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';

const LANGUAGE_CONFIG = {
  python: { monacoLang: 'python', label: 'Python', emoji: '🐍' },
  java:   { monacoLang: 'java',   label: 'Java',   emoji: '☕' },
  cpp:    { monacoLang: 'cpp',    label: 'C++',    emoji: '⚙️' },
};

// CodeEditor component
// Props: code, setCode, language, setLanguage, onRun, isLoading
const CodeEditor = ({ code, setCode, language, setLanguage, onRun, isLoading }) => {
  const editorRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.focus();

    // Custom keyboard shortcut: Ctrl+Enter = Run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
  };

  return (
    <div className="editor-container">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <div className="lang-pills">
            {Object.entries(LANGUAGE_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                className={`lang-pill ${language === key ? 'active' : ''}`}
                onClick={() => handleLanguageChange(key)}
              >
                <span>{cfg.emoji}</span>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-right">
          <span className="shortcut-hint">⌘↵ to run</span>
          <button
            className={`run-btn ${isLoading ? 'running' : ''}`}
            onClick={onRun}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="run-spinner" />
                Running...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 2l7 4-7 4V2z" fill="currentColor"/>
                </svg>
                Run Code
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="editor-wrap">
        <Editor
          height="100%"
          language={LANGUAGE_CONFIG[language].monacoLang}
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: '"Space Mono", "Fira Code", "Cascadia Code", monospace',
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: 'gutter',
            cursorBlinking: 'phase',
            smoothScrolling: true,
            lineDecorationsWidth: 8,
            glyphMargin: false,
            folding: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;