'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { ChatInterface } from './ChatInterface';
import { CodeEditor } from './CodeEditor';
import { FileExplorer } from './FileExplorer';
import { Terminal } from './Terminal';
import { StatusBar } from './StatusBar';

export function Dashboard() {
  const [activePanel, setActivePanel] = useState<'chat' | 'editor' | 'terminal'>('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-dark-900">
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Left panel - File Explorer */}
        <motion.div
          initial={false}
          animate={{
            width: sidebarCollapsed ? '300px' : '250px',
          }}
          className="bg-dark-50 dark:bg-dark-800 border-r border-dark-200 dark:border-dark-700 flex-shrink-0"
        >
          <FileExplorer />
        </motion.div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Tab bar */}
          <div className="bg-white dark:bg-dark-900 border-b border-dark-200 dark:border-dark-700 px-4 py-2">
            <div className="flex space-x-1">
              {(['chat', 'editor', 'terminal'] as const).map((panel) => (
                <button
                  key={panel}
                  onClick={() => setActivePanel(panel)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activePanel === panel
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-dark-100 hover:bg-dark-100 dark:hover:bg-dark-800'
                  }`}
                >
                  {panel.charAt(0).toUpperCase() + panel.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activePanel === 'chat' && <ChatInterface />}
              {activePanel === 'editor' && <CodeEditor />}
              {activePanel === 'terminal' && <Terminal />}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}