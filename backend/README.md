# 👋 Minimal CopilotKit + LangGraph Dojo

Get all AG-UI features betwen langgraph and copilotkit working with minimal cloud/framework dependencies.

## Project Structure

- `react-client`: The frontend React application
- `copilot-runtime-service`: The CopilotKit runtime service
- `lang-graph-service`: The LangGraph agent service

```sh
[react-client]
      |
[copilot-runtime-service]
      |
[lang-graph-service]
```

## Setup

1. **Copy and update environment variables:**

   ```sh
   cp lang-graph-service/.env.example lang-graph-service/.env
   ```

   Edit lang-graph-service/.env and set your variables:

   ```env
   #Mongodb setup
   MONGODB_CONNECTION_STRING=mongodb://localhost:27017

   # Server config
   PORT=8000
   # Azure OpenAI Configuration
   AZURE_OPENAI_API_KEY=your_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_MODEL=gpt-4o-mini
   AZURE_OPENAI_API_VERSION=2025-01-01-preview
   ```

2. **Create a Python virtual environment**

   ```sh
      python -m venv .venv
      . ./.venv/Scripts/activate
      # use command deactivate to get out of the venv when you want
   ```

3. **Install poetry**
   Install the poetry package manager for python. [See how](https://python-poetry.org/docs/#installing-with-the-official-installer).


4. **Install dependencies for runtime and backend**

   Open a new terminal tab (or shell) for each service.

   **CopilotKit Runtime:**

   ```sh
      cd ../copilot-runtime-service && npm install
      npm run dev
   ```

   **Backend (FastAPI with LangGraph and CopilotKit):**

   ```sh
      cd ../lang-graph-servicereact-client && poetry install
      npm run dev
   ```

   **MongoDB (must have Docker desktop running):**

   ```bash
   docker run -d --name mongodb -p 27017:27017 mongo:latest
   ```

   Or use Docker Compose:

   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
   mongodb:
      image: mongo:latest
      ports:
         - "27017:27017"
      volumes:
         - mongodb_data:/data/db

   volumes:
   mongodb_data:
   ```

- Copilot runtime: http://localhost:4000/copilotkit
- LangGraph agent: http://localhost:8000/copilotkit

## How It Works
1. **New Chat**: When CopilotKit runtime starts a chat, only provide `user_id` (no `thread_id`)
2. **Session Check**: System checks for conversations within the last 3 hours
3. **Restore or Create**:
   - If recent conversation found → restores that session
   - If no recent activity → creates new conversation thread
4. **Seamless Experience**: User continues where they left off

### Configuration
- **Time Threshold**: 3 hours (configurable)
- **Per-User Isolation**: Each user's sessions are independent
- **Automatic Cleanup**: Old sessions naturally age out

### Example Behavior
```
User starts chat → System checks last activity
├── Last message < 3 hours ago → Restore session ABC123
└── Last message > 3 hours ago → Create new session XYZ789
```

## Database Schema

The MongoDB collection stores **one document per conversation thread** with this structure:

```json
{
  "_id": "ObjectId",
  "thread_id": "uuid4-string",
  "user_id": "user123",
  "checkpoint_id": "latest-checkpoint-uuid",
  "checkpoint_ns": "timestamp",
  "checkpoint": {
    "v": 1,
    "ts": "timestamp",
    "id": "checkpoint-id",
    "channel_values": {
      "messages": [...],  // All conversation messages
      "agent_state": {...}  // Current agent state
    },
    "channel_versions": {...},
    "versions_seen": {...},
    "pending_sends": []
  },
  "metadata": {
    "source": "input",
    "step": 1,
    "writes": {...},
    "parents": {...}
  },
  "created_at": "2025-07-15T10:30:00Z",  // When conversation started
  "updated_at": "2025-07-15T10:30:00Z"   // Last message timestamp
}
```

**Key Design Decision**: Only the **latest checkpoint** is stored per conversation. Each new message/interaction replaces the entire document, keeping the database size manageable while preserving the complete conversation state.

## Storage Efficiency

### Latest Checkpoint Only
This implementation saves **only the latest checkpoint** per conversation, not every intermediate state. This provides several benefits:

- **Database Size**: Prevents exponential growth from storing every checkpoint
- **Performance**: Faster queries with one document per conversation
- **Cost Effective**: Minimal storage requirements, perfect for production
- **Clean State**: Complete conversation state in a single document

### What Gets Saved
- ✅ **Complete conversation history** (all messages)
- ✅ **Current agent state** (context, variables, etc.)
- ✅ **Session metadata** (user_id, timestamps)
- ❌ **Intermediate checkpoints** (only latest state)

For most chat applications, you only need the current state to continue conversations, making this approach ideal.

## Migration to CosmosDB

When moving to production with CosmosDB:

1. **Connection String**: Update `MONGODB_CONNECTION_STRING` to CosmosDB connection string
2. **API Compatibility**: CosmosDB supports MongoDB API, so minimal code changes needed
3. **Indexing**: CosmosDB has different indexing - update the `ensure_indexes()` method
4. **Scaling**: Configure CosmosDB throughput and partitioning as needed

## API

Open the Swagger API page at http://localhost:8000/docs to play with the endpoints.

### Chat with CopilotKit

- **POST** `/copilotkit` - Main CopilotKit endpoint for chat interactions

### Conversation Management

- **GET** `/conversations/{user_id}` - See if there are any conversations for a user
- **GET** `/conversations/{thread_id}` - Get messages for a conversation
- **POST** `/conversations` - Create a new conversation
- **DELETE** `/conversations/{thread_id}` - Delete a conversation

### Session Management

- **GET** `/session/{user_id}` - Check session status and recent activity

### Health Check

- **GET** `/health` - Server health status

## Manual querying in MongoDB

1. Run the `mongosh` command in the running container:

   `docker exec -it mongodb mongosh`

2. Connect to the DB

```bash
   # List databases
   show dbs

   # Use the chat database
   use chatdb

   # List collections
   show collectionss
```

3. Query away

```bash

   # See all conversations:
   db.conversations.find().pretty()
   # Count total conversations:
   db.conversations.countDocuments()
   # Find conversations for your specific user:
   db.conversations.find({"userId": "beware-the-krakken-1234"}).pretty()
   # Get just the messages from conversations:
   db.conversations.find( {"userId": "beware-the-krakken-1234"}, {"messages": 1}).pretty()
   # Check the most recent conversation:
   db.conversations.find({"userId": "beware-the-krakken-1234"}).sort({"lastUpdated": -1}).limit(1).pretty()
   # Check checkpoint data structure:
   db.conversations.find( {"userId": "beware-the-krakken-1234"}, {"checkpoint": 1, "id": 1}).pretty()
```

## Contributing

This repo was cloned from [minimal-copilotkit-langgraph](https://github.com/jrhicks/minimal-copilotkit-langgraph). Open any PRs there. You can find many examples at: https://github.com/CopilotKit/CopilotKit/tree/main/examples

---

## License

MIT
