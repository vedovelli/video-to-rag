export interface ChatRequest {
  query: string;
  stream?: boolean;
}

export interface ChatResponse {
  response: string;
}

export interface ErrorResponse {
  error: string;
}
