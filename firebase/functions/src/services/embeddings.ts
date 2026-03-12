import { GoogleGenAI } from "@google/genai";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

let genaiClient: GoogleGenAI | null = null;

function getClient(apiKey: string): GoogleGenAI {
  if (!genaiClient) {
    genaiClient = new GoogleGenAI({ apiKey });
  }
  return genaiClient;
}

export async function generateEmbedding(
  text: string,
  geminiApiKey: string
): Promise<number[]> {
  const client = getClient(geminiApiKey);

  const response = await client.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding) {
    throw new Error("Failed to generate embedding: empty response");
  }

  return embedding;
}

export { EMBEDDING_DIMENSIONS };
