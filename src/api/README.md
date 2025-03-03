# Chatbot API

This is a REST API for the chatbot using Hono.

## Endpoints

### Health Check

```
GET /
```

Returns a simple health check response.

**Response**

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

Send a query to the chatbot and get a response.

**Request Body**

```json
{
  "query": "Your question here"
}
```

**Response**

```json
{
  "response": "The chatbot's response here"
}
```

**Error Response**

```json
{
  "error": "Error message here"
}
```

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

## Testing the API

To test the API:

```bash
bun run src/api/test-api.ts
```
