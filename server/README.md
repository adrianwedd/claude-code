# Claude Code WebSocket Server

Real-time communication hub for Claude Code multi-platform integration, enabling seamless synchronization between web, mobile, and CLI applications.

## Features

### 🔄 Real-Time Communication
- **WebSocket Server**: Socket.IO-based real-time messaging
- **Multi-Platform Support**: Web, mobile, and CLI client integration
- **Message Broadcasting**: Efficient message routing between clients
- **Connection Management**: Automatic reconnection and heartbeat monitoring

### 🛡️ Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive message validation with Joi

### 📊 Core Functionality
- **Chat Messages**: Real-time AI conversation synchronization
- **Terminal Commands**: Remote command execution coordination
- **File Updates**: Real-time file synchronization across platforms
- **TTS Notifications**: Text-to-speech notification broadcasting
- **System Status**: Real-time system health monitoring

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Start production server**:
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `JWT_SECRET` | JWT signing secret | `claude-code-dev-secret` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `localhost origins` |
| `CLAUDE_API_KEY` | Claude API key | None |
| `RATE_LIMIT_POINTS` | Rate limit requests | `100` |
| `RATE_LIMIT_DURATION` | Rate limit window (seconds) | `60` |

### Production Configuration

For production deployment, ensure:
- Set strong `JWT_SECRET`
- Configure proper `ALLOWED_ORIGINS`
- Set `NODE_ENV=production`
- Use external Redis for scaling
- Configure proper logging levels

## API Reference

### WebSocket Events

#### Authentication
```javascript
// Connect with authentication
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### Chat Messages
```javascript
// Send chat message
socket.emit('chat_message', {
  content: 'Hello Claude!',
  sessionId: 'session-uuid',
  projectId: 'project-id', // optional
  metadata: {} // optional
});

// Receive chat messages
socket.on('chat_message', (message) => {
  console.log('New message:', message);
});
```

#### Terminal Commands
```javascript
// Execute terminal command
socket.emit('terminal_command', {
  command: 'npm test',
  sessionId: 'session-uuid',
  workingDir: '/path/to/project' // optional
});

// Receive command output
socket.on('terminal_output', (output) => {
  console.log('Command output:', output);
});
```

#### File Updates
```javascript
// Send file update
socket.emit('file_update', {
  filePath: 'src/main.js',
  content: 'console.log("Hello World");',
  projectId: 'project-id',
  action: 'update' // 'create', 'update', 'delete'
});

// Receive file updates
socket.on('file_update', (update) => {
  console.log('File updated:', update);
});
```

#### TTS Notifications
```javascript
// Send TTS notification
socket.emit('tts_notification', {
  message: 'Build completed successfully!',
  type: 'success', // 'info', 'success', 'warning', 'error'
  priority: 'normal' // 'normal', 'urgent'
});

// Receive TTS notifications
socket.on('tts_notification', (notification) => {
  console.log('TTS notification:', notification);
});
```

#### Session Management
```javascript
// Join session
socket.emit('join_session', 'session-uuid');

// Join project
socket.emit('join_project', 'project-id');

// Get system status
socket.emit('system_status');
socket.on('system_status', (status) => {
  console.log('System status:', status);
});
```

### HTTP Endpoints

#### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-04T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

## Client Integration

### Web Application (React/Next.js)
```javascript
import io from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  auth: {
    token: getAuthToken()
  }
});

// Handle connection
socket.on('connect', () => {
  console.log('Connected to Claude Code server');
  socket.emit('join_session', currentSessionId);
});

// Handle chat messages
socket.on('chat_message', (message) => {
  addMessageToUI(message);
});
```

### Mobile Application (React Native)
```javascript
import io from 'socket.io-client';

const socket = io('ws://your-server.com:3001', {
  transports: ['websocket'],
  auth: {
    token: await getStoredToken()
  }
});

// Handle TTS notifications
socket.on('tts_notification', (notification) => {
  if (notification.type === 'success') {
    showSuccessNotification(notification.message);
  }
});
```

### CLI Integration (Python)
```python
import socketio

sio = socketio.Client()

@sio.event
def connect():
    print('Connected to Claude Code server')
    sio.emit('join_session', session_id)

@sio.event
def terminal_output(data):
    print(f"Output: {data['output']}")

sio.connect('ws://localhost:3001', auth={'token': jwt_token})
```

## Architecture

### Message Flow
```
CLI Client    Web App    Mobile App
    │            │           │
    ├────────────┼───────────┼─────► WebSocket Server
    │            │           │              │
    │            │           │              ▼
    │            │           │       Message Validation
    │            │           │              │
    │            │           │              ▼
    │            │           │       Rate Limiting
    │            │           │              │
    │            │           │              ▼
    │            │           │       Business Logic
    │            │           │              │
    ◄────────────┼───────────┼──────────────┤
                 │           │              │
                 │           │              ▼
                 │           │        Claude API
                 │           │        Integration
```

### Data Stores
- **In-Memory**: Active sessions, projects, message history (development)
- **Redis**: Distributed caching and session storage (production)
- **PostgreSQL**: Persistent data storage (production)

## Development

### Scripts
```bash
# Development with auto-reload
npm run dev

# Production build
npm start

# Run tests
npm test

# Linting
npm run lint

# Type checking
npm run type-check
```

### Testing
```bash
# Install test dependencies
npm install --dev

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Load testing
npm run test:load
```

## Deployment

### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .
EXPOSE 3001

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  claude-code-server:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Cloud Deployment

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway link
railway up
```

#### Heroku
```bash
# Create Heroku app
heroku create claude-code-server

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main
```

## Monitoring

### Logging
- **Winston**: Structured logging with multiple transports
- **Log Levels**: Error, warn, info, debug
- **Log Rotation**: Automatic log file management

### Metrics
- **Connection Count**: Active WebSocket connections
- **Message Throughput**: Messages per second
- **Error Rates**: Failed message processing
- **Response Times**: Message processing latency

### Health Checks
```bash
# Basic health check
curl http://localhost:3001/health

# WebSocket connection test
wscat -c ws://localhost:3001
```

## Security Considerations

### Authentication
- JWT tokens with expiration
- Refresh token mechanism
- Rate limiting per user/IP

### Data Validation
- Input sanitization with Joi
- Message size limits
- File upload restrictions

### Network Security
- CORS configuration
- Helmet.js security headers
- Rate limiting middleware

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check firewall settings
   - Verify CORS configuration
   - Confirm WebSocket support

2. **Authentication Errors**
   - Validate JWT token format
   - Check token expiration
   - Verify JWT secret

3. **Performance Issues**
   - Monitor memory usage
   - Check message queue size
   - Review rate limiting settings

### Debug Mode
```bash
# Enable debug logging
DEBUG=socket.io* npm run dev

# Verbose logging
LOG_LEVEL=debug npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/websocket-enhancement`
3. Make your changes with tests
4. Ensure all tests pass: `npm test`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the main project LICENSE file for details.