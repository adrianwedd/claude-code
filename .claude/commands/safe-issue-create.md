# Safe GitHub Issue Creation Command

## Purpose
Create GitHub issues safely in the fork repository (adrianwedd/claude-code) while preventing accidental creation in the upstream repository (anthropics/claude-code).

## Usage
```bash
claude --command safe-issue-create
```

## Safety Features
- ✅ Automatically targets fork repository (adrianwedd/claude-code)
- ✅ Verifies current repository context before creation
- ✅ Prevents upstream repository modifications
- ✅ Confirms repository target with user
- ✅ Validates issue content before creation
- ✅ Supports batch issue creation with confirmation

## Command Implementation

The command will:

1. **Repository Verification**: Confirm we're working with the correct fork
2. **Safety Checks**: Verify remote configuration and prevent upstream targeting
3. **Issue Validation**: Check issue format and content
4. **User Confirmation**: Require explicit approval before creation
5. **Batch Processing**: Support creating multiple issues safely
6. **Error Handling**: Graceful failure with clear error messages

## Example Usage

### Single Issue Creation
```bash
# Claude will prompt for issue details and confirm repository target
claude --command safe-issue-create --single
```

### Batch Issue Creation (from agent analysis)
```bash
# Create all deployment-focused issues from agent recommendations
claude --command safe-issue-create --batch deployment
```

### Preview Mode (no actual creation)
```bash
# Preview issues without creating them
claude --command safe-issue-create --preview
```

## Safety Configuration

The command includes these safety mechanisms:

- **Repository whitelist**: Only allows creation in adrianwedd/claude-code
- **Upstream protection**: Blocks any attempts to create issues in anthrop
- **Confirmation prompts**: Requires user approval for each issue
- **Dry-run mode**: Preview functionality before execution
- **Error recovery**: Rollback capability if issues arise

## Command Structure

```bash
#!/bin/bash
# Safe GitHub Issue Creation for Claude Code Fork
# Usage: claude --command safe-issue-create [options]

set -euo pipefail

# Configuration
ALLOWED_REPO="adrianwedd/claude-code"
UPSTREAM_REPO="anthropics/claude-code"
```

This command ensures we can safely create deployment-focused GitHub issues without risk of modifying the upstream repository.