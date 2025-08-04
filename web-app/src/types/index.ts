export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  github?: {
    username: string;
    accessToken: string;
  };
}

export interface Session {
  id: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  memory?: SessionMemory;
}

export interface SessionMemory {
  context: string;
  variables: Record<string, any>;
  history: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    toolUse?: ToolUse[];
    executionTime?: number;
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
  executionTime?: number;
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  lastModified: Date;
  size: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  path: string;
  repository?: {
    url: string;
    branch: string;
    lastCommit?: string;
  };
  files: CodeFile[];
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface WebSocketMessage {
  type: 'chat' | 'tool_use' | 'file_update' | 'system_status' | 'error';
  payload: any;
  timestamp: Date;
  sessionId?: string;
}

export interface SystemStatus {
  containerRunning: boolean;
  claudeConnected: boolean;
  memoryUsage: number;
  cpuUsage: number;
  activeSessionsCount: number;
  lastHeartbeat: Date;
}

export interface EditorTheme {
  name: string;
  isDark: boolean;
  colors: {
    background: string;
    foreground: string;
    selection: string;
    lineHighlight: string;
    cursor: string;
  };
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  editorTheme: string;
  fontSize: number;
  autoSave: boolean;
  notifications: {
    desktop: boolean;
    sound: boolean;
    tts: boolean;
  };
  ai: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
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

export interface FileSystemEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: Date;
  children?: FileSystemEntry[];
}

export interface ContainerInfo {
  id: string;
  image: string;
  status: 'running' | 'stopped' | 'starting' | 'error';
  ports: Record<string, number>;
  volumes: Record<string, string>;
  environment: Record<string, string>;
  logs: string[];
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actions?: {
    label: string;
    action: string;
  }[];
}