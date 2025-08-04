# JWT Authentication Security Hardening

## Issue Type: Security - Critical Deployment Blocker

## Summary
Critical JWT authentication vulnerabilities including hardcoded secrets, weak token validation, and insecure WebSocket authentication. These vulnerabilities expose the entire application to authentication bypass and session hijacking attacks.

## Security Impact
- **CVSS Score**: 8.5 (Critical)
- **Attack Vectors**: Authentication Bypass, Session Hijacking, Token Theft
- **Data at Risk**: All user data, code repositories, API access
- **Compliance**: Critical SOC2 failure, authentication control deficiency

## Vulnerability Analysis

### 1. Hardcoded JWT Secret (CRITICAL)
```javascript
// server/server.js:21 - SECURITY VULNERABILITY
const JWT_SECRET = process.env.JWT_SECRET || 'claude-code-dev-secret';
```
**Risk**: Default secret enables attackers to forge valid tokens

### 2. Insecure WebSocket Authentication
```javascript
// server/server.js:131-138 - WEAK AUTHENTICATION
if (!token) {
  // Allow anonymous connections for development
  if (NODE_ENV === 'development') {
    socket.userId = `anonymous_${uuidv4()}`;
    socket.isAuthenticated = false;
    return next();
  }
  return next(new Error('Authentication required'));
}
```
**Risk**: Anonymous connections bypass all authorization controls

### 3. Missing Token Validation
```javascript
// web-app/src/hooks/useSocket.tsx:33 - NO TOKEN TRANSMISSION
const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001', {
  transports: ['websocket'],
  // MISSING: auth token transmission
});
```

## Required Security Implementation

### 1. JWT Secret Management
```javascript
// server/server.js - SECURITY FIX
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('SECURITY ERROR: JWT_SECRET must be set and at least 32 characters');
  process.exit(1);
}

// Add secret rotation capability
const JWT_SECRETS = [
  process.env.JWT_SECRET,
  process.env.JWT_SECRET_PREVIOUS // For graceful rotation
].filter(Boolean);
```

### 2. Enhanced JWT Token Validation
```javascript
// server/auth-middleware.js - NEW FILE REQUIRED
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const tokenBlacklist = new Set(); // Use Redis in production

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false,
});

function validateJWT(token, secrets = JWT_SECRETS) {
  let decoded = null;
  let error = null;
  
  for (const secret of secrets) {
    try {
      decoded = jwt.verify(token, secret, {
        issuer: 'claude-code',
        audience: 'claude-code-users',
        maxAge: '24h'
      });
      break;
    } catch (err) {
      error = err;
      continue;
    }
  }
  
  if (!decoded) {
    throw error || new Error('Invalid token');
  }
  
  // Check token blacklist
  if (tokenBlacklist.has(decoded.jti)) {
    throw new Error('Token revoked');
  }
  
  return decoded;
}

module.exports = { validateJWT, authLimiter, tokenBlacklist };
```

### 3. Secure WebSocket Authentication
```javascript
// server/server.js - WEBSOCKET AUTHENTICATION FIX
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || 
                 socket.handshake.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    const decoded = validateJWT(token);
    
    // Verify user exists and is active
    const user = await getUserById(decoded.userId);
    if (!user || !user.active) {
      return next(new Error('User not found or inactive'));
    }
    
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    socket.isAuthenticated = true;
    socket.tokenJti = decoded.jti; // For revocation tracking
    
    logger.info('WebSocket authenticated', { 
      userId: socket.userId, 
      email: socket.userEmail,
      jti: decoded.jti
    });
    
    next();
  } catch (error) {
    logger.error('WebSocket authentication failed', { 
      error: error.message,
      ip: socket.handshake.address
    });
    next(new Error('Authentication failed'));
  }
});
```

### 4. Client-Side Token Management
```javascript
// web-app/src/hooks/useSocket.tsx - SECURE TOKEN TRANSMISSION
import { useSession } from 'next-auth/react';

export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session } = useSession();
  
  const connect = () => {
    if (socket?.connected) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001', {
      auth: {
        token: session?.accessToken // Secure token transmission
      },
      transports: ['websocket'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true,
    });
    
    // Token refresh handling
    newSocket.on('token_expired', async () => {
      const refreshedToken = await refreshSession();
      newSocket.auth.token = refreshedToken;
      newSocket.connect();
    });
  };
}
```

### 5. Mobile App Secure Token Storage
```javascript
// mobile-app/src/services/auth.ts - NEW FILE REQUIRED
import Keychain from 'react-native-keychain';
import CryptoJS from 'crypto-js';

export class SecureTokenManager {
  private static KEYCHAIN_SERVICE = 'claude-code-tokens';
  private static ENCRYPTION_KEY = 'claude-code-key'; // Use device-specific key
  
  static async storeToken(token: string): Promise<void> {
    try {
      // Encrypt token before storing
      const encryptedToken = CryptoJS.AES.encrypt(token, this.ENCRYPTION_KEY).toString();
      
      await Keychain.setInternetCredentials(
        this.KEYCHAIN_SERVICE,
        'auth_token',
        encryptedToken,
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
          authenticatePrompt: 'Authenticate to access Claude Code',
          service: this.KEYCHAIN_SERVICE,
          storage: Keychain.STORAGE_TYPE.KC_KEYCHAIN,
        }
      );
    } catch (error) {
      throw new Error(`Token storage failed: ${error}`);
    }
  }
  
  static async retrieveToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.KEYCHAIN_SERVICE);
      
      if (credentials && credentials.password) {
        // Decrypt token
        const decryptedBytes = CryptoJS.AES.decrypt(credentials.password, this.ENCRYPTION_KEY);
        return decryptedBytes.toString(CryptoJS.enc.Utf8);
      }
      
      return null;
    } catch (error) {
      console.error('Token retrieval failed:', error);
      return null;
    }
  }
  
  static async deleteToken(): Promise<void> {
    try {
      await Keychain.resetInternetCredentials(this.KEYCHAIN_SERVICE);
    } catch (error) {
      console.error('Token deletion failed:', error);
    }
  }
}
```

### 6. Token Revocation System
```javascript
// server/routes/auth.js - TOKEN REVOCATION
app.post('/auth/revoke', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.decode(token);
    
    if (decoded?.jti) {
      tokenBlacklist.add(decoded.jti);
      
      // Notify all WebSocket connections for this user
      io.to(`user:${decoded.userId}`).emit('token_revoked', {
        reason: 'Manual revocation',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ success: true, message: 'Token revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Token revocation failed' });
  }
});
```

## Environment Configuration Requirements

### Production Environment Variables
```bash
# .env.production - REQUIRED SECURITY CONFIGURATION
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars-random-string
JWT_SECRET_PREVIOUS=previous-secret-for-rotation-support
JWT_ISSUER=claude-code
JWT_AUDIENCE=claude-code-users
JWT_EXPIRY=24h
TOKEN_REFRESH_THRESHOLD=2h

# Redis for token blacklist (production)
REDIS_URL=redis://your-redis-instance
REDIS_TOKEN_BLACKLIST_TTL=86400
```

## Implementation Timeline
- **Day 1**: JWT secret validation and environment setup
- **Day 2**: WebSocket authentication hardening
- **Day 3**: Mobile token storage implementation
- **Day 4**: Token revocation system
- **Day 5**: Security testing and validation

## Security Testing Requirements
```bash
# JWT Security Testing
npm install --save-dev jsonwebtoken-test
node -e "
const jwt = require('jsonwebtoken');
const weak_secret = 'claude-code-dev-secret';
const strong_secret = process.env.JWT_SECRET;
console.log('Testing JWT security...');
// Test weak secret detection
"

# WebSocket Authentication Testing
node test-scripts/websocket-auth-test.js

# Mobile Token Security Testing
# iOS: xcrun simctl spawn booted log stream --predicate 'subsystem contains "keychain"'
# Android: adb shell am broadcast -a android.intent.action.MASTER_CLEAR
```

## Success Criteria
- [ ] No hardcoded secrets in production code
- [ ] All WebSocket connections require valid authentication
- [ ] Mobile apps use secure keychain storage with biometric protection
- [ ] Token revocation system functional across all platforms
- [ ] Security scans show no authentication-related vulnerabilities
- [ ] JWT tokens include all required claims (iss, aud, exp, jti)

## Risk Assessment
- **Without Implementation**: CRITICAL - Complete authentication bypass possible
- **With Implementation**: LOW - Enterprise-grade authentication security
- **Implementation Risk**: MEDIUM - Requires careful token migration strategy

## Performance Impact
- **JWT Validation**: +2-5ms per request
- **WebSocket Auth**: +10-20ms initial connection
- **Mobile Keychain**: +50-100ms token operations
- **Overall Impact**: Negligible with significant security improvement

---
**Priority**: CRITICAL - Deployment Blocker
**Estimated Effort**: 24-32 hours
**Security Classification**: Authentication Critical
**App Store Impact**: Required for security approval