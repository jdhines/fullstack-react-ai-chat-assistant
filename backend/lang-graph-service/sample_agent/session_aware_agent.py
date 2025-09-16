"""
Custom LangGraph agent wrapper that handles automatic session restoration
based on recent conversation activity for CopilotKit integration.
"""
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from langchain_core.runnables import RunnableConfig
from copilotkit import LangGraphAgent
from .conversation_aware_checkpointer import ConversationAwareMongoCheckpointer


class SessionAwareLangGraphAgent(LangGraphAgent):
    """
    LangGraph agent that automatically handles session restoration based on recent activity.

    If a user has a conversation within the last 3 hours, it restores that session.
    Otherwise, it creates a new conversation thread.
    """

    def __init__(self, checkpointer: ConversationAwareMongoCheckpointer, hours_threshold: int = 3, **kwargs):
        """
        Initialize the session-aware agent.

        Args:
            checkpointer: MongoDB checkpointer instance
            hours_threshold: Hours to look back for recent conversations (default: 3)
            **kwargs: Other arguments passed to LangGraphAgent
        """
        super().__init__(**kwargs)
        self.checkpointer = checkpointer
        self.hours_threshold = hours_threshold

    async def _ensure_thread_id(self, config: RunnableConfig) -> RunnableConfig:
        """
        Ensure a thread_id exists in config.
        New strategy: Each user has exactly one persistent conversation.
        """
        configurable = config.get("configurable", {})

        # Try to get user_id from different possible locations
        user_id = (
            configurable.get("user_id") or
            config.get("user_id") or
            configurable.get("userId") or
            config.get("userId")
        )

        # If no user_id provided, create a new thread (anonymous session)
        if not user_id:
            new_thread_id = str(uuid.uuid4())
            config["configurable"] = {
                **configurable, "thread_id": new_thread_id}
            return config

        # Get or create the user's single conversation
        thread_id = await self.checkpointer.get_or_create_user_conversation(user_id)

        # Clean up any duplicate conversations for this user (maintenance)
        await self.checkpointer.cleanup_old_conversations(user_id)

        config["configurable"] = {
            **configurable,
            "thread_id": thread_id,
            "user_id": user_id
        }

        return config

    async def ainvoke(self, input_data: Dict[str, Any], config: Optional[RunnableConfig] = None, **kwargs) -> Any:
        """
        Async invoke with automatic session management.
        """
        if config is None:
            config = {}

        # Ensure thread_id exists (restore recent or create new)
        config = await self._ensure_thread_id(config)

        # Call the parent's ainvoke method
        return await super().ainvoke(input_data, config, **kwargs)

    def invoke(self, input_data: Dict[str, Any], config: Optional[RunnableConfig] = None, **kwargs) -> Any:
        """
        Sync invoke with automatic session management.
        """
        import asyncio

        if config is None:
            config = {}

        # Handle async session management in sync context
        try:
            loop = asyncio.get_event_loop()
            config = loop.run_until_complete(self._ensure_thread_id(config))
        except RuntimeError:
            # If no event loop is running, create a new one
            config = asyncio.run(self._ensure_thread_id(config))

        # Call the parent's invoke method
        return super().invoke(input_data, config, **kwargs)

    async def astream(self, input_data: Dict[str, Any], config: Optional[RunnableConfig] = None, **kwargs):
        """
        Async stream with automatic session management.
        """

        if config is None:
            config = {}

        # Ensure thread_id exists (restore recent or create new)
        config = await self._ensure_thread_id(config)

        # Call the parent's astream method
        async for chunk in super().astream(input_data, config, **kwargs):
            yield chunk

    def stream(self, input_data: Dict[str, Any], config: Optional[RunnableConfig] = None, **kwargs):
        """
        Sync stream with automatic session management.
        """
        import asyncio

        if config is None:
            config = {}

        # Handle async session management in sync context
        try:
            loop = asyncio.get_event_loop()
            config = loop.run_until_complete(self._ensure_thread_id(config))
        except RuntimeError:
            # If no event loop is running, create a new one
            config = asyncio.run(self._ensure_thread_id(config))

        # Call the parent's stream method
        for chunk in super().stream(input_data, config, **kwargs):
            yield chunk
