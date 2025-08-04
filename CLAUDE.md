# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

[PROJECT_DESCRIPTION: Replace with a brief description of your project, its purpose, and primary technology stack]

### Session Management & Knowledge Continuity

**Efficient Session Workflow**: This project uses a structured session management system for optimal Claude Code collaboration:

- **`NEXT_SESSION_PLAN.md`**: Strategic session planning with prioritized objectives, time estimates, and success criteria
- **Active Development**: Execute planned work with todo tracking and incremental progress documentation  
- **`SESSION_WRAPUP.md`**: Comprehensive session closure template ensuring knowledge capture and strategic follow-up

**Key Benefits**:
- **Context Efficiency**: New Claude instances can quickly understand current priorities and system status
- **Knowledge Preservation**: Detailed session history prevents losing technical insights and architectural decisions
- **Strategic Planning**: Systematic objective prioritization based on business value and technical readiness
- **Quality Assurance**: Structured wrap-up process ensures deliverables meet production standards

**Files for Context**:
- `NEXT_SESSION_PLAN.md` - Current session objectives and strategic priorities
- `SESSION_WRAPUP.md` - Session closure template and documentation standards
- `PREVIOUS_SESSION_WRAPUPS.md` - Historical session achievements and learnings archive

### 🚀 Quick Start for New Claude Sessions

**Bootstrap Checklist (5 minutes)**:
1. **Context**: Read this CLAUDE.md file for project understanding
2. **Objectives**: Check `NEXT_SESSION_PLAN.md` for current priorities and time estimates
3. **Health Check**: Run project test suite to verify system operational status
4. **Planning**: Use TodoWrite tool immediately to track session progress
5. **Git Status**: Check current branch and uncommitted changes

**System Status Quick Reference**:
- **Current Branch**: [main/develop/feature-branch]
- **Test Command**: [npm test/pytest/cargo test/etc.]
- **Build Command**: [npm run build/make/cargo build/etc.]
- **Lint Command**: [npm run lint/flake8/clippy/etc.]

## Architecture

### Core Components
[ARCHITECTURE_OVERVIEW: Describe your project's main components, modules, or services]

### Key Files
[KEY_FILES: List the most important files developers should know about]

## Development Commands

### Setup & Installation
```bash
# [SETUP_INSTRUCTIONS: Add your project's setup commands]
```

### Testing
```bash
# [TEST_COMMANDS: Add your testing commands]
```

### Building & Running
```bash
# [BUILD_COMMANDS: Add your build and run commands]
```

### Debugging & Troubleshooting
```bash
# [DEBUG_COMMANDS: Add debugging and troubleshooting commands]
```

## Development Notes

### When Making Changes
[DEVELOPMENT_GUIDELINES: Add project-specific development guidelines]

### Testing Locally
[LOCAL_TESTING: Add instructions for local testing]

### Common Tasks
[COMMON_TASKS: List frequent development tasks and how to accomplish them]

### Important Constraints
[CONSTRAINTS: List any important limitations, requirements, or constraints]

## Critical System Insights & Learnings

### Recent Achievements
[ACHIEVEMENTS: Document recent session achievements and learnings]

### Key Technical Patterns
[PATTERNS: Document important architectural patterns and decisions]

### Operational Excellence Principles
[PRINCIPLES: Document development and operational best practices]

## 🔒 Repository Safety Protocols

### Remote Configuration
- **origin**: adrianwedd/claude-code (fetch + push) - YOUR FORK
- **upstream**: anthropics/claude-code (fetch only) - SOURCE REPO
- **Push protection**: `upstream` set to `no-push` to prevent accidents

### Safe Workflow
```bash
# ✅ SAFE: Pull changes from upstream
git fetch upstream && git merge upstream/main

# ✅ SAFE: Push to your fork
git push origin main

# 🚫 BLOCKED: Cannot push to upstream (protection active)
git push upstream main  # Will fail safely
```

### Agent Safety Rules
- **NEVER** create GitHub issues without explicit user confirmation
- **ALWAYS** operate in template/analysis mode by default  
- **VERIFY** repository context before any GitHub operations
- **NO** direct API calls to anthropics/claude-code repository

*For complete historical session details, see [PREVIOUS_SESSION_WRAPUPS.md](PREVIOUS_SESSION_WRAPUPS.md)*