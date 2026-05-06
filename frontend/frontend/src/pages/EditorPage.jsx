import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import OutputPanel from '../components/OutputPanel';
import { executeCode, explainError, analyzeCode } from '../api/services';
import '../styles/EditorPage.css';

const DEFAULT_CODE = {
  python: `# Write your Python code here\ndef main():\n    print("Hello from SmartCloud!")\n\nmain()`,
  java: `// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from SmartCloud!");\n    }\n}`,
  cpp: `// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from SmartCloud!" << endl;\n    return 0;\n}`,
};

const EditorPage = () => {
  const location = useLocation();

  // BUG FIX: Read location.state so "Re-open in editor" from HistoryPage actually works
  const [language, setLanguage] = useState(location.state?.language || 'python');
  const [code, setCode] = useState(location.state?.code || DEFAULT_CODE.python);
  const [stdin, setStdin] = useState(location.state?.input || '');

  // Sync code template when language changes (only if not reopening from history)
  const [wasReopened, setWasReopened] = useState(!!location.state?.code);

  const [output, setOutput] = useState(null);
  const [aiExplain, setAiExplain] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  // When location.state changes (user navigates from history), update editor
  useEffect(() => {
    if (location.state?.code) {
      setCode(location.state.code);
      setLanguage(location.state.language || 'python');
      setStdin(location.state.input || '');
      setOutput(null);
      setAiExplain('');
      setAiAnalysis('');
      setWasReopened(true);
    }
  }, [location.state]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (!wasReopened) {
      setCode(DEFAULT_CODE[newLang]);
    }
    setWasReopened(false);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);
    setAiExplain('');
    setAiAnalysis('');

    try {
      const response = await executeCode({ language, code, input: stdin });
      setOutput(response.data);
    } catch (err) {
      setOutput({
        status: 'ERROR',
        stderr: err.response?.data?.message || 'Server error. Please try again.',
        stdout: '',
        executionTime: null,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleExplain = async () => {
    if (!output?.stderr) return;
    setIsAILoading(true);
    try {
      const response = await explainError({ language, code, error: output.stderr });
      setAiExplain(response.data.explanation);
    } catch {
      setAiExplain('AI service unavailable. Please try again later.');
    } finally {
      setIsAILoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAILoading(true);
    try {
      const response = await analyzeCode({ language, code });
      setAiAnalysis(response.data.analysis);
    } catch {
      setAiAnalysis('AI service unavailable. Please try again later.');
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="editor-page">
      {/* Left: code editor + stdin */}
      <div className="editor-pane">
        <CodeEditor
          code={code}
          setCode={setCode}
          language={language}
          setLanguage={handleLanguageChange}
          onRun={handleRun}
          isLoading={isRunning}
        />

        <div className="stdin-panel">
          <div className="stdin-header">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 6h10M6 1l5 5-5 5" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>stdin</span>
            <span className="stdin-hint">Program input (optional)</span>
          </div>
          <textarea
            className="stdin-textarea"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input for your program..."
            rows={3}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Right: output + AI */}
      <div className="output-pane">
        <OutputPanel
          output={output}
          aiExplain={aiExplain}
          aiAnalysis={aiAnalysis}
          onExplain={handleExplain}
          onAnalyze={handleAnalyze}
          isAILoading={isAILoading}
        />
      </div>
    </div>
  );
};

export default EditorPage;