import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { MemoryApiClient } from "./api.js";
import { registerSaveMemory } from "./tools/saveMemory.js";
import { registerFindMemories } from "./tools/findMemories.js";
import { registerDeleteMemory } from "./tools/deleteMemory.js";

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

async function main(): Promise<void> {
  const config = loadConfig();
  const api = new MemoryApiClient(config);

  const server = new McpServer(
    {
      name: "mcp-memory-server",
      version: "0.1.1",
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    }
  );

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
