/**
 * Unified Error Handling System for Claude Code
 * Provides consistent error handling across all platforms (Web, Mobile, CLI, Server)
 */

// Error categories and codes
const ErrorCategories = {
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  NETWORK: 'NETWORK',
  API: 'API',
  SYSTEM: 'SYSTEM',
  USER_INPUT: 'USER_INPUT',
  RATE_LIMIT: 'RATE_LIMIT',
  FILE_SYSTEM: 'FILE_SYSTEM',
  WEBSOCKET: 'WEBSOCKET'
};

const ErrorCodes = {
  // Authentication errors (1xxx)
  AUTH_TOKEN_EXPIRED: 1001,
  AUTH_TOKEN_INVALID: 1002,
  AUTH_REQUIRED: 1003,
  AUTH_FAILED: 1004,
  
  // Authorization errors (2xxx)
  INSUFFICIENT_PERMISSIONS: 2001,
  RESOURCE_ACCESS_DENIED: 2002,
  PROJECT_ACCESS_DENIED: 2003,
  
  // Validation errors (3xxx)
  INVALID_INPUT: 3001,
  MISSING_REQUIRED_FIELD: 3002,
  INVALID_FORMAT: 3003,
  INVALID_FILE_TYPE: 3004,
  SIZE_LIMIT_EXCEEDED: 3005,
  
  // Network errors (4xxx)
  CONNECTION_FAILED: 4001,
  CONNECTION_TIMEOUT: 4002,
  CONNECTION_LOST: 4003,
  SERVER_UNAVAILABLE: 4004,
  
  // API errors (5xxx)
  API_KEY_INVALID: 5001,
  API_QUOTA_EXCEEDED: 5002,
  API_RATE_LIMITED: 5003,
  API_RESPONSE_ERROR: 5004,
  CLAUDE_API_ERROR: 5005,
  
  // System errors (6xxx)
  INTERNAL_ERROR: 6001,
  CONFIG_ERROR: 6002,
  DEPENDENCY_ERROR: 6003,
  MEMORY_ERROR: 6004,
  
  // User input errors (7xxx)
  INVALID_COMMAND: 7001,
  COMMAND_FAILED: 7002,
  FILE_NOT_FOUND: 7003,
  PERMISSION_DENIED: 7004,
  
  // Rate limiting errors (8xxx)
  RATE_LIMIT_EXCEEDED: 8001,
  CONCURRENT_REQUEST_LIMIT: 8002,
  
  // File system errors (9xxx)
  FILE_READ_ERROR: 9001,
  FILE_WRITE_ERROR: 9002,
  DIRECTORY_ACCESS_ERROR: 9003,
  DISK_SPACE_ERROR: 9004,
  
  // WebSocket errors (10xxx)
  WEBSOCKET_CONNECTION_FAILED: 10001,
  WEBSOCKET_MESSAGE_FAILED: 10002,
  WEBSOCKET_AUTHENTICATION_FAILED: 10003
};

// Error severity levels
const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Base error class for Claude Code
 */
class ClaudeCodeError extends Error {
  constructor(message, code, category, severity = ErrorSeverity.MEDIUM, context = {}) {
    super(message);
    this.name = 'ClaudeCodeError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.platform = this.detectPlatform();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  detectPlatform() {
    if (typeof window !== 'undefined') return 'web';
    if (typeof global !== 'undefined' && global.process) return 'node';
    if (typeof importScripts === 'function') return 'webworker';
    return 'unknown';
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      platform: this.platform,
      stack: this.stack
    };
  }
  
  toString() {
    return `[${this.category}:${this.code}] ${this.message}`;
  }
}

/**
 * Specific error classes for different categories
 */
