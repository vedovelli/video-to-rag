import { OpenAI } from "openai";
import config from "../config";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";
import { readFile } from "fs/promises";

// Initialize Supabase client
const supabaseClient = createClient(config.supabase.url, config.supabase.key);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    sourcePath: string;
    chunkIndex: number;
    title?: string;
  };
  embedding: number[];
}

export async function initializeDatabase(): Promise<void> {
  try {
    // Check if the table exists, if not create it
    // Note: This would typically be done via migrations or SQL scripts
    // For simplicity, we're using a direct RPC call

    const { error } = await supabaseClient.rpc("initialize_documents_table", {
      table_name: config.supabase.documentsTable,
      vector_dimension: config.supabase.vectorDimension,
    });

    if (error && !error.message.includes("already exists")) {
      logger.error("Failed to initialize database", error);
      throw error;
    }

    logger.info("Database initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize database", error);
    throw error;
  }
}

export function chunkDocument(content: string): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  // Simple chunking by splitting on newlines and aggregating to max chunk size
  const paragraphs = content.split("\n\n");

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > config.chunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += "\n\n" + paragraph;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: config.supabase.vectorDimension,
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.error("Failed to generate embedding", error);
    throw error;
  }
}

export async function storeDocumentChunks(
  chunks: DocumentChunk[]
): Promise<void> {
  try {
    // Store each chunk in the database
    for (const chunk of chunks) {
      const { error } = await supabaseClient
        .from(config.supabase.documentsTable)
        .upsert({
          id: chunk.id,
          content: chunk.content,
          metadata: chunk.metadata,
          embedding: chunk.embedding,
        });

      if (error) {
        logger.error(`Failed to store chunk ${chunk.id}`, error);
        throw error;
      }
    }

    logger.info(`Stored ${chunks.length} document chunks`);
  } catch (error) {
    logger.error("Failed to store document chunks", error);
    throw error;
  }
}

export async function processContentForRAG(contentPath: string): Promise<void> {
  try {
    logger.info(`Processing content for RAG: ${contentPath}`);

    // Ensure database is initialized
    await initializeDatabase();

    // Read content file
    const content = await readFile(contentPath, "utf-8");

    // Extract title from markdown if possible (assuming first # heading is title)
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : contentPath.split("/").pop();

    // Chunk the document
    const chunks = chunkDocument(content);
    const documentChunks: DocumentChunk[] = [];

    // Generate embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);

      documentChunks.push({
        id: `${contentPath}-${i}`,
        content: chunks[i],
        metadata: {
          sourcePath: contentPath,
          chunkIndex: i,
          title,
        },
        embedding,
      });
    }

    // Store chunks in Supabase
    await storeDocumentChunks(documentChunks);

    logger.info(`Successfully processed content for RAG: ${contentPath}`);
  } catch (error) {
    logger.error(`Failed to process content for RAG: ${contentPath}`, error);
    throw error;
  }
}

export async function queryVectorStore(
  query: string,
  limit: number = 5
): Promise<any[]> {
  try {
    logger.info(`Gerando embedding para a consulta: "${query}"`);

    // Generate embedding for the query
    const embedding = await generateEmbedding(query);

    logger.info(`Embedding gerado com sucesso. Consultando Supabase...`);
    logger.info(`Usando limiar de similaridade: 0.5 (era 0.7)`);

    // Query Supabase with the embedding
    const { data, error } = await supabaseClient.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.5, // Reduzido de 0.7 para 0.5 para ser menos restritivo
      match_count: limit,
    });

    if (error) {
      logger.error(`Erro ao consultar Supabase: ${error.message}`, error);
      throw error;
    }

    logger.info(
      `Consulta ao Supabase concluída. Resultados encontrados: ${
        data ? data.length : 0
      }`
    );

    if (data && data.length > 0) {
      logger.info(
        `Melhor resultado - similaridade: ${data[0].similarity.toFixed(4)}`
      );
    }

    return data || [];
  } catch (error) {
    logger.error(`Falha ao consultar base vetorial: ${error}`, error);
    throw error;
  }
}
