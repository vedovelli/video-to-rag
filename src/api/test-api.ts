import fetch from "node-fetch";
import { logger } from "../utils/logger";

async function testRegularResponse() {
  console.log("Testing regular response...");

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "Como faço para criar um novo usuário?",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as { response: string };
    console.log("Regular Response:", data.response);
  } catch (error) {
    console.error("Error testing regular response:", error);
  }
}

async function testStreamingResponse() {
  console.log("\nTesting streaming response...");

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "Como faço para criar um novo usuário?",
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("Streaming Response:");

    // Handle streaming response
    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body as any;
    const decoder = new TextDecoder();

    let result = "";
    const readableStreamReader = reader.getReader();

    while (true) {
      const { done, value } = await readableStreamReader.read();

      if (done) {
        break;
      }

      const text = decoder.decode(value);
      process.stdout.write(text);
      result += text;
    }

    console.log("\n\nStreaming response complete!");
  } catch (error) {
    console.error("Error testing streaming response:", error);
  }
}

async function main() {
  await testRegularResponse();
  await testStreamingResponse();
}

main().catch(console.error);
