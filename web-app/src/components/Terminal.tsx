'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

export function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'output',
      content: 'Welcome to Claude Code Terminal',
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'output',
      content: 'Type "help" for available commands',
      timestamp: new Date(),
    },
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('terminal_output', (data: { output: string; type: 'output' | 'error' }) => {
        const newLine: TerminalLine = {
          id: Date.now().toString(),
          type: data.type,
          content: data.output,
          timestamp: new Date(),
        };
        setLines(prev => [...prev, newLine]);
        setIsExecuting(false);
      });
    }

    return () => {
      if (socket) {
        socket.off('terminal_output');
      }
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [lines]);

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Add command line
    const commandLine: TerminalLine = {
      id: Date.now().toString(),
      type: 'command',
      content: `$ ${command}`,
      timestamp: new Date(),
    };
    setLines(prev => [...prev, commandLine]);

    setIsExecuting(true);
    setCurrentCommand('');

    // Handle built-in commands
    if (command === 'clear') {
      setLines([]);
      setIsExecuting(false);
      return;
    }

    if (command === 'help') {
      const helpOutput: TerminalLine = {
        id: (Date.now() + 1).toString(),
        type: 'output',
        content: `Available commands:
  clear     - Clear terminal
  help      - Show this help
  ls        - List files
  pwd       - Show current directory
  echo      - Print text
  git       - Git commands
  npm       - NPM commands
  python    - Python interpreter
  node      - Node.js REPL`,
        timestamp: new Date(),
      };
      setLines(prev => [...prev, helpOutput]);
      setIsExecuting(false);
      return;
    }

    if (command.startsWith('echo ')) {
      const text = command.substring(5);
      const echoOutput: TerminalLine = {
        id: (Date.now() + 1).toString(),
        type: 'output',
        content: text,
        timestamp: new Date(),
      };
      setLines(prev => [...prev, echoOutput]);
      setIsExecuting(false);
      return;
    }

    // Send command to backend via WebSocket
    if (isConnected && socket) {
      socket.emit('terminal_command', {
        command,
        sessionId: 'current',
      });
    } else {
      // Mock response for demo
      const mockOutput: TerminalLine = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: 'Not connected to backend server',
        timestamp: new Date(),
      };
      setLines(prev => [...prev, mockOutput]);
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
        if (newIndex === commandHistory.length - 1) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex] || '');
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Implement autocomplete here
    }
  };

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const getLineClass = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command':
        return 'text-primary-400';
      case 'error':
        return 'text-red-400';
      case 'output':
      default:
        return 'text-dark-100';
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-900 text-dark-100 font-mono">
      {/* Terminal header */}
      <div className="bg-dark-800 border-b border-dark-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm text-dark-300 ml-4">Terminal</span>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-dark-400">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Terminal content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 cursor-text"
        onClick={handleTerminalClick}
      >
        <div className="space-y-1">
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${getLineClass(line.type)} whitespace-pre-wrap text-sm leading-relaxed`}
            >
              {line.content}
            </motion.div>
          ))}
          
          {/* Current command line */}
          <div className="flex items-center text-sm">
            <span className="text-primary-400 mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-dark-100"
              placeholder={isExecuting ? 'Executing...' : 'Type a command...'}
              disabled={isExecuting}
              autoFocus
            />
            {isExecuting && (
              <div className="ml-2">
                <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terminal footer */}
      <div className="bg-dark-800 border-t border-dark-700 px-4 py-2 text-xs text-dark-400">
        <div className="flex items-center justify-between">
          <span>Press Tab for autocomplete, ↑↓ for history</span>
          <span>{lines.length} lines</span>
        </div>
      </div>
    </div>
  );
}