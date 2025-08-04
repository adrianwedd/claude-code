# CRITICAL DEPLOYMENT ISSUES - PRODUCTION READINESS

## Issue 1: Complete React Native Mobile App Infrastructure Setup

**Priority**: 🔴 CRITICAL - BLOCKER  
**Timeline**: 3-4 days  
**Complexity**: HIGH

### Problem Statement
The mobile app currently exists only as a basic React Native structure without native iOS/Android project configurations. This completely blocks app store deployment.

### Implementation Plan

#### Phase 1: Native Project Initialization (Day 1)
```bash
# Initialize React Native projects with proper structure
cd mobile-app
npx react-native init ClaudeCodeMobile --template react-native-template-typescript
```

#### Phase 2: iOS App Store Configuration (Day 2)
1. **Create iOS project structure**:
   - Generate `ios/ClaudeCodeMobile.xcworkspace`
   - Configure App Store Connect metadata
   - Set up signing certificates and provisioning profiles

2. **Required iOS files**:
   ```
   ios/
   ├── ClaudeCodeMobile.xcworkspace
   ├── ClaudeCodeMobile/
   │   ├── Info.plist (with proper bundle ID, permissions)
   │   ├── LaunchScreen.storyboard
   │   └── Images.xcassets/AppIcon.appiconset/
   └── Podfile (for dependencies)
   ```

3. **App Store requirements**:
   - Bundle ID: `com.claudecode.mobile`
   - Version: 1.0.0 (build 1)
   - Minimum iOS version: 13.0
   - Required permissions: Camera, Microphone, Files
   - App icons: 1024x1024 master + all required sizes

#### Phase 3: Android Play Store Configuration (Day 2-3)
1. **Create Android project structure**:
   ```
   android/
   ├── app/
   │   ├── build.gradle (release signing, play store config)
   │   ├── src/main/
   │   │   ├── AndroidManifest.xml
   │   │   ├── res/mipmap-*/ic_launcher.png
   │   │   └── java/com/claudecodemobile/
   └── gradle.properties (release optimization)
   ```

2. **Play Store requirements**:
   - Application ID: `com.claudecode.mobile`
   - Target SDK: 34 (Android 14)
   - Minimum SDK: 21 (Android 5.0)
   - Required permissions: INTERNET, WRITE_EXTERNAL_STORAGE, RECORD_AUDIO
   - Adaptive icon + legacy icons

#### Phase 4: Store Submission Automation (Day 3-4)
1. **Fastlane integration**:
   ```ruby
   # fastlane/Fastfile
   platform :ios do
     lane :release do
       build_app(scheme: "ClaudeCodeMobile")
       upload_to_app_store(skip_waiting_for_build_processing: true)
     end
   end

   platform :android do
     lane :release do
       gradle(task: "bundleRelease")
       upload_to_play_store(track: "internal")
     end
   end
   ```

2. **GitHub Actions integration**:
   - Add mobile build/deploy jobs to existing pipeline
   - Configure App Store Connect API keys
   - Set up Google Play Console service account

### Success Criteria
- [ ] iOS app builds and runs on device
- [ ] Android app builds and generates signed APK/AAB
- [ ] Apps pass basic store validation checks
- [ ] Automated deployment pipeline functional

---

## Issue 2: Fix PWA Assets and Web App Store Readiness

**Priority**: 🟡 HIGH - DEPLOYMENT BLOCKER  
**Timeline**: 1-2 days  
**Complexity**: MEDIUM

### Problem Statement
PWA manifest references missing icon files and configuration needs optimization for web app stores and Vercel deployment.

### Implementation Plan

#### Phase 1: PWA Assets Creation (Day 1)
1. **Generate required icons**:
   ```bash
   # Create master icon (512x512) then generate all sizes
   # Required sizes: 16, 32, 48, 72, 96, 144, 192, 256, 384, 512
   ```

2. **Screenshot generation**:
   - Wide format: 1280x720 (desktop experience)
   - Narrow format: 720x1280 (mobile experience)
   - Show key features: chat interface, code editor, terminal

3. **PWA assets checklist**:
   ```
   web-app/public/
   ├── icon-16x16.png
   ├── icon-32x32.png
   ├── icon-192x192.png
   ├── icon-512x512.png
   ├── apple-touch-icon.png
   ├── favicon.ico
   ├── screenshot-wide.png
   └── screenshot-narrow.png
   ```

#### Phase 2: Vercel Configuration Fix (Day 1)
1. **Update vercel.json for Next.js 14 App Router**:
   ```json
   {
     "version": 2,
     "builds": [
       {"src": "web-app/package.json", "use": "@vercel/next"}
     ],
     "routes": [
       {"src": "/api/(.*)", "dest": "/api/$1"},
       {"src": "/(.*)", "dest": "/$1"}
     ]
   }
   ```

2. **Fix routing configuration**:
   - Remove obsolete pages API references
   - Configure proper API routes for App Router
   - Update CORS and security headers

#### Phase 3: Web App Store Preparation (Day 2)
1. **Microsoft Store (PWA)**:
   - Validate manifest.json meets Microsoft requirements
   - Test PWA installation flow
   - Prepare store listing assets

2. **Chrome Web Store (if applicable)**:
   - Create extension manifest v3
   - Package PWA as Chrome app
   - Prepare store assets

### Success Criteria
- [ ] All PWA icons load correctly
- [ ] PWA installs properly on mobile/desktop
- [ ] Vercel deployment succeeds without errors
- [ ] Web app passes Microsoft Store validation

---

## Issue 3: Production Environment and CI/CD Secret Configuration

**Priority**: 🔴 CRITICAL - DEPLOYMENT BLOCKER  
**Timeline**: 1 day  
**Complexity**: MEDIUM

### Problem Statement
GitHub Actions pipeline references undefined secrets, preventing any automated deployment to staging or production.

### Implementation Plan

#### Phase 1: GitHub Secrets Configuration (Day 1)
1. **Required repository secrets**:
   ```
   VERCEL_TOKEN=<vercel_deployment_token>
   VERCEL_ORG_ID=<vercel_organization_id>  
   VERCEL_PROJECT_ID=<vercel_project_id>
   RAILWAY_TOKEN=<railway_api_token>
   CLAUDE_API_KEY=<anthropic_api_key>
   JWT_SECRET=<32_char_random_string>
   SENTRY_DSN=<sentry_error_tracking_dsn>
   SNYK_TOKEN=<snyk_security_scan_token>
   CODEPUSH_ACCESS_KEY=<microsoft_codepush_key>
   SLACK_WEBHOOK_URL=<slack_notification_webhook>
   ```

2. **Environment-specific secrets**:
   ```
   STAGING_WEB_URL=https://claude-code-staging.vercel.app
   STAGING_SERVER_URL=https://claude-code-server-staging.railway.app
   PRODUCTION_WEB_URL=https://claude-code.vercel.app
   PRODUCTION_SERVER_URL=https://claude-code-server.railway.app
   GRAFANA_WEBHOOK_URL=<monitoring_webhook>
   ```

#### Phase 2: Service Account Setup (Day 1)
1. **Vercel deployment**:
   - Create Vercel project for claude-code-web
   - Generate deployment token with appropriate permissions
   - Configure domain mapping

2. **Railway backend**:
   - Set up Railway project for server deployment
   - Configure PostgreSQL and Redis add-ons
   - Set up staging and production environments

3. **App Store credentials**:
   ```
   # iOS App Store
   APP_STORE_CONNECT_API_KEY=<asc_api_key>
   APP_STORE_CONNECT_ISSUER_ID=<asc_issuer_id>
   
   # Google Play Store  
   GOOGLE_PLAY_SERVICE_ACCOUNT=<base64_encoded_json>
   ```

### Success Criteria
- [ ] All pipeline jobs execute without secret errors
- [ ] Staging deployment completes successfully
- [ ] Health checks pass for all deployed services
- [ ] Rollback mechanism functions correctly

---

## DEPLOYMENT TIMELINE SUMMARY

### Week 1: Foundation (Days 1-4)
- **Day 1**: PWA assets + Vercel config + GitHub secrets
- **Day 2**: React Native iOS project setup
- **Day 3**: React Native Android project setup  
- **Day 4**: Mobile app store submission prep

### Week 2: Launch (Days 5-7)
- **Day 5**: End-to-end testing and validation
- **Day 6**: Production deployment and monitoring setup
- **Day 7**: App store submissions and launch

### Success Metrics
- ✅ Web app deployed to Vercel with PWA capabilities
- ✅ Mobile apps submitted to iOS App Store and Google Play Store
- ✅ Zero-downtime CI/CD pipeline operational  
- ✅ Production monitoring and alerting active
- ✅ All security scans passing

## NEXT ACTIONS

1. **IMMEDIATE** (Today): Set up GitHub repository secrets and service accounts
2. **HIGH PRIORITY** (Tomorrow): Begin React Native native project initialization
3. **MEDIUM PRIORITY** (This week): Generate PWA assets and fix Vercel configuration

This deployment plan prioritizes getting the web app to production first (1-2 days), then mobile apps (3-4 additional days), ensuring fastest time to market while maintaining production quality standards.