import * as admin from "firebase-admin";
import * as crypto from "crypto";

admin.initializeApp();

const db = admin.firestore();

async function generateApiKey(userId: string, label: string): Promise<void> {
  const apiKey = crypto.randomBytes(32).toString("hex");

  await db.collection("apiKeys").doc(apiKey).set({
    userId,
    label,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("\n=== API Key Generated ===");
  console.log(`User ID:  ${userId}`);
  console.log(`Label:    ${label}`);
  console.log(`API Key:  ${apiKey}`);
  console.log("\nStore this key securely — it cannot be retrieved later.");
  console.log("========================\n");

  process.exit(0);
}

const userId = process.argv[2];
const label = process.argv[3] || "default";

if (!userId) {
  console.error("Usage: npm run generate-key -- <userId> [label]");
  console.error('Example: npm run generate-key -- "user_1" "Cursor on MacBook"');
  process.exit(1);
}

generateApiKey(userId, label);
