# Fullstack AI Chat Assistant

A modern fullstack AI chat assistant application featuring persistent conversations, session restoration, and a beautiful React-based interface.

## 🛠 Technology Stack

![Tech stack diagram](./docs/tech-stack.png)

### Frontend

- **React 18** - Modern React with hooks and concurrent features
- **TanStack Router** - Type-safe routing and navigation
- **TanStack Query** - Data fetching and state management
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server

### AI Integration

- **CopilotKit** - AI assistant UI components and runtime
- **LangGraph** - Agent workflow orchestration
- **Azure OpenAI** - GPT-4 language model integration

### Backend

- **FastAPI** - High-performance Python API framework
- **MongoDB** - Document database for conversation persistence
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation and serialization

## ✨ Key Features

- 🗣 **Persistent Conversations** - Chat history saved to MongoDB with automatic session restoration
- 👤 **Single Conversation Per User** - Each user maintains one continuous conversation thread
- 🔄 **Session Restoration** - Conversations automatically restore on page refresh
- 🎨 **Modern UI** - Beautiful, responsive chat interface built with React and Tailwind
- 🚀 **Real-time Streaming** - Live AI responses with CopilotKit's streaming capabilities
- 🛡 **Type Safety** - Full TypeScript support across frontend and backend
- 📱 **Mobile Friendly** - Responsive design that works on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB instance (local or cloud)
- Azure OpenAI API access

### 1. Clone and Setup Environment

```bash
git clone <repository-url> fullstack-ai-chat
cd fullstack-ai-chat
```

### 2. Backend Setup

```bash
cd backend/lang-graph-service
cp .env.example .env
# Edit .env with your MongoDB and Azure OpenAI credentials
python -m venv .venv
source .venv/Scripts/activate  # Windows: .venv\Scripts\activate
pip install poetry
poetry install
```

### 3. Frontend Setup

```bash
cd client
npm install
```

### 4. Start Services

```bash
# Terminal 1: Start LangGraph service
cd backend/lang-graph-service
poetry run python server.py

# Terminal 2: Start CopilotKit runtime
cd backend/copilot-runtime-service
npm install && npm start

# Terminal 3: Start React client
cd client
npm start
```

The application will be available at:

- **Frontend**: <http://localhost:3000>
- **CopilotKit Runtime**: <http://localhost:4000>
- **LangGraph API**: <http://localhost:8000>

## 📚 Documentation

- **Frontend Documentation**: [client/README.md](./client/README.md)
  - React components, routing, styling, and testing
- **Backend Documentation**: [backend/README.md](./backend/README.md)
  - API endpoints, MongoDB setup, and deployment

## 🏗 Project Structure

```text
/
├── README.md                          # This file
├── client/                            # React frontend application
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Page components
│   │   ├── routes/                   # TanStack Router routes
│   │   └── providers/                # React context providers
│   └── README.md                     # Frontend documentation
├── backend/
│   ├── copilot-runtime-service/      # CopilotKit runtime service
│   └── lang-graph-service/           # LangGraph agent service
│       ├── server.py                 # FastAPI server
│       ├── sample_agent/             # AI agent implementation
│       └── README.md                 # Backend documentation
└── docs/                             # Additional documentation
```

## 🔧 Configuration

### Environment Variables

The application requires configuration for:

- **MongoDB Connection**: For conversation persistence
- **Azure OpenAI**: For AI model access
- **CORS Settings**: For frontend-backend communication

See the backend documentation for detailed configuration instructions.

## 🚀 Deployment

This application is designed for easy deployment to:

- **Azure Container Apps** - For scalable container deployment
- **Azure App Service** - For traditional web app hosting
- **Docker** - Using the provided Dockerfiles

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support or questions:

- Check the [client README](./client/README.md) for frontend issues
- Check the [backend README](./backend/README.md) for backend issues
- Review the API documentation at <http://localhost:8000/docs> when running locally

---

Built with ❤️ using modern web technologies and AI.
