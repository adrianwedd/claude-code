/**
 * Error Middleware for Express/Socket.IO Integration
 * Provides consistent error handling across server endpoints
 */

const { 
  ClaudeCodeError, 
  ErrorCategories, 
  ErrorCodes,
  ErrorHandlerFactory 
} = require('./error-handling');

/**
 * Express error middleware
 */
function expressErrorMiddleware(options = {}) {
  const errorHandler = ErrorHandlerFactory.create('server', options);
  
  return (error, req, res, next) => {
    const context = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    };
    
    const handled = errorHandler.handle(error, context);
    
    // Determine HTTP status code
    let statusCode = 500;
    
    switch (handled.error.category) {
      case ErrorCategories.AUTHENTICATION:
        statusCode = 401;
        break;
      case ErrorCategories.AUTHORIZATION:
        statusCode = 403;
        break;
      case ErrorCategories.VALIDATION:
        statusCode = 400;
        break;
      case ErrorCategories.RATE_LIMIT:
        statusCode = 429;
        break;
      case ErrorCategories.API:
        statusCode = handled.error.code === ErrorCodes.API_RATE_LIMITED ? 429 : 502;
        break;
      case ErrorCategories.NETWORK:
        statusCode = 503;
        break;
      default:
        statusCode = 500;
    }
    
    // Send error response
    res.status(statusCode).json({
      success: false,
      error: {
        message: handled.userMessage,
        code: handled.error.code,
        category: handled.error.category,
        timestamp: handled.error.timestamp,
        actions: handled.actions
      },
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          originalMessage: handled.error.message,
          stack: handled.error.stack,
          context: handled.error.context
        }
      })
    });
  };
}

/**
 * Socket.IO error middleware
 */
function socketErrorMiddleware(options = {}) {
  const errorHandler = ErrorHandlerFactory.create('server', options);
  
  return (socket, next) => {
    // Override socket.emit to catch and handle errors
    const originalEmit = socket.emit;
    
    socket.emit = function(event, data, callback) {
      try {
        return originalEmit.call(this, event, data, callback);
      } catch (error) {
        const context = {
          socketId: socket.id,
          userId: socket.userId,
          event: event,
          rooms: Array.from(socket.rooms)
        };
        
        const handled = errorHandler.handle(error, context);
        
        // Emit error to client
        socket.emit('error', {
          message: handled.userMessage,
          code: handled.error.code,
          category: handled.error.category,
          timestamp: handled.error.timestamp,
          actions: handled.actions
        });
      }
    };
    
    // Handle socket errors
    socket.on('error', (error) => {
      const context = {
        socketId: socket.id,
        userId: socket.userId,
        rooms: Array.from(socket.rooms)
      };
      
      errorHandler.handle(error, context);
    });
    
    next();
  };
}

/**
 * Async error wrapper for route handlers
 */
function asyncErrorWrapper(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Socket event error wrapper
 */
function socketEventWrapper(handler, errorHandler) {
  return async (data, callback) => {
    try {
      await handler(data, callback);
    } catch (error) {
      const context = {
        socketId: this.id,
        userId: this.userId,
        eventData: data
      };
      
      const handled = errorHandler.handle(error, context);
      
      // Send error to client
      this.emit('error', {
        message: handled.userMessage,
        code: handled.error.code,
        category: handled.error.category,
        actions: handled.actions
      });
      
      // Call callback with error if provided
      if (callback && typeof callback === 'function') {
        callback({
          error: handled.userMessage,
          code: handled.error.code
        });
      }
    }
  };
}

/**
 * Rate limiting error handler
 */
function rateLimitErrorHandler(req, res, next, rateLimitInfo) {
  const error = new ClaudeCodeError(
    `Rate limit exceeded. Try again in ${Math.ceil(rateLimitInfo.msBeforeNext / 1000)} seconds.`,
    ErrorCodes.RATE_LIMIT_EXCEEDED,
    ErrorCategories.RATE_LIMIT
  );
  
  next(error);
}

/**
 * Validation error handler for request body/params
 */
function validationErrorHandler(validationResult) {
  const errors = validationResult.array();
  const errorMessages = errors.map(err => `${err.param}: ${err.msg}`).join(', ');
  
  return new ClaudeCodeError(
    `Validation failed: ${errorMessages}`,
    ErrorCodes.INVALID_INPUT,
    ErrorCategories.VALIDATION,
    undefined,
    { validationErrors: errors }
  );
}

/**
 * Database error handler
 */
function databaseErrorHandler(dbError) {
  let code = ErrorCodes.INTERNAL_ERROR;
  let message = 'Database operation failed';
  
  // Map common database errors
  if (dbError.code === '23505') { // Unique constraint violation
    code = ErrorCodes.INVALID_INPUT;
    message = 'Duplicate entry - resource already exists';
  } else if (dbError.code === '23503') { // Foreign key constraint
    code = ErrorCodes.INVALID_INPUT;
    message = 'Referenced resource does not exist';
  } else if (dbError.code === '23502') { // Not null constraint
    code = ErrorCodes.MISSING_REQUIRED_FIELD;
    message = 'Required field is missing';
  } else if (dbError.code === 'ECONNREFUSED') {
    code = ErrorCodes.CONNECTION_FAILED;
    message = 'Database connection failed';
  }
  
  return new ClaudeCodeError(
    message,
    code,
    ErrorCategories.SYSTEM,
    undefined,
    { originalError: dbError.code, detail: dbError.detail }
  );
}

/**
 * File system error handler
 */
function fileSystemErrorHandler(fsError) {
  let code = ErrorCodes.FILE_READ_ERROR;
  let category = ErrorCategories.FILE_SYSTEM;
  let message = 'File system operation failed';
  
  switch (fsError.code) {
    case 'ENOENT':
      code = ErrorCodes.FILE_NOT_FOUND;
      message = 'File or directory not found';
      break;
    case 'EACCES':
    case 'EPERM':
      code = ErrorCodes.PERMISSION_DENIED;
      message = 'Permission denied';
      break;
    case 'ENOSPC':
      code = ErrorCodes.DISK_SPACE_ERROR;
      message = 'Insufficient disk space';
      break;
    case 'EIO':
      code = ErrorCodes.FILE_READ_ERROR;
      message = 'I/O error occurred';
      break;
    case 'EMFILE':
    case 'ENFILE':
      code = ErrorCodes.SYSTEM_ERROR;
      message = 'Too many open files';
      break;
  }
  
  return new ClaudeCodeError(
    message,
    code,
    category,
    undefined,
    { path: fsError.path, syscall: fsError.syscall }
  );
}

/**
 * API integration error handler (for external APIs like Claude)
 */
function apiIntegrationErrorHandler(apiError, apiName = 'External API') {
  let code = ErrorCodes.API_RESPONSE_ERROR;
  let message = `${apiName} request failed`;
  
  if (apiError.response) {
    // HTTP error response
    const status = apiError.response.status;
    
    if (status === 401) {
      code = ErrorCodes.API_KEY_INVALID;
      message = `${apiName} authentication failed`;
    } else if (status === 429) {
      code = ErrorCodes.API_RATE_LIMITED;
      message = `${apiName} rate limit exceeded`;
    } else if (status === 402) {
      code = ErrorCodes.API_QUOTA_EXCEEDED;
      message = `${apiName} quota exceeded`;
    } else if (status >= 500) {
      code = ErrorCodes.SERVER_UNAVAILABLE;
      message = `${apiName} server error`;
    }
  } else if (apiError.code === 'ECONNREFUSED' || apiError.code === 'ENOTFOUND') {
    code = ErrorCodes.CONNECTION_FAILED;
    message = `Cannot connect to ${apiName}`;
  } else if (apiError.code === 'ETIMEDOUT') {
    code = ErrorCodes.CONNECTION_TIMEOUT;
    message = `${apiName} request timeout`;
  }
  
  return new ClaudeCodeError(
    message,
    code,
    ErrorCategories.API,
    undefined,
    { 
      apiName,
      status: apiError.response?.status,
      originalMessage: apiError.message 
    }
  );
}

/**
 * Global error handler setup for different environments
 */
function setupGlobalErrorHandlers(options = {}) {
  const errorHandler = ErrorHandlerFactory.create('server', options);
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    const handled = errorHandler.handle(error, { 
      type: 'uncaughtException',
      critical: true 
    });
    
    console.error('Uncaught Exception:', handled.error.toJSON());
    
    // Graceful shutdown
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    const handled = errorHandler.handle(error, { 
      type: 'unhandledRejection',
      promise: promise,
      critical: true 
    });
    
    console.error('Unhandled Rejection:', handled.error.toJSON());
  });
  
  // Handle SIGTERM gracefully
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    
    // Close server connections, cleanup resources
    setTimeout(() => {
      process.exit(0);
    }, 10000); // 10 second timeout
  });
}

module.exports = {
  expressErrorMiddleware,
  socketErrorMiddleware,
  asyncErrorWrapper,
  socketEventWrapper,
  rateLimitErrorHandler,
  validationErrorHandler,
  databaseErrorHandler,
  fileSystemErrorHandler,
  apiIntegrationErrorHandler,
  setupGlobalErrorHandlers
};