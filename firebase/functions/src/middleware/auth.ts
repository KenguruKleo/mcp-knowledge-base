import * as admin from "firebase-admin";
import { Request } from "firebase-functions/v2/https";

export interface AuthenticatedUser {
  apiKey: string;
  userId: string;
}

export async function validateApiKey(
  req: Request
): Promise<AuthenticatedUser> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const apiKey = authHeader.slice(7);
  if (!apiKey) {
    throw new Error("Empty API key");
  }

  const doc = await admin
    .firestore()
    .collection("apiKeys")
    .doc(apiKey)
    .get();

  if (!doc.exists) {
    throw new Error("Invalid API key");
  }

  const data = doc.data()!;
  return {
    apiKey,
    userId: data.userId as string,
  };
}
