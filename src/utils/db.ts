import config from "../config";
import { createClient } from "@libsql/client";
import { logger } from "./logger";

export const db = createClient({
  url: config.turso.dbUrl,
  authToken: config.turso.authToken,
});

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding: number[];
}

export async function initializeDb() {
  logger.info("Initializing database...");

  try {
    // Create documents table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        metadata TEXT NOT NULL,
        embedding BLOB NOT NULL
      )
    `);

    logger.info("Database initialized successfully!");
  } catch (error) {
    logger.error(`Error initializing database: ${error}`);
    throw error;
  }
}

export async function insertDocument(doc: Document) {
  const { id, content, metadata, embedding } = doc;

  try {
    await db.execute({
      sql: `
        INSERT INTO documents (id, content, metadata, embedding)
        VALUES (?, ?, ?, ?)
      `,
      args: [
        id,
        content,
        JSON.stringify(metadata),
        Buffer.from(new Float32Array(embedding).buffer),
      ],
    });
  } catch (error) {
    logger.error(`Error inserting document: ${error}`);
    throw error;
  }
}

export async function findSimilarDocuments(
  queryEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
): Promise<Array<Document & { similarity: number }>> {
  // Since Turso doesn't support vector operations natively,
  // we'll implement cosine similarity in JavaScript
  const documents = await db.execute("SELECT * FROM documents");

  const results = documents.rows.map((row: any) => {
    const embedding = new Float32Array(
      Buffer.from(row.embedding as Buffer).buffer
    );

    // Calculate cosine similarity
    const similarity = cosineSimilarity(queryEmbedding, Array.from(embedding));

    return {
      id: row.id,
      content: row.content,
      metadata: JSON.parse(row.metadata),
      embedding: Array.from(embedding),
      similarity,
    };
  });

  return results
    .filter((doc) => doc.similarity >= matchThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
