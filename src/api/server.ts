import type { ChatRequest, ChatResponse, ErrorResponse } from "./types";

import { ChatbotService } from "./services/chatbotService";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "../utils/logger";
import { serve } from "@hono/node-server";

// Initialize the Hono app
const app = new Hono();

// Add middleware
app.use(cors());

// Initialize services
const chatbotService = new ChatbotService();

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "Chatbot API is running",
  });
});

// Chat endpoint
app.post("/api/chat", async (c) => {
  try {
    const body = await c.req.json<ChatRequest>();
    const { query } = body;

    if (!query || typeof query !== "string") {
      const errorResponse: ErrorResponse = {
        error: "Query is required and must be a string",
      };
      return c.json(errorResponse, 400);
    }

    const response = await chatbotService.generateResponse(query);
    const chatResponse: ChatResponse = { response };
    return c.json(chatResponse);
  } catch (error) {
    logger.error("Error in chat endpoint:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return c.json(errorResponse, 500);
  }
});

// Start the server
// Note: The "Failed to find Response internal state key" warning is a known issue with Bun and Hono
// It doesn't affect functionality and can be safely ignored
const PORT = process.env.PORT || 3000;

export function startServer() {
  try {
    const server = serve({
      fetch: app.fetch,
      port: Number(PORT),
    });

    logger.info(`Server is running on http://localhost:${PORT}`);

    return server;
  } catch (error) {
    logger.error(`Failed to start server on port ${PORT}.`, error);

    // Check for common error patterns that indicate port is in use
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isPortInUse =
      errorMessage.includes("EADDRINUSE") ||
      errorMessage.includes("address already in use") ||
      (errorMessage.includes("port") && errorMessage.includes("use"));

    if (isPortInUse) {
      const alternativePort = Number(PORT) + 1;
      logger.info(
        `Port ${PORT} is in use. Attempting to use alternative port: ${alternativePort}`
      );

      try {
        const server = serve({
          fetch: app.fetch,
          port: alternativePort,
        });

        logger.info(`Server is running on http://localhost:${alternativePort}`);
        return server;
      } catch (retryError) {
        logger.error(
          `Failed to start server on alternative port ${alternativePort}`,
          retryError
        );
        throw new Error(
          `Could not start server on ports ${PORT} or ${alternativePort}. Please ensure these ports are available.`
        );
      }
    }

    throw new Error(`Failed to start server: ${errorMessage}`);
  }
}

// If this file is run directly
if (import.meta.url === Bun.main) {
  startServer();
}

export default app;
