import { logger } from "./utils/logger";
import { runPipeline } from "./pipeline";
import { startServer } from "./api/server";

async function main() {
  try {
    // Check if we should run the pipeline or just start the server
    const shouldRunPipeline = process.argv.includes("--run-pipeline");

    if (shouldRunPipeline) {
      logger.info("Starting pipeline...");
      await runPipeline();
      logger.info("Pipeline completed successfully");
    }

    // Start the API server
    logger.info("Starting API server...");
    startServer();
  } catch (error) {
    logger.error("Application failed", error);
    process.exit(1);
  }
}

main();
