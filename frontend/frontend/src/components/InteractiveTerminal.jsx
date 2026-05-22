import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import '../styles/OutputPanel.css'; // Reuse existing styles

const InteractiveTerminal = ({ code, language, token, onFinish, onError }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    // Initialize xterm.js
    const terminal = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff'
      },
      fontFamily: '"Fira Code", monospace',
      fontSize: 14
    });
    
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    
    terminal.open(terminalRef.current);
    fitAddon.fit();
    
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle window resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    // Initialize WebSocket
    const getWsUrl = () => {
      if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL.replace(/^http/, 'ws') + '/api/ws/execute';
      }
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/api/ws/execute`;
      }
      return 'ws://localhost:8082/api/ws/execute';
    };
    const wsUrl = getWsUrl();
      
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    let inputBuffer = '';
    let fullOutput = '';

    ws.onopen = () => {
      setStatus('Running...');
      ws.send(JSON.stringify({
        type: 'init',
        token,
        language,
        code
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'stdout') {
        fullOutput += msg.data;
        // xterm expects \r\n for newlines, so we replace \n with \r\n
        terminal.write(msg.data.replace(/\r?\n/g, '\r\n'));
      } else if (msg.type === 'status') {
        setStatus(msg.status);
        if (onFinish) onFinish({ ...msg, fullOutput });
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setStatus('Connection Error');
      if (onError) onError('Connection error');
    };

    ws.onclose = () => {
      if (status === 'Running...') {
         setStatus('Disconnected');
      }
    };

    // Handle user input in terminal
    terminal.onData((data) => {
      // Echo the character in the terminal so user sees what they type
      terminal.write(data);
      
      // If it's a backspace (DEL or BS)
      if (data === '\x7f' || data === '\b') {
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          // Erase character from terminal (backspace, space, backspace)
          terminal.write('\b \b');
        }
        return;
      }

      // If it's Enter (CR)
      if (data === '\r') {
        terminal.write('\n'); // Move to next line in terminal
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data: inputBuffer }));
        }
        inputBuffer = '';
      } else {
        inputBuffer += data;
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      terminal.dispose();
    };
  }, [code, language, token]); // Re-run if these props change

  return (
    <div className="interactive-terminal-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div className="terminal-header" style={{ padding: '8px 12px', background: '#161b22', borderBottom: '1px solid #30363d', fontSize: '12px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}>
        <span>Interactive Terminal</span>
        <span style={{ color: status === 'Running...' ? '#3fb950' : (status === 'SUCCESS' ? '#3fb950' : '#f85149') }}>
          {status}
        </span>
      </div>
      <div ref={terminalRef} style={{ flex: 1, padding: '10px', background: '#0d1117', overflow: 'hidden' }} />
    </div>
  );
};

export default InteractiveTerminal;
