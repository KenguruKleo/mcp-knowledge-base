import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { MemoryApiClient } from "./api.js";
import { registerSaveMemory } from "./tools/saveMemory.js";
import { registerFindMemories } from "./tools/findMemories.js";
import { registerDeleteMemory } from "./tools/deleteMemory.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const api = new MemoryApiClient(config);

  const server = new McpServer({
    name: "mcp-memory-server",
    version: "0.1.0",
  });

  registerSaveMemory(server, api);
  registerFindMemories(server, api);
  registerDeleteMemory(server, api);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
