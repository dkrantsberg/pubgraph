// AWS Bedrock Types - Only the types actually used in the codebase

export interface BedrockModelOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
}

export interface BedrockModelInfo {
  modelId: string;
  provider: string;
  modelName: string;
  region: string;
}

export interface BedrockResponse {
  content: Array<{
    text: string;
    type: string;
  }>;
  id: string;
  model: string;
  role: string;
  stop_reason: string;
  stop_sequence: string | null;
  type: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface BedrockRequestBody {
  anthropic_version: string;
  max_tokens: number;
  temperature: number;
  top_p: number;
  top_k: number;
  stop_sequences: string[];
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// Error Types
export type BedrockErrorType =
  | 'ValidationException'
  | 'ThrottlingException'
  | 'AccessDeniedException'
  | 'ResourceNotFoundException'
  | 'InternalServerException';

export interface BedrockError extends Error {
  name: BedrockErrorType;
  statusCode?: number;
  code?: string;
}