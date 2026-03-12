import { Response } from "express";
import { Request } from "firebase-functions/v2/https";
import { validateApiKey } from "../middleware/auth";
import { deleteMemoryDoc } from "../services/firestore";

export async function handleDeleteMemory(
  req: Request,
  res: Response
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const user = await validateApiKey(req);

    const { memoryId } = req.body as { memoryId?: string };

    if (!memoryId || typeof memoryId !== "string") {
      res.status(400).json({ error: "Field 'memoryId' is required" });
      return;
    }

    await deleteMemoryDoc(user.userId, memoryId);

    res.status(200).json({ message: "Memory deleted" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    let status = 500;
    if (message.includes("API key") || message.includes("Authorization")) {
      status = 401;
    } else if (message.includes("not found")) {
      status = 404;
    } else if (message.includes("Unauthorized")) {
      status = 403;
    }
    res.status(status).json({ error: message });
  }
}
