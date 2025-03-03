# Chatbot API

This API provides a simple interface to interact with the chatbot.

## Endpoints

### Health Check

```
GET /
```

Returns a simple health check response to verify the API is running.

**Response:**

```json
{
  "status": "ok",
  "message": "Chatbot API is running"
}
```

### Chat

```
POST /api/chat
```

Send a query to the chatbot and receive a response.

**Request Body:**

```json
{
  "query": "Your question here",
  "stream": false
}
```

- `query` (string, required): The question to ask the chatbot
- `stream` (boolean, optional, default: false): Whether to stream the response

**Response (non-streaming):**

```json
{
  "response": "The chatbot's response here"
}
```

**Response (streaming):**

When `stream` is set to `true`, the response will be streamed as a text/event-stream. Each chunk of the response will be sent as it's generated.

## Streaming Example

### Client-side JavaScript Example

```javascript
async function streamChatResponse(query) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";

  // Read the stream
  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const text = decoder.decode(value);
    result += text;

    // Update UI with the partial response
    document.getElementById("response").textContent = result;
  }

  return result;
}
```

### Node.js Example

```javascript
import fetch from "node-fetch";

async function streamChatResponse(query) {
  const response = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body;
  const decoder = new TextDecoder();

  const readableStreamReader = reader.getReader();

  while (true) {
    const { done, value } = await readableStreamReader.read();

    if (done) {
      break;
    }

    const text = decoder.decode(value);
    process.stdout.write(text);
  }
}
```

## Testing

You can test the API using the provided test script:

```bash
bun run test:api
```

This will test both regular and streaming responses.

## Running the API

To run the API server:

```bash
bun run src/index.ts
```

The server will start on port 3000 by default. You can change this by setting the PORT environment variable.

To run the pipeline and then start the API server:

```bash
bun run src/index.ts --run-pipeline
```

> **Note:** When running with Bun, you may see a warning message: "Failed to find Response internal state key". This is a known issue with Bun and Hono, but it doesn't affect functionality and can be safely ignored.
