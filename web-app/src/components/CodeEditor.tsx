'use client';

import { useState, useRef, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { useAppState } from '@/hooks/useAppState';

export function CodeEditor() {
  const { theme } = useTheme();
  const { state } = useAppState();
  const [code, setCode] = useState('// Welcome to Claude Code\n// Start coding with AI assistance\n\nconsole.log("Hello, World!");');
  const [language, setLanguage] = useState('typescript');
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Configure editor
    editor.updateOptions({
      fontSize: state.settings.fontSize,
      wordWrap: 'on',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      
      // Auto-save if enabled
      if (state.settings.autoSave) {
        // Implement auto-save logic here
        console.log('Auto-saving code...');
      }
    }
  };

  const editorTheme = theme === 'dark' || state.settings.editorTheme.includes('dark') 
    ? 'vs-dark' 
    : 'vs-light';

  return (
    <div className="h-full flex flex-col">
      {/* Editor toolbar */}
      <div className="bg-white dark:bg-dark-800 border-b border-dark-200 dark:border-dark-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1 bg-dark-50 dark:bg-dark-700 border border-dark-200 dark:border-dark-600 rounded text-sm"
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
            </select>
            
            <span className="text-sm text-dark-500 dark:text-dark-400">
              Ln 1, Col 1
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors">
              Format
            </button>
            <button className="px-3 py-1 text-sm bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600 text-dark-700 dark:text-dark-300 rounded transition-colors">
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme={editorTheme}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: state.settings.fontSize,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: { enabled: true },
            wordWrap: 'on',
            contextmenu: true,
            selectOnLineNumbers: true,
            glyphMargin: true,
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            unfoldOnClickAfterEndOfLine: false,
            renderLineHighlight: 'all',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showClasses: true,
              showFunctions: true,
              showVariables: true,
            },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            parameterHints: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  );
}