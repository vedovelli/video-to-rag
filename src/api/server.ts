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
const PORT = process.env.PORT || 3000;

export function startServer() {
  serve({
    fetch: app.fetch,
    port: Number(PORT),
  });

  logger.info(`Server is running on http://localhost:${PORT}`);
}

// If this file is run directly
if (import.meta.url === Bun.main) {
  startServer();
}

export default app;
