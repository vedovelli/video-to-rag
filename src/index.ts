import { logger } from "./utils/logger";
import { runPipeline } from "./pipeline";
import { startServer } from "./api/server";

async function main() {
  let server;

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
    server = startServer();
  } catch (error) {
    logger.error("Application failed", error);
    process.exit(1);
  }

  // Set up graceful shutdown
  const shutdown = () => {
    logger.info("Shutting down gracefully...");
    if (server) {
      logger.info("Closing server...");
      server.close();
    }
    process.exit(0);
  };

  // Listen for termination signals
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
