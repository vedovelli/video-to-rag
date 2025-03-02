import config from "./config";
import { createClient } from "@supabase/supabase-js";
import { logger } from "./utils/logger";

async function countDocuments() {
  logger.info("Contando documentos na tabela documents...");

  try {
    // Inicializar cliente do Supabase
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Contar documentos
    const { count, error } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true });

    if (error) {
      logger.error(`Erro ao contar documentos: ${error.message}`);
      throw error;
    }

    logger.info(`Total de documentos na tabela: ${count}`);

    // Listar alguns documentos para verificação
    const { data: samples, error: samplesError } = await supabase
      .from("documents")
      .select("id, content, metadata")
      .limit(3);

    if (samplesError) {
      logger.error(`Erro ao buscar amostras: ${samplesError.message}`);
    } else {
      logger.info("Amostras de documentos:");
      samples.forEach((doc, index) => {
        logger.info(`Documento ${index + 1}:`);
        logger.info(`  ID: ${doc.id}`);
        logger.info(`  Conteúdo: ${doc.content.substring(0, 100)}...`);
        logger.info(`  Metadados: ${JSON.stringify(doc.metadata)}`);
      });
    }
  } catch (error) {
    logger.error(`Erro ao contar documentos: ${error}`);
    throw error;
  }
}

// Executar a função
countDocuments()
  .then(() => {
    logger.info("Contagem concluída");
  })
  .catch((error) => {
    logger.error(`Falha na contagem: ${error}`);
    process.exit(1);
  });
