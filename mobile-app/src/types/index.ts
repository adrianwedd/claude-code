export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  githubUsername?: string;
  accessToken: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  repository: {
    url: string;
    branch: string;
    owner: string;
    name: string;
  };
  status: 'active' | 'inactive' | 'error';
  lastActivity: Date;
  ciStatus?: CIStatus;
}

export interface CIStatus {
  id: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'cancelled';
  branch: string;
  commit: {
    sha: string;
    message: string;
    author: string;
    timestamp: Date;
  };
  workflow?: string;
  startedAt?: Date;
  completedAt?: Date;
  logs?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    toolUse?: ToolUse[];
    tokens?: {
      input: number;
      output: number;
    };
  };
}

export interface ToolUse {
  name: string;
  input: Record<string, any>;
  output?: any;
  error?: string;
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date;
}

export interface Session {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'ci_update';
  timestamp: Date;
  read: boolean;
  projectId?: string;
  actionUrl?: string;
  data?: Record<string, any>;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  notifications: {
    push: boolean;
    ciUpdates: boolean;
    aiSuggestions: boolean;
    sound: boolean;
    vibration: boolean;
  };
  sync: {
    autoSync: boolean;
    syncInterval: number; // minutes
    wifiOnly: boolean;
  };
  ai: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  biometrics: {
    enabled: boolean;
    type?: 'fingerprint' | 'face' | 'iris';
  };
}

export interface SyncStatus {
  lastSync: Date | null;
  isOnline: boolean;
  pendingChanges: number;
  syncInProgress: boolean;
  error?: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileTreeNode[];
  isExpanded?: boolean;
}

export interface WebSocketMessage {
  type: 'chat' | 'ci_update' | 'file_change' | 'system_status' | 'notification';
  payload: any;
  timestamp: Date;
  sessionId?: string;
  projectId?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Navigation types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  ProjectDetail: { projectId: string };
  ChatSession: { sessionId: string; projectId: string };
  CodeViewer: { filePath: string; projectId: string };
  Settings: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  Projects: undefined;
  Chat: undefined;
  Files: undefined;
  CI: undefined;
  Profile: undefined;
};

export type ProjectStackParamList = {
  ProjectList: undefined;
  ProjectDetail: { projectId: string };
  CreateProject: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatSession: { sessionId: string; projectId: string };
  NewChat: { projectId?: string };
};

export type FilesStackParamList = {
  FileExplorer: { projectId: string };
  CodeViewer: { filePath: string; projectId: string };
  FileSearch: { projectId: string };
};

export type CIStackParamList = {
  CIOverview: undefined;
  CIDetail: { ciId: string; projectId: string };
  CILogs: { ciId: string; projectId: string };
};