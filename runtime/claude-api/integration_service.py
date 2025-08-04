"""
Claude Code Integration Service
Orchestrates AI interactions with the broader development environment
"""

import asyncio
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
import structlog

from claude_client import ClaudeAPIClient, AgentOrchestrator

logger = structlog.get_logger(__name__)

class DevelopmentContext:
    """Manages development environment context and state"""
    
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root).resolve()
        self.git_info = self._get_git_info()
        self.project_info = self._analyze_project()
    
    def _get_git_info(self) -> Dict[str, Any]:
        """Extract git repository information"""
        try:
            # Get current branch
            branch = subprocess.check_output(
                ["git", "branch", "--show-current"], 
                cwd=self.project_root,
                text=True
            ).strip()
            
            # Get recent commits
            commits = subprocess.check_output(
                ["git", "log", "--oneline", "-5"],
                cwd=self.project_root,
                text=True
            ).strip().split('\n')
            
            # Get status
            status = subprocess.check_output(
                ["git", "status", "--porcelain"],
                cwd=self.project_root,
                text=True
            ).strip()
            
            return {
                "branch": branch,
                "recent_commits": commits,
                "has_uncommitted_changes": bool(status),
                "modified_files": [line[3:] for line in status.split('\n') if line]
            }
        except subprocess.CalledProcessError:
            return {"error": "Not a git repository or git not available"}
    
    def _analyze_project(self) -> Dict[str, Any]:
        """Analyze project structure and technologies"""
        info = {
            "root": str(self.project_root),
            "technologies": [],
            "structure": {}
        }
        
        # Detect technologies based on files
        tech_indicators = {
            "package.json": "Node.js/JavaScript",
            "requirements.txt": "Python",
            "Cargo.toml": "Rust", 
            "pom.xml": "Java/Maven",
            "build.gradle": "Java/Gradle",
            "Dockerfile": "Docker",
            "docker-compose.yml": "Docker Compose",
            ".github/workflows": "GitHub Actions",
            "tsconfig.json": "TypeScript",
            "go.mod": "Go"
        }
        
        for indicator, tech in tech_indicators.items():
            if (self.project_root / indicator).exists():
                info["technologies"].append(tech)
        
        # Get basic structure
        try:
            important_dirs = ["src", "lib", "components", "pages", "api", "tests", "__tests__"]
            for dir_name in important_dirs:
                dir_path = self.project_root / dir_name
                if dir_path.exists() and dir_path.is_dir():
                    file_count = len(list(dir_path.rglob("*")))
                    info["structure"][dir_name] = {"files": file_count}
        except Exception as e:
            logger.warning("Failed to analyze project structure", error=str(e))
        
        return info
    
    def get_context_summary(self) -> str:
        """Get a human-readable context summary"""
        lines = [
            f"Project: {self.project_root.name}",
            f"Location: {self.project_root}",
        ]
        
        if self.project_info["technologies"]:
            lines.append(f"Technologies: {', '.join(self.project_info['technologies'])}")
        
        if not self.git_info.get("error"):
            lines.append(f"Git branch: {self.git_info['branch']}")
            if self.git_info["has_uncommitted_changes"]:
                lines.append(f"Modified files: {len(self.git_info['modified_files'])}")
        
        return "\n".join(lines)

class TaskOrchestrator:
    """Orchestrates complex development tasks using AI agents"""
    
    def __init__(self, claude_client: ClaudeAPIClient, context: DevelopmentContext):
        self.claude = claude_client
        self.context = context
        self.orchestrator = AgentOrchestrator(claude_client)
    
    async def execute_development_task(
        self,
        task_description: str,
        session_id: str,
        task_type: str = "general"
    ) -> Dict[str, Any]:
        """Execute a development task with appropriate agent coordination"""
        
        logger.info("Starting development task", 
                   task=task_description[:100], 
                   type=task_type,
                   session_id=session_id)
        
        # Prepare context
        context_data = {
            "project": {
                "name": self.context.project_root.name,
                "path": str(self.context.project_root),
                "technologies": self.context.project_info["technologies"],
                "git_info": self.context.git_info
            },
            "task_type": task_type
        }
        
        # Determine required agents based on task type
        agent_workflows = {
            "code_review": ["code_reviewer", "security_specialist"],
            "architecture": ["architect", "security_specialist"],
            "performance": ["performance_specialist", "devops_specialist"],
            "security": ["security_specialist", "code_reviewer"],
            "deployment": ["devops_specialist", "security_specialist"],
            "debugging": ["code_reviewer", "performance_specialist"],
            "feature": ["architect", "code_reviewer"],
            "testing": ["code_reviewer", "devops_specialist"],
            "general": ["assistant"]
        }
        
        required_agents = agent_workflows.get(task_type, ["assistant"])
        
        # Execute task with agent coordination
        if len(required_agents) == 1:
            # Single agent task
            template_name = required_agents[0] if required_agents[0] != "assistant" else "general_assistant"
            result = await self.claude.send_message_async(
                task_description,
                session_id,
                template_name,
                context_data
            )
            return {"primary_response": result, "agents_used": required_agents}
        else:
            # Multi-agent coordination
            results = await self.orchestrator.coordinate_task(
                task_description,
                session_id,
                required_agents,
                context_data
            )
            return {"agent_responses": results, "agents_used": required_agents}
    
    async def code_review_workflow(
        self,
        file_paths: List[str],
        session_id: str,
        review_type: str = "comprehensive"
    ) -> Dict[str, Any]:
        """Specialized workflow for code review"""
        
        results = {}
        
        for file_path in file_paths:
            full_path = self.context.project_root / file_path
            if not full_path.exists():
                results[file_path] = {"error": "File not found"}
                continue
            
            # Read file content
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception as e:
                results[file_path] = {"error": f"Could not read file: {e}"}
                continue
            
            # Prepare review request
            review_request = f"""
Please review the following code file: {file_path}

File content:
```
{content}
```

Provide a {review_type} review focusing on:
- Code quality and best practices
- Potential bugs and edge cases
- Security considerations
- Performance implications
- Suggestions for improvement
"""
            
            # Get review from multiple agents
            if review_type == "comprehensive":
                agents = ["code_reviewer", "security_specialist", "performance_specialist"]
            else:
                agents = ["code_reviewer"]
            
            file_results = await self.orchestrator.coordinate_task(
                review_request,
                f"{session_id}_{file_path}",
                agents,
                {"file_path": file_path, "file_content": content}
            )
            
            results[file_path] = file_results
        
        return results

class ClaudeCodeIntegration:
    """Main integration service for Claude Code"""
    
    def __init__(self, project_root: str = ".", api_key: Optional[str] = None):
        self.context = DevelopmentContext(project_root)
        self.claude = ClaudeAPIClient(api_key=api_key)
        self.orchestrator = TaskOrchestrator(self.claude, self.context)
        
        logger.info("Claude Code integration initialized", 
                   project=self.context.project_root.name,
                   technologies=self.context.project_info["technologies"])
    
    async def interactive_session(self, session_id: Optional[str] = None) -> None:
        """Start an interactive development session"""
        
        if not session_id:
            session_id = f"interactive_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        print(f"\n🚀 Claude Code Interactive Session")
        print(f"Session ID: {session_id}")
        print(f"Project: {self.context.project_root.name}")
        print("\nContext:")
        print(self.context.get_context_summary())
        print("\nType 'help' for commands, 'quit' to exit\n")
        
        while True:
            try:
                user_input = input("🤖 Claude Code > ").strip()
                
                if not user_input:
                    continue
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("Goodbye! 👋")
                    break
                
                if user_input.lower() == 'help':
                    self._show_help()
                    continue
                
                if user_input.lower() == 'status':
                    await self._show_status(session_id)
                    continue
                
                if user_input.startswith('/'):
                    await self._handle_command(user_input, session_id)
                    continue
                
                # Regular AI interaction
                print("🤔 Thinking...")
                
                response = await self.claude.send_message_async(
                    user_input,
                    session_id,
                    additional_context={
                        "project": {
                            "name": self.context.project_root.name,
                            "context": self.context.get_context_summary()
                        }
                    }
                )
                
                print(f"\n✨ Claude Code:\n{response['response']}\n")
                
                if response.get('tool_uses'):
                    print(f"🔧 Tools used: {[tool['name'] for tool in response['tool_uses']]}")
                
            except KeyboardInterrupt:
                print("\n\nGoodbye! 👋")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                logger.error("Interactive session error", error=str(e))
    
    def _show_help(self) -> None:
        """Show help information"""
        help_text = """
Available commands:
  help                    - Show this help
  status                  - Show session status and metrics
  quit, exit, q          - Exit the session
  
  /review <files>        - Review specific files
  /architecture          - Discuss system architecture  
  /debug <description>   - Help with debugging
  /optimize              - Performance optimization advice
  /security              - Security analysis
  /deploy                - Deployment guidance
  /test                  - Testing strategy
  
Examples:
  /review src/main.py src/utils.py
  /debug "Getting 500 error on user login"
  /optimize "API response times are slow"
  
Just type naturally for general development assistance!
"""
        print(help_text)
    
    async def _show_status(self, session_id: str) -> None:
        """Show session status and metrics"""
        metrics = self.claude.get_usage_metrics()
        
        print(f"\n📊 Session Status:")
        print(f"Session ID: {session_id}")
        print(f"Total requests: {metrics['total_requests']}")
        print(f"Total tokens: {metrics['total_tokens_input'] + metrics['total_tokens_output']}")
        print(f"Total cost: ${metrics['total_cost_usd']:.4f}")
        print(f"Average cost per request: ${metrics['average_cost_per_request']:.4f}")
        
        if session_id in self.claude.contexts:
            context = self.claude.contexts[session_id]
            print(f"Messages in conversation: {len(context.conversation_history)}")
            print(f"Recent tools: {', '.join(context.recent_tools[-5:]) if context.recent_tools else 'None'}")
        
        print()
    
    async def _handle_command(self, command: str, session_id: str) -> None:
        """Handle special commands"""
        parts = command[1:].split()
        cmd = parts[0].lower()
        args = parts[1:] if len(parts) > 1 else []
        
        task_types = {
            "review": "code_review",
            "architecture": "architecture", 
            "debug": "debugging",
            "optimize": "performance",
            "security": "security",
            "deploy": "deployment",
            "test": "testing"
        }
        
        if cmd in task_types:
            task_type = task_types[cmd]
            
            if cmd == "review" and args:
                # File review
                print(f"🔍 Reviewing files: {', '.join(args)}")
                results = await self.orchestrator.code_review_workflow(args, session_id)
                
                for file_path, result in results.items():
                    print(f"\n📁 {file_path}:")
                    if "error" in result:
                        print(f"❌ {result['error']}")
                    else:
                        for agent, response in result.items():
                            print(f"\n🤖 {agent.title()}:")
                            print(response['response'][:500] + "..." if len(response['response']) > 500 else response['response'])
            else:
                # General task
                task_desc = " ".join(args) if args else f"Help with {cmd}"
                print(f"🚀 Executing {cmd} task...")
                
                result = await self.orchestrator.execute_development_task(
                    task_desc, session_id, task_type
                )
                
                if "primary_response" in result:
                    print(f"\n✨ Response:\n{result['primary_response']['response']}")
                else:
                    for agent, response in result["agent_responses"].items():
                        print(f"\n🤖 {agent.title()}:")
                        print(response['response'][:400] + "..." if len(response['response']) > 400 else response['response'])
        else:
            print(f"❌ Unknown command: {cmd}")

async def main():
    """Main entry point for CLI usage"""
    
    # Get API key from environment or command line
    api_key = os.getenv("CLAUDE_API_KEY")
    if not api_key:
        print("❌ CLAUDE_API_KEY environment variable is required")
        sys.exit(1)
    
    # Initialize integration
    integration = ClaudeCodeIntegration(api_key=api_key)
    
    # Start interactive session
    await integration.interactive_session()

if __name__ == "__main__":
    asyncio.run(main())