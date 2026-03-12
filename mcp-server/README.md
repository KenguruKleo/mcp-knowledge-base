# @kengurukleo/mcp-memory-server

An MCP server that gives AI assistants persistent memory. Save and recall personal information across conversations using semantic vector search.

Works with **Cursor**, **Claude Desktop**, **Codex**, and any MCP-compatible client.

## How It Works

When connected to your AI assistant, you can say things like:

- "Remember that my preferred editor is Cursor"
- "What do you know about my coding preferences?"
- "Forget my old email address"

Memories are stored as vector embeddings in Firebase Firestore, enabling semantic search -- you don't need exact keywords to recall them.

## Setup

### Prerequisites

You need a running backend (Firebase Cloud Functions). See the [full setup guide](https://github.com/KenguruKleo/mcp-knowledge-base) for backend deployment instructions.

Once the backend is deployed, you'll have:
- A **Cloud Functions URL** (e.g. `https://europe-west1-YOUR_PROJECT.cloudfunctions.net`)
- A personal **API key**

### Configure in Cursor

Add to `~/.cursor/mcp.json`:

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

### Configure in Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

## MCP Tools

| Tool | Description |
|------|-------------|
| `save_memory` | Save information to memory. Input: `text` (required), `tags` (optional) |
| `find_memories` | Search memories by meaning. Input: `query` (required), `limit` (optional, 1-10) |
| `delete_memory` | Delete a memory by ID. Input: `memoryId` (required) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MEMORY_API_URL` | Yes | Firebase Cloud Functions base URL |
| `MEMORY_API_KEY` | Yes | Your personal API key |

## Architecture

This package is a thin MCP client. It communicates via stdio with the LLM client and makes HTTPS calls to Firebase Cloud Functions which handle:
- Embedding generation (Gemini API)
- Vector storage and search (Firestore)
- API key authentication

All secrets stay server-side. This package only needs the API URL and your personal key.

## License

MIT
