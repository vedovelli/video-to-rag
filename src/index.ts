import { logger } from "./utils/logger";
import { runPipeline } from "./pipeline";

async function main() {
  try {
    await runPipeline();
  } catch (error) {
    logger.error("Application failed", error);
    process.exit(1);
  }
}

main();
