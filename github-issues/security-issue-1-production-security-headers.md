# Production Security Headers and CSP Implementation

## Issue Type: Security - High Priority Deployment Blocker

## Summary
The web application lacks critical security headers and Content Security Policy (CSP) implementation required for production deployment and app store submission. This creates multiple attack vectors including XSS, clickjacking, and data exfiltration.

## Security Impact
- **CVSS Score**: 7.2 (High)
- **Attack Vectors**: XSS, Clickjacking, Data Injection, Man-in-the-Middle
- **Compliance**: Fails SOC2 security controls, OWASP Top 10 violations

## Current State Analysis
```javascript
// web-app/next.config.js - MISSING SECURITY HEADERS
const nextConfig = {
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
    ];
  },
};
```

## Required Implementation

### 1. Next.js Security Headers Configuration
```javascript
// web-app/next.config.js - SECURITY IMPLEMENTATION
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:; frame-ancestors 'self';"
          }
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
    ];
  },
};
```

### 2. Security Middleware Implementation
```javascript
// web-app/middleware.ts - NEW FILE REQUIRED
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers for all routes
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  // Rate limiting headers
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', '99');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 3. Server Security Headers
```javascript
// server/server.js - SECURITY ENHANCEMENT
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Mobile App Security Requirements

### iOS App Transport Security (ATS)
```xml
<!-- mobile-app/ios/ClaudeCodeMobile/Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
  <key>NSExceptionDomains</key>
  <dict>
    <key>localhost</key>
    <dict>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <true/>
      <key>NSExceptionMinimumTLSVersion</key>
      <string>TLSv1.0</string>
    </dict>
  </dict>
</dict>
```

### Android Network Security Config
```xml
<!-- mobile-app/android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.claude-code.com</domain>
        <pin-set expiration="2025-12-31">
            <pin digest="SHA-256">YOUR_PIN_HERE</pin>
        </pin-set>
    </domain-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
</network-security-config>
```

## Implementation Timeline
- **Phase 1** (Day 1-2): Next.js security headers and CSP
- **Phase 2** (Day 2-3): Server security middleware enhancement
- **Phase 3** (Day 3-4): Mobile app security configurations
- **Phase 4** (Day 4-5): Security testing and validation

## Success Criteria
- [ ] All security headers implemented and tested
- [ ] CSP policy blocks XSS attempts without breaking functionality
- [ ] HSTS enforced with preload directive
- [ ] Mobile apps pass App Store security review requirements
- [ ] Security scan tools show no high/critical vulnerabilities

## Testing Requirements
```bash
# Security header validation
curl -I https://your-domain.com | grep -E "(X-Frame-Options|X-XSS-Protection|Strict-Transport-Security)"

# CSP testing
npm install --save-dev csp-evaluator
npx csp-evaluator --url https://your-domain.com

# Mobile security validation
# iOS: xcode-select --install && xcrun security check-cert
# Android: ./gradlew assembleRelease --scan
```

## Risk Assessment
- **Without Implementation**: HIGH - App store rejection, security breaches, compliance failures
- **With Implementation**: LOW - Production-ready security posture, compliance alignment
- **Implementation Risk**: LOW - Standard security practices, well-documented solutions

## Related Issues
- JWT Security Implementation (#security-issue-2)
- WebSocket Authentication (#security-issue-3)
- GDPR Compliance Implementation (#compliance-issue-1)

---
**Priority**: CRITICAL - Deployment Blocker
**Estimated Effort**: 16-20 hours
**App Store Impact**: Required for approval