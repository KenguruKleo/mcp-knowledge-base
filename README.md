# MCP Memory Server

A personal knowledge base that lets AI assistants remember things about you across conversations. Built as an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server backed by Firebase Cloud Functions and Firestore vector search.

[![npm](https://img.shields.io/npm/v/@kengurukleo/mcp-memory-server)](https://www.npmjs.com/package/@kengurukleo/mcp-memory-server)

## How It Works

```
LLM Client (Cursor / Claude / Codex)
    ↕ stdio
MCP Server (runs locally via npx)
    ↕ HTTPS + Bearer token
Firebase Cloud Functions
    ↕
Firestore (vector search) + Gemini API (embeddings)
```

- **Save memories**: "Remember that I prefer TypeScript over JavaScript"
- **Recall memories**: "What programming languages do I like?"
- **Delete memories**: "Forget my editor preference"

Memories are stored as vector embeddings in Firestore, enabling semantic search — you don't need exact keywords to find them.

## Quick Start (Client Only)

If someone has already deployed the backend for you, just configure your MCP client:

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@kengurukleo/mcp-memory-server"],
      "env": {
        "MEMORY_API_URL": "https://europe-west1-YOUR_PROJECT.cloudfunctions.net",
        "MEMORY_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Backend Setup

### Prerequisites

- Node.js 18+
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)
- A Google account

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Upgrade to the **Blaze (pay-as-you-go) plan** — required for Cloud Functions deployment
   - You won't be charged for personal usage (2M free invocations/month)
3. Enable **Cloud Firestore** in Native mode (pick a region close to you)

### 2. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key (free tier: 1,500 requests/day)
3. Save it — you'll need it in step 4

### 3. Deploy the Backend

```bash
git clone https://github.com/KenguruKleo/mcp-knowledge-base.git
cd mcp-knowledge-base/firebase

# Log in to Firebase and set your project
firebase login
firebase use YOUR_PROJECT_ID

# Install dependencies
cd functions && npm install && cd ..

# Store the Gemini API key as a secret
firebase functions:secrets:set GEMINI_API_KEY

# Deploy functions + Firestore indexes + security rules
firebase deploy --only functions,firestore:indexes,firestore:rules
```

After deployment, note the base URL printed in the terminal. It follows this format:
```
https://REGION-YOUR_PROJECT_ID.cloudfunctions.net
```

### 4. Generate an API Key

**Option A: Using the helper script** (requires `GOOGLE_APPLICATION_CREDENTIALS` set):
```bash
cd firebase/functions
npm run generate-key -- "user_1" "My Cursor setup"
```

**Option B: Manually in Firebase Console**:
1. Go to Firestore in the [Firebase Console](https://console.firebase.google.com/)
2. Create a collection called `apiKeys`
3. Add a document where:
   - Document ID = any random string (this is your API key — e.g. `openssl rand -hex 32`)
   - Fields: `userId` (string, e.g. `"user_1"`), `label` (string, e.g. `"Cursor on MacBook"`), `createdAt` (timestamp)

### 5. Configure Your MCP Client

#### Cursor

Add to `~/.cursor/mcp.json` (or project-level `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@kengurukleo/mcp-memory-server"],
      "env": {
        "MEMORY_API_URL": "https://REGION-YOUR_PROJECT_ID.cloudfunctions.net",
        "MEMORY_API_KEY": "your-api-key-from-step-4"
      }
    }
  }
}
```

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@kengurukleo/mcp-memory-server"],
      "env": {
        "MEMORY_API_URL": "https://REGION-YOUR_PROJECT_ID.cloudfunctions.net",
        "MEMORY_API_KEY": "your-api-key-from-step-4"
      }
    }
  }
}
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `save_memory` | Save a piece of information. Input: `text` (required), `tags` (optional array) |
| `find_memories` | Search memories by meaning. Input: `query` (required), `limit` (optional, 1-10, default 3) |
| `delete_memory` | Delete a memory by ID. Input: `memoryId` (required) |

## Usage Examples

Once configured, just talk to your AI assistant naturally:

- "Remember that my database password rotation schedule is every 90 days"
- "What do you know about my deployment process?"
- "I no longer use Vim, forget that and remember I switched to Cursor"

## Architecture

```
mcp-knowledge-base/
  firebase/                    Firebase backend
    functions/src/
      index.ts                 Cloud Function exports
      middleware/auth.ts       API key validation
      services/embeddings.ts   Gemini embedding generation
      services/firestore.ts    Firestore vector operations
      handlers/                Request handlers
    firestore.indexes.json     Vector index (768-dim, cosine)
    firestore.rules            Security rules (deny all client access)
  mcp-server/                  MCP npm package (thin client)
    src/
      index.ts                 MCP server entry point
      api.ts                   HTTP client for Cloud Functions
      config.ts                Environment variable parsing
      tools/                   MCP tool definitions
```

## Cost

For personal usage, everything stays within free tiers:

| Service | Free Tier | Typical Personal Usage |
|---------|-----------|----------------------|
| Cloud Functions | 2M invocations/month | ~200-600/month |
| Firestore reads | 50K/day | ~10-30/day |
| Firestore writes | 20K/day | ~5-15/day |
| Firestore storage | 1 GiB | < 1 MB |
| Gemini embeddings | 1,500/day | ~5-20/day |

**Estimated monthly cost: $0**

## Multi-User Support

The system supports multiple users out of the box:

1. Generate a new API key for each user (with a unique `userId`)
2. Memories are automatically scoped by `userId`
3. Each user can only access their own memories

## License

MIT
