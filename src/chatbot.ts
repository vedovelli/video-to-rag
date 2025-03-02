import { OpenAI } from "openai";
import config from "./config";
import { createInterface } from "readline";
import { logger } from "./utils/logger";
import { queryVectorStore } from "./services/vectorStore";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Create readline interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
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
      "Desculpe, não consegui gerar uma resposta."
    );
  } catch (error) {
    logger.error("Erro ao gerar resposta:", error);
    return "Desculpe, ocorreu um erro ao gerar uma resposta.";
  }
}

async function chat() {
  console.log(
    "🤖 Bem-vindo ao Chatbot de Suporte! Digite 'sair' para encerrar."
  );

  const askQuestion = async () => {
    rl.question("\nDigite sua pergunta: ", async (query) => {
      if (query.toLowerCase() === "sair") {
        console.log("Até logo! 👋");
        rl.close();
        return;
      }

      try {
        // Buscar contexto relevante
        console.log("Buscando informações...");
        const results = await queryVectorStore(query, 3); // Buscar até 3 resultados

        if (results.length === 0) {
          console.log(
            "Não encontrei informações específicas sobre isso. Por favor, consulte o manual do sistema ou entre em contato com o suporte técnico para obter ajuda."
          );
          askQuestion();
          return;
        }

        // Concatenar os resultados para formar o contexto
        const context = results
          .map(
            (result) =>
              `Título: ${result.metadata.title}\n\nConteúdo: ${result.content}`
          )
          .join("\n\n---\n\n");

        // Gerar resposta
        const response = await generateResponse(query, context);
        console.log(`\n${response}`);
      } catch (error) {
        console.error("Erro ao processar sua pergunta:", error);
        console.log(
          "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente."
        );
      }

      // Perguntar novamente
      askQuestion();
    });
  };

  // Iniciar o chat
  askQuestion();
}

// Start the chat
chat().catch((error) => {
  logger.error("Erro na aplicação de chat:", error);
  process.exit(1);
});
