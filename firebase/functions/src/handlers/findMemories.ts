import { Response } from "express";
import { Request } from "firebase-functions/v2/https";
import { validateApiKey } from "../middleware/auth";
import { generateEmbedding } from "../services/embeddings";
import { findMemoryDocs } from "../services/firestore";

const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 10;

export async function handleFindMemories(
  req: Request,
  res: Response,
  geminiApiKey: string
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const user = await validateApiKey(req);

    const { query, limit: rawLimit } = req.body as {
      query?: string;
      limit?: number;
    };

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      res.status(400).json({ error: "Field 'query' is required and must be a non-empty string" });
      return;
    }

    const limit = Math.min(
      Math.max(1, typeof rawLimit === "number" ? rawLimit : DEFAULT_LIMIT),
      MAX_LIMIT
    );

    const queryEmbedding = await generateEmbedding(query, geminiApiKey);
    const memories = await findMemoryDocs(user.userId, queryEmbedding, limit);

    res.status(200).json({ memories });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("API key") || message.includes("Authorization")
      ? 401
      : 500;
    res.status(status).json({ error: message });
  }
}
