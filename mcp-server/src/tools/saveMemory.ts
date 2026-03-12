import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MemoryApiClient } from "../api.js";

export const saveMemorySchema = {
  text: z.string().describe(
    "The memory content to save. Should be a clear, self-contained statement. " +
    "Examples: 'My preferred programming language is TypeScript', " +
    "'I use neovim as my editor', 'My cat is named Luna'."
  ),
  tags: z.array(z.string()).optional().describe(
    "Optional tags to categorize the memory, e.g. ['preferences', 'work']"
  ),
};

export function registerSaveMemory(server: McpServer, api: MemoryApiClient): void {
  server.tool(
    "save_memory",
    "Save a fact to the user's personal long-term memory. " +
    "Text should be a clear, atomic, self-contained statement (one fact per call). " +
    "Returns the saved memory ID.",
    saveMemorySchema,
    async ({ text, tags }) => {
      const result = await api.saveMemory(text, tags);
      return {
        content: [
          {
            type: "text" as const,
            text: `Memory saved (id: ${result.id}). I'll remember: "${text}"`,
          },
        ],
      };
    }
  );
}
