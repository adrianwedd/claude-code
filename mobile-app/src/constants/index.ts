import {Dimensions, Platform} from 'react-native';

// Device dimensions
export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;

// Platform checks
export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';

// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:3001' : 'https://api.claude-code.dev',
  WEBSOCKET_URL: __DEV__ ? 'ws://localhost:3001' : 'wss://ws.claude-code.dev',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Claude Code',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  BUNDLE_ID: IS_IOS ? 'com.claudecode.mobile' : 'com.claudecode.mobile',
  DEEP_LINK_SCHEME: 'claudecode',
};

// Theme Colors
export const COLORS = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  dark: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// Typography
export const FONTS = {
  thin: 'System' + (IS_IOS ? '' : '-Thin'),
  light: 'System' + (IS_IOS ? '' : '-Light'),
  regular: 'System',
  medium: 'System' + (IS_IOS ? '' : '-Medium'),
  semibold: 'System' + (IS_IOS ? '' : '-SemiBold'),
  bold: 'System' + (IS_IOS ? '' : '-Bold'),
  mono: IS_IOS ? 'Menlo' : 'monospace',
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border Radius
export const RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Animation Durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Z-Index Levels
export const Z_INDEX = {
  modal: 1000,
  overlay: 900,
  dropdown: 800,
  header: 700,
  fab: 600,
  drawer: 500,
};

// Layout Constants
export const LAYOUT = {
  HEADER_HEIGHT: IS_IOS ? 88 : 64,
  TAB_BAR_HEIGHT: IS_IOS ? 83 : 64,
  SAFE_AREA_PADDING: IS_IOS ? 44 : 0,
  STATUS_BAR_HEIGHT: IS_IOS ? 44 : 24,
};

// File Extensions and Languages
export const FILE_EXTENSIONS = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.cpp': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.cs': 'csharp',
  '.php': 'php',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.json': 'json',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.txt': 'text',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.fish': 'fish',
  '.sql': 'sql',
  '.dockerfile': 'dockerfile',
  '.gitignore': 'text',
  '.env': 'text',
};

// CI Status Colors
export const CI_STATUS_COLORS = {
  pending: COLORS.warning,
  running: COLORS.info,
  success: COLORS.success,
  failure: COLORS.error,
  cancelled: COLORS.dark[400],
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  CI_UPDATE: 'ci_update',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: '@claude_code/user_token',
  USER_DATA: '@claude_code/user_data',
  SETTINGS: '@claude_code/settings',
  PROJECTS: '@claude_code/projects',
  SESSIONS: '@claude_code/sessions',
  NOTIFICATIONS: '@claude_code/notifications',
  LAST_SYNC: '@claude_code/last_sync',
  BIOMETRIC_ENABLED: '@claude_code/biometric_enabled',
  THEME: '@claude_code/theme',
  ONBOARDING_COMPLETED: '@claude_code/onboarding_completed',
};

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CHAT_MESSAGE: 'chat_message',
  CI_UPDATE: 'ci_update',
  FILE_CHANGE: 'file_change',
  SYSTEM_STATUS: 'system_status',
  NOTIFICATION: 'notification',
  JOIN_PROJECT: 'join_project',
  LEAVE_PROJECT: 'leave_project',
  TYPING: 'typing',
  ERROR: 'error',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  INVALID_INPUT: 'Invalid input provided.',
  PROJECT_NOT_FOUND: 'Project not found.',
  SESSION_NOT_FOUND: 'Session not found.',
  FILE_NOT_FOUND: 'File not found.',
  SYNC_FAILED: 'Failed to sync data.',
  BIOMETRIC_NOT_AVAILABLE: 'Biometric authentication is not available on this device.',
  CAMERA_PERMISSION_DENIED: 'Camera permission is required for QR code scanning.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PROJECT_CREATED: 'Project created successfully.',
  PROJECT_UPDATED: 'Project updated successfully.',
  PROJECT_DELETED: 'Project deleted successfully.',
  SESSION_CREATED: 'Chat session created successfully.',
  FILE_SAVED: 'File saved successfully.',
  SETTINGS_UPDATED: 'Settings updated successfully.',
  SYNC_COMPLETED: 'Data synchronized successfully.',
  NOTIFICATION_CLEARED: 'Notifications cleared.',
};