# Claude Code Web Application

A modern, responsive web interface for Claude Code - an AI-powered development environment that brings intelligent coding assistance directly to your browser.

## Features

- **Real-time AI Chat Interface** - Interactive conversations with Claude AI for coding assistance
- **Monaco Code Editor** - Full-featured code editor with syntax highlighting and IntelliSense
- **Integrated Terminal** - Command-line access with WebSocket-based real-time execution
- **File Explorer** - Browse and manage project files with intuitive tree view
- **Progressive Web App** - Install as a desktop/mobile app with offline capabilities
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Dark/Light Themes** - Automatic theme switching based on system preferences
- **GitHub Authentication** - Secure login with GitHub OAuth integration

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **Code Editor**: Monaco Editor (VS Code engine)
- **Real-time Communication**: Socket.IO
- **Authentication**: NextAuth.js with GitHub OAuth
- **State Management**: Zustand + Context API
- **Animations**: Framer Motion
- **PWA**: Custom service worker and manifest

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- GitHub OAuth App (for authentication)
- Claude Code backend server running

### Installation

1. **Clone and navigate to the web app directory**:
   ```bash
   cd web-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables in `.env.local`:
   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret
   GITHUB_CLIENT_ID=your-github-oauth-client-id
   GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
   NEXT_PUBLIC_SOCKET_URL=ws://localhost:3001
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Type checking
npm run type-check
```

## Project Structure

```
web-app/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── styles/             # Global styles
│   └── types/              # TypeScript definitions
├── public/                 # Static assets and PWA files
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Key Components

### Dashboard
The main application interface with:
- Collapsible sidebar navigation
- Resizable panels for file explorer, editor, and terminal
- Tab-based content switching
- Real-time status indicators

### Chat Interface
- Message history with user/assistant distinction
- Typing indicators and loading states
- Voice recording capability (coming soon)
- Real-time WebSocket communication

### Code Editor
- Monaco Editor with VS Code experience
- Multi-language syntax highlighting
- IntelliSense and autocomplete
- Customizable themes and settings
- Auto-save functionality

### Terminal
- Full terminal emulator in the browser
- Command history and autocomplete
- Real-time command execution
- Built-in commands and backend integration

### File Explorer
- Tree view of project structure
- File type icons and size indicators
- Search and filtering capabilities
- Context menu actions

## WebSocket Integration

The application uses Socket.IO for real-time communication:

- **Chat messages**: Bidirectional AI conversation
- **Terminal commands**: Remote command execution
- **File updates**: Real-time file system changes
- **System status**: Backend health monitoring

## PWA Features

- **Offline functionality**: Service worker caching
- **App installation**: Add to home screen
- **Push notifications**: System alerts and updates
- **Background sync**: Offline message queuing

## Authentication

Uses NextAuth.js with GitHub OAuth:
- Secure session management
- Automatic token refresh
- Protected routes and API endpoints
- User profile integration

## Customization

### Themes
- Built-in light/dark themes
- System preference detection
- Custom theme creation support

### Editor Settings
- Font family and size configuration
- Keybinding customization
- Plugin and extension support

### AI Configuration
- Model selection (Claude variants)
- Temperature and token limits
- Custom prompt templates

## Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel via Git integration
```

### Docker
```bash
# Build container
docker build -t claude-code-web .

# Run container
docker run -p 3000:3000 claude-code-web
```

### Self-Hosted
```bash
npm run build
npm run start
```

## Performance Optimization

- **Code splitting**: Automatic route-based splitting
- **Image optimization**: Next.js Image component
- **Bundle analysis**: Built-in bundle analyzer
- **Caching**: Aggressive static asset caching
- **Lazy loading**: Component-level lazy loading

## Browser Support

- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and test thoroughly
4. Commit with descriptive messages: `git commit -am 'Add new feature'`
5. Push to your branch: `git push origin feature/new-feature`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the main project LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [View docs](https://docs.claude-code.dev)
- Community: [Join Discord](https://discord.gg/claude-code)