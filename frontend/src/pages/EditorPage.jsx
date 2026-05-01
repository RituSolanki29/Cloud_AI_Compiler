import React, { useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import OutputPanel from '../components/OutputPanel';
import { executeCode, explainError, analyzeCode } from '../api/services';
import '../styles/EditorPage.css';

// EditorPage — the main workspace of the app
// This page:
//   1. Holds all state: code, language, output, AI results
//   2. Renders CodeEditor (left) and OutputPanel (right) side by side
//   3. Handles all API calls: execute, explain, analyze
const EditorPage = () => {
  // Code state
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(`# Write your Python code here\ndef main():\n    print("Hello from SmartCloud!")\n\nmain()`);
  const [stdin, setStdin] = useState(''); // optional user input for the program

  // Output state
  const [output, setOutput] = useState(null);      // execution result from backend
  const [aiExplain, setAiExplain] = useState('');  // AI error explanation
  const [aiAnalysis, setAiAnalysis] = useState('');// AI code analysis

  // Loading states — controls spinners and disabled buttons
  const [isRunning, setIsRunning] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  // ── RUN CODE ──────────────────────────────────────────────
  // Called when user clicks ▶ Run Code
  // Sends code to backend → backend spins up Docker container → returns output
  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);        // clear previous output
    setAiExplain('');       // clear previous AI results
    setAiAnalysis('');

    try {
      const response = await executeCode({ language, code, input: stdin });
      setOutput(response.data);  // { stdout, stderr, executionTime, status }
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

  // ── AI EXPLAIN ────────────────────────────────────────────
  // Called when user clicks "Explain this error with AI"
  // Sends the code + error to OpenAI via our backend
  const handleExplain = async () => {
    if (!output?.stderr) return;
    setIsAILoading(true);
    try {
      const response = await explainError({
        language,
        code,
        error: output.stderr,
      });
      setAiExplain(response.data.explanation);
    } catch (err) {
      setAiExplain('AI service unavailable. Please try again later.');
    } finally {
      setIsAILoading(false);
    }
  };

  // ── AI ANALYZE ────────────────────────────────────────────
  // Called when user clicks "Analyze Code Complexity"
  // Sends code to OpenAI for Big-O analysis and optimization tips
  const handleAnalyze = async () => {
    setIsAILoading(true);
    try {
      const response = await analyzeCode({ language, code });
      setAiAnalysis(response.data.analysis);
    } catch (err) {
      setAiAnalysis('AI service unavailable. Please try again later.');
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="editor-page">
      {/* Left panel — code editor */}
      <div className="editor-section">
        <CodeEditor
          code={code}
          setCode={setCode}
          language={language}
          setLanguage={setLanguage}
          onRun={handleRun}
          isLoading={isRunning}
        />

        {/* Optional stdin input — for programs that read user input */}
        <div className="stdin-section">
          <label className="stdin-label">📥 Program Input (stdin):</label>
          <textarea
            className="stdin-input"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input for your program here (optional)..."
            rows={3}
          />
        </div>
      </div>

      {/* Right panel — output + AI results */}
      <div className="output-section">
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
