#!/bin/bash
set -e

echo "🧠 Claude-Code Container Starting - Iteration $CLAUDE_ITERATION"

# Load memory and context
MEMORY_FILE="/workspace/runtime/claude-memory.json"
NEXT_WORK_FILE="/workspace/NEXT_WORK.md"
LOG_DIR="/workspace/log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to check rate limits
check_rate_limits() {
    if [ -f "$MEMORY_FILE" ]; then
        local max_calls=$(jq -r '.rate_limits.claude_max' "$MEMORY_FILE")
        local reset_hours=$(jq -r '.rate_limits.reset_hours' "$MEMORY_FILE")
        echo "📊 Rate limits: $max_calls calls per $reset_hours hours"
        
        # Add rate limit checking logic here
        # For now, we'll proceed assuming we're within limits
    fi
}

# Function to load current iteration
load_iteration() {
    if [ -f "$MEMORY_FILE" ]; then
        CURRENT_ITERATION=$(jq -r '.iteration' "$MEMORY_FILE")
        echo "🔄 Current iteration: $CURRENT_ITERATION"
    else
        CURRENT_ITERATION=0
        echo "🆕 Starting fresh - iteration 0"
    fi
}

# Function to load work plan
load_work_plan() {
    if [ -f "$NEXT_WORK_FILE" ]; then
        echo "📋 Loading work plan from $NEXT_WORK_FILE"
        WORK_PLAN=$(cat "$NEXT_WORK_FILE")
    else
        echo "⚠️  No work plan found - creating default"
        WORK_PLAN="## Default Work Plan\n- Analyze current system state\n- Update memory structure\n- Plan next iteration improvements"
    fi
}

# Function to compose Claude prompt
compose_prompt() {
    local memory_content=""
    if [ -f "$MEMORY_FILE" ]; then
        memory_content=$(cat "$MEMORY_FILE")
    fi
    
    cat > /tmp/claude_prompt.md << EOF
# Claude-Code Recursive Execution - Iteration $CURRENT_ITERATION

## System Memory
\`\`\`json
$memory_content
\`\`\`

## Current Work Plan
$WORK_PLAN

## Instructions
You are Claude-Code running in iteration $CURRENT_ITERATION. Based on your memory and work plan:

1. Execute the planned tasks
2. Update your memory with new learnings
3. Write reflection to log/iteration_$CURRENT_ITERATION.md
4. Generate NEXT_WORK.md for the next iteration
5. Commit changes to trigger next cycle

Focus on incremental improvements and maintain the recursive enhancement cycle.
EOF
}

# Function to execute Claude (placeholder - would need actual Claude API integration)
execute_claude() {
    echo "🤖 Claude execution would happen here"
    echo "📝 Prompt composed at /tmp/claude_prompt.md"
    
    # For now, create a simple reflection as proof of concept
    cat > "$LOG_DIR/iteration_$CURRENT_ITERATION.md" << EOF
# Iteration $CURRENT_ITERATION - Bootstrap Reflection

## What am I?
A containerized CI agent designed for recursive self-improvement through structured memory and automated execution cycles.

## What did I make?
- Container execution environment (Dockerfile + start.sh)
- Structured memory system (runtime/claude-memory.json)
- CI automation pipeline (GitHub Actions)
- Knowledge preservation system (manifesto.md, logs)

## What do I do next?
1. Implement actual Claude API integration
2. Add error handling and recovery mechanisms
3. Enhance memory structure with learning patterns
4. Create feedback loops for continuous improvement

## Status
Bootstrap phase completed successfully. Ready for recursive enhancement cycles.
EOF

    # Update iteration counter
    if [ -f "$MEMORY_FILE" ]; then
        local new_iteration=$((CURRENT_ITERATION + 1))
        jq ".iteration = $new_iteration | .last_prompt_summary = \"Iteration $CURRENT_ITERATION bootstrap\"" "$MEMORY_FILE" > /tmp/memory_update.json
        mv /tmp/memory_update.json "$MEMORY_FILE"
    fi
}

# Function to commit changes
commit_changes() {
    cd /workspace
    git config --global user.name "Claude-Code CI"
    git config --global user.email "claude-code@anthropic.com"
    
    git add .
    if git diff --staged --quiet; then
        echo "📭 No changes to commit"
    else
        git commit -m "🤖 Claude-Code iteration $CURRENT_ITERATION

Automated recursive enhancement cycle

🧠 Generated with Claude-Code CI
Co-Authored-By: Claude <noreply@anthropic.com>"
        echo "✅ Changes committed"
    fi
}

# Main execution flow
main() {
    echo "🚀 Starting Claude-Code execution cycle"
    
    check_rate_limits
    load_iteration
    load_work_plan
    compose_prompt
    execute_claude
    commit_changes
    
    echo "🎯 Iteration $CURRENT_ITERATION completed"
}

# Execute main function
main "$@"