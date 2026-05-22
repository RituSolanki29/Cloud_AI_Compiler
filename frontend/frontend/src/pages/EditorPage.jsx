import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import CodeEditor from '../components/CodeEditor';
import OutputPanel from '../components/OutputPanel';

import {
  executeCode,
  explainError,
  analyzeCode,
} from '../api/services';

import '../styles/EditorPage.css';

const DEFAULT_CODE = {
  python: `# Write your Python code here
def main():
    print("Hello from SmartCloud!")

main()`,

  java: `// Write your Java code here
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from SmartCloud!");
    }
}`,

  cpp: `// Write your C++ code here
#include <iostream>
using namespace std;

int main() {
    cout << "Hello from SmartCloud!" << endl;
    return 0;
}`,
};

const EditorPage = ({ editorState, setEditorState }) => {
  const location = useLocation();

  // Prevent repeated history-state reapplication
  const appliedStateRef = useRef(null);

  // Persistent state from App.jsx
  const { language, code } = editorState;

  // Local UI states
  const [wasReopened, setWasReopened] = useState(
    !!location.state?.code
  );

  const [output, setOutput] = useState(null);
  const [aiExplain, setAiExplain] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  
  // Resizable panes state
  const [rightPaneWidth, setRightPaneWidth] = useState(420);
  const isResizing = useRef(false);

  // Apply history state ONLY once per navigation
  useEffect(() => {
    if (
      location.state?.code &&
      location.state !== appliedStateRef.current
    ) {
      appliedStateRef.current = location.state;

      setEditorState({
        language: location.state.language || 'python',
        code: location.state.code,
      });

      setOutput(null);
      setAiExplain('');
      setAiAnalysis('');
      setWasReopened(true);
    }
  }, [location.state, setEditorState]);

  // Update code
  const setCode = (newCode) => {
    setEditorState((prev) => ({
      ...prev,
      code: newCode,
    }));
  };

  // Handle language switch
  const handleLanguageChange = (newLang) => {
    setEditorState((prev) => ({
      ...prev,
      language: newLang,
      code: !wasReopened
        ? DEFAULT_CODE[newLang]
        : prev.code,
    }));

    setWasReopened(false);
  };

  // Run code
  const handleRun = () => {
    setIsRunning(true);
    setOutput(null);
    setAiExplain('');
    setAiAnalysis('');

    const token = localStorage.getItem('token');
    
    setActiveSession({
      language,
      code,
      token
    });
  };

  const handleTerminalFinish = (msg) => {
    setIsRunning(false);
    setOutput({
      status: msg.status,
      executionTime: msg.executionTime,
      stdout: msg.status === 'SUCCESS' ? msg.fullOutput : '',
      stderr: msg.status === 'ERROR' ? msg.fullOutput : msg.fullOutput || ''
    });
    // We leave activeSession non-null so the terminal remains visible until next run
  };

  const handleTerminalError = (err) => {
    setIsRunning(false);
    setOutput({
      status: 'ERROR',
      stderr: err || 'Terminal connection error',
      stdout: '',
      executionTime: null
    });
    setActiveSession(null);
  };

  // Explain errors
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
    } catch {
      setAiExplain(
        'AI service unavailable. Please try again later.'
      );
    } finally {
      setIsAILoading(false);
    }
  };

  // Analyze code
  const handleAnalyze = async () => {
    setIsAILoading(true);

    try {
      const response = await analyzeCode({
        language,
        code,
      });

      setAiAnalysis(response.data.analysis);
    } catch {
      setAiAnalysis(
        'AI service unavailable. Please try again later.'
      );
    } finally {
      setIsAILoading(false);
    }
  };

  // Resizing logic
  const handleMouseDown = (e) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newWidth = document.body.clientWidth - e.clientX;
    // Set min/max boundaries
    if (newWidth > 300 && newWidth < document.body.clientWidth - 300) {
      setRightPaneWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="editor-page" style={{ cursor: isResizing.current ? 'col-resize' : 'auto' }}>
      {/* Left Side */}
      <div className="editor-pane" style={{ width: `calc(100% - ${rightPaneWidth}px)`, flex: 'none' }}>
        <CodeEditor
          code={code}
          setCode={setCode}
          language={language}
          setLanguage={handleLanguageChange}
          onRun={handleRun}
          isLoading={isRunning}
        />
      </div>

      {/* Resizer */}
      <div 
        className="resizer" 
        onMouseDown={handleMouseDown}
      />

      {/* Right Side */}
      <div className="output-pane" style={{ width: `${rightPaneWidth}px`, flex: 'none' }}>
        <OutputPanel
          output={output}
          aiExplain={aiExplain}
          aiAnalysis={aiAnalysis}
          onExplain={handleExplain}
          onAnalyze={handleAnalyze}
          isAILoading={isAILoading}
          activeSession={activeSession}
          onTerminalFinish={handleTerminalFinish}
          onTerminalError={handleTerminalError}
        />
      </div>
    </div>
  );
};

export default EditorPage;