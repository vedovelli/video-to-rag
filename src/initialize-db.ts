import config from "./config";
import { createClient } from "@supabase/supabase-js";
import { logger } from "./utils/logger";

async function initializeDocumentsTable() {
  logger.info("Inicializando tabela documents no Supabase...");

  try {
    // Inicializar cliente do Supabase
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Chamar a função RPC para inicializar a tabela documents
    const { data, error } = await supabase.rpc("initialize_documents_table", {
      table_name: "documents",
      vector_dimension: 1536,
    });

    if (error) {
      logger.error(`Erro ao inicializar tabela documents: ${error.message}`);
      throw error;
    }

    logger.info("Tabela documents inicializada com sucesso!");

    // Verificar se a tabela foi criada corretamente
    const { data: countData, error: countError } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true });

    if (countError) {
      logger.error(`Erro ao verificar tabela documents: ${countError.message}`);
    } else {
      logger.info(`Tabela documents verificada: ${countData ? "OK" : "Falha"}`);
    }
  } catch (error) {
    logger.error(`Erro ao inicializar tabela documents: ${error}`);
    throw error;
  }
}

// Executar a função
initializeDocumentsTable()
  .then(() => {
    logger.info("Processo de inicialização concluído");
  })
  .catch((error) => {
    logger.error(`Falha na inicialização: ${error}`);
    process.exit(1);
  });
