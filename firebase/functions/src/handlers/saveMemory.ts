import { Response } from "express";
import { Request } from "firebase-functions/v2/https";
import { validateApiKey } from "../middleware/auth";
import { generateEmbedding } from "../services/embeddings";
import { saveMemoryDoc } from "../services/firestore";

export async function handleSaveMemory(
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

    const { text, tags } = req.body as {
      text?: string;
      tags?: string[];
    };

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({ error: "Field 'text' is required and must be a non-empty string" });
      return;
    }

    const sanitizedTags = Array.isArray(tags)
      ? tags.filter((t): t is string => typeof t === "string")
      : [];

    const embedding = await generateEmbedding(text, geminiApiKey);
    const id = await saveMemoryDoc(user.userId, text.trim(), sanitizedTags, embedding);

    res.status(201).json({ id, message: "Memory saved" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("API key") || message.includes("Authorization")
      ? 401
      : 500;
    res.status(status).json({ error: message });
  }
}
