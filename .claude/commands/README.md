# Claude Code Commands

This directory contains custom commands for Claude to safely manage the Claude Code repository.

## Available Commands

### 🔒 safe-issue-create.sh

**Purpose**: Safely create GitHub issues in the fork repository while preventing accidental upstream modifications.

**Usage**:
```bash
# Preview issues without creating them
./.claude/commands/safe-issue-create.sh --preview

# Create all deployment-focused issues
./.claude/commands/safe-issue-create.sh --batch

# Interactive single issue creation (coming soon)
./.claude/commands/safe-issue-create.sh --single
```

**Safety Features**:
- ✅ Repository verification (only works in adrianwedd/claude-code)
- ✅ Upstream protection (prevents anthropics/claude-code modifications)
- ✅ User confirmation for each issue
- ✅ Preview mode for testing
- ✅ Batch processing with error handling

**Example Output**:
```
🚀 Safe GitHub Issue Creation for Claude Code
=============================================

[10:30:15] Verifying repository context...
✅ Repository verification passed
  - Fork: adrianwedd/claude-code
  - Upstream: anthro
  - Upstream: anthropics/claude-code (read-only)

[10:30:16] Verifying GitHub CLI access...
✅ GitHub CLI access verified

[10:30:17] Loading Priority 0 (Critical) Issues...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ISSUE PREVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Repository: adrianwedd/claude-code
Title: [P0][DEPLOYMENT] iOS App Store Distribution Pipeline
Labels: deployment,ios,mobile,app-store,priority-p0,fastlane
...
```

## Command Development Guidelines

### Safety First
All commands must include:
- Repository verification
- User confirmation prompts
- Preview/dry-run modes
- Error handling and rollback
- Clear logging and status updates

### Command Structure
```bash
#!/bin/bash
set -euo pipefail

# Configuration
ALLOWED_REPO="adrianwedd/claude-code"
UPSTREAM_REPO="anthropics/claude-code"

# Safety functions
verify_repository() { ... }
verify_access() { ... }

# Main functionality
main() { ... }
```

### Error Handling
- Use `set -euo pipefail` for strict error handling
- Provide clear error messages with suggested fixes
- Include rollback mechanisms where appropriate
- Log all actions for debugging

## Future Commands

### Planned Commands
- `safe-deployment.sh` - Safe deployment to production environments
- `generate-release-notes.sh` - Automated release note generation
- `run-integration-tests.sh` - Comprehensive testing suite
- `sync-with-upstream.sh` - Safe upstream synchronization

### Command Requests
To request new commands, create an issue with the label `claude-command` and include:
- Use case description
- Safety requirements
- Expected functionality
- Example usage

## Integration with Claude

These commands are designed to work seamlessly with Claude Code sessions:

```
User: "Create deployment issues for app store submission"
Claude: "I'll use the safe-issue-create command to create issues in your fork repository."
```

Claude automatically uses these commands when appropriate, ensuring safe repository operations while maintaining development velocity.