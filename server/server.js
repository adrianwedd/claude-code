/**
 * Claude Code WebSocket Server
 * Real-time communication hub for multi-platform integration
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const Joi = require('joi');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { router: healthRouter, initializeHealthChecks } = require('./health');
require('dotenv').config();

// Configuration
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'claude-code-dev-secret';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Logger setup
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'server.log' })
  ]
});

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req, res) => req.ip,
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Express app setup
const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://claude-code.vercel.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoints
app.use('/', healthRouter);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://claude-code.vercel.app'
    ],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// In-memory stores (replace with Redis in production)
const activeSessions = new Map();
const activeProjects = new Map();
const messageHistory = new Map();

// Message validation schemas
const messageSchemas = {
  chat_message: Joi.object({
    content: Joi.string().min(1).max(10000).required(),
    sessionId: Joi.string().uuid().required(),
    projectId: Joi.string().optional(),
    metadata: Joi.object().optional()
  }),
  
  terminal_command: Joi.object({
    command: Joi.string().min(1).max(1000).required(),
    sessionId: Joi.string().uuid().required(),
    projectId: Joi.string().optional(),
    workingDir: Joi.string().optional()
  }),
  
  file_update: Joi.object({
    filePath: Joi.string().required(),
    content: Joi.string().required(),
    projectId: Joi.string().required(),
    action: Joi.string().valid('create', 'update', 'delete').required()
  }),
  
  project_sync: Joi.object({
    projectId: Joi.string().required(),
    data: Joi.object().required(),
    timestamp: Joi.date().required()
  }),
  
  tts_notification: Joi.object({
    message: Joi.string().min(1).max(500).required(),
    type: Joi.string().valid('info', 'success', 'warning', 'error').required(),
    priority: Joi.string().valid('normal', 'urgent').default('normal')
  })
};

// Authentication middleware for Socket.IO
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    
    if (!token) {
      // Allow anonymous connections for development
      if (NODE_ENV === 'development') {
        socket.userId = `anonymous_${uuidv4()}`;
        socket.isAuthenticated = false;
        return next();
      }
      return next(new Error('Authentication required'));
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    socket.isAuthenticated = true;
    
    logger.info('User authenticated', { userId: socket.userId, email: socket.userEmail });
    next();
  } catch (error) {
    logger.error('Authentication failed', { error: error.message });
    next(new Error('Invalid authentication token'));
  }
});

// Rate limiting middleware for Socket.IO
io.use(async (socket, next) => {
  try {
    const clientIP = socket.handshake.address;
    await rateLimiter.consume(clientIP);
    next();
  } catch (rejRes) {
    logger.warn('Rate limit exceeded', { 
      ip: socket.handshake.address,
      userId: socket.userId 
    });
    next(new Error('Rate limit exceeded'));
  }
});

// Socket connection handling
io.on('connection', (socket) => {
  // Update connection stats
  global.socketStats.connections++;
  
  logger.info('Client connected', { 
    socketId: socket.id, 
    userId: socket.userId,
    authenticated: socket.isAuthenticated,
    totalConnections: global.socketStats.connections
  });
  
  // Join user to their personal room
  socket.join(`user:${socket.userId}`);
  
  // Handle chat messages
  socket.on('chat_message', async (data) => {
    try {
      const { error, value } = messageSchemas.chat_message.validate(data);
      if (error) {
        socket.emit('error', { message: 'Invalid message format', details: error.details });
        return;
      }
      
      const message = {
        id: uuidv4(),
        ...value,
        userId: socket.userId,
        timestamp: new Date().toISOString(),
        platform: 'websocket'
      };
      
      // Update message stats
      global.socketStats.messages++;
      
      // Store message history
      const sessionKey = `session:${value.sessionId}`;
      if (!messageHistory.has(sessionKey)) {
        messageHistory.set(sessionKey, []);
      }
      messageHistory.get(sessionKey).push(message);
      
      // Broadcast to session participants
      socket.to(sessionKey).emit('chat_message', message);
      
      // Here you would integrate with Claude API
      // For now, simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: uuidv4(),
          content: `AI Response to: "${value.content.substring(0, 50)}..."`,
          sessionId: value.sessionId,
          userId: 'claude-ai',
          timestamp: new Date().toISOString(),
          role: 'assistant',
          platform: 'claude-api'
        };
        
        messageHistory.get(sessionKey).push(aiResponse);
        io.to(sessionKey).emit('chat_message', aiResponse);
      }, 1000);
      
      logger.debug('Chat message processed', { messageId: message.id, sessionId: value.sessionId });
      
    } catch (error) {
      logger.error('Error processing chat message', { error: error.message, userId: socket.userId });
      socket.emit('error', { message: 'Failed to process message' });
    }
  });
  
  // Handle terminal commands
  socket.on('terminal_command', async (data) => {
    try {
      const { error, value } = messageSchemas.terminal_command.validate(data);
      if (error) {
        socket.emit('error', { message: 'Invalid command format', details: error.details });
        return;
      }
      
      const commandId = uuidv4();
      
      // Simulate command execution (replace with actual execution logic)
      setTimeout(() => {
        const output = `Executed: ${value.command}\nOutput: Command completed successfully`;
        
        socket.emit('terminal_output', {
          commandId,
          sessionId: value.sessionId,
          output,
          type: 'success',
          timestamp: new Date().toISOString()
        });
      }, 500);
      
      logger.debug('Terminal command received', { 
        command: value.command, 
        sessionId: value.sessionId,
        userId: socket.userId 
      });
      
    } catch (error) {
      logger.error('Error processing terminal command', { error: error.message, userId: socket.userId });
      socket.emit('error', { message: 'Failed to execute command' });
    }
  });
  
  // Handle file updates
  socket.on('file_update', async (data) => {
    try {
      const { error, value } = messageSchemas.file_update.validate(data);
      if (error) {
        socket.emit('error', { message: 'Invalid file update format', details: error.details });
        return;
      }
      
      const update = {
        id: uuidv4(),
        ...value,
        userId: socket.userId,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast file update to project participants
      socket.to(`project:${value.projectId}`).emit('file_update', update);
      
      logger.debug('File update processed', { 
        filePath: value.filePath, 
        projectId: value.projectId,
        action: value.action,
        userId: socket.userId 
      });
      
    } catch (error) {
      logger.error('Error processing file update', { error: error.message, userId: socket.userId });
      socket.emit('error', { message: 'Failed to update file' });
    }
  });
  
  // Handle TTS notifications
  socket.on('tts_notification', async (data) => {
    try {
      const { error, value } = messageSchemas.tts_notification.validate(data);
      if (error) {
        socket.emit('error', { message: 'Invalid TTS notification format', details: error.details });
        return;
      }
      
      const notification = {
        id: uuidv4(),
        ...value,
        userId: socket.userId,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast TTS notification to user's devices
      io.to(`user:${socket.userId}`).emit('tts_notification', notification);
      
      logger.debug('TTS notification sent', { 
        message: value.message, 
        type: value.type,
        priority: value.priority,
        userId: socket.userId 
      });
      
    } catch (error) {
      logger.error('Error processing TTS notification', { error: error.message, userId: socket.userId });
      socket.emit('error', { message: 'Failed to send TTS notification' });
    }
  });
  
  // Handle project joining
  socket.on('join_project', (projectId) => {
    if (!projectId) {
      socket.emit('error', { message: 'Project ID is required' });
      return;
    }
    
    socket.join(`project:${projectId}`);
    
    // Track active projects
    if (!activeProjects.has(projectId)) {
      activeProjects.set(projectId, new Set());
    }
    activeProjects.get(projectId).add(socket.userId);
    
    logger.debug('User joined project', { projectId, userId: socket.userId });
    socket.emit('project_joined', { projectId });
  });
  
  // Handle session joining
  socket.on('join_session', (sessionId) => {
    if (!sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    socket.join(`session:${sessionId}`);
    
    // Track active sessions
    if (!activeSessions.has(sessionId)) {
      activeSessions.set(sessionId, new Set());
    }
    activeSessions.get(sessionId).add(socket.userId);
    
    // Send recent message history
    const sessionHistory = messageHistory.get(`session:${sessionId}`) || [];
    socket.emit('session_history', {
      sessionId,
      messages: sessionHistory.slice(-50) // Last 50 messages
    });
    
    logger.debug('User joined session', { sessionId, userId: socket.userId });
    socket.emit('session_joined', { sessionId });
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    if (data.sessionId) {
      socket.to(`session:${data.sessionId}`).emit('typing', {
        userId: socket.userId,
        isTyping: data.isTyping,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Handle system status requests
  socket.on('system_status', () => {
    const status = {
      connectedClients: io.engine.clientsCount,
      activeSessions: activeSessions.size,
      activeProjects: activeProjects.size,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    socket.emit('system_status', status);
  });
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    // Update connection stats
    global.socketStats.connections = Math.max(0, global.socketStats.connections - 1);
    
    logger.info('Client disconnected', { 
      socketId: socket.id, 
      userId: socket.userId,
      reason,
      remainingConnections: global.socketStats.connections
    });
    
    // Clean up user from active sessions and projects
    activeSessions.forEach((users, sessionId) => {
      if (users.has(socket.userId)) {
        users.delete(socket.userId);
        if (users.size === 0) {
          activeSessions.delete(sessionId);
        }
      }
    });
    
    activeProjects.forEach((users, projectId) => {
      if (users.has(socket.userId)) {
        users.delete(socket.userId);
        if (users.size === 0) {
          activeProjects.delete(projectId);
        }
      }
    });
  });
  
  // Error handling
  socket.on('error', (error) => {
    logger.error('Socket error', { 
      socketId: socket.id, 
      userId: socket.userId,
      error: error.message 
    });
  });
});

// Periodic cleanup of old message history
setInterval(() => {
  const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
  
  messageHistory.forEach((messages, sessionId) => {
    const filtered = messages.filter(msg => new Date(msg.timestamp).getTime() > cutoffTime);
    if (filtered.length === 0) {
      messageHistory.delete(sessionId);
    } else {
      messageHistory.set(sessionId, filtered);
    }
  });
  
  logger.debug('Message history cleanup completed', { 
    totalSessions: messageHistory.size 
  });
}, 60 * 60 * 1000); // Run every hour

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  io.emit('server_shutdown', { 
    message: 'Server is shutting down for maintenance',
    timestamp: new Date().toISOString()
  });
  
  setTimeout(() => {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  }, 5000);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Initialize health checks
initializeHealthChecks();

// Initialize global WebSocket stats for monitoring
global.socketStats = {
  connections: 0,
  messages: 0
};

// Start server
server.listen(PORT, () => {
  logger.info(`Claude Code WebSocket Server running on port ${PORT}`, {
    environment: NODE_ENV,
    cors: process.env.ALLOWED_ORIGINS?.split(',') || ['localhost'],
    features: [
      'Real-time chat',
      'Terminal execution',
      'File synchronization',
      'TTS notifications',
      'Multi-platform support',
      'Health monitoring',
      'Metrics collection'
    ]
  });
});

module.exports = { app, server, io };