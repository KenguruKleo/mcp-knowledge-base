import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MemoryApiClient } from "../api.js";

export const deleteMemorySchema = {
  memoryId: z.string().describe(
    "The ID of the memory to delete. Obtain this from find_memories results."
  ),
};

export function registerDeleteMemory(server: McpServer, api: MemoryApiClient): void {
  server.tool(
    "delete_memory",
    "Delete a memory by its ID. " +
    "Use find_memories first to get the ID.",
    deleteMemorySchema,
    async ({ memoryId }) => {
      await api.deleteMemory(memoryId);
      return {
        content: [
          {
            type: "text" as const,
            text: `Memory ${memoryId} has been deleted.`,
          },
        ],
      };
    }
  );
}
