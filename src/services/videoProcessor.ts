import {
  ensureDirectoryExists,
  getFilesWithExtension,
  getOutputPath,
} from "../utils/fileSystem";

import config from "../config";
import { logger } from "../utils/logger";
import { spawn } from "child_process";

export async function scanForVideos(): Promise<string[]> {
  logger.info("Scanning for MP4 videos...");
  return getFilesWithExtension(config.paths.videos, ".mp4");
}

export async function extractAudio(videoPath: string): Promise<string> {
  try {
    const outputPath = getOutputPath(
      videoPath,
      config.paths.audio,
      config.ffmpeg.audioFormat
    );

    await ensureDirectoryExists(config.paths.audio);

    logger.info(`Extracting audio from ${videoPath} to ${outputPath}`);

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        videoPath,
        "-vn", // No video
        "-acodec",
        config.ffmpeg.audioFormat,
        "-q:a",
        config.ffmpeg.audioQuality,
        "-y", // Overwrite output file
        outputPath,
      ]);

      let stderr = "";

      ffmpeg.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          logger.info(`Audio extracted successfully: ${outputPath}`);
          resolve(outputPath);
        } else {
          logger.error(`FFmpeg process exited with code ${code}`);
          logger.debug(`FFmpeg stderr: ${stderr}`);
          reject(new Error(`FFmpeg process failed with code ${code}`));
        }
      });
    });
  } catch (error) {
    logger.error(`Failed to extract audio from ${videoPath}`, error);
    throw error;
  }
}
