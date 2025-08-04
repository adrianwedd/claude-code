# Agent Review and Deployment Command

## Purpose
Systematically activate specialized Claude Code agents to review the codebase and create strategic GitHub issues focused on fast-tracking web and mobile app store deployment.

## Usage
```bash
./.claude/commands/agent-review-deploy.sh [mode]
```

## Modes
- `interactive` - Run with user prompts (default)
- `batch` - Run all agents without prompts
- `preview` - Show what would be done without execution
- `list` - List available agents and their specializations

## Agent Specializations

### Phase 1: Critical Deployment Infrastructure
- **deployment-commander**: Production deployment infrastructure, CI/CD optimization, app store submission pipelines
- **mobile-platform-specialist**: iOS/Android app store deployment, React Native optimization, mobile-specific performance
- **interface-artisan**: PWA implementation, web app store readiness, mobile-responsive optimization

### Phase 2: Store Approval Requirements  
- **performance-virtuoso**: Bundle optimization, Core Web Vitals, mobile app performance for store approval
- **fortress-guardian**: Security compliance for app stores, OAuth implementation, data protection
- **quality-assurance-engineer**: Automated testing for CI/CD, app store compliance testing

### Phase 3: Production Infrastructure
- **integration-maestro**: API resilience, third-party integrations, app store review requirements
- **data-flow-architect**: Backend scalability for production load, database optimization
- **cloud-navigator**: Multi-platform deployment, serverless architecture, global CDN setup
- **reliability-engineer**: Production monitoring, error handling, uptime requirements

## Deployment Objectives

### Web App Deployment
- Next.js web app deployed to production (Vercel)
- PWA features ready for web app stores
- Performance optimization for Core Web Vitals
- Security compliance and monitoring

### Mobile App Stores
- React Native apps prepared for iOS App Store submission
- Google Play Store deployment configuration
- Performance optimization for mobile devices
- App store compliance and review requirements

### Production Infrastructure
- Backend services production-ready with monitoring
- Scalable architecture for user growth
- Error handling and uptime monitoring
- Security and compliance validation

## Expected Deliverables

Each agent will create 2-3 targeted GitHub issues focusing on:
- Deployment blockers and optimization opportunities
- App store submission requirements
- Production infrastructure needs
- Performance and security compliance

Total expected: **20-30 deployment-focused GitHub issues** with:
- Detailed implementation plans
- Timeline estimates and success criteria
- Specific code examples and configurations
- Clear priorities for deployment timeline

## Integration with Safe Issue Creation

After running this command, use the safe issue creation system:

```bash
# Preview generated issues
./.claude/commands/safe-issue-create.sh --preview

# Create deployment issues in batch
./.claude/commands/safe-issue-create.sh --batch
```

## Target Timeline
🎯 **Production deployment within 2-4 weeks**
📱 **iOS App Store, Google Play Store, Web App Stores**
🌐 **Vercel production deployment with PWA features**

## Command Flow

1. **Repository Verification**: Confirm working in adrianwedd/claude-code fork
2. **Agent Activation**: Generate specialized prompts for each agent
3. **Prompt Generation**: Create detailed deployment-focused analysis requests
4. **Issue Planning**: Prepare GitHub issue templates with implementation details
5. **Summary Report**: Provide deployment readiness overview

The command creates agent prompt files in `/tmp/agent_prompt_*.txt` for use with Claude to generate specific deployment issues.