import { extractAudio, scanForVideos } from "./services/videoProcessor";

import { logger } from "./utils/logger";
import { processContentForRAG } from "./services/vectorStore";
import { transcribeAudio } from "./services/transcriber";
import { transformToSupportPage } from "./services/contentGenerator";

export async function processVideo(videoPath: string): Promise<boolean> {
  try {
    logger.info(`Starting pipeline for video: ${videoPath}`);

    // Step 1: Extract audio
    logger.info(`Extracting audio from ${videoPath}`);
    const audioPath = await extractAudio(videoPath);

    // Step 2: Transcribe audio
    logger.info(`Transcribing audio from ${audioPath}`);
    const transcriptPath = await transcribeAudio(audioPath);

    // Step 3: Generate support page content
    logger.info(`Generating content from ${transcriptPath}`);
    const contentPath = await transformToSupportPage(transcriptPath);

    // Step 4: Process for RAG
    logger.info(`Processing content for RAG: ${contentPath}`);
    await processContentForRAG(contentPath);

    logger.info(`Pipeline completed successfully for ${videoPath}`);
    return true;
  } catch (error) {
    logger.error(`Pipeline failed for ${videoPath}`, error);
    return false;
  }
}

export async function runPipeline() {
  try {
    logger.info("Starting video processing pipeline");

    // Get all videos
    const videos = await scanForVideos();
    logger.info(`Found ${videos.length} videos to process`);

    if (videos.length === 0) {
      logger.warn("No videos found in the videos directory");
      return;
    }

    // Track successes and failures
    const results: Record<string, boolean> = {};

    // Process each video
    for (const videoPath of videos) {
      results[videoPath] = await processVideo(videoPath);
    }

    // Log summary
    const successCount = Object.values(results).filter(Boolean).length;
    logger.info(
      `Pipeline completed. Processed ${successCount}/${videos.length} videos successfully`
    );

    // Log failures if any
    const failures = Object.entries(results)
      .filter(([_, success]) => !success)
      .map(([path]) => path);

    if (failures.length > 0) {
      logger.warn(`Failed to process ${failures.length} videos:`);
      failures.forEach((path) => logger.warn(`- ${path}`));
    }

    return results;
  } catch (error) {
    logger.error("Pipeline execution failed", error);
    throw error;
  }
}
