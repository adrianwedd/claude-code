'use client';

import { useSocket } from '@/hooks/useSocket';
import { useAppState } from '@/hooks/useAppState';

export function StatusBar() {
  const { isConnected } = useSocket();
  const { state } = useAppState();

  return (
    <div className="bg-primary-600 text-white px-4 py-2 text-xs flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {state.currentProject && (
          <div className="flex items-center space-x-2">
            <span>📁</span>
            <span>{state.currentProject.name}</span>
          </div>
        )}
        
        {state.systemStatus && (
          <div className="flex items-center space-x-4">
            <span>CPU: {state.systemStatus.cpuUsage.toFixed(1)}%</span>
            <span>Memory: {state.systemStatus.memoryUsage.toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <span>Claude Code v1.0.0</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}