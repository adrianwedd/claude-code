'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import {
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  CommandLineIcon,
  CogIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('chat');

  const menuItems = [
    { id: 'chat', icon: ChatBubbleLeftRightIcon, label: 'Chat' },
    { id: 'editor', icon: CodeBracketIcon, label: 'Editor' },
    { id: 'terminal', icon: CommandLineIcon, label: 'Terminal' },
    { id: 'settings', icon: CogIcon, label: 'Settings' },
  ];

  return (
    <motion.div
      initial={false}
      animate={{
        width: collapsed ? '60px' : '240px',
      }}
      className="bg-white dark:bg-dark-800 border-r border-dark-200 dark:border-dark-700 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-dark-200 dark:border-dark-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-lg font-bold text-dark-900 dark:text-dark-100">
                Claude Code
              </h1>
            </motion.div>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            <Bars3Icon className="h-5 w-5 text-dark-600 dark:text-dark-400" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveItem(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                  activeItem === item.id
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-dark-100 hover:bg-dark-100 dark:hover:bg-dark-700'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="ml-3"
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-dark-200 dark:border-dark-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-3"
            >
              <UserCircleIcon className="h-8 w-8 text-dark-400" />
              <div>
                <p className="text-sm font-medium text-dark-900 dark:text-dark-100">
                  Developer
                </p>
                <p className="text-xs text-dark-500 dark:text-dark-400">
                  Online
                </p>
              </div>
            </motion.div>
          )}
          <button
            onClick={() => signOut()}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
            title="Sign out"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 text-dark-600 dark:text-dark-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}