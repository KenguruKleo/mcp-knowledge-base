import { Response } from "express";
import { Request } from "firebase-functions/v2/https";
import type { IncomingMessage, ServerResponse } from "node:http";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

import { validateApiKey } from "../middleware/auth";
import { generateEmbedding } from "../services/embeddings";
import { deleteMemoryDoc, findMemoryDocs, saveMemoryDoc } from "../services/firestore";

const SERVER_INSTRUCTIONS = `You have access to a personal memory system. Use it proactively:

WHEN TO SAVE (save_memory):
- User explicitly asks to remember something ("remember that...", "save this...", "don't forget...")
- User shares important personal info: name, preferences, workflows, tools, contacts, project details
- User corrects previous information (save the correction)
- User describes recurring processes or conventions they follow

WHEN TO SEARCH (find_memories):
- User asks "what do you know about...", "do you remember...", "what's my..."
- Before answering questions about user preferences, setup, or personal details
- When context about the user would improve your response
- At the START of a new conversation, if the user's question might relate to previously saved info

WHEN TO DELETE (delete_memory):
- User says information is outdated or wrong ("forget that...", "that's no longer true...")
- After saving a correction, delete the old memory if found

GUIDELINES:
- Keep memories atomic: one fact per memory, clear and self-contained
- Use tags to categorize: preferences, work, personal, tools, projects, etc.
- When saving, write the memory as a factual statement, not a conversation quote
- Don't save transient or sensitive information (passwords, tokens) unless explicitly asked`;

function sendJsonRpcError(res: Response, status: number, message: string): void {
  res.status(status).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message,
    },
    id: null,
  });
}

export async function handleMcpHttp(
  req: Request,
  res: Response,
  geminiApiKey: string
): Promise<void> {
  // In stateless JSON-response mode we only support POST.
  if (req.method !== "POST") {
    res.status(405).set("Allow", "POST");
    sendJsonRpcError(res, 405, "Method not allowed.");
    return;
  }

  let userId: string;
  try {
    const user = await validateApiKey(req);
    userId = user.userId;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    sendJsonRpcError(res, 401, message);
    return;
  }

  const server = new McpServer(
    {
      name: "mcp-memory-server",
      version: "1.0.0",
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  server.tool(
    "save_memory",
    "Save a fact to the user's personal long-term memory. Text should be a clear, atomic statement (one fact per call). Returns the saved memory ID.",
    {
      text: z
        .string()
        .describe("The memory content to save. Should be a clear, self-contained statement."),
      tags: z.array(z.string()).optional().describe("Optional tags to categorize the memory."),
    },
    async ({ text, tags }) => {
      const sanitizedText = text.trim();
      if (sanitizedText.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Memory text cannot be empty.",
            },
          ],
        };
      }

      const sanitizedTags = Array.isArray(tags)
        ? tags.filter((t): t is string => typeof t === "string")
        : [];

      const embedding = await generateEmbedding(sanitizedText, geminiApiKey);
      const id = await saveMemoryDoc(userId, sanitizedText, sanitizedTags, embedding);

      return {
        content: [
          {
            type: "text" as const,
            text: `Memory saved (id: ${id}).`,
          },
        ],
      };
    }
  );

  server.tool(
    "find_memories",
    "Semantic search over the user's personal long-term memory. Returns relevant memories ranked by similarity.",
    {
      query: z.string().describe("Natural language query to search memories."),
      limit: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .describe("Maximum number of memories to return (default: 3)."),
    },
    async ({ query, limit }) => {
      const sanitizedQuery = query.trim();
      if (sanitizedQuery.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Query cannot be empty.",
            },
          ],
        };
      }

      const resolvedLimit = Math.min(Math.max(1, limit ?? 3), 10);

      const queryEmbedding = await generateEmbedding(sanitizedQuery, geminiApiKey);
      const memories = await findMemoryDocs(userId, queryEmbedding, resolvedLimit);

      if (memories.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No matching memories found.",
            },
          ],
        };
      }

      const formatted = memories
        .map((m, i) => {
          const tagStr = m.tags.length > 0 ? ` [${m.tags.join(", ")}]` : "";
          const dateStr = m.createdAt ? ` (saved: ${m.createdAt})` : "";
          return `${i + 1}. ${m.text}${tagStr}${dateStr}\n   id: ${m.id}`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${memories.length} matching memories:\n\n${formatted}`,
          },
        ],
      };
    }
  );

  server.tool(
    "delete_memory",
    "Delete a memory by its ID. Use find_memories first to get the ID.",
    {
      memoryId: z.string().describe("The ID of the memory to delete."),
    },
    async ({ memoryId }) => {
      const sanitizedId = memoryId.trim();
      if (sanitizedId.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "memoryId cannot be empty.",
            },
          ],
        };
      }

      await deleteMemoryDoc(userId, sanitizedId);
      return {
        content: [
          {
            type: "text" as const,
            text: `Memory ${sanitizedId} has been deleted.`,
          },
        ],
      };
    }
  );

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  // Clean up after request finishes (best-effort).
  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(
      req as unknown as IncomingMessage,
      res as unknown as ServerResponse,
      req.body
    );
  } catch (err: unknown) {
    if (res.headersSent) {
      return;
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    sendJsonRpcError(res, 500, message);
  }
}