class AuthenticationError extends ClaudeCodeError {
  constructor(message, code = ErrorCodes.AUTH_FAILED, context = {}) {
    super(message, code, ErrorCategories.AUTHENTICATION, ErrorSeverity.HIGH, context);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends ClaudeCodeError {
  constructor(message, code = ErrorCodes.INVALID_INPUT, context = {}) {
    super(message, code, ErrorCategories.VALIDATION, ErrorSeverity.MEDIUM, context);
    this.name = 'ValidationError';
  }
}

class NetworkError extends ClaudeCodeError {
  constructor(message, code = ErrorCodes.CONNECTION_FAILED, context = {}) {
    super(message, code, ErrorCategories.NETWORK, ErrorSeverity.HIGH, context);
    this.name = 'NetworkError';
  }
}

class APIError extends ClaudeCodeError {
  constructor(message, code = ErrorCodes.API_RESPONSE_ERROR, context = {}) {
    super(message, code, ErrorCategories.API, ErrorSeverity.HIGH, context);
    this.name = 'APIError';
  }
}

class RateLimitError extends ClaudeCodeError {
  constructor(message, code = ErrorCodes.RATE_LIMIT_EXCEEDED, context = {}) {
    super(message, code, ErrorCategories.RATE_LIMIT, ErrorSeverity.MEDIUM, context);
    this.name = 'RateLimitError';
  }
}

/**
 * Error handler factory for different platforms
 */
class ErrorHandlerFactory {
  static create(platform, options = {}) {
    switch (platform) {
      case 'web':
        return new WebErrorHandler(options);
      case 'mobile':
        return new MobileErrorHandler(options);
      case 'server':
        return new ServerErrorHandler(options);
      case 'cli':
        return new CLIErrorHandler(options);
      default:
        return new BaseErrorHandler(options);
    }
  }
}

/**
 * Base error handler with common functionality
 */
class BaseErrorHandler {
  constructor(options = {}) {
    this.options = {
      logErrors: true,
      reportErrors: false,
      showStackTrace: process.env.NODE_ENV === 'development',
      maxRetries: 3,
      retryDelay: 1000,
      ...options
    };
    
    this.errorLog = [];
    this.retryAttempts = new Map();
  }
  
  handle(error, context = {}) {
    const normalizedError = this.normalizeError(error, context);
    
    // Log the error
    if (this.options.logErrors) {
      this.logError(normalizedError);
    }
    
    // Report to monitoring service
    if (this.options.reportErrors) {
      this.reportError(normalizedError);
    }
    
    // Determine recovery strategy
    const recovery = this.getRecoveryStrategy(normalizedError);
    
    return {
      error: normalizedError,
      recovery,
      userMessage: this.getUserMessage(normalizedError),
      actions: this.getSuggestedActions(normalizedError)
    };
  }
  
  normalizeError(error, context = {}) {
    if (error instanceof ClaudeCodeError) {
      return error;
    }
    
    // Convert standard errors to ClaudeCodeError
    let code = ErrorCodes.INTERNAL_ERROR;
    let category = ErrorCategories.SYSTEM;
    let severity = ErrorSeverity.MEDIUM;
    
    // Detect error type based on message or properties
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      code = ErrorCodes.INVALID_INPUT;
      category = ErrorCategories.VALIDATION;
    } else if (error.name === 'NetworkError' || error.code === 'ECONNREFUSED') {
      code = ErrorCodes.CONNECTION_FAILED;
      category = ErrorCategories.NETWORK;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('rate limit')) {
      code = ErrorCodes.RATE_LIMIT_EXCEEDED;
      category = ErrorCategories.RATE_LIMIT;
    } else if (error.message.includes('authentication') || error.status === 401) {
      code = ErrorCodes.AUTH_FAILED;
      category = ErrorCategories.AUTHENTICATION;
      severity = ErrorSeverity.HIGH;
    }
    
    return new ClaudeCodeError(
      error.message || 'An unexpected error occurred',
      code,
      category,
      severity,
      { ...context, originalError: error.name }
    );
  }
  
  logError(error) {
    const logEntry = {
      timestamp: error.timestamp,
      level: this.getSeverityLevel(error.severity),
      message: error.message,
      code: error.code,
      category: error.category,
      context: error.context,
      stack: this.options.showStackTrace ? error.stack : undefined
    };
    
    this.errorLog.push(logEntry);
    
    // Platform-specific logging
    this.platformLog(logEntry);
  }
  
  platformLog(logEntry) {
    // Override in platform-specific handlers
    console.error(`[${logEntry.category}:${logEntry.code}] ${logEntry.message}`);
  }
  
  getSeverityLevel(severity) {
    switch (severity) {
      case ErrorSeverity.CRITICAL: return 'error';
      case ErrorSeverity.HIGH: return 'error';
      case ErrorSeverity.MEDIUM: return 'warn';
      case ErrorSeverity.LOW: return 'info';
      default: return 'warn';
    }
  }
  
  getUserMessage(error) {
    const messages = {
      [ErrorCodes.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
      [ErrorCodes.AUTH_REQUIRED]: 'Authentication required to access this feature.',
      [ErrorCodes.CONNECTION_FAILED]: 'Unable to connect to server. Please check your internet connection.',
      [ErrorCodes.API_RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
      [ErrorCodes.INVALID_INPUT]: 'Please check your input and try again.',
      [ErrorCodes.FILE_NOT_FOUND]: 'The requested file could not be found.',
      [ErrorCodes.PERMISSION_DENIED]: 'You don\'t have permission to perform this action.',
      [ErrorCodes.CLAUDE_API_ERROR]: 'AI service is temporarily unavailable. Please try again later.',
    };
    
    return messages[error.code] || 'An unexpected error occurred. Please try again.';
  }
  
  getSuggestedActions(error) {
    const actions = {
      [ErrorCodes.AUTH_TOKEN_EXPIRED]: ['Sign in again', 'Refresh the page'],
      [ErrorCodes.CONNECTION_FAILED]: ['Check internet connection', 'Try again', 'Contact support'],
      [ErrorCodes.API_RATE_LIMITED]: ['Wait 60 seconds', 'Try again later'],
      [ErrorCodes.INVALID_INPUT]: ['Check input format', 'Review requirements'],
      [ErrorCodes.FILE_NOT_FOUND]: ['Check file path', 'Verify file exists'],
      [ErrorCodes.CLAUDE_API_ERROR]: ['Try again later', 'Use offline features', 'Contact support'],
    };
    
    return actions[error.code] || ['Try again', 'Contact support if problem persists'];
  }
  
  getRecoveryStrategy(error) {
    const strategies = {
      [ErrorCategories.NETWORK]: 'retry',
      [ErrorCategories.API]: 'retry',
      [ErrorCategories.RATE_LIMIT]: 'delay_retry',
      [ErrorCategories.AUTHENTICATION]: 'reauthenticate',
      [ErrorCategories.VALIDATION]: 'user_input',
      [ErrorCategories.SYSTEM]: 'fallback'
    };
    
    return strategies[error.category] || 'fallback';
  }
  
  canRetry(error, context = {}) {
    const retryableCategories = [
      ErrorCategories.NETWORK,
      ErrorCategories.API,
      ErrorCategories.WEBSOCKET
    ];
    
    if (!retryableCategories.includes(error.category)) {
      return false;
    }
    
    const key = `${error.code}_${context.operation || 'default'}`;
    const attempts = this.retryAttempts.get(key) || 0;
    
    return attempts < this.options.maxRetries;
  }
  
  async retry(operation, error, context = {}) {
    const key = `${error.code}_${context.operation || 'default'}`;
    const attempts = this.retryAttempts.get(key) || 0;
    
    if (attempts >= this.options.maxRetries) {
      throw new ClaudeCodeError(
        'Maximum retry attempts exceeded',
        ErrorCodes.INTERNAL_ERROR,
        ErrorCategories.SYSTEM,
        ErrorSeverity.HIGH
      );
    }
    
    this.retryAttempts.set(key, attempts + 1);
    
    // Calculate delay with exponential backoff
    const delay = this.options.retryDelay * Math.pow(2, attempts);
    await this.delay(delay);
    
    try {
      const result = await operation();
      this.retryAttempts.delete(key); // Reset on success
      return result;
    } catch (retryError) {
      if (this.canRetry(error, context)) {
        return this.retry(operation, error, context);
      }
      throw retryError;
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  reportError(error) {
    // Override in platform-specific handlers for error reporting
    // This could send to Sentry, LogRocket, etc.
    console.warn('Error reporting not implemented for base handler');
  }
  
  getErrorSummary() {
    const summary = {
      total: this.errorLog.length,
      bySeverity: {},
      byCategory: {},
      recent: this.errorLog.slice(-10)
    };
    
    this.errorLog.forEach(error => {
      const severity = this.getSeverityLevel(error.severity);
      summary.bySeverity[severity] = (summary.bySeverity[severity] || 0) + 1;
      summary.byCategory[error.category] = (summary.byCategory[error.category] || 0) + 1;
    });
    
    return summary;
  }
}

/**
 * Web-specific error handler
 */
class WebErrorHandler extends BaseErrorHandler {
  constructor(options = {}) {
    super({
      showUserNotifications: true,
      useToastNotifications: true,
      reportToSentry: false,
      ...options
    });
  }
  
  platformLog(logEntry) {
    // Use console with appropriate styling for web
    const style = this.getConsoleStyle(logEntry.level);
    console.group(`%c[${logEntry.category}:${logEntry.code}]`, style);
    console.error(logEntry.message);
    if (logEntry.context) {
      console.log('Context:', logEntry.context);
    }
    if (logEntry.stack) {
      console.log('Stack:', logEntry.stack);
    }
    console.groupEnd();
  }
  
  getConsoleStyle(level) {
    const styles = {
      error: 'color: #ff4444; font-weight: bold;',
      warn: 'color: #ffaa00; font-weight: bold;',
      info: 'color: #4444ff; font-weight: bold;'
    };
    return styles[level] || styles.warn;
  }
  
  showUserNotification(message, type = 'error') {
    if (!this.options.showUserNotifications) return;
    
    if (this.options.useToastNotifications && window.showToast) {
      window.showToast(message, type);
    } else {
      // Fallback to alert or custom notification
      alert(message);
    }
  }
}

/**
 * Server-specific error handler  
 */
class ServerErrorHandler extends BaseErrorHandler {
  constructor(options = {}) {
    super({
      logToFile: true,
      useWinston: true,
      reportToSentry: process.env.NODE_ENV === 'production',
      ...options
    });
  }
  
  platformLog(logEntry) {
    // Use structured logging for server
    if (this.options.useWinston && global.logger) {
      global.logger[logEntry.level](logEntry.message, {
        code: logEntry.code,
        category: logEntry.category,
        context: logEntry.context
      });
    } else {
      const timestamp = new Date().toISOString();
      console.error(`${timestamp} [${logEntry.level.toUpperCase()}] [${logEntry.category}:${logEntry.code}] ${logEntry.message}`);
    }
  }
}

/**
 * CLI-specific error handler
 */
class CLIErrorHandler extends BaseErrorHandler {
  constructor(options = {}) {
    super({
      useColors: true,
      showProgress: true,
      ...options
    });
  }
  
  platformLog(logEntry) {
    const colors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[34m',
      reset: '\x1b[0m'
    };
    
    const color = this.options.useColors ? colors[logEntry.level] || colors.warn : '';
    const reset = this.options.useColors ? colors.reset : '';
    
    console.error(`${color}[${logEntry.category}:${logEntry.code}] ${logEntry.message}${reset}`);
  }
}

/**
 * Mobile-specific error handler
 */
class MobileErrorHandler extends BaseErrorHandler {
  constructor(options = {}) {
    super({
      useCrashlytics: true,
      showInAppNotifications: true,
      ...options
    });
  }
  
  platformLog(logEntry) {
    // Mobile logging - could integrate with React Native debugging tools
    console.error(`[Mobile][${logEntry.category}:${logEntry.code}] ${logEntry.message}`);
  }
}

// Export everything
module.exports = {
  ClaudeCodeError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  APIError,
  RateLimitError,
  ErrorCategories,
  ErrorCodes,
  ErrorSeverity,
  ErrorHandlerFactory,
  BaseErrorHandler,
  WebErrorHandler,
  ServerErrorHandler,
  CLIErrorHandler,
  MobileErrorHandler
};