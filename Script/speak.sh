#!/bin/bash

# This script uses the macOS 'say' command to speak the provided text.

if [ -z "$1" ]; then
  echo "Usage: ./speak.sh <text-to-speak>"
  exit 1
fi

say "$1"
