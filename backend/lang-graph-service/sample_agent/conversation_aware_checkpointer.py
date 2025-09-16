"""
Enhanced MongoDB checkpointer that follows CosmosDB/chat application best practices.
This version optimizes for the conversation-centric data model while maintaining LangGraph compatibility.
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from langgraph.checkpoint.base import BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple
from langchain_core.runnables import RunnableConfig

logger = logging.getLogger(__name__)


def serialize_for_mongodb(obj: Any) -> Any:
    """
    Recursively serialize objects for MongoDB storage.

    Handles LangChain messages and other complex objects that can't be directly stored in MongoDB.
    """
    if hasattr(obj, '__dict__'):
        # If it's a complex object (like LangChain messages), convert to dict
        if hasattr(obj, 'content') and hasattr(obj, 'type'):
            # LangChain message object
            return {
                "_type": obj.__class__.__name__,
                "content": obj.content,
                "type": obj.type,
                "additional_kwargs": getattr(obj, 'additional_kwargs', {}),
                "response_metadata": getattr(obj, 'response_metadata', {}),
                "id": getattr(obj, 'id', None)
            }
        else:
            # General object serialization
            result = {"_type": obj.__class__.__name__}
            result.update({k: serialize_for_mongodb(v)
                          for k, v in obj.__dict__.items()})
            return result
    elif isinstance(obj, dict):
        return {k: serialize_for_mongodb(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [serialize_for_mongodb(item) for item in obj]
    elif isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    elif isinstance(obj, datetime):
        return obj
    else:
        # For any other type, try to convert to string as a fallback
        try:
            return str(obj)
        except Exception:
            return f"<unserializable: {type(obj).__name__}>"


def deserialize_from_mongodb(obj: Any) -> Any:
    """
    Recursively deserialize objects from MongoDB storage.

    Reconstructs LangChain messages and other complex objects from serialized format.
    """
    if isinstance(obj, dict) and "_type" in obj:
        obj_type = obj["_type"]
        if obj_type in ["HumanMessage", "AIMessage", "SystemMessage"]:
            # Reconstruct LangChain message
            from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
            message_classes = {
                "HumanMessage": HumanMessage,
                "AIMessage": AIMessage,
                "SystemMessage": SystemMessage
            }
            message_class = message_classes.get(obj_type, HumanMessage)
            return message_class(
                content=obj.get("content", ""),
                additional_kwargs=obj.get("additional_kwargs", {}),
                response_metadata=obj.get("response_metadata", {}),
                id=obj.get("id")
            )
        else:
            # General object reconstruction (return as dict for now)
            result = {k: deserialize_from_mongodb(
                v) for k, v in obj.items() if k != "_type"}
            return result
    elif isinstance(obj, dict):
        return {k: deserialize_from_mongodb(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [deserialize_from_mongodb(item) for item in obj]
    else:
        return obj


class ConversationAwareMongoCheckpointer(BaseCheckpointSaver):
    """
    MongoDB checkpointer optimized for chat applications following CosmosDB best practices.

    Key Design Principles:
    - One document per conversation (session/thread)
    - User-centric partitioning for data isolation
    - Conversation-focused structure with embedded LangGraph state
    - Efficient queries for session restoration
    """

    def __init__(self, connection_string: str, database_name: str = "chatdb", collection_name: str = "conversations"):
        """
        Initialize MongoDB checkpointer.

        Args:
            connection_string: MongoDB connection string
            database_name: Name of the database
            collection_name: Name of the collection to store conversations
        """
        self.client = AsyncIOMotorClient(connection_string)
        self.db = self.client[database_name]
        self.collection: AsyncIOMotorCollection = self.db[collection_name]

    async def ensure_indexes(self):
        """Create indexes optimized for chat application queries."""
        # Primary: userId + thread_id for point reads (equivalent to partition key + id in CosmosDB)
        await self.collection.create_index([("userId", 1), ("id", 1)], unique=True)

        # For session restoration: userId + lastUpdated for finding recent conversations
        await self.collection.create_index([("userId", 1), ("lastUpdated", -1)])

        # For time-based queries
        await self.collection.create_index([("lastUpdated", -1)])

    def get(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        """Get the latest checkpoint for a thread (sync wrapper)."""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.aget_tuple(config))
        except RuntimeError:
            return asyncio.run(self.aget_tuple(config))

    def aget(self, config: RunnableConfig):
        """Get the latest checkpoint for a thread (async)."""
        return self.aget_tuple(config)

    async def aget_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        """Async implementation of get_tuple - point read using userId + sessionId."""
        thread_id = config["configurable"]["thread_id"]
        user_id = config["configurable"].get("user_id")

        # Point read: most efficient query (equivalent to CosmosDB point read)
        query = {"id": thread_id}
        if user_id:
            query["userId"] = user_id

        doc = await self.collection.find_one(query)

        if not doc:
            return None

        # Extract LangGraph checkpoint from conversation document
        checkpoint_data = doc.get("checkpoint", {})
        if not checkpoint_data:
            return None

        # Reconstruct channel_values from stored messages + other channel data
        stored_channel_values = deserialize_from_mongodb(
            checkpoint_data.get("channel_values", {}))

        # Reconstruct LangGraph messages from our clean messages array
        messages_array = doc.get("messages", [])
        langgraph_messages = []

        for msg in messages_array:
            from langchain_core.messages import HumanMessage, AIMessage
            if msg.get("role") == "user":
                langgraph_messages.append(HumanMessage(
                    content=msg.get("content", ""),
                    id=f"msg-{len(langgraph_messages)}"
                ))
            elif msg.get("role") == "assistant":
                langgraph_messages.append(AIMessage(
                    content=msg.get("content", ""),
                    id=f"msg-{len(langgraph_messages)}"
                ))

        # Combine reconstructed messages with other channel data
        channel_values = {
            "messages": langgraph_messages,
            **stored_channel_values  # Add any other channel data that was stored
        }

        checkpoint = Checkpoint(
            v=checkpoint_data.get("v", 1),
            ts=checkpoint_data.get("ts", ""),
            id=checkpoint_data.get("id", ""),
            channel_values=channel_values,
            channel_versions={},  # Minimal - not needed for basic chat
            versions_seen={},     # Minimal - not needed for basic chat
            pending_sends=[]      # Minimal - not needed for basic chat
        )

        # Get writes from stored checkpoint data, with a safe default
        stored_writes = checkpoint_data.get("writes", {})

        # Deserialize writes if they exist, otherwise provide a default
        if stored_writes:
            try:
                stored_writes = deserialize_from_mongodb(stored_writes)
            except Exception:
                # If deserialization fails, use safe default
                stored_writes = {"chat_node": "completed"}
        else:
            stored_writes = {"chat_node": "completed"}

        # Ensure writes is never empty for CopilotKit compatibility
        if not stored_writes:
            stored_writes = {"chat_node": "completed"}

        metadata = CheckpointMetadata(
            source=checkpoint_data.get("source", "input"),
            step=checkpoint_data.get(
                "step", -1) if checkpoint_data.get("step") is not None else -1,
            writes=stored_writes,
            parents={}   # Minimal - not needed for basic chat
        )

        return CheckpointTuple(
            config=config,
            checkpoint=checkpoint,
            metadata=metadata,
            parent_config=None
        )

    def list(self, config: RunnableConfig, *, filter: Optional[Dict[str, Any]] = None, before: Optional[RunnableConfig] = None, limit: Optional[int] = None) -> List[CheckpointTuple]:
        """List checkpoints for a thread (sync wrapper)."""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.alist(config, filter=filter, before=before, limit=limit))
        except RuntimeError:
            return asyncio.run(self.alist(config, filter=filter, before=before, limit=limit))

    async def alist(self, config: RunnableConfig, *, filter: Optional[Dict[str, Any]] = None, before: Optional[RunnableConfig] = None, limit: Optional[int] = None) -> List[CheckpointTuple]:
        """List checkpoints for a thread (async) - for this chat model, we only have one checkpoint per thread."""
        # Get the single conversation document
        checkpoint_tuple = await self.aget_tuple(config)
        return [checkpoint_tuple] if checkpoint_tuple else []

    def put(self, config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata, new_versions: Dict[str, Any]) -> RunnableConfig:
        """Save a checkpoint (sync wrapper)."""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.aput(config, checkpoint, metadata, new_versions))
        except RuntimeError:
            return asyncio.run(self.aput(config, checkpoint, metadata, new_versions))

    async def aput(self, config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata, new_versions: Dict[str, Any]) -> RunnableConfig:
        """Save checkpoint in conversation-centric document structure."""
        thread_id = config["configurable"]["thread_id"]
        user_id = config["configurable"].get("user_id")

        # Debug logging for checkpoint and metadata types
        logger.debug(
            f"aput called with checkpoint type: {type(checkpoint)}, metadata type: {type(metadata)}")

        # Ensure metadata has proper defaults
        if metadata is None:
            # Create a default metadata if none provided
            from langgraph.checkpoint.base import CheckpointMetadata
            metadata = CheckpointMetadata(
                source="input", step=-1, writes={"chat_node": "completed"}, parents={})

        # Handle both dict and CheckpointMetadata formats and ensure writes is serializable
        if isinstance(metadata, dict):
            # If metadata is a dict, ensure writes key exists and is not empty
            if not metadata.get('writes'):
                metadata['writes'] = {"chat_node": "completed"}
            else:
                # Serialize the writes data to ensure MongoDB compatibility
                metadata['writes'] = serialize_for_mongodb(metadata['writes'])
        else:
            # If metadata is a CheckpointMetadata object, ensure writes is never empty
            if not getattr(metadata, 'writes', None):
                metadata.writes = {"chat_node": "completed"}
            else:
                # Serialize the writes data to ensure MongoDB compatibility
                metadata.writes = serialize_for_mongodb(metadata.writes)

        # Handle both dict and Checkpoint object formats
        if isinstance(checkpoint, dict):
            # Checkpoint passed as dictionary
            channel_values = checkpoint.get("channel_values", {})
            checkpoint_v = checkpoint.get("v")
            checkpoint_ts = checkpoint.get("ts")
            checkpoint_id = checkpoint.get("id")
            checkpoint_channel_versions = checkpoint.get(
                "channel_versions", {})
            checkpoint_versions_seen = checkpoint.get("versions_seen", {})
            checkpoint_pending_sends = checkpoint.get("pending_sends", [])
        else:
            # Checkpoint passed as object
            channel_values = checkpoint.channel_values or {}
            checkpoint_v = checkpoint.v
            checkpoint_ts = checkpoint.ts
            checkpoint_id = checkpoint.id
            checkpoint_channel_versions = checkpoint.channel_versions
            checkpoint_versions_seen = checkpoint.versions_seen
            checkpoint_pending_sends = checkpoint.pending_sends

        # Extract messages from checkpoint for conversation view
        messages = []
        raw_messages = channel_values.get("messages", [])

        # Convert LangGraph messages to conversation format
        for msg in raw_messages:
            if hasattr(msg, 'content') and hasattr(msg, 'type'):
                role = "user" if msg.type == "human" else "assistant"
                messages.append({
                    "role": role,
                    "content": msg.content,
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                })

        current_time = datetime.utcnow()

        # Create conversation document following CosmosDB chat best practices
        conversation_doc = {
            "id": thread_id,                    # sessionId (document ID)
            "userId": user_id,                  # partition key equivalent
            "lastUpdated": current_time,        # for session expiration logic
            # clean conversation history (primary source)
            "messages": messages,
            "checkpoint": {                     # minimal LangGraph state for resumption
                "v": checkpoint_v,
                "ts": checkpoint_ts,
                "id": checkpoint_id,
                # Store only non-message channel data to avoid duplication
                "channel_values": {k: serialize_for_mongodb(v) for k, v in channel_values.items() if k != "messages"},
                # Essential metadata for debugging and CopilotKit compatibility
                "source": metadata.get('source', 'input') if isinstance(metadata, dict) else getattr(metadata, 'source', 'input'),
                "step": (metadata.get('step', -1) if metadata.get('step') is not None else -1) if isinstance(metadata, dict) else (getattr(metadata, 'step', -1) if getattr(metadata, 'step', None) is not None else -1),
                # Store writes to prevent CopilotKit errors - ensure it's never empty and serialized
                "writes": serialize_for_mongodb((metadata.get('writes', {}) or {"chat_node": "completed"}) if isinstance(metadata, dict) else (getattr(metadata, 'writes', {}) or {"chat_node": "completed"})),
            },
            "new_versions": new_versions
        }

        # Set createdAt only for new conversations
        existing_doc = await self.collection.find_one({"id": thread_id, "userId": user_id})
        if not existing_doc:
            conversation_doc["createdAt"] = current_time

        # Upsert conversation document (atomic replace)
        await self.collection.replace_one(
            {"id": thread_id, "userId": user_id},
            conversation_doc,
            upsert=True
        )

        return config

    async def aput_writes(self, config: RunnableConfig, writes: List[Tuple[str, Any]], task_id: str) -> None:
        """
        Store intermediate writes (required by LangGraph).
        For chat applications, we don't need to store intermediate writes separately
        since we only keep the final state.
        """
        # For chat applications, we can safely ignore intermediate writes
        # since we only store the final conversation state
        pass

    def put_writes(self, config: RunnableConfig, writes: List[Tuple[str, Any]], task_id: str) -> None:
        """Store intermediate writes (sync wrapper)."""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.aput_writes(config, writes, task_id))
        except RuntimeError:
            return asyncio.run(self.aput_writes(config, writes, task_id))

    async def get_conversations_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all conversations for a user, optimized query pattern."""
        # Query scoped to single user (efficient partition scan)
        cursor = self.collection.find(
            {"userId": user_id}
        ).sort("lastUpdated", -1).limit(limit)

        conversations = []
        async for doc in cursor:
            conversations.append({
                "thread_id": doc["id"],
                "user_id": doc["userId"],
                "last_updated": doc["lastUpdated"],
                "created_at": doc.get("createdAt", doc["lastUpdated"]),
                "message_count": len(doc.get("messages", [])),
                "messages": doc.get("messages", []),
                "first_message_preview": doc.get("messages", [{}])[0] if doc.get("messages") else None
            })

        return conversations

    async def get_recent_active_conversation(self, user_id: str, hours_threshold: int = 3) -> Optional[str]:
        """
        Get the single conversation for this user.

        One conversation per user that persists indefinitely.
        If conversation exists but is older than threshold, it will be reused (not deleted).

        Returns the thread_id of the user's conversation, or None if no conversation exists.
        """
        # Find any conversation for this user (ignore time threshold for now)
        doc = await self.collection.find_one(
            {"userId": user_id},
            # Get the most recent one if multiple exist
            sort=[("lastUpdated", -1)]
        )

        if doc:
            return doc["id"]

        return None

    async def get_or_create_user_conversation(self, user_id: str) -> str:
        """
        Get the user's single conversation thread_id, or create one if it doesn't exist.
        This ensures each user has exactly one conversation that persists over time.
        """
        # Check if user already has a conversation
        doc = await self.collection.find_one(
            {"userId": user_id},
            sort=[("lastUpdated", -1)]
        )

        if doc:
            return doc["id"]

        # Create a new thread_id for this user
        # Use a deterministic format: user-{user_id} to make it predictable
        thread_id = f"user-{user_id}"

        # Note: The conversation document will be created when the first message is saved
        return thread_id

    async def cleanup_old_conversations(self, user_id: str):
        """
        Clean up any extra conversations for a user, keeping only the most recent one.
        This is a maintenance operation to fix any existing duplicate conversations.
        """
        conversations = await self.collection.find(
            {"userId": user_id},
            sort=[("lastUpdated", -1)]
        ).to_list(length=None)

        if len(conversations) <= 1:
            return  # Nothing to clean up

        # Keep the most recent conversation, delete the rest
        keep_conversation = conversations[0]
        delete_conversations = conversations[1:]

        for conv in delete_conversations:
            await self.collection.delete_one({"_id": conv["_id"]})

        print(
            f"Cleaned up {len(delete_conversations)} old conversations for user {user_id}, kept {keep_conversation['id']}")

    async def delete_conversation(self, thread_id: str) -> bool:
        """Delete a conversation - point delete operation."""
        result = await self.collection.delete_one({
            "id": thread_id
        })
        return result.deleted_count > 0

    async def close(self):
        """Close the MongoDB connection."""
        self.client.close()
