import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type {
  BedrockModelOptions,
  BedrockModelInfo,
  BedrockResponse,
  BedrockRequestBody,
  BedrockError,
} from '../types/index.js';

export class BedrockService {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      // AWS SDK will automatically use credentials from:
      // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
      // 2. IAM roles (if running on EC2)
      // 3. AWS credentials file
      // 4. Other credential providers in the chain
    });

    this.modelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0';
  }

  /**
   * Calls AWS Bedrock using the currently configured model.
   * Supports Anthropic Claude models and Meta Llama models on Bedrock.
   */
  async callModel(
    prompt: string,
    options: BedrockModelOptions = {}
  ): Promise<string> {
    try {
      const {
        maxTokens = 4000,
        temperature = 0.1,
        topP = 0.9,
        topK = 250,
        stopSequences = [],
      } = options;
      const formattedPrompt = prompt;

      // Decide request schema based on provider
      let body: any;
      if (this.isAnthropicModel()) {
        const requestBody: BedrockRequestBody = {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: maxTokens,
          temperature: temperature,
          top_p: topP,
          top_k: topK,
          stop_sequences: stopSequences,
          messages: [
            {
              role: 'user',
              content: formattedPrompt,
            },
          ],
        };
        body = requestBody;
      } else if (this.isMetaLlamaModel()) {
        // Meta Llama request shape for Bedrock
        body = {
          prompt: formattedPrompt,
          max_gen_len: maxTokens,
          temperature: temperature,
          top_p: topP,
          ...(stopSequences.length ? { stop: stopSequences } : {}),
        };
      } else {
        // Default to Anthropic schema if unknown
        const requestBody: BedrockRequestBody = {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: maxTokens,
          temperature: temperature,
          top_p: topP,
          top_k: topK,
          stop_sequences: stopSequences,
          messages: [
            {
              role: 'user',
              content: formattedPrompt,
            },
          ],
        };
        body = requestBody;
      }

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(body),
      });

      console.log(`Calling Bedrock model: ${this.modelId}`);
      const response = await this.client.send(command);

      // Parse the response based on model provider
      const rawText = new TextDecoder().decode(response.body);
      const responseBody = JSON.parse(rawText) as any;

      if (this.isAnthropicModel()) {
        const anthropic = responseBody as BedrockResponse;
        if (anthropic.content && anthropic.content.length > 0) {
          return anthropic.content[0]?.text || '';
        }
        throw new Error('No content in response from Anthropic model');
      }

      if (this.isMetaLlamaModel()) {
        // Meta Llama typically returns { generation: string, ... }
        const text = responseBody.generation || responseBody.output_text || '';
        if (typeof text === 'string' && text.length > 0) {
          return text;
        }
        throw new Error('No content in response from Meta Llama model');
      }

      // Fallback attempt
      return (
        responseBody?.content?.[0]?.text ||
        responseBody?.generation ||
        responseBody?.output_text ||
        ''
      );
    } catch (error) {
      console.error('Error calling Bedrock:', error);
      throw this.handleBedrockError(error);
    }
  }

  // Removed callClaude; use callModel instead

  private isAnthropicModel(): boolean {
    return this.modelId.includes('us.anthropic.');
  }

  private isMetaLlamaModel(): boolean {
    return this.modelId.includes('meta.llama');
  }


  /**
   * Gets information about the current model
   */
  getModelInfo(): BedrockModelInfo {
    const region = process.env.AWS_REGION || 'us-east-1';
    if (this.isMetaLlamaModel()) {
      return {
        modelId: this.modelId,
        provider: 'Meta',
        modelName: 'Llama (Bedrock)',
        region,
      };
    }
    return {
      modelId: this.modelId,
      provider: 'Anthropic',
      modelName: 'Claude (Bedrock)',
      region,
    };
  }

  /**
   * Validates prompt content
   */
  validatePrompt(prompt: string): boolean {
    return typeof prompt === 'string' && prompt.trim().length > 0;
  }

  /**
   * Handles Bedrock-specific errors with proper typing
   */
  private handleBedrockError(error: unknown): Error {
    if (this.isBedrockError(error)) {
      switch (error.name) {
        case 'ValidationException':
          return new Error(`Validation error: ${error.message}`);
        case 'ThrottlingException':
          return new Error('Request was throttled. Please try again later.');
        case 'AccessDeniedException':
          return new Error('Access denied. Please check your AWS credentials and permissions.');
        case 'ResourceNotFoundException':
          return new Error(`Model not found: ${this.modelId}`);
        case 'InternalServerException':
          return new Error('Internal server error from AWS Bedrock.');
        default:
          return new Error(`AWS Bedrock error: ${error.message}`);
      }
    }

    if (error instanceof Error) {
      return new Error(`Failed to call Bedrock: ${error.message}`);
    }

    return new Error('Unknown error occurred while calling Bedrock');
  }

  /**
   * Type guard for Bedrock errors
   */
  private isBedrockError(error: unknown): error is BedrockError {
    return (
      error instanceof Error &&
      'name' in error &&
      typeof error.name === 'string' &&
      [
        'ValidationException',
        'ThrottlingException',
        'AccessDeniedException',
        'ResourceNotFoundException',
        'InternalServerException',
      ].includes(error.name)
    );
  }

  /**
   * Sets a custom model ID
   */
  setModelId(modelId: string): void {
    this.modelId = modelId;
  }

  /**
   * Gets the current model ID
   */
  getModelId(): string {
    return this.modelId;
  }

  /**
   * Creates a new instance with different AWS region
   */
  static createWithRegion(region: string): BedrockService {
    const service = new BedrockService();
    service.client = new BedrockRuntimeClient({ region });
    return service;
  }
}

export default BedrockService;
