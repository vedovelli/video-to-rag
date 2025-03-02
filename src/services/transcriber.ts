import { ensureDirectoryExists, getOutputPath } from "../utils/fileSystem";

import { OpenAI } from "openai";
import config from "../config";
import { logger } from "../utils/logger";
import { spawn } from "child_process";
import { writeFile } from "fs/promises";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// This assumes you have a local Whisper model setup
// You can use whisper.cpp, Whisper OpenAI API, or other implementations
export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const outputPath = getOutputPath(
      audioPath,
      config.paths.transcripts,
      "txt"
    );

    await ensureDirectoryExists(config.paths.transcripts);

    logger.info(`Transcribing audio with OpenAI API: ${audioPath}`);

    // Read the audio file as a buffer
    const file = await Bun.file(audioPath).arrayBuffer();

    // Create a File object from the buffer
    const audioFile = new File([file], "audio.flac", { type: "audio/flac" });

    // Call OpenAI's Whisper API
    const result = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    // Write the transcript to a file
    await writeFile(outputPath, result.text);

    logger.info(`Transcription completed successfully: ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error(`Failed to transcribe audio with OpenAI: ${audioPath}`, error);
    throw error;
  }
}

// Alternative implementation using OpenAI's Whisper API
export async function transcribeWithOpenAI(audioPath: string): Promise<string> {
  try {
    const outputPath = getOutputPath(
      audioPath,
      config.paths.transcripts,
      "txt"
    );

    await ensureDirectoryExists(config.paths.transcripts);

    logger.info(`Transcribing audio with OpenAI API: ${audioPath}`);

    // Implementation using OpenAI's API would go here
    // This is a placeholder - you would use the OpenAI SDK

    // const openai = new OpenAI(config.openai.apiKey);
    // const file = await Bun.file(audioPath).arrayBuffer();
    // const result = await openai.audio.transcriptions.create({
    //   file: new File([file], "audio.flac"),
    //   model: "whisper-1",
    // });

    // await writeFile(outputPath, result.text);

    return outputPath;
  } catch (error) {
    logger.error(`Failed to transcribe audio with OpenAI: ${audioPath}`, error);
    throw error;
  }
}
