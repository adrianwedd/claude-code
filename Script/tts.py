#!/usr/bin/env python3
"""
macOS Text-to-Speech Integration for Claude Code
Provides intelligent audio notifications for development sessions
"""

import os
import sys
import subprocess
import threading
import re
from pathlib import Path
from typing import Optional, Dict, Any
import json

class TTSManager:
    """Manages Text-to-Speech functionality for Claude Code"""
    
    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.tts_script = self.script_dir / "tts.sh"
        self.config = self._load_config()
        self._initialize()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load TTS configuration from environment and defaults"""
        return {
            'voice': os.getenv('TTS_VOICE', 'Alex'),
            'rate': int(os.getenv('TTS_RATE', '200')),
            'enabled': os.getenv('TTS_ENABLED', 'true').lower() == 'true',
            'filter_mode': os.getenv('TTS_FILTER_MODE', 'smart'),
            'max_length': int(os.getenv('TTS_MAX_LENGTH', '500')),
        }
    
    def _initialize(self) -> bool:
        """Initialize the TTS system"""
        if not self.tts_script.exists():
            print(f"Warning: TTS script not found at {self.tts_script}", file=sys.stderr)
            self.config['enabled'] = False
            return False
        
        try:
            result = subprocess.run(
                [str(self.tts_script), 'init'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode != 0:
                self.config['enabled'] = False
                return False
        except (subprocess.TimeoutExpired, subprocess.SubprocessError):
            self.config['enabled'] = False
            return False
        
        return True
    
    def _execute_tts(self, command: str, *args: str, priority: str = 'normal') -> bool:
        """Execute TTS command via shell script"""
        if not self.config['enabled']:
            return False
        
        try:
            cmd = [str(self.tts_script), command] + list(args)
            
            if priority == 'urgent':
                # Run synchronously for urgent messages
                subprocess.run(cmd, timeout=10)
            else:
                # Run asynchronously for normal messages
                threading.Thread(
                    target=lambda: subprocess.run(cmd, timeout=10),
                    daemon=True
                ).start()
            
            return True
        except (subprocess.TimeoutExpired, subprocess.SubprocessError) as e:
            print(f"TTS error: {e}", file=sys.stderr)
            return False
    
    def speak(self, text: str, priority: str = 'normal') -> bool:
        """Speak arbitrary text with optional priority"""
        return self._execute_tts('speak', text, priority)
    
    def session_complete(self) -> bool:
        """Announce session completion"""
        return self._execute_tts('session-complete')
    
    def error(self, message: str) -> bool:
        """Announce error with urgency"""
        return self._execute_tts('error', message)
    
    def warning(self, message: str) -> bool:
        """Announce warning"""
        return self._execute_tts('warning', message)
    
    def summary(self, text: str) -> bool:
        """Speak summary content with smart filtering"""
        return self._execute_tts('summary', text)
    
    def test(self) -> bool:
        """Test TTS functionality"""
        return self._execute_tts('test')
    
    def is_enabled(self) -> bool:
        """Check if TTS is enabled and available"""
        return self.config['enabled']
    
    def get_config(self) -> Dict[str, Any]:
        """Get current TTS configuration"""
        return self.config.copy()
    
    @staticmethod
    def filter_for_speech(text: str) -> str:
        """Filter text content for appropriate speech output"""
        # Remove code blocks
        text = re.sub(r'```[\s\S]*?```', '', text)
        text = re.sub(r'`[^`]*`', '', text)
        
        # Remove technical symbols and noise
        lines = text.split('\n')
        filtered_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Skip lines that are mostly technical symbols
            if re.match(r'^[\s\{\}\(\)\[\];,]*$', line):
                continue
            
            # Skip comment lines
            if re.match(r'^\s*(//|#)', line):
                continue
            
            # Skip very short lines that are likely technical
            if len(line) < 5:
                continue
            
            filtered_lines.append(line)
        
        result = ' '.join(filtered_lines)
        
        # Limit length
        if len(result) > 500:
            result = result[:497] + "..."
        
        return result


# CLI interface
def main():
    """Command-line interface for TTS functionality"""
    if len(sys.argv) < 2:
        print("Usage: python tts.py <command> [args...]")
        print("Commands: speak, session-complete, error, warning, summary, test, config")
        sys.exit(1)
    
    tts = TTSManager()
    command = sys.argv[1]
    
    if command == 'speak' and len(sys.argv) >= 3:
        priority = sys.argv[3] if len(sys.argv) > 3 else 'normal'
        success = tts.speak(sys.argv[2], priority)
    elif command == 'session-complete':
        success = tts.session_complete()
    elif command == 'error' and len(sys.argv) >= 3:
        success = tts.error(sys.argv[2])
    elif command == 'warning' and len(sys.argv) >= 3:
        success = tts.warning(sys.argv[2])
    elif command == 'summary' and len(sys.argv) >= 3:
        success = tts.summary(sys.argv[2])
    elif command == 'test':
        success = tts.test()
    elif command == 'config':
        print("TTS Configuration:")
        config = tts.get_config()
        for key, value in config.items():
            print(f"  {key}: {value}")
        success = True
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()