// AWS Bedrock Types
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

// API Response Types
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: true;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
}

export interface ApiInfoResponse {
  name: string;
  version: string;
  description: string;
  endpoints: Record<string, string>;
}

// LLM API Types
export interface LLMAnalyzeRequest {
  prompt: string;
  csvData: string;
  options?: BedrockModelOptions;
}

export interface LLMAnalyzeFilesRequest {
  promptFilePath: string;
  csvFilePath: string;
  options?: BedrockModelOptions;
}

export interface LLMTestRequest {
  options?: BedrockModelOptions;
}

export interface LLMAnalyzeResponse {
  response: string;
  processingTime: number;
  options: BedrockModelOptions;
  promptFilePath?: string;
  csvFilePath?: string;
  filesUsed?: {
    prompt: string;
    csv: string;
  };
}

// CSV Data Types
export interface PublicationData {
  title: string;
  abstract: string;
  authors: string;
  journal: string;
  year: string;
  doi: string;
}

export interface CSVRecord {
  [key: string]: string | undefined;
}

// Configuration Types
export interface EnvironmentConfig {
  PORT: string;
  HOST: string;
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL: string;
  CORS_ORIGIN: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  BEDROCK_MODEL_ID: string;
  BEDROCK_MAX_TOKENS: string;
  BEDROCK_TEMPERATURE: string;
}

export interface FastifyConfig {
  PORT: string;
  NODE_ENV: string;
  CORS_ORIGIN: string;
}

// Fastify Route Types
export interface ItemParams {
  id: string;
}

export interface ItemBody {
  name?: string;
  description?: string;
  [key: string]: any;
}

export interface ItemResponse {
  id: string | number;
  name: string;
  [key: string]: any;
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

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

// File Operation Types
export interface FileReadResult {
  content: string;
  path: string;
  size: number;
}

export interface CSVParseResult {
  records: CSVRecord[];
  headers: string[];
  rowCount: number;
}

// Logging Types
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerConfig {
  level: LogLevel;
  transport?: {
    target: string;
    options: Record<string, any>;
  };
}

// Service Response Types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// AWS SDK Types (extending existing types)
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export interface AWSConfig {
  region: string;
  credentials?: AWSCredentials;
}

// Test Types
export interface TestResult {
  success: boolean;
  duration: number;
  response?: string;
  error?: string;
  statistics: {
    responseLength: number;
    wordCount: number;
    lineCount: number;
  };
}

// Route Handler Types (for Fastify)
export interface RouteHandlerContext {
  log: any;
  config: FastifyConfig;
}

// Validation Schema Types
export interface ValidationSchema {
  type: 'object';
  required?: string[];
  properties: Record<string, {
    type: string;
    default?: any;
    format?: string;
    minimum?: number;
    maximum?: number;
  }>;
}

// Plugin Types
export interface PluginOptions {
  [key: string]: any;
}

// Security Types
export interface SecurityHeaders {
  contentSecurityPolicy?: {
    directives: Record<string, string[]>;
  };
}

export interface CorsOptions {
  origin: string | string[];
  methods: string[];
  allowedHeaders: string[];
}

// Database Types (for future use)
export interface DatabaseConfig {
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

// Authentication Types (for future use)
export interface JWTConfig {
  secret: string;
  expiresIn?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Neo4j Knowledge Graph Types
export interface BiologicalTriple {
  subject: string;
  subject_type: string;
  subject_qualifier: string[] | null;
  object: string;
  object_type: string;
  object_qualifier: string[] | null;
  relationship: string;
  statement_qualifier: string[] | null;
}

export interface PaperData {
  id: number;
  title: string;
  summary: string;
  biological_entities: string[];
  core_triples: BiologicalTriple[];
}

export interface Neo4jNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface Neo4jRelationship {
  id: string;
  type: string;
  startNodeId: string;
  endNodeId: string;
  properties: Record<string, any>;
}

export interface CypherQuery {
  query: string;
  parameters?: Record<string, any>;
}

export interface Neo4jIngestionResult {
  nodesCreated: number;
  relationshipsCreated: number;
  cypherQueries: CypherQuery[];
  errors: string[];
}

export interface EntityNode {
  name: string;
  type: string;
  qualifiers?: string[];
}

export interface KnowledgeGraphStats {
  totalPapers: number;
  totalEntities: number;
  totalRelationships: number;
  entityTypes: Record<string, number>;
  relationshipTypes: Record<string, number>;
}

// Export all types
export * from './index';
