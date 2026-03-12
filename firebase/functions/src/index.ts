import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { handleSaveMemory } from "./handlers/saveMemory";
import { handleFindMemories } from "./handlers/findMemories";
import { handleDeleteMemory } from "./handlers/deleteMemory";

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const region = "europe-west1";
const invoker = "public" as const;

export const saveMemory = onRequest(
  { secrets: [geminiApiKey], cors: false, region, invoker },
  (req, res) => handleSaveMemory(req, res, geminiApiKey.value())
);

export const findMemories = onRequest(
  { secrets: [geminiApiKey], cors: false, region, invoker },
  (req, res) => handleFindMemories(req, res, geminiApiKey.value())
);

export const deleteMemory = onRequest(
  { cors: false, region, invoker },
  (req, res) => handleDeleteMemory(req, res)
);
