import { OpenAI } from "openai";
import { VectorStore } from "./services/vectorStore";
import config from "./config";
import { logger } from "./utils/logger";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

async function generateResponse(
  query: string,
  context: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: "system",
          content: `Você é um assistente de suporte prestativo. Use o seguinte contexto para responder à pergunta do usuário.
          Se você não souber a resposta com base no contexto, diga isso educadamente.
          Todas as suas respostas devem ser em português brasileiro, com um tom amigável e profissional.
          
          Contexto:
          ${context}`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return (
      response.choices[0].message.content ||
      "Não foi possível gerar uma resposta."
    );
  } catch (error) {
    logger.error(`Erro ao gerar resposta: ${error}`);
    return "Desculpe, ocorreu um erro ao gerar a resposta. Por favor, tente novamente.";
  }
}

async function testChatbot() {
  // Obter a consulta da linha de comando
  const query = process.argv[2] || "Como cadastrar um novo usuário?";

  console.log(`🤖 Testando chatbot com a pergunta: "${query}"`);

  try {
    // Buscar contexto relevante usando o VectorStore
    console.log("Buscando informações...");
    const vectorStore = new VectorStore();
    const results = await vectorStore.similaritySearch(query, 0.5, 3); // Reduced threshold to 0.5 for better recall

    if (results.length === 0) {
      console.log(
        "Não encontrei informações específicas sobre isso. Por favor, consulte o manual do sistema ou entre em contato com o suporte técnico para obter ajuda."
      );
      return;
    }

    console.log(`Encontrados ${results.length} resultados relevantes.`);

    // Concatenar os resultados para formar o contexto
    const context = results
      .map(
        (result) =>
          `Título: ${result.metadata.title}\n\nConteúdo: ${result.content}`
      )
      .join("\n\n---\n\n");

    // Gerar resposta
    console.log("Gerando resposta...");
    const response = await generateResponse(query, context);
    console.log("\n🤖 Resposta do Chatbot:\n");
    console.log(response);
  } catch (error) {
    logger.error(`Erro ao processar pergunta: ${error}`);
    console.log(
      "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente."
    );
  }
}

// Executar o teste
testChatbot().catch((error) => {
  logger.error(`Erro na aplicação: ${error}`);
  process.exit(1);
});
