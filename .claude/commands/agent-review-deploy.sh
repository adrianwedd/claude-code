#!/bin/bash

# Agent Review and Deployment Feature Request Generator
# Systematically activates each specialized agent to review code and create GitHub issues
# Focus: Fast-tracking web app and app store deployment

set -eo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPO_NAME="adrianwedd/claude-code"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

agent_header() {
    echo -e "${PURPLE}🤖 AGENT: $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Agent specializations for deployment focus
AGENTS="deployment-commander:Production deployment infrastructure, CI/CD optimization, app store submission pipelines
mobile-platform-specialist:iOS/Android app store deployment, React Native optimization, mobile-specific performance
interface-artisan:PWA implementation, web app store readiness, mobile-responsive optimization
performance-virtuoso:Bundle optimization, Core Web Vitals, mobile app performance for store approval
fortress-guardian:Security compliance for app stores, OAuth implementation, data protection
integration-maestro:API resilience, third-party integrations, app store review requirements
data-flow-architect:Backend scalability for production load, database optimization
quality-assurance-engineer:Automated testing for CI/CD, app store compliance testing
cloud-navigator:Multi-platform deployment, serverless architecture, global CDN setup
reliability-engineer:Production monitoring, error handling, uptime requirements"

# Agent review focus areas for deployment
REVIEW_FOCUS="deployment-commander:GitHub Actions pipeline, Vercel/Railway deployment, app store automation
mobile-platform-specialist:React Native build process, iOS/Android configuration, store submission
interface-artisan:PWA features, mobile UX, web app store compliance
performance-virtuoso:Bundle size, lighthouse scores, mobile performance metrics
fortress-guardian:Security headers, OAuth flows, app store security requirements
integration-maestro:Claude API integration, WebSocket reliability, error handling
data-flow-architect:Database scalability, API performance, production data flow
quality-assurance-engineer:Test coverage, CI/CD quality gates, automated testing
cloud-navigator:Infrastructure as code, multi-region deployment, CDN optimization
reliability-engineer:Monitoring setup, error tracking, production readiness"

# Function to get agent info
get_agent_info() {
    local agent_name="$1"
    local field="$2"
    
    if [ "$field" = "description" ]; then
        echo "$AGENTS" | grep "^$agent_name:" | cut -d: -f2-
    elif [ "$field" = "focus" ]; then
        echo "$REVIEW_FOCUS" | grep "^$agent_name:" | cut -d: -f2-
    fi
}

# Function to activate a specific agent
activate_agent() {
    local agent_name="$1"
    local agent_description=$(get_agent_info "$agent_name" "description")
    local review_focus=$(get_agent_info "$agent_name" "focus")
    
    agent_header "$agent_name"
    echo "Focus: $agent_description"
    echo "Review Area: $review_focus"
    echo ""
    
    # Create agent-specific issue request
    log "Activating $agent_name for deployment review..."
    
    # Generate deployment-focused prompt for the agent
    local agent_prompt="You are the $agent_name agent. Your mission is to fast-track the deployment of Claude Code to production web hosting and mobile app stores.

CURRENT SYSTEM STATUS:
- Multi-platform Claude Code implementation with Web App (Next.js), Mobile App (React Native), Server (Node.js), and Claude API integration
- GitHub Actions CI/CD pipeline configured for staging and production deployment
- TTS integration with cross-platform support
- Security auditing and performance testing implemented

YOUR DEPLOYMENT FOCUS: $review_focus

DEPLOYMENT OBJECTIVES:
1. WEB APP DEPLOYMENT: Get the Next.js web app deployed to production (Vercel) with PWA features ready for web app stores
2. MOBILE APP STORES: Prepare React Native apps for iOS App Store and Google Play Store submission
3. PRODUCTION INFRASTRUCTURE: Ensure backend services are production-ready with monitoring and scaling
4. COMPLIANCE & PERFORMANCE: Meet all app store requirements and performance benchmarks

ANALYSIS REQUIRED:
- Review the codebase focusing on your specialization area
- Identify blockers and optimization opportunities for rapid deployment
- Propose specific, actionable GitHub issues with implementation details
- Prioritize tasks that directly impact app store approval and production launch

DELIVERABLES:
- Create 2-3 high-priority GitHub issues with detailed implementation plans
- Focus on deployment blockers and store submission requirements
- Provide timeline estimates and success criteria
- Include specific code examples and configuration changes needed

Repository: $REPO_NAME
Current branch: main
Focus on fast deployment to production and app stores."

    echo "Agent Prompt Generated:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$agent_prompt"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Return the prompt for Claude to process
    echo "AGENT_PROMPT_$agent_name" > "/tmp/agent_prompt_${agent_name}.txt"
    echo "$agent_prompt" >> "/tmp/agent_prompt_${agent_name}.txt"
    
    success "$agent_name activation prepared"
    echo ""
}

# Function to run deployment-focused agent review
run_deployment_review() {
    local mode="${1:-interactive}"
    
    echo ""
    echo "🚀 Claude Code Deployment Agent Review System"
    echo "============================================="
    echo "Objective: Fast-track web and app store deployment"
    echo "Repository: $REPO_NAME"
    echo "Mode: $mode"
    echo ""
    
    # Verify we're in the correct repository
    if ! git remote get-url origin | grep -q "$REPO_NAME"; then
        error "Not in the correct repository fork: $REPO_NAME"
        exit 1
    fi
    
    log "Starting systematic agent review for deployment..."
    
    # Phase 1: Critical Deployment Agents
    warning "PHASE 1: Critical Deployment Infrastructure"
    activate_agent "deployment-commander"
    activate_agent "mobile-platform-specialist"
    activate_agent "interface-artisan"
    
    # Phase 2: Performance and Security for Store Approval
    warning "PHASE 2: Store Approval Requirements"
    activate_agent "performance-virtuoso"
    activate_agent "fortress-guardian"
    activate_agent "quality-assurance-engineer"
    
    # Phase 3: Production Readiness
    warning "PHASE 3: Production Infrastructure"
    activate_agent "integration-maestro"
    activate_agent "data-flow-architect"
    activate_agent "cloud-navigator"
    activate_agent "reliability-engineer"
    
    echo ""
    success "All agents activated for deployment review!"
    echo ""
    
    # Generate summary report
    log "Generating deployment readiness summary..."
    
    cat << EOF
📋 DEPLOYMENT AGENT REVIEW SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AGENTS ACTIVATED: $(echo "$AGENTS" | wc -l)
FOCUS: Fast-track web and mobile app store deployment
REPOSITORY: $REPO_NAME

NEXT STEPS:
1. Each agent will create 2-3 targeted GitHub issues
2. Issues will focus on deployment blockers and store requirements
3. Implementation priorities will be based on deployment timeline
4. All issues will include detailed technical specifications

EXPECTED DELIVERABLES:
- 20-30 deployment-focused GitHub issues
- Clear implementation roadmap for production launch
- App store submission preparation checklist
- Production infrastructure optimization plan

Use these agent prompts with Claude to generate specific deployment issues.
The prompts are saved in /tmp/agent_prompt_*.txt files.

🎯 TARGET: Production deployment within 2-4 weeks
📱 STORES: iOS App Store, Google Play Store, Web App Stores
🌐 WEB: Vercel production deployment with PWA features
EOF
    
    echo ""
    success "Deployment agent review system ready!"
    
    if [[ "$mode" == "interactive" ]]; then
        echo ""
        read -p "Would you like to see the agent prompt files? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Agent prompt files created in /tmp/:"
            ls -la /tmp/agent_prompt_*.txt
        fi
    fi
}

# Main execution
main() {
    local mode="${1:-interactive}"
    
    case "$mode" in
        "interactive"|"batch"|"preview")
            run_deployment_review "$mode"
            ;;
        "list")
            echo "Available agents for deployment review:"
            echo "$AGENTS" | while IFS=: read -r agent_name agent_desc; do
                echo "  - $agent_name: $agent_desc"
            done
            ;;
        *)
            echo "Usage: $0 [interactive|batch|preview|list]"
            echo ""
            echo "Modes:"
            echo "  interactive - Run with user prompts (default)"
            echo "  batch      - Run all agents without prompts"
            echo "  preview    - Show what would be done"
            echo "  list       - List available agents"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"