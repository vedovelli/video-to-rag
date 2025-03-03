import { dirname, join } from "path";

import { fileURLToPath } from "url";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

interface Config {
  paths: {
    videos: string;
    audio: string;
    transcripts: string;
    content: string;
  };
  openai: {
    apiKey: string;
    model: string;
    whisperModel: string;
  };
  ffmpeg: {
    audioFormat: string;
    audioQuality: string;
  };
  turso: {
    dbUrl: string;
    authToken: string;
  };
  chunkSize: number;
  chunkOverlap: number;
  logLevel: LogLevel;
}

const config: Config = {
  paths: {
    videos: join(projectRoot, "data", "videos"),
    audio: join(projectRoot, "data", "audio"),
    transcripts: join(projectRoot, "data", "transcripts"),
    content: join(projectRoot, "data", "content"),
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4",
    whisperModel: process.env.WHISPER_MODEL || "medium", // For local Whisper
  },
  ffmpeg: {
    audioFormat: "mp3",
    audioQuality: "5", // Higher is better
  },
  turso: {
    dbUrl: process.env.TURSO_DB_URL || "",
    authToken: process.env.TURSO_DB_AUTH_TOKEN || "",
  },
  chunkSize: 1000,
  chunkOverlap: 200,
  logLevel: (process.env.LOG_LEVEL as LogLevel) || "INFO",
};

export default config;
