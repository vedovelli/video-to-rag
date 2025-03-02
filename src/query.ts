import { logger } from "./utils/logger";
import { queryVectorStore } from "./services/vectorStore";

async function testQuery() {
  // Obter a consulta da linha de comando
  const query = process.argv[2] || "Como cadastrar um novo usuário?";

  logger.info(`Executando consulta: "${query}"`);

  try {
    // Consultar a base de conhecimento
    const results = await queryVectorStore(query);

    logger.info(`Encontrados ${results.length} resultados:`);

    if (results.length === 0) {
      logger.info("Nenhum resultado encontrado para a consulta.");
      return;
    }

    // Exibir os resultados
    results.forEach((result, index) => {
      logger.info(
        `\nResultado ${index + 1} (similaridade: ${result.similarity.toFixed(
          4
        )}):`
      );
      logger.info(`Título: ${result.metadata.title}`);
      logger.info(`Conteúdo: ${result.content}`);
    });
  } catch (error) {
    logger.error(`Erro ao consultar: ${error}`);
  }
}

// Executar a consulta
testQuery().catch((error) => {
  logger.error(`Erro na aplicação: ${error}`);
  process.exit(1);
});
