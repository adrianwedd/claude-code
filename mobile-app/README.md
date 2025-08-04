# Claude Code Mobile

A native mobile application for Claude Code - bringing AI-powered development assistance to iOS and Android devices with seamless integration to your CI/CD pipeline and development workflow.

## Features

- **Native Mobile Experience** - Optimized UI/UX for mobile development workflows
- **Real-time CI/CD Monitoring** - Live updates on build status, deployments, and pipeline health
- **AI Chat Interface** - Full-featured Claude AI integration for coding assistance on-the-go
- **Code Review & Browsing** - Syntax-highlighted code viewer with file navigation
- **Push Notifications** - Instant alerts for CI events, PR reviews, and AI suggestions
- **Offline Capability** - Browse projects, view code, and access chat history offline
- **Biometric Security** - Fingerprint and Face ID authentication for secure access
- **Cross-Platform** - Single codebase for both iOS and Android with platform-specific optimizations

## Technology Stack

- **Framework**: React Native 0.75+ with TypeScript
- **Navigation**: React Navigation 6 with stack and tab navigators
- **State Management**: React Context + AsyncStorage for persistence
- **UI Components**: React Native Paper + custom components
- **Real-time Communication**: Socket.IO client for WebSocket connections
- **Authentication**: Biometric authentication + GitHub OAuth
- **Push Notifications**: React Native Push Notification + Firebase Messaging
- **Code Highlighting**: Syntax highlighting for 40+ programming languages
- **Offline Storage**: AsyncStorage + SQLite for complex data
- **CI/CD Integration**: CodePush for over-the-air updates

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- React Native CLI: `npm install -g @react-native-community/cli`
- **iOS**: Xcode 14+ and iOS Simulator or physical device
- **Android**: Android Studio with Android SDK and emulator or physical device

### Installation

1. **Navigate to mobile app directory**:
   ```bash
   cd mobile-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   
   # iOS only - install CocoaPods dependencies
   cd ios && pod install && cd ..
   ```

3. **Set up environment configuration**:
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables in `.env`:
   ```
   API_BASE_URL=https://api.claude-code.dev
   WEBSOCKET_URL=wss://ws.claude-code.dev
   GITHUB_CLIENT_ID=your-github-oauth-client-id
   CODEPUSH_KEY_IOS=your-codepush-ios-key
   CODEPUSH_KEY_ANDROID=your-codepush-android-key
   ```

4. **Run the application**:
   
   **iOS**:
   ```bash
   npm run ios
   # or for specific simulator
   npm run ios -- --simulator="iPhone 15 Pro"
   ```
   
   **Android**:
   ```bash
   npm run android
   # or for specific emulator
   npm run android -- --deviceId=emulator-5554
   ```

## Development Commands

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm test

# Build for release
npm run build:ios
npm run build:android

# Reset cache
npm start -- --reset-cache
```

## Project Structure

```
mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API and external services
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Utility functions
│   ├── constants/         # App constants and configuration
│   └── App.tsx           # Root application component
├── android/               # Android-specific code
├── ios/                  # iOS-specific code
├── __tests__/           # Test files
└── index.js            # Entry point
```

## Key Features

### Real-time CI/CD Integration
- Live build status updates
- Pipeline visualization
- Build logs and error tracking
- Deployment notifications
- Branch and commit monitoring

### AI-Powered Development
- Context-aware code suggestions
- Natural language queries for debugging
- Code review assistance
- Architecture guidance
- Performance optimization tips

### Mobile-Optimized Code Browsing
- Syntax highlighting for 40+ languages
- File tree navigation with search
- Diff viewing for pull requests
- Responsive code display
- Quick navigation and bookmarking

### Smart Notifications
- CI/CD pipeline status changes
- Pull request reviews and comments
- AI-generated code suggestions
- Security alerts and recommendations
- Custom notification preferences

### Offline Functionality
- Cached project data and code
- Offline chat history access
- Background synchronization
- Smart data management
- Seamless online/offline transitions

## WebSocket Integration

Real-time communication via Socket.IO:

```typescript
// Connect to CI events
socket.on('ci_update', (data: CIStatus) => {
  // Handle build status changes
});

// Receive AI chat responses
socket.on('chat_message', (message: ChatMessage) => {
  // Handle AI responses
});

// File system changes
socket.on('file_change', (event: FileChangeEvent) => {
  // Update file tree and cache
});
```

## Push Notifications

Integrated push notification system:

- **CI Events**: Build started, completed, failed
- **Code Reviews**: New reviews, approvals, changes requested
- **AI Suggestions**: Proactive code improvements
- **Security**: Vulnerability alerts, dependency updates
- **Custom**: User-defined notification rules

## Authentication & Security

Multi-layer security implementation:

- **GitHub OAuth**: Secure repository access
- **Biometric Authentication**: Face ID, Touch ID, Fingerprint
- **Token Management**: Secure token storage with Keychain
- **Certificate Pinning**: Network security for API communications
- **Data Encryption**: Local data encryption for sensitive information

## Platform-Specific Features

### iOS
- Face ID / Touch ID integration
- Siri Shortcuts for quick actions
- iOS widget for build status
- Haptic feedback for interactions
- Native share sheet integration

### Android
- Fingerprint authentication
- Android Auto projection
- Home screen widgets
- Material You theming
- Adaptive icons and shortcuts

## Deployment

### App Store (iOS)
```bash
# Build for App Store
npm run build:ios
# Follow iOS deployment guide in docs/ios-deployment.md
```

### Google Play (Android)
```bash
# Build signed APK
npm run build:android
# Follow Android deployment guide in docs/android-deployment.md
```

### Over-the-Air Updates (CodePush)
```bash
# Release to Staging
code-push release-react claude-code-ios ios --deploymentName Staging

# Release to Production
code-push release-react claude-code-ios ios --deploymentName Production
```

## Performance Optimization

- **Bundle Splitting**: Lazy loading for non-critical features
- **Image Optimization**: WebP format with fallbacks
- **Memory Management**: Efficient list virtualization
- **Network Optimization**: Request deduplication and caching
- **Battery Optimization**: Background task management

## Testing

```bash
# Unit tests
npm test

# E2E tests (Detox)
npm run test:e2e:ios
npm run test:e2e:android

# Performance tests
npm run test:performance
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npm start -- --reset-cache
   ```

2. **iOS build failures**:
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android build issues**:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

4. **Network connectivity**:
   - Check API_BASE_URL in .env
   - Verify device/emulator internet connection
   - Check firewall and proxy settings

### Debugging

- Use Flipper for advanced debugging
- React Native Debugger for Redux/Context inspection
- Xcode/Android Studio for native debugging
- Network inspection via Charles Proxy or similar

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/mobile-enhancement`
3. Follow React Native and TypeScript best practices
4. Test thoroughly on both iOS and Android
5. Update documentation as needed
6. Submit a pull request with detailed description

## Deployment Checklist

### Pre-Release
- [ ] Run full test suite
- [ ] Test on multiple device sizes
- [ ] Verify offline functionality
- [ ] Test push notifications
- [ ] Performance profiling
- [ ] Security audit
- [ ] App store guidelines compliance

### Post-Release
- [ ] Monitor crash reports
- [ ] Track performance metrics
- [ ] Gather user feedback
- [ ] Plan OTA updates if needed

## License

This project is licensed under the MIT License - see the main project LICENSE file for details.

## Support

For mobile-specific issues:
- GitHub Issues: [Mobile Issues](https://github.com/your-repo/issues?label=mobile)
- Documentation: [Mobile Docs](https://docs.claude-code.dev/mobile)
- Community: [Discord #mobile](https://discord.gg/claude-code)