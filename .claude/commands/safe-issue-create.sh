#!/bin/bash

# Safe GitHub Issue Creation for Claude Code Fork
# Prevents accidental issue creation in upstream repository
# Usage: ./safe-issue-create.sh [--preview] [--batch] [--single]

set -euo pipefail

# Configuration
ALLOWED_REPO="adrianwedd/claude-code"
UPSTREAM_REPO="anthropics/claude-code"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ISSUES_DIR="${SCRIPT_DIR}/issues"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Safety check: Verify we're in the correct repository
verify_repository() {
    log "Verifying repository context..."
    
    # Check if we're in a git repository
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        error "Not in a git repository"
        exit 1
    fi
    
    # Get current repository information
    local origin_url
    origin_url=$(git remote get-url origin 2>/dev/null || echo "")
    
    # Check if we're in the correct fork
    if [[ "$origin_url" != *"$ALLOWED_REPO"* ]]; then
        error "Repository verification failed!"
        echo "Current origin: $origin_url"
        echo "Expected: *$ALLOWED_REPO*"
        echo ""
        echo "This command only works in the fork repository: $ALLOWED_REPO"
        exit 1
    fi
    
    # Verify upstream configuration (should exist but not be pushable)
    local upstream_url
    upstream_url=$(git remote get-url upstream 2>/dev/null || echo "")
    
    if [[ -n "$upstream_url" && "$upstream_url" == *"$UPSTREAM_REPO"* ]]; then
        success "Repository verification passed"
        echo "  - Fork: $ALLOWED_REPO"
        echo "  - Upstream: $UPSTREAM_REPO (read-only)"
    else
        warning "Upstream not configured correctly, but fork is correct"
    fi
}

# Check GitHub CLI authentication and repository access
verify_github_access() {
    log "Verifying GitHub CLI access..."
    
    # Check if gh is installed
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) is not installed"
        echo "Install with: brew install gh"
        exit 1
    fi
    
    # Check authentication
    if ! gh auth status >/dev/null 2>&1; then
        error "GitHub CLI is not authenticated"
        echo "Run: gh auth login"
        exit 1
    fi
    
    # Test repository access
    if ! gh repo view "$ALLOWED_REPO" >/dev/null 2>&1; then
        error "Cannot access repository: $ALLOWED_REPO"
        echo "Verify repository exists and you have access"
        exit 1
    fi
    
    success "GitHub CLI access verified"
}

# Create issues directory if it doesn't exist
ensure_issues_directory() {
    if [[ ! -d "$ISSUES_DIR" ]]; then
        log "Creating issues directory..."
        mkdir -p "$ISSUES_DIR"
        success "Issues directory created: $ISSUES_DIR"
    fi
}

# Preview issue template
preview_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 ISSUE PREVIEW"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Repository: $ALLOWED_REPO"
    echo "Title: $title"
    echo "Labels: $labels"
    echo ""
    echo "Body:"
    echo "$body"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Create a single GitHub issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local preview_mode="${4:-false}"
    
    if [[ "$preview_mode" == "true" ]]; then
        preview_issue "$title" "$body" "$labels"
        return 0
    fi
    
    # Confirm with user
    echo ""
    preview_issue "$title" "$body" "$labels"
    
    read -p "Create this issue in $ALLOWED_REPO? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warning "Issue creation cancelled"
        return 1
    fi
    
    # Create the issue
    log "Creating issue..."
    
    local issue_url
    if issue_url=$(gh issue create \
        --repo "$ALLOWED_REPO" \
        --title "$title" \
        --body "$body" \
        --label "$labels" 2>&1); then
        success "Issue created successfully!"
        echo "URL: $issue_url"
        return 0
    else
        error "Failed to create issue: $issue_url"
        return 1
    fi
}

# Load issue templates from agent analysis
load_deployment_issues() {
    local preview_mode="${1:-false}"
    local created_count=0
    local failed_count=0
    
    # Priority 0 - Critical Blockers
    log "Loading Priority 0 (Critical) Issues..."
    
    # Issue 1: iOS App Store Pipeline
    if create_issue \
        "[P0][DEPLOYMENT] iOS App Store Distribution Pipeline" \
        "## Overview
Enable production-ready iOS App Store deployment with automated build, signing, and distribution capabilities.

## Problem Statement
Currently, the React Native mobile app lacks proper iOS project configuration and deployment automation needed for App Store submission.

## Technical Requirements
- Complete iOS Xcode project with proper bundle ID and signing
- Fastlane integration for automated App Store deployment  
- TestFlight beta distribution automation
- App Store metadata and screenshots automation
- CI/CD pipeline integration for iOS builds

## Implementation Plan
\`\`\`bash
# 1. Configure iOS project structure
cd mobile-app
npx react-native eject  # If using Expo
cd ios && pod install

# 2. Set up Fastlane
fastlane init
fastlane add_plugin increment_build_number
fastlane add_plugin app_store_connect_api_key

# 3. Configure signing
fastlane match init
fastlane match development
fastlane match appstore
\`\`\`

## Acceptance Criteria
- [ ] iOS Xcode project builds without errors
- [ ] Fastlane configuration for App Store deployment
- [ ] TestFlight distribution working
- [ ] App Store metadata automation
- [ ] CI/CD pipeline includes iOS builds
- [ ] Documentation for release process

## Dependencies
- React Native project structure completion
- Apple Developer Account setup
- Code signing certificates

**Priority:** P0 - Critical Blocker
**Effort:** 8 story points
**Timeline:** 1-2 weeks" \
        "deployment,ios,mobile,app-store,priority-p0,fastlane" \
        "$preview_mode"; then
        ((created_count++))
    else
        ((failed_count++))
    fi
    
    # Issue 2: Android Play Store Pipeline
    if create_issue \
        "[P0][DEPLOYMENT] Google Play Store Distribution Pipeline" \
        "## Overview
Enable production-ready Google Play Store deployment with automated build, signing, and distribution capabilities.

## Problem Statement
The React Native mobile app needs proper Android configuration and Play Console integration for store submission.

## Technical Requirements
- Android project with proper package name and signing
- Google Play Console API integration
- Automated APK/AAB signing with keystore management
- Play Store metadata and asset automation
- CI/CD pipeline integration for Android builds

## Implementation Plan
\`\`\`bash
# 1. Configure Android project
cd mobile-app/android
./gradlew assembleRelease  # Test build

# 2. Set up signing
keytool -genkey -v -keystore release-key.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000

# 3. Configure Fastlane for Android
fastlane init
fastlane add_plugin increment_version_code
fastlane add_plugin supply
\`\`\`

## Acceptance Criteria
- [ ] Android project builds signed APK/AAB
- [ ] Fastlane configuration for Play Store
- [ ] Play Console beta track distribution
- [ ] Store listing automation
- [ ] CI/CD pipeline includes Android builds
- [ ] Documentation for release process

## Dependencies
- React Native project completion
- Google Play Developer Account
- Keystore and signing setup

**Priority:** P0 - Critical Blocker
**Effort:** 8 story points  
**Timeline:** 1-2 weeks" \
        "deployment,android,mobile,play-store,priority-p0,fastlane" \
        "$preview_mode"; then
        ((created_count++))
    else
        ((failed_count++))
    fi
    
    # Issue 3: Critical Security Fixes
    if create_issue \
        "[P0][SECURITY] Fix Critical Security Vulnerabilities" \
        "## Overview
Address critical security vulnerabilities that block production deployment and app store approval.

## Security Issues Identified
1. **Hardcoded JWT Secrets** - Default secrets in server configuration
2. **Missing Security Headers** - No CSP, HSTS, or security headers
3. **Database Credentials** - Default passwords in init scripts
4. **OAuth Security** - Missing PKCE flow for mobile security

## Critical Fixes Required

### 1. Secrets Management
\`\`\`javascript
// Replace hardcoded secrets
const JWT_SECRET = process.env.JWT_SECRET || 'claude-code-dev-secret';
// With proper environment variable validation
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters');
}
\`\`\`

### 2. Security Headers
\`\`\`javascript
// Add to Next.js configuration
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: \"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';\"
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }
];
\`\`\`

## Acceptance Criteria
- [ ] All hardcoded secrets removed
- [ ] Environment variable validation implemented
- [ ] Security headers configured
- [ ] Database default passwords changed
- [ ] OAuth PKCE flow implemented
- [ ] Security audit passes

**Priority:** P0 - Security Critical
**Effort:** 5 story points
**Timeline:** 1 week" \
        "security,vulnerability,priority-p0,oauth,secrets-management" \
        "$preview_mode"; then
        ((created_count++))
    else
        ((failed_count++))
    fi
    
    # Issue 4: PWA Enhancement
    if create_issue \
        "[P1][PWA] Implement Production-Ready Service Worker" \
        "## Overview
Transform the web application into a fully functional PWA with offline support and app store distribution capabilities.

## Problem Statement
The current web app lacks PWA features needed for app store distribution and offline functionality.

## Technical Requirements
- Workbox integration with Next.js for service worker
- Offline functionality for core features (code editor, chat)
- Push notification system for real-time updates
- Install prompt optimization and app shortcuts
- File system access API for local development

## Implementation Plan
\`\`\`javascript
// 1. Install and configure Workbox
npm install workbox-webpack-plugin workbox-window

// 2. Configure service worker in next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'claude-api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
});

// 3. Implement offline chat storage
const offlineQueue = new workbox.backgroundSync.Queue('chat-queue');
\`\`\`

## Acceptance Criteria
- [ ] Service worker implemented with Workbox
- [ ] Offline functionality for core features
- [ ] Push notifications working
- [ ] PWA install experience optimized
- [ ] Lighthouse PWA score ≥ 95
- [ ] Microsoft Store PWA submission ready

**Priority:** P1 - App Store Distribution
**Effort:** 8 story points
**Timeline:** 2-3 weeks" \
        "pwa,offline,service-worker,priority-p1,web-app" \
        "$preview_mode"; then
        ((created_count++))
    else
        ((failed_count++))
    fi
    
    # Issue 5: Mobile Performance Optimization
    if create_issue \
        "[P0][MOBILE] Fix Critical Performance Issues" \
        "## Overview
Address critical mobile performance issues that prevent app store approval and cause poor user experience.

## Performance Issues Identified
1. **Memory Leaks** - WebSocket connections not properly cleaned up
2. **Slow Startup Time** - App takes >5 seconds to load
3. **Bundle Size** - JavaScript bundle exceeds mobile limits
4. **Animation Performance** - Janky transitions and UI lag

## Critical Fixes Required

### 1. Memory Management
\`\`\`javascript
// Fix WebSocket cleanup in useSocket hook
useEffect(() => {
  return () => {
    if (socket) {
      socket.disconnect();
      socket.removeAllListeners();
    }
  };
}, []);

// Implement proper component cleanup
const [components, setComponents] = useState(new Map());
useEffect(() => {
  return () => {
    components.forEach(component => component.cleanup?.());
  };
}, []);
\`\`\`

### 2. Bundle Optimization
\`\`\`javascript
// Implement code splitting
const ChatInterface = lazy(() => import('./ChatInterface'));
const CodeEditor = lazy(() => import('./CodeEditor'));

// Tree shaking optimization
import { specific } from 'lodash/specific';
// Instead of: import _ from 'lodash';
\`\`\`

## Performance Targets
- App startup time: <2 seconds
- Memory usage: <100MB baseline
- JavaScript bundle: <2MB compressed
- Animation frame rate: 60fps consistent

## Acceptance Criteria
- [ ] Memory leaks fixed and tested
- [ ] Startup time under 2 seconds
- [ ] Bundle size optimized
- [ ] 60fps animations on mid-range devices
- [ ] App store performance guidelines met

**Priority:** P0 - App Store Blocker
**Effort:** 6 story points  
**Timeline:** 1 week" \
        "mobile,performance,memory-leak,priority-p0,optimization" \
        "$preview_mode"; then
        ((created_count++))
    else
        ((failed_count++))
    fi
    
    # Issue 6: Database Performance Optimization
    if create_issue \
        "[P1][DATABASE] Optimize PostgreSQL for Production Scale" \
        "## Overview
Optimize database schema and queries for production scale handling 100K+ users and millions of messages.

## Current Performance Issues
- Slow message queries (>2 seconds for large sessions)
- Missing indexes on common query patterns
- No connection pooling optimization
- No query performance monitoring

## Implementation Plan
\`\`\`sql
-- Add composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_messages_session_created 
ON messages(session_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_files_project_path 
ON files(project_id, file_path) WHERE content IS NOT NULL;

-- Partition messages table by month
CREATE TABLE messages_2025_01 PARTITION OF messages
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Configure connection pooling
-- max_connections = 200
-- shared_buffers = 256MB  
-- effective_cache_size = 1GB
\`\`\`

## Performance Targets
- Query response time: <100ms at p95
- Support 1000+ concurrent connections
- Handle 10M+ messages efficiently
- 99.9% query success rate

## Acceptance Criteria
- [ ] All slow queries optimized (<100ms)
- [ ] Composite indexes implemented
- [ ] Connection pooling configured
- [ ] Query monitoring with pg_stat_statements
- [ ] Load testing passing at 1000+ concurrent users

**Priority:** P1 - Scalability Critical
**Effort:** 5 story points
**Timeline:** 1-2 weeks" \
        "database,performance,postgresql,priority-p1,scalability" \
        "$preview_mode"; then
        ((created_count++))
    else
        ((failed_count++))
    fi
    
    echo ""
    log "Issue creation summary:"
    echo "  - Created: $created_count"
    echo "  - Failed: $failed_count"
    
    if [[ "$preview_mode" == "true" ]]; then
        echo "  - Mode: Preview (no issues actually created)"
    fi
}

# Main function
main() {
    local preview_mode=false
    local batch_mode=false
    local single_mode=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --preview)
                preview_mode=true
                shift
                ;;
            --batch)
                batch_mode=true
                shift
                ;;
            --single)
                single_mode=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                echo "Usage: $0 [--preview] [--batch] [--single]"
                exit 1
                ;;
        esac
    done
    
    # Display header
    echo ""
    echo "🚀 Safe GitHub Issue Creation for Claude Code"
    echo "============================================="
    echo ""
    
    # Safety checks
    verify_repository
    verify_github_access
    ensure_issues_directory
    
    if [[ "$preview_mode" == "true" ]]; then
        warning "Preview mode enabled - no issues will be created"
    fi
    
    # Execute based on mode
    if [[ "$batch_mode" == "true" ]]; then
        log "Starting batch issue creation..."
        load_deployment_issues "$preview_mode"
    elif [[ "$single_mode" == "true" ]]; then
        log "Single issue mode not yet implemented"
        echo "Use --batch for now to create deployment issues"
    else
        # Default to batch mode
        log "No mode specified, defaulting to batch creation..."
        load_deployment_issues "$preview_mode"
    fi
    
    echo ""
    success "Safe issue creation process completed!"
}

# Run main function
main "$@"