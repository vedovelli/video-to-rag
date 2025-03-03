import { db } from "./utils/db";
import { logger } from "./utils/logger";

async function countDocuments() {
  try {
    const result = await db.execute("SELECT COUNT(*) as count FROM documents");
    const count = Number(result.rows[0].count);

    logger.info(`Total de documentos na base: ${count}`);

    if (count > 0) {
      const samples = await db.execute(
        "SELECT id, content FROM documents LIMIT 3"
      );

      logger.info("\nAmostras de documentos:");
      samples.rows.forEach((doc: any) => {
        logger.info(`\nID: ${doc.id}`);
        logger.info(`Conteúdo: ${doc.content.substring(0, 150)}...`);
      });
    }
  } catch (error) {
    logger.error(`Erro ao contar documentos: ${error}`);
    throw error;
  }
}

// Execute the function
countDocuments()
  .then(() => {
    logger.info("Processo concluído");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Falha no processo: ${error}`);
    process.exit(1);
  });
