import { logger } from "../utils/logger";

async function testChatEndpoint() {
  try {
    logger.info("Testing chat endpoint...");

    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "Como funciona o sistema de suporte?",
      }),
    });

    const data = await response.json();

    logger.info("Response status:", response.status);
    logger.info("Response data:", data);

    return data;
  } catch (error) {
    logger.error("Error testing chat endpoint:", error);
    throw error;
  }
}

async function main() {
  try {
    // Test the chat endpoint
    await testChatEndpoint();

    logger.info("API tests completed successfully");
  } catch (error) {
    logger.error("API tests failed:", error);
    process.exit(1);
  }
}

// Run the tests
main();
