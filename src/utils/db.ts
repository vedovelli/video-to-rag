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
    // Drop the existing table if it exists
    await db.execute("DROP TABLE IF EXISTS documents");

    // Create documents table with F32_BLOB vector type
    await db.execute(`
      CREATE TABLE documents (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        metadata TEXT NOT NULL,
        embedding F32_BLOB(1536) NOT NULL
      )
    `);

    // Create a vector index for efficient similarity search
    await db.execute(`
      CREATE INDEX documents_embedding_idx 
      ON documents (
        libsql_vector_idx(
          embedding,
          'metric=cosine'
        )
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
    // Validação básica do embedding
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new Error(
        "Invalid embedding: must be a non-empty array of numbers"
      );
    }

    // Inserir o documento com conversão para vetor
    await db.execute({
      sql: `
        INSERT INTO documents (id, content, metadata, embedding)
        VALUES (?, ?, ?, vector32(?))
      `,
      args: [id, content, JSON.stringify(metadata), JSON.stringify(embedding)],
    });

    logger.info(`Document inserted successfully: ${id}`);
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
  try {
    // Usar vector_top_k para busca eficiente de vizinhos aproximados
    const result = await db.execute({
      sql: `
        SELECT 
          d.id, 
          d.content, 
          d.metadata,
          vector_distance_cos(d.embedding, vector32(?)) as distance
        FROM 
          vector_top_k('documents_embedding_idx', vector32(?), ?) as v
        JOIN 
          documents as d ON v.id = d.rowid
        ORDER BY 
          distance ASC
        LIMIT ?
      `,
      args: [
        JSON.stringify(queryEmbedding),
        JSON.stringify(queryEmbedding),
        matchCount * 2, // Buscar mais candidatos para filtrar pelo threshold
        matchCount,
      ],
    });

    // Converter distância para similaridade (distância cosseno = 1 - similaridade cosseno)
    return result.rows
      .map((row: any) => ({
        id: row.id,
        content: row.content,
        metadata: JSON.parse(row.metadata),
        embedding: queryEmbedding, // Não precisamos retornar o embedding real
        similarity: 1 - row.distance, // Converter distância para similaridade
      }))
      .filter((doc) => doc.similarity >= matchThreshold);
  } catch (error) {
    logger.error(`Error finding similar documents: ${error}`);
    throw error;
  }
}
