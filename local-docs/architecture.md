Packing repository using repomix...
Querying Gemini AI using gemini-2.0-flash-thinking-exp-01-21...
```markdown
# Architecture Overview: Video to RAG Chatbot

This document provides a comprehensive architectural overview of the Video to RAG Chatbot application. This application processes video files to create a Retrieval-Augmented Generation (RAG) chatbot, capable of answering user queries based on the content of the videos.

## 1. System Design

The system is designed as a pipeline that automates the process of converting video content into a knowledge base for a chatbot. The core functionalities include:

- **Video Processing**: Scanning for video files, extracting audio, and preparing them for transcription.
- **Transcription**: Converting audio to text transcripts using the OpenAI Whisper API.
- **Content Transformation**: Structuring the transcripts into user-friendly support pages in Markdown format using OpenAI's GPT models.
- **Vector Store Indexing**: Chunking the Markdown content, generating vector embeddings using OpenAI Embeddings API, and storing them in a Turso database for efficient similarity search.
- **Chatbot API**: Providing a REST API to query the knowledge base and generate responses using OpenAI's GPT models, leveraging the retrieved context from the vector store.
- **Command Line Interface (CLI) Chatbot**: Offering a CLI for direct interaction with the chatbot for testing and usage.

The architecture emphasizes modularity, allowing for easy maintenance and extension of individual components such as transcription services or vector storage solutions.

## 2. Component Structure

The codebase is structured into several key components, each with a specific responsibility:

### 2.1. API (`src/api/`)

- **`server.ts`**:  Sets up and runs the Hono.js web server, defining API endpoints.
- **`chatbotService.ts`**: Implements the core logic for handling chat requests, including querying the vector store and generating responses using OpenAI.
- **`types.ts`**: Defines TypeScript interfaces for API request and response bodies.
- **`test-api.ts`**: Contains functions to test the API endpoints.
- **`README.md`**: Provides documentation for the API endpoints.

**Responsibilities:**
- Exposes RESTful endpoints for external applications to interact with the chatbot.
- Handles HTTP requests and responses, routing them to the appropriate services.
- Implements input validation and error handling for API requests.

**Key Technologies:**
- **Hono.js**:  Lightweight web framework for routing and middleware.
- **CORS (hono/cors)**: Middleware for handling Cross-Origin Resource Sharing.

### 2.2. Services (`src/services/`)

- **`videoProcessor.ts`**: Handles video file scanning and audio extraction using FFmpeg.
- **`transcriber.ts`**: Manages audio transcription using the OpenAI Whisper API.
- **`contentGenerator.ts`**: Transforms text transcripts into structured Markdown support pages using OpenAI's GPT models.
- **`vectorStore.ts`**:  Encapsulates the logic for interacting with the vector database (Turso), including embedding generation, document indexing, and similarity searching.

**Responsibilities:**
- Contains the core business logic of the application.
- Orchestrates video processing, transcription, content transformation, and vector store operations.
- Interacts with external services like OpenAI API and FFmpeg.
- Manages data processing and transformation workflows.

**Key Technologies:**
- **OpenAI API (openai)**: For Whisper transcription and GPT content generation.
- **FFmpeg**:  Command-line tool for audio extraction.
- **uuid**: For generating unique identifiers for documents in the vector store.

### 2.3. Utils (`src/utils/`)

- **`db.ts`**:  Provides functions for interacting with the Turso database, including initialization, document insertion, and similarity search queries.
- **`fileSystem.ts`**:  Utility functions for file system operations like directory creation, file listing, and path manipulation.
- **`logger.ts`**:  Configurable logger for application logging with different levels (DEBUG, INFO, WARN, ERROR).
- **`openai.ts`**:  Encapsulates the OpenAI Embeddings API client for generating vector embeddings.

**Responsibilities:**
- Provides reusable utility functions and helper classes.
- Abstracts database interactions, file system operations, and logging.
- Centralizes OpenAI API client initialization and embedding generation logic.

**Key Technologies:**
- **Turso SDK (@libsql/client)**: For interacting with the Turso database.
- **OpenAI SDK (openai)**: For accessing OpenAI Embeddings API.

### 2.4. Core Application Files (`src/`)

- **`index.ts`**:  Entry point of the application, responsible for starting the pipeline and/or the API server based on command-line arguments.
- **`pipeline.ts`**:  Defines and orchestrates the end-to-end video processing pipeline.
- **`chatbot.ts`**: Implements the command-line chatbot interface.
- **`query.ts`**:  Utility script for directly querying the vector store from the command line.
- **`config.ts`**:  Loads and manages application configuration from environment variables and default values.
- **`initialize-db.ts`**:  Script to initialize the Turso database schema and vector index.
- **`count-documents.ts`**: Utility to count and display sample documents in the vector store for debugging and monitoring.
- **`test-chatbot.ts`**: Script to test the chatbot functionality from the command line.

**Responsibilities:**
- Orchestrates the overall application flow.
- Defines the video processing pipeline and chatbot interactions.
- Manages application configuration and initialization.
- Provides CLI tools for testing, querying, and database management.

**Key Technologies:**
- **Bun**: Runtime environment and task runner.
- **dotenv**: For loading environment variables from `.env` files.

## 3. Data Flow

The data flow within the application can be summarized as follows:

1. **Video Input**: MP4 video files are placed in the `data/videos/` directory.
2. **Scan for Videos**: The `videoProcessor.scanForVideos()` function identifies MP4 files in the input directory.
3. **Audio Extraction**: For each video, `videoProcessor.extractAudio()` uses FFmpeg to extract the audio track and saves it as an audio file (e.g., MP3) in `data/audio/`.
4. **Audio Transcription**: `transcriber.transcribeAudio()` takes the extracted audio file and sends it to the OpenAI Whisper API for transcription. The resulting text transcript is saved in `data/transcripts/` as a TXT file.
5. **Content Transformation**: `contentGenerator.transformToSupportPage()` reads the transcript file and uses OpenAI's GPT models to transform it into a well-structured support page in Markdown format. This Markdown content is saved in `data/content/` as an MD file.
6. **Vector Store Processing**: `vectorStore.processContentForRAG()` reads the Markdown content file.
    - **Chunking**: The content is split into smaller chunks using `vectorStore.chunkDocument()`.
    - **Embedding Generation**: For each chunk, `OpenAIEmbeddings.embed()` from `openai.ts` is used to generate a vector embedding using the OpenAI Embeddings API.
    - **Document Storage**: The chunks, along with their embeddings and metadata (source path, chunk index, title), are stored as documents in the Turso database using `db.insertDocument()` from `db.ts`.
7. **Chatbot Query**:
    - When a user sends a query through the API or CLI, `chatbotService.generateResponse()` is invoked.
    - **Query Embedding**:  The user query is embedded using `OpenAIEmbeddings.embed()`.
    - **Similarity Search**: `vectorStore.similaritySearch()` queries the Turso database using `db.findSimilarDocuments()` to find document chunks that are semantically similar to the query embedding.
    - **Context Retrieval**: Relevant document chunks are retrieved from the vector store.
    - **Response Generation**: The retrieved context, along with the user query, is sent to OpenAI's GPT models via `openai.chat.completions.create()` in `chatbotService.generateResponse()`. The GPT model generates a response based on the provided context.
8. **Chatbot Response Output**: The generated response is returned to the user via the API as a JSON response or displayed in the CLI.

## 4. Key Technologies Used

- **Bun**:  A fast JavaScript runtime, bundler, and package manager used as the primary execution environment.
- **FFmpeg**: A command-line tool used for extracting audio from video files.
- **OpenAI API**:
    - **Whisper API**: For transcribing audio to text.
    - **GPT Models (e.g., gpt-4, gpt-4o)**: For transforming transcripts into support pages and generating chatbot responses.
    - **Embeddings API**: For generating vector embeddings of text for semantic similarity search.
- **Turso**: An edge database based on libSQL, used for storing vector embeddings and performing similarity searches.
- **Hono.js**: A lightweight web framework used to build the REST API.
- **libSQL/client**:  The official JavaScript client for Turso databases.
- **uuid**: A library for generating universally unique identifiers for database records.
- **dotenv**: A library for loading environment variables from `.env` files, used for managing API keys and database credentials.
- **Node.js standard libraries**:  `path`, `fs/promises`, `child_process`, `readline` for file system operations, process management, and command-line interface.
- **Markdown**:  A lightweight markup language used for structuring support page content.

## 5. Deployment Considerations

- **Environment Variables**: API keys for OpenAI and database credentials for Turso are managed through environment variables, ensuring security and configurability.
- **Containerization**: The application can be containerized using Docker for easier deployment and portability across different environments.
- **Cloud Deployment**: The application can be deployed to cloud platforms like AWS, Google Cloud, or Azure. Turso's edge database nature is well-suited for cloud deployments, and serverless functions could be used to host the API.
- **Scalability**:  The system's scalability depends on the capacity of the Turso database and the OpenAI API limits. Vector search performance in Turso is optimized for large datasets, and OpenAI's services are designed to handle high volumes of requests.

This architectural overview provides a detailed understanding of the Video to RAG Chatbot application's design, components, data flow, and technologies. It serves as a valuable resource for development, maintenance, and future enhancements of the system.
```