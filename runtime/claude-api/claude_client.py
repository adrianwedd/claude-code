"""
Claude API Integration Client
Provides secure, intelligent API interactions with context management
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, AsyncGenerator
from dataclasses import dataclass, asdict
from pathlib import Path

import structlog
from anthropic import Anthropic, AsyncAnthropic
from anthropic.types import MessageParam, TextBlock, ToolUseBlock
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from pydantic import BaseModel, Field
import tiktoken
import yaml

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

@dataclass
class APIUsageMetrics:
    """Track API usage and costs"""
    total_requests: int = 0
    total_tokens_input: int = 0
    total_tokens_output: int = 0
    total_cost_usd: float = 0.0
    rate_limit_hits: int = 0
    errors: int = 0
    last_request: Optional[datetime] = None

class PromptTemplate(BaseModel):
    """Structured prompt template for different agent types"""
    name: str
    role: str
    system_prompt: str
    context_variables: List[str] = Field(default_factory=list)
    max_tokens: int = 4000
    temperature: float = 0.7
    tools: List[str] = Field(default_factory=list)

class ConversationContext(BaseModel):
    """Conversation context and memory management"""
    session_id: str
    project_context: Dict[str, Any] = Field(default_factory=dict)
    memory_snippets: List[str] = Field(default_factory=list)
    recent_tools: List[str] = Field(default_factory=list)
    conversation_history: List[MessageParam] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class ClaudeAPIClient:
    """Intelligent Claude API client with context management"""
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-3-5-sonnet-20241022",
        max_retries: int = 3,
        rate_limit_delay: float = 1.0,
        memory_file_path: str = "runtime/claude-memory.json"
    ):
        self.api_key = api_key or os.getenv("CLAUDE_API_KEY")
        if not self.api_key:
            raise ValueError("CLAUDE_API_KEY must be set in environment or passed directly")
        
        self.model = model
        self.max_retries = max_retries
        self.rate_limit_delay = rate_limit_delay
        self.memory_file_path = Path(memory_file_path)
        
        # Initialize clients
        self.sync_client = Anthropic(api_key=self.api_key)
        self.async_client = AsyncAnthropic(api_key=self.api_key)
        
        # Initialize tokenizer for cost estimation
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
        # Usage tracking
        self.metrics = APIUsageMetrics()
        
        # Load prompt templates
        self.prompt_templates = self._load_prompt_templates()
        
        # Initialize context manager
        self.contexts: Dict[str, ConversationContext] = {}
        
        logger.info("Claude API client initialized", model=self.model)

    def _load_prompt_templates(self) -> Dict[str, PromptTemplate]:
        """Load prompt templates from configuration"""
        templates_file = Path(__file__).parent / "prompt_templates.yaml"
        if not templates_file.exists():
            return self._create_default_templates()
        
        try:
            with open(templates_file, 'r') as f:
                data = yaml.safe_load(f)
            
            templates = {}
            for name, config in data.get('templates', {}).items():
                templates[name] = PromptTemplate(**config)
            
            logger.info("Loaded prompt templates", count=len(templates))
            return templates
        except Exception as e:
            logger.error("Failed to load prompt templates", error=str(e))
            return self._create_default_templates()

    def _create_default_templates(self) -> Dict[str, PromptTemplate]:
        """Create default prompt templates"""
        return {
            "general_assistant": PromptTemplate(
                name="general_assistant",
                role="AI Development Assistant",
                system_prompt="""You are Claude Code, an advanced AI development assistant. You help developers with:
- Code analysis, debugging, and optimization
- Architecture decisions and best practices  
- Project planning and task breakdown
- Technical documentation and explanations

Use your tools effectively and provide clear, actionable responses.""",
                max_tokens=4000,
                temperature=0.7
            ),
            "code_reviewer": PromptTemplate(
                name="code_reviewer",
                role="Senior Code Reviewer",
                system_prompt="""You are a meticulous code reviewer focused on:
- Code quality, security, and performance
- Best practices and architectural patterns
- Bug detection and edge case analysis
- Suggestions for improvement

Provide detailed, constructive feedback with specific examples.""",
                max_tokens=3000,
                temperature=0.3
            ),
            "architect": PromptTemplate(
                name="architect",
                role="Software Architect",
                system_prompt="""You are a software architect responsible for:
- System design and architectural patterns
- Scalability and performance planning
- Technology stack recommendations
- Integration strategy and API design

Focus on long-term maintainability and scalability.""",
                max_tokens=3500,
                temperature=0.5
            )
        }

    def estimate_tokens(self, text: str) -> int:
        """Estimate token count for text"""
        return len(self.tokenizer.encode(text))

    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Estimate API cost based on token usage"""
        # Claude 3.5 Sonnet pricing (as of 2024)
        input_cost_per_1k = 0.003
        output_cost_per_1k = 0.015
        
        input_cost = (input_tokens / 1000) * input_cost_per_1k
        output_cost = (output_tokens / 1000) * output_cost_per_1k
        
        return input_cost + output_cost

    def load_memory_context(self) -> Dict[str, Any]:
        """Load existing memory context"""
        try:
            if self.memory_file_path.exists():
                with open(self.memory_file_path, 'r') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            logger.error("Failed to load memory context", error=str(e))
            return {}

    def update_memory_context(self, updates: Dict[str, Any]) -> None:
        """Update and save memory context"""
        try:
            memory = self.load_memory_context()
            memory.update(updates)
            memory['last_updated'] = datetime.now().isoformat()
            
            with open(self.memory_file_path, 'w') as f:
                json.dump(memory, f, indent=2, default=str)
            
            logger.info("Memory context updated", updates_count=len(updates))
        except Exception as e:
            logger.error("Failed to update memory context", error=str(e))

    def create_context_prompt(
        self,
        template_name: str,
        user_message: str,
        session_id: str,
        additional_context: Optional[Dict[str, Any]] = None
    ) -> tuple[str, List[MessageParam]]:
        """Create a contextualized prompt with memory integration"""
        
        template = self.prompt_templates.get(template_name, self.prompt_templates["general_assistant"])
        memory = self.load_memory_context()
        
        # Build context from memory and session
        context_parts = []
        
        # Add project context
        if additional_context:
            project_info = additional_context.get("project", {})
            if project_info:
                context_parts.append(f"Project: {project_info.get('name', 'Unknown')}")
                if project_info.get('description'):
                    context_parts.append(f"Description: {project_info['description']}")
        
        # Add recent memory snippets
        recent_learnings = memory.get("recent_learnings", [])[-5:]  # Last 5 learnings
        if recent_learnings:
            context_parts.append("Recent Learnings:")
            for learning in recent_learnings:
                context_parts.append(f"- {learning}")
        
        # Add session context
        session_context = self.contexts.get(session_id)
        if session_context:
            if session_context.recent_tools:
                context_parts.append(f"Recent Tools Used: {', '.join(session_context.recent_tools[-3:])}")
        
        # Build system prompt
        context_str = "\n".join(context_parts) if context_parts else ""
        system_prompt = template.system_prompt
        if context_str:
            system_prompt += f"\n\nCurrent Context:\n{context_str}"
        
        # Build message history
        messages: List[MessageParam] = []
        if session_context and session_context.conversation_history:
            # Include recent conversation history (last 10 messages)
            messages.extend(session_context.conversation_history[-10:])
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        return system_prompt, messages

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((Exception,))
    )
    async def send_message_async(
        self,
        message: str,
        session_id: str,
        template_name: str = "general_assistant",
        additional_context: Optional[Dict[str, Any]] = None,
        tools: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Send async message to Claude with intelligent context"""
        
        start_time = time.time()
        
        try:
            # Create contextualized prompt
            system_prompt, messages = self.create_context_prompt(
                template_name, message, session_id, additional_context
            )
            
            # Estimate input tokens
            input_text = system_prompt + "\n".join([msg["content"] for msg in messages if isinstance(msg["content"], str)])
            input_tokens = self.estimate_tokens(input_text)
            
            # Prepare request parameters
            template = self.prompt_templates[template_name]
            request_params = {
                "model": self.model,
                "max_tokens": template.max_tokens,
                "temperature": template.temperature,
                "system": system_prompt,
                "messages": messages
            }
            
            if tools:
                request_params["tools"] = tools
            
            # Make API call
            logger.info("Sending Claude API request", 
                       session_id=session_id, 
                       template=template_name,
                       input_tokens=input_tokens)
            
            response = await self.async_client.messages.create(**request_params)
            
            # Process response
            response_text = ""
            tool_uses = []
            
            for content_block in response.content:
                if isinstance(content_block, TextBlock):
                    response_text += content_block.text
                elif isinstance(content_block, ToolUseBlock):
                    tool_uses.append({
                        "name": content_block.name,
                        "input": content_block.input
                    })
            
            # Update metrics
            output_tokens = response.usage.output_tokens
            self.metrics.total_requests += 1
            self.metrics.total_tokens_input += input_tokens
            self.metrics.total_tokens_output += output_tokens
            self.metrics.total_cost_usd += self.estimate_cost(input_tokens, output_tokens)
            self.metrics.last_request = datetime.now()
            
            # Update conversation context
            if session_id not in self.contexts:
                self.contexts[session_id] = ConversationContext(session_id=session_id)
            
            context = self.contexts[session_id]
            context.conversation_history.append({"role": "user", "content": message})
            context.conversation_history.append({"role": "assistant", "content": response_text})
            context.updated_at = datetime.now()
            
            if tool_uses:
                tool_names = [tool["name"] for tool in tool_uses]
                context.recent_tools.extend(tool_names)
                context.recent_tools = context.recent_tools[-10:]  # Keep last 10
            
            # Update memory with learnings
            self._extract_and_store_learnings(message, response_text, session_id)
            
            execution_time = time.time() - start_time
            
            logger.info("Claude API request completed",
                       session_id=session_id,
                       execution_time=execution_time,
                       input_tokens=input_tokens,
                       output_tokens=output_tokens,
                       cost_usd=self.estimate_cost(input_tokens, output_tokens))
            
            return {
                "response": response_text,
                "tool_uses": tool_uses,
                "usage": {
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_tokens": input_tokens + output_tokens
                },
                "execution_time": execution_time,
                "session_id": session_id
            }
            
        except Exception as e:
            self.metrics.errors += 1
            logger.error("Claude API request failed", 
                        session_id=session_id,
                        error=str(e),
                        execution_time=time.time() - start_time)
            raise

    def send_message(
        self,
        message: str,
        session_id: str,
        template_name: str = "general_assistant",
        additional_context: Optional[Dict[str, Any]] = None,
        tools: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Synchronous wrapper for async message sending"""
        return asyncio.run(self.send_message_async(
            message, session_id, template_name, additional_context, tools
        ))

    def _extract_and_store_learnings(self, user_message: str, response: str, session_id: str) -> None:
        """Extract key learnings from conversation and store in memory"""
        try:
            # Simple learning extraction - could be enhanced with NLP
            if any(keyword in user_message.lower() for keyword in ["how", "why", "what", "explain"]):
                learning = f"Q: {user_message[:100]}... A: {response[:200]}..."
                
                memory = self.load_memory_context()
                if "recent_learnings" not in memory:
                    memory["recent_learnings"] = []
                
                memory["recent_learnings"].append({
                    "timestamp": datetime.now().isoformat(),
                    "session_id": session_id,
                    "learning": learning
                })
                
                # Keep only last 50 learnings
                memory["recent_learnings"] = memory["recent_learnings"][-50:]
                
                self.update_memory_context(memory)
                
        except Exception as e:
            logger.error("Failed to extract learnings", error=str(e))

    async def stream_message_async(
        self,
        message: str,
        session_id: str,
        template_name: str = "general_assistant",
        additional_context: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response from Claude API"""
        
        system_prompt, messages = self.create_context_prompt(
            template_name, message, session_id, additional_context
        )
        
        template = self.prompt_templates[template_name]
        
        async with self.async_client.messages.stream(
            model=self.model,
            max_tokens=template.max_tokens,
            temperature=template.temperature,
            system=system_prompt,
            messages=messages
        ) as stream:
            full_response = ""
            async for text in stream.text_stream:
                full_response += text
                yield text
            
            # Update context after streaming completes
            if session_id not in self.contexts:
                self.contexts[session_id] = ConversationContext(session_id=session_id)
            
            context = self.contexts[session_id]
            context.conversation_history.append({"role": "user", "content": message})
            context.conversation_history.append({"role": "assistant", "content": full_response})
            context.updated_at = datetime.now()

    def get_usage_metrics(self) -> Dict[str, Any]:
        """Get current API usage metrics"""
        return {
            **asdict(self.metrics),
            "average_cost_per_request": (
                self.metrics.total_cost_usd / max(self.metrics.total_requests, 1)
            ),
            "tokens_per_dollar": (
                (self.metrics.total_tokens_input + self.metrics.total_tokens_output) / 
                max(self.metrics.total_cost_usd, 0.001)
            )
        }

    def reset_session_context(self, session_id: str) -> None:
        """Reset conversation context for a session"""
        if session_id in self.contexts:
            del self.contexts[session_id]
        logger.info("Session context reset", session_id=session_id)

    def cleanup_old_contexts(self, max_age_hours: int = 24) -> None:
        """Clean up old conversation contexts"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        old_sessions = [
            session_id for session_id, context in self.contexts.items()
            if context.updated_at < cutoff_time
        ]
        
        for session_id in old_sessions:
            del self.contexts[session_id]
        
        logger.info("Cleaned up old contexts", removed_count=len(old_sessions))


# Multi-agent orchestration system
class AgentOrchestrator:
    """Coordinates multiple specialized AI agents"""
    
    def __init__(self, claude_client: ClaudeAPIClient):
        self.claude = claude_client
        self.agents = {
            "architect": "architect",
            "reviewer": "code_reviewer", 
            "assistant": "general_assistant"
        }
    
    async def coordinate_task(
        self,
        task_description: str,
        session_id: str,
        required_agents: List[str],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Coordinate multiple agents to complete a complex task"""
        
        results = {}
        
        for agent_name in required_agents:
            if agent_name not in self.agents:
                continue
                
            template_name = self.agents[agent_name]
            
            # Customize task for specific agent
            agent_task = f"As a {agent_name}, please help with: {task_description}"
            
            # Add context from previous agents
            if results:
                previous_work = "\n".join([
                    f"{prev_agent}: {prev_result.get('response', '')[:200]}..."
                    for prev_agent, prev_result in results.items()
                ])
                agent_task += f"\n\nPrevious agent work:\n{previous_work}"
            
            # Get agent response
            result = await self.claude.send_message_async(
                agent_task, 
                f"{session_id}_{agent_name}",
                template_name,
                context
            )
            
            results[agent_name] = result
        
        return results


if __name__ == "__main__":
    # Example usage
    async def main():
        client = ClaudeAPIClient()
        
        # Simple conversation
        response = await client.send_message_async(
            "Explain the benefits of using TypeScript in a React project",
            session_id="demo_session"
        )
        
        print("Response:", response["response"])
        print("Usage:", response["usage"])
        
        # Multi-agent coordination
        orchestrator = AgentOrchestrator(client)
        
        results = await orchestrator.coordinate_task(
            "Design a scalable microservices architecture for an e-commerce platform",
            "architecture_session",
            ["architect", "reviewer"],
            {"project": {"name": "E-commerce Platform", "description": "Online marketplace"}}
        )
        
        for agent, result in results.items():
            print(f"\n{agent.upper()}:")
            print(result["response"][:300] + "...")
    
    asyncio.run(main())