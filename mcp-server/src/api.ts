import type { Config } from "./config.js";

export class MemoryApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: Config) {
    this.baseUrl = config.apiUrl;
    this.apiKey = config.apiKey;
  }

  async saveMemory(text: string, tags?: string[]): Promise<{ id: string; message: string }> {
    return this.post<{ id: string; message: string }>("saveMemory", { text, tags });
  }

  async findMemories(
    query: string,
    limit?: number
  ): Promise<{
    memories: Array<{
      id: string;
      text: string;
      tags: string[];
      createdAt: string;
    }>;
  }> {
    return this.post("findMemories", { query, limit });
  }

  async deleteMemory(memoryId: string): Promise<{ message: string }> {
    return this.post<{ message: string }>("deleteMemory", { memoryId });
  }

  private async post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = (errorBody as Record<string, string>).error || `HTTP ${response.status}`;
      throw new Error(`Memory API error: ${message}`);
    }

    return response.json() as Promise<T>;
  }
}
