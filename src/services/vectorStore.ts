import { logger } from "../utils/logger";
import {
  db,
  type Document,
  insertDocument,
  findSimilarDocuments,
} from "../utils/db";
import { OpenAIEmbeddings } from "../utils/openai";
import { v4 as uuidv4 } from "uuid";
import { readFile } from "fs/promises";
import config from "../config";

export interface Chunk {
  content: string;
  metadata: Record<string, any>;
}

export class VectorStore {
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings();
  }

  async addDocuments(chunks: Chunk[]): Promise<void> {
    logger.info(`Gerando embeddings para ${chunks.length} chunks...`);

    for (const chunk of chunks) {
      const embedding = await this.embeddings.embed(chunk.content);

      const document: Document = {
        id: uuidv4(),
        content: chunk.content,
        metadata: chunk.metadata,
        embedding,
      };

      await insertDocument(document);
    }

    logger.info("Documentos adicionados com sucesso!");
  }

  async similaritySearch(
    query: string,
    matchThreshold: number = 0.7,
    matchCount: number = 5
  ): Promise<Array<Document & { similarity: number }>> {
    logger.info(`Gerando embedding para a query: "${query}"...`);

    const queryEmbedding = await this.embeddings.embed(query);

    logger.info(`Embedding gerado com sucesso. Consultando banco de dados...`);

    const results = await findSimilarDocuments(
      queryEmbedding,
      matchThreshold,
      matchCount
    );

    logger.info(
      `Consulta concluída. Resultados encontrados: ${results.length}`
    );

    return results;
  }
}

function chunkDocument(content: string): string[] {
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

export async function processContentForRAG(contentPath: string): Promise<void> {
  try {
    logger.info(`Processing content for RAG: ${contentPath}`);

    // Read content file
    const content = await readFile(contentPath, "utf-8");

    // Extract title from markdown if possible (assuming first # heading is title)
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : contentPath.split("/").pop();

    // Chunk the document
    const chunks = chunkDocument(content);

    // Create chunks with metadata
    const chunksWithMetadata: Chunk[] = chunks.map((content, index) => ({
      content,
      metadata: {
        sourcePath: contentPath,
        chunkIndex: index,
        title,
      },
    }));

    // Store chunks in the vector store
    const vectorStore = new VectorStore();
    await vectorStore.addDocuments(chunksWithMetadata);

    logger.info(`Successfully processed content for RAG: ${contentPath}`);
  } catch (error) {
    logger.error(`Failed to process content for RAG: ${contentPath}`, error);
    throw error;
  }
}
