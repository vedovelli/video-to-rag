import { dirname, join } from "path";

import { config } from "dotenv";
import { fileURLToPath } from "url";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

export default {
  paths: {
    videos: join(projectRoot, "data", "videos"),
    audio: join(projectRoot, "data", "audio"),
    transcripts: join(projectRoot, "data", "transcripts"),
    content: join(projectRoot, "data", "content"),
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o",
    whisperModel: process.env.WHISPER_MODEL || "medium", // For local Whisper
  },
  ffmpeg: {
    audioFormat: "flac",
    audioQuality: "5", // Higher is better
  },
  supabase: {
    url: process.env.SUPABASE_URL || "",
    key: process.env.SUPABASE_KEY || "",
    vectorDimension: 1536, // OpenAI's embedding dimension
    documentsTable: "documents",
  },
  chunkSize: 1000,
  chunkOverlap: 200,
};
