import { OpenAI } from "openai";
import { VectorStore } from "../../services/vectorStore";
import config from "../../config";
import { logger } from "../../utils/logger";

export class ChatbotService {
  private openai: OpenAI;
  private vectorStore: VectorStore;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.vectorStore = new VectorStore();
  }

  async generateResponse(query: string): Promise<string> {
    try {
      // Fetch relevant context using VectorStore
      logger.info(`Searching for context for query: "${query}"`);
      const results = await this.vectorStore.similaritySearch(query, 0.5, 3);

      if (results.length === 0) {
        return "Não encontrei informações específicas sobre isso. Por favor, consulte o manual do sistema ou entre em contato com o suporte técnico para obter ajuda.";
      }

      // Concatenate results to form context
      const context = results
        .map(
          (result) =>
            `Título: ${result.metadata.title}\n\nConteúdo: ${result.content}`
        )
        .join("\n\n---\n\n");

      // Generate response using OpenAI
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: "system",
            content: `Você é um assistente de suporte prestativo. Use o seguinte contexto para responder à pergunta do usuário.
            Se você não souber a resposta com base no contexto, diga isso educadamente.
            Todas as suas respostas devem ser em português brasileiro, com um tom amigável e profissional.

            Sempre que exisir um link no contexto, use o link para criar um link para o vídeo no conteúdo da página de suporte.
            
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
      logger.error("Error generating response:", error);
      throw new Error("Failed to generate response");
    }
  }
}
