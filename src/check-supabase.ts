import config from "./config";
import { createClient } from "@supabase/supabase-js";
import { logger } from "./utils/logger";

async function checkSupabaseSetup() {
  logger.info("Verificando configuração do Supabase...");

  try {
    // Inicializar cliente do Supabase
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Verificar se a extensão pgvector está instalada
    const { data: extensionData, error: extensionError } = await supabase.rpc(
      "check_extension",
      { extension_name: "vector" }
    );

    if (extensionError) {
      logger.error(
        `Erro ao verificar extensão pgvector: ${extensionError.message}`
      );
      logger.error("Execute o seguinte SQL no Supabase:");
      logger.error("CREATE EXTENSION IF NOT EXISTS vector;");
    } else {
      logger.info(`Extensão pgvector instalada: ${extensionData}`);
    }

    // Verificar se a função match_documents existe
    const { data: functionData, error: functionError } = await supabase.rpc(
      "check_function_exists",
      { function_name: "match_documents" }
    );

    if (functionError) {
      logger.error(
        `Erro ao verificar função match_documents: ${functionError.message}`
      );
      logger.error(
        "Execute o SQL para criar a função match_documents no Supabase"
      );
    } else {
      logger.info(`Função match_documents existe: ${functionData}`);
    }

    // Verificar se a tabela documents existe
    const { data: tableData, error: tableError } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true });

    if (tableError) {
      logger.error(`Erro ao verificar tabela documents: ${tableError}`);
      logger.info(
        "Você precisa executar o SQL para criar a tabela documents usando a função initialize_documents_table"
      );
      logger.info("Execute: bun run src/initialize-db.ts");
    } else {
      logger.info("Tabela documents existe e está acessível");
    }
  } catch (error) {
    logger.error(`Erro ao verificar configuração do Supabase: ${error}`);
    throw error;
  }
}

// Executar a função
checkSupabaseSetup()
  .then(() => {
    logger.info("Verificação concluída");
  })
  .catch((error) => {
    logger.error(`Falha na verificação: ${error}`);
    process.exit(1);
  });
