export interface AIProvider {
  name: string;
  supportsVision: boolean;
  validateKey(key: string): Promise<boolean>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

export interface ContentPart {
  type: 'text' | 'image';
  text?: string;
  imageData?: string; // base64
  mimeType?: string;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export type AIErrorType = 'rate_limit' | 'auth' | 'network' | 'unknown';

export interface AIError {
  type: AIErrorType;
  message: string;
  cause?: unknown;
}

export type ProviderName = 'claude' | 'gemini' | 'gpt';
