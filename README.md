# 🐃 Durabull Sample App

A production-ready sample application demonstrating the **Durabull** workflow engine for Node.js/TypeScript. This app showcases durable, long-lived workflows that generate multiple hash digests (MD5, SHA1, SHA256, SHA512, BLAKE3) for uploaded images using parallel processing.

![Durabull Demo](https://img.shields.io/badge/status-demo-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)

## 🌟 Features

- **🔄 Durable Workflows**: Long-lived, fault-tolerant workflow orchestration using Durabull
- **⚡ Parallel Processing**: Computes 5 different hash algorithms simultaneously
- **🚀 Modern Stack**: 
  - Backend: Fastify API server with TypeScript
  - Frontend: React with Vite
  - Queue: Redis with BullMQ
  - Workflow Engine: Durabull
- **🐳 Docker Ready**: Complete Docker Compose setup for Redis
- **💻 Codespaces Ready**: Full devcontainer configuration for GitHub Codespaces
- **✨ Production Best Practices**: 
  - ESLint and Prettier for code quality
  - Structured logging
  - Error handling
  - Clean architecture

## 📋 Hash Algorithms Supported

- MD5
- SHA1
- SHA256
- SHA512
- BLAKE3 (via WebAssembly)

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Vite + TS)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Fastify API    │◄────►│    Redis     │
│    Server       │      │   (BullMQ)   │
└────────┬────────┘      └──────▲───────┘
         │                      │
         ▼                      │
┌─────────────────┐             │
│    Durabull     │─────────────┘
│  Workflow/      │
│  Activity       │
│  Workers        │
└─────────────────┘
```

### Key Components

1. **Workflow** (`ImageHashWorkflow`): Orchestrates the parallel hash computation
2. **Activities** (`ComputeHashActivity`): Individual hash computation tasks
3. **Workers**: Process workflow and activity jobs from Redis queues
4. **API Server**: Handles file uploads and provides workflow status
5. **Frontend**: User interface for uploading images and viewing results

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for Redis)
- Git

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/typescript-workflow/sample-app.git
cd sample-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Start everything (backend, worker, frontend)**

Open one terminal and run:

```bash
npm run dev
```

This will start the backend API server, the Durabull worker, and the Vite dev server for the frontend concurrently. The frontend is served at `http://localhost:5173` by default.

4. **Open your browser**

Navigate to `http://localhost:5173` and upload an image!

### GitHub Codespaces

This project is fully configured for GitHub Codespaces:

1. Click the "Code" button on the repository
2. Select "Codespaces" tab
3. Click "Create codespace on main"
4. Wait for the environment to build
5. Run the commands above to start the services

The devcontainer will automatically:
- Install all dependencies
- Configure VS Code extensions
- Forward necessary ports

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Redis Connection
REDIS_URL=redis://redis:6379

# API Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
```

### Durabull Configuration

The Durabull engine is configured in `backend/config/durabull.ts`:

```typescript
Durabull.configure({
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  queues: {
    workflow: 'durabull:workflow',
    activity: 'durabull:activity',
  },
  serializer: 'json',
  pruneAge: '30 days',
});
```

## 🧪 How It Works

### 1. Image Upload

User uploads an image through the React frontend. The file is sent to the Fastify API server.

### 2. Workflow Creation

The API server creates a new `ImageHashWorkflow` and starts it with the image buffer and list of hash algorithms.

```typescript
const workflow = await WorkflowStub.make(ImageHashWorkflow);
await workflow.start({
  imageBuffer: buffer,
  algorithms: ['md5', 'sha1', 'sha256', 'sha512', 'blake3'],
}, fileName);
```

### 3. Parallel Activity Execution

The workflow dispatches 5 `ComputeHashActivity` tasks in parallel:

```typescript
const hashStubs = input.algorithms.map((algorithm) =>
  ActivityStub.make(ComputeHashActivity, input.imageBuffer, algorithm)
);

const hashes = yield ActivityStub.all(hashStubs);
```

### 4. Worker Processing

The Durabull workers pick up the workflow and activity jobs from Redis queues and execute them.

### 5. Result Polling

The frontend polls the API to check workflow status. Once complete, it displays all hash results.

## 🎨 Frontend Features

- **Drag & Drop**: Easy file upload
- **Image Preview**: View uploaded image before processing
- **Real-time Updates**: Polls for workflow completion
- **Copy to Clipboard**: One-click hash copying
- **Responsive Design**: Works on mobile and desktop
- **Beautiful UI**: Modern gradient design with smooth animations

## 🔐 Security Considerations

- File size limit: 10MB maximum
- File type validation: Only images allowed
- No persistent storage: Images are processed in memory
- Activity timeout: 30 seconds per hash computation
- Retry logic: 3 attempts per activity

## 📚 Learn More

### Durabull

- [Durabull GitHub](https://github.com/typescript-workflow/durabull)
- [npm Package](https://www.npmjs.com/package/durabull)

### Technologies

- [Fastify](https://www.fastify.io/) - Fast web framework
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [BullMQ](https://bullmq.io/) - Queue system
- [Redis](https://redis.io/) - In-memory data store

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 👨‍💻 Author

Built with ❤️ as a demonstration of the Durabull workflow engine

---

**Note**: This is a sample application for demonstration purposes. For production use, consider adding:
- Authentication and authorization
- Persistent storage for images and results
- Rate limiting
- Monitoring and observability
- Horizontal scaling
- Database for workflow history
