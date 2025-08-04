#!/bin/bash

# Cross-platform text-to-speech script
# Works on macOS (say), Linux (espeak), and containers

if [ -z "$1" ]; then
  echo "Usage: ./speak.sh <text-to-speak>"
  exit 1
fi

TEXT="$1"

# Check if running in Docker/CI environment
if [ "$DOCKER_CONTAINER" = "1" ] || [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]; then
  echo "🔊 TTS: $TEXT"
  exit 0
fi

# Try different TTS engines based on OS
if command -v say &> /dev/null; then
  # macOS
  say "$TEXT"
elif command -v espeak &> /dev/null; then
  # Linux with espeak
  espeak "$TEXT"
elif command -v spd-say &> /dev/null; then
  # Linux with speech-dispatcher
  spd-say "$TEXT"
else
  # Fallback: just echo the message
  echo "🔊 TTS: $TEXT"
fi
