import { initializeDb } from "./utils/db";
import { logger } from "./utils/logger";

// Execute the initialization
initializeDb()
  .then(() => {
    logger.info("Database initialization completed");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Database initialization failed: ${error}`);
    process.exit(1);
  });
