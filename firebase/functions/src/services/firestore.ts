import * as admin from "firebase-admin";
import { EMBEDDING_DIMENSIONS } from "./embeddings";

const MEMORIES_COLLECTION = "memories";

interface MemoryDocument {
  text: string;
  tags: string[];
  userId: string;
  embedding: FirebaseFirestore.VectorValue;
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
}

export interface MemoryResult {
  id: string;
  text: string;
  tags: string[];
  createdAt: string;
}

export async function saveMemoryDoc(
  userId: string,
  text: string,
  tags: string[],
  embedding: number[]
): Promise<string> {
  const db = admin.firestore();

  const doc: MemoryDocument = {
    text,
    tags,
    userId,
    embedding: admin.firestore.FieldValue.vector(embedding) as unknown as FirebaseFirestore.VectorValue,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const ref = await db.collection(MEMORIES_COLLECTION).add(doc);
  return ref.id;
}

export async function findMemoryDocs(
  userId: string,
  queryEmbedding: number[],
  limit: number
): Promise<MemoryResult[]> {
  const db = admin.firestore();

  const collectionRef = db.collection(MEMORIES_COLLECTION);

  const vectorQuery = collectionRef
    .where("userId", "==", userId)
    .findNearest("embedding", queryEmbedding, {
      limit,
      distanceMeasure: "COSINE",
    });

  const snapshot = await vectorQuery.get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text as string,
      tags: (data.tags as string[]) || [],
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? "",
    };
  });
}

export async function deleteMemoryDoc(
  userId: string,
  memoryId: string
): Promise<void> {
  const db = admin.firestore();
  const docRef = db.collection(MEMORIES_COLLECTION).doc(memoryId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`Memory ${memoryId} not found`);
  }

  if (doc.data()?.userId !== userId) {
    throw new Error("Unauthorized: memory belongs to another user");
  }

  await docRef.delete();
}

export { EMBEDDING_DIMENSIONS };
