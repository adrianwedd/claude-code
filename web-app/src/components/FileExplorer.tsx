'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderIcon,
  FolderOpenIcon,
  DocumentIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { FileSystemEntry } from '@/types';

// Mock file system data
const mockFileSystem: FileSystemEntry[] = [
  {
    name: 'src',
    path: '/src',
    type: 'directory',
    children: [
      {
        name: 'components',
        path: '/src/components',
        type: 'directory',
        children: [
          { name: 'Button.tsx', path: '/src/components/Button.tsx', type: 'file', size: 1024 },
          { name: 'Modal.tsx', path: '/src/components/Modal.tsx', type: 'file', size: 2048 },
        ],
      },
      {
        name: 'hooks',
        path: '/src/hooks',
        type: 'directory',
        children: [
          { name: 'useAuth.ts', path: '/src/hooks/useAuth.ts', type: 'file', size: 512 },
          { name: 'useSocket.ts', path: '/src/hooks/useSocket.ts', type: 'file', size: 1536 },
        ],
      },
      { name: 'App.tsx', path: '/src/App.tsx', type: 'file', size: 4096 },
      { name: 'index.tsx', path: '/src/index.tsx', type: 'file', size: 256 },
    ],
  },
  {
    name: 'public',
    path: '/public',
    type: 'directory',
    children: [
      { name: 'favicon.ico', path: '/public/favicon.ico', type: 'file', size: 64 },
      { name: 'manifest.json', path: '/public/manifest.json', type: 'file', size: 512 },
    ],
  },
  { name: 'package.json', path: '/package.json', type: 'file', size: 2048 },
  { name: 'tsconfig.json', path: '/tsconfig.json', type: 'file', size: 1024 },
  { name: 'README.md', path: '/README.md', type: 'file', size: 4096 },
];

interface FileTreeItemProps {
  item: FileSystemEntry;
  depth: number;
  onSelect: (path: string) => void;
  selectedPath: string | null;
}

function FileTreeItem({ item, depth, onSelect, selectedPath }: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = selectedPath === item.path;

  const handleToggle = () => {
    if (item.type === 'directory') {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(item.path);
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return '⚛️';
      case 'ts':
      case 'js':
        return '📄';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      case 'css':
      case 'scss':
        return '🎨';
      case 'html':
        return '🌐';
      default:
        return '📄';
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-dark-100 dark:hover:bg-dark-700 rounded transition-colors ${
          isSelected ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleToggle}
      >
        {item.type === 'directory' && (
          <div className="mr-1 text-dark-400">
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </div>
        )}

        <div className="mr-2">
          {item.type === 'directory' ? (
            isExpanded ? (
              <FolderOpenIcon className="h-4 w-4 text-blue-500" />
            ) : (
              <FolderIcon className="h-4 w-4 text-blue-500" />
            )
          ) : (
            <span className="text-sm">{getFileIcon(item.name)}</span>
          )}
        </div>

        <span className="text-sm text-dark-700 dark:text-dark-300 truncate">
          {item.name}
        </span>

        {item.type === 'file' && item.size && (
          <span className="ml-auto text-xs text-dark-400">
            {(item.size / 1024).toFixed(1)}KB
          </span>
        )}
      </div>

      <AnimatePresence>
        {item.type === 'directory' && isExpanded && item.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {item.children.map((child) => (
              <FileTreeItem
                key={child.path}
                item={child}
                depth={depth + 1}
                onSelect={onSelect}
                selectedPath={selectedPath}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FileExplorer() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileSelect = (path: string) => {
    setSelectedPath(path);
    console.log('Selected file:', path);
    // Implement file opening logic here
  };

  const filteredFiles = searchQuery
    ? mockFileSystem.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockFileSystem;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-dark-200 dark:border-dark-700">
        <h3 className="text-sm font-semibold text-dark-900 dark:text-dark-100 mb-3">
          Explorer
        </h3>
        
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-dark-50 dark:bg-dark-700 border border-dark-200 dark:border-dark-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredFiles.length === 0 ? (
          <div className="text-center text-dark-500 dark:text-dark-400 text-sm mt-8">
            No files found
          </div>
        ) : (
          <div className="space-y-1">
            {filteredFiles.map((item) => (
              <FileTreeItem
                key={item.path}
                item={item}
                depth={0}
                onSelect={handleFileSelect}
                selectedPath={selectedPath}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-dark-200 dark:border-dark-700">
        <div className="text-xs text-dark-500 dark:text-dark-400">
          {filteredFiles.length} items
        </div>
      </div>
    </div>
  );
}