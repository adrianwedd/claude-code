#!/bin/bash

# macOS Text-to-Speech System for Claude Code
# Provides intelligent audio notifications for development sessions

set -euo pipefail

# Configuration defaults
TTS_VOICE="${TTS_VOICE:-Alex}"
TTS_RATE="${TTS_RATE:-200}"
TTS_ENABLED="${TTS_ENABLED:-true}"
TTS_FILTER_MODE="${TTS_FILTER_MODE:-smart}"
TTS_MAX_LENGTH="${TTS_MAX_LENGTH:-500}"

# Audio queue management
TTS_QUEUE_DIR="${TMPDIR:-/tmp}/claude-tts"
TTS_LOCK_FILE="$TTS_QUEUE_DIR/tts.lock"

# Initialize TTS system
init_tts() {
    mkdir -p "$TTS_QUEUE_DIR"
    
    # Check if 'say' command is available
    if ! command -v say >/dev/null 2>&1; then
        echo "Warning: TTS not available - 'say' command not found" >&2
        export TTS_ENABLED=false
        return 1
    fi
    
    # Test audio output
    if ! say "TTS initialized" >/dev/null 2>&1; then
        echo "Warning: TTS not available - audio output failed" >&2
        export TTS_ENABLED=false
        return 1
    fi
    
    return 0
}

# Smart content filtering
filter_content() {
    local content="$1"
    local mode="${2:-$TTS_FILTER_MODE}"
    
    case "$mode" in
        "smart")
            # Filter out code blocks, verbose logs, and technical noise
            echo "$content" | \
                sed 's/```[^`]*```//g' | \
                sed 's/`[^`]*`//g' | \
                grep -v '^\s*[{}()\[\];,].*$' | \
                grep -v '^\s*//.*$' | \
                grep -v '^\s*#.*$' | \
                head -c "$TTS_MAX_LENGTH"
            ;;
        "summary")
            # Only speak if content contains summary keywords
            if echo "$content" | grep -iE "(summary|completed|failed|finished|done|error|warning)" >/dev/null; then
                echo "$content" | head -c "$TTS_MAX_LENGTH"
            fi
            ;;
        "all")
            echo "$content" | head -c "$TTS_MAX_LENGTH"
            ;;
        *)
            echo "$content" | head -c "$TTS_MAX_LENGTH"
            ;;
    esac
}

# Queue management to prevent overlapping speech
acquire_lock() {
    local timeout=10
    while [ $timeout -gt 0 ]; do
        if mkdir "$TTS_LOCK_FILE" 2>/dev/null; then
            return 0
        fi
        sleep 0.5
        timeout=$((timeout - 1))
    done
    return 1
}

release_lock() {
    rmdir "$TTS_LOCK_FILE" 2>/dev/null || true
}

# Core TTS function
speak_text() {
    local text="$1"
    local priority="${2:-normal}"
    
    # Check if TTS is enabled
    if [ "$TTS_ENABLED" != "true" ]; then
        return 0
    fi
    
    # Filter content
    local filtered_text
    filtered_text=$(filter_content "$text")
    
    # Skip if no content after filtering
    if [ -z "$filtered_text" ] || [ ${#filtered_text} -lt 10 ]; then
        return 0
    fi
    
    # Handle priority speaking (interrupt current speech)
    if [ "$priority" = "urgent" ]; then
        pkill -f "say" 2>/dev/null || true
        say -v "$TTS_VOICE" -r "$TTS_RATE" "$filtered_text" &
        return 0
    fi
    
    # Queue management for normal priority
    if acquire_lock; then
        trap 'release_lock' EXIT
        say -v "$TTS_VOICE" -r "$TTS_RATE" "$filtered_text"
        release_lock
        trap - EXIT
    fi
}

# Predefined notification types
speak_session_complete() {
    speak_text "Session completed successfully. All tasks finished." "normal"
}

speak_error() {
    local error_msg="$1"
    speak_text "Error occurred: $error_msg" "urgent"
}

speak_warning() {
    local warning_msg="$1"
    speak_text "Warning: $warning_msg" "normal"
}

speak_summary() {
    local summary="$1"
    speak_text "Summary: $summary" "normal"
}

# Main CLI interface
main() {
    local command="${1:-}"
    shift || true
    
    case "$command" in
        "init")
            init_tts
            ;;
        "speak")
            if [ $# -eq 0 ]; then
                echo "Usage: $0 speak <text> [priority]" >&2
                exit 1
            fi
            speak_text "$1" "${2:-normal}"
            ;;
        "session-complete")
            speak_session_complete
            ;;
        "error")
            if [ $# -eq 0 ]; then
                echo "Usage: $0 error <error-message>" >&2
                exit 1
            fi
            speak_error "$1"
            ;;
        "warning")
            if [ $# -eq 0 ]; then
                echo "Usage: $0 warning <warning-message>" >&2
                exit 1
            fi
            speak_warning "$1"
            ;;
        "summary")
            if [ $# -eq 0 ]; then
                echo "Usage: $0 summary <summary-text>" >&2
                exit 1
            fi
            speak_summary "$1"
            ;;
        "test")
            init_tts && speak_text "TTS system is working correctly"
            ;;
        "config")
            echo "TTS Configuration:"
            echo "  Voice: $TTS_VOICE"
            echo "  Rate: $TTS_RATE"
            echo "  Enabled: $TTS_ENABLED"
            echo "  Filter Mode: $TTS_FILTER_MODE"
            echo "  Max Length: $TTS_MAX_LENGTH"
            ;;
        *)
            echo "Usage: $0 {init|speak|session-complete|error|warning|summary|test|config}"
            echo ""
            echo "Commands:"
            echo "  init                    Initialize TTS system"
            echo "  speak <text> [priority] Speak arbitrary text (priority: normal|urgent)"
            echo "  session-complete        Announce session completion"
            echo "  error <message>         Announce error with urgency"
            echo "  warning <message>       Announce warning"
            echo "  summary <text>          Speak summary content"
            echo "  test                    Test TTS functionality"
            echo "  config                  Show current configuration"
            echo ""
            echo "Environment Variables:"
            echo "  TTS_VOICE      Voice to use (default: Alex)"
            echo "  TTS_RATE       Speech rate (default: 200)"
            echo "  TTS_ENABLED    Enable/disable TTS (default: true)"
            echo "  TTS_FILTER_MODE Content filtering (smart|summary|all)"
            echo "  TTS_MAX_LENGTH Maximum text length (default: 500)"
            exit 1
            ;;
    esac
}

# Initialize TTS on script load
init_tts >/dev/null 2>&1 || true

# Run main function if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi