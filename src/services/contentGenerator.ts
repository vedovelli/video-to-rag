import { ensureDirectoryExists, getOutputPath } from "../utils/fileSystem";
import { readFile, writeFile } from "fs/promises";

import { OpenAI } from "openai";
import config from "../config";
import { logger } from "../utils/logger";

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export async function transformToSupportPage(
  transcriptPath: string
): Promise<string> {
  try {
    const outputPath = getOutputPath(
      transcriptPath,
      config.paths.content,
      "md"
    );

    await ensureDirectoryExists(config.paths.content);

    logger.info(`Transforming transcript to support page: ${transcriptPath}`);

    const transcript = await readFile(transcriptPath, "utf-8");

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: "system",
          content: `Você é um especialista em criar páginas de suporte bem estruturadas.
          
          Transforme a transcrição fornecida em uma página de suporte em formato markdown bem estruturada em português brasileiro.
          
          Siga estas diretrizes:
          1. Crie um título claro e descritivo usando # no início
          2. Organize o conteúdo em seções lógicas usando ## para subtítulos
          3. Use listas com marcadores (- ou *) para etapas ou pontos importantes
          5. Mantenha um tom profissional mas amigável
          6. Certifique-se de que o conteúdo seja fácil de ler e seguir
          7. Inclua uma breve introdução e conclusão
          8. Adicione dicas ou notas quando apropriado

          O nome do arquivo é ${transcriptPath
            .split("/")
            .pop()}. Ele corresponde ao ID do vídeo no YouTube. Utilize esse ID para criar links para o vídeo no conteúdo da página de suporte.
          
          Se a transcrição estiver vazia ou não contiver informações suficientes, desconsidere o arquivo.`,
        },
        {
          role: "user",
          content: `Transcrição: ${transcript}
          
          Nome do arquivo: ${transcriptPath.split("/").pop()}`,
        },
      ],
      temperature: 0.7,
    });

    const supportPageContent = response.choices[0].message.content || "";

    await writeFile(outputPath, supportPageContent);

    logger.info(`Support page created successfully: ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error(`Failed to transform transcript: ${transcriptPath}`, error);
    throw error;
  }
}
