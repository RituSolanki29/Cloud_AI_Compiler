import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import '../styles/CodeEditor.css';

// Language configs — maps our language names to Monaco's syntax highlighting IDs
// and provides starter template code for each language
const LANGUAGE_CONFIG = {
  python: {
    monacoLang: 'python',
    template: `# Write your Python code here\ndef main():\n    print("Hello from SmartCloud!")\n\nmain()`,
  },
  java: {
    monacoLang: 'java',
    template: `// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from SmartCloud!");\n    }\n}`,
  },
  cpp: {
    monacoLang: 'cpp',
    template: `// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from SmartCloud!" << endl;\n    return 0;\n}`,
  },
};

// CodeEditor component
// Props:
//   code          — current code string (controlled by parent)
//   setCode       — updates code in parent state
//   language      — 'python' | 'java' | 'cpp'
//   setLanguage   — updates language in parent
//   onRun         — function called when Run button is clicked
//   isLoading     — disables Run button while code is executing
const CodeEditor = ({ code, setCode, language, setLanguage, onRun, isLoading }) => {
  const editorRef = useRef(null);

  // Called once Monaco editor mounts — stores reference for future operations
  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  // When language changes, swap in the starter template for that language
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(LANGUAGE_CONFIG[newLang].template);
  };

  return (
    <div className="editor-container">
      {/* Toolbar: language selector + run button */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <label className="toolbar-label">Language:</label>
          <select
            className="language-select"
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="python">🐍 Python</option>
            <option value="java">☕ Java</option>
            <option value="cpp">⚙️ C++</option>
          </select>
        </div>

        <div className="toolbar-right">
          <button
            className={`run-btn ${isLoading ? 'loading' : ''}`}
            onClick={onRun}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Running...' : '▶ Run Code'}
          </button>
        </div>
      </div>

      {/* Monaco Editor — the actual code editing area */}
      {/* It gives us VS Code-like features: syntax highlight, autocomplete, line numbers */}
      <Editor
        height="65vh"
        language={LANGUAGE_CONFIG[language].monacoLang}
        value={code}
        onChange={(value) => setCode(value || '')}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          minimap: { enabled: false },  // hide the minimap for cleaner UI
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          automaticLayout: true,       // resize when container changes
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
    </div>
  );
};

export default CodeEditor;
