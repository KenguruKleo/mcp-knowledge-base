import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MemoryApiClient } from "../api.js";

export const findMemoriesSchema = {
  query: z.string().describe(
    "A natural language query to search memories. " +
    "Examples: 'What is my favorite programming language?', " +
    "'What pets do I have?', 'editor preferences'."
  ),
  limit: z.number().min(1).max(10).optional().describe(
    "Maximum number of memories to return (1-10, default: 3)"
  ),
};

export function registerFindMemories(server: McpServer, api: MemoryApiClient): void {
  server.tool(
    "find_memories",
    "Search the user's personal memory for relevant information. " +
    "Use this when the user asks you to recall something, " +
    "or when you need context about the user's preferences, history, or personal details. " +
    "Returns the most semantically relevant memories.",
    findMemoriesSchema,
    async ({ query, limit }) => {
      const result = await api.findMemories(query, limit);

      if (result.memories.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No matching memories found.",
            },
          ],
        };
      }

      const memoriesText = result.memories
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
            text: `Found ${result.memories.length} matching memories:\n\n${memoriesText}`,
          },
        ],
      };
    }
  );
}
