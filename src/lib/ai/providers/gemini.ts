import { GoogleGenerativeAI, type Content, type Part } from '@google/generative-ai';
import type { AIProvider, ChatMessage, ChatOptions, AIResponse, ContentPart } from '../types';
import { normalizeError } from '../errors';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  readonly supportsVision = true;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      await model.generateContent('hi');
      return true;
    } catch (error) {
      const normalized = normalizeError(error);
      if (normalized.type === 'auth') return false;
      throw normalized;
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const systemInstruction = this.extractSystemPrompt(messages, options?.systemPrompt);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      ...(systemInstruction ? { systemInstruction } : {}),
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 4096,
        ...(options?.temperature != null && { temperature: options.temperature }),
      },
    });

    const contents = this.formatContents(messages);

    try {
      const result = await model.generateContent({ contents });
      const response = result.response;
      const text = response.text();
      const usage = response.usageMetadata;

      return {
        content: text,
        usage: usage
          ? { inputTokens: usage.promptTokenCount ?? 0, outputTokens: usage.candidatesTokenCount ?? 0 }
          : undefined,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  private extractSystemPrompt(messages: ChatMessage[], optionsSystemPrompt?: string): string | undefined {
    if (optionsSystemPrompt) return optionsSystemPrompt;
    const systemMessages = messages.filter((m) => m.role === 'system');
    if (systemMessages.length === 0) return undefined;
    return systemMessages.map((m) => (typeof m.content === 'string' ? m.content : '')).join('\n');
  }

  private formatContents(messages: ChatMessage[]): Content[] {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: this.formatParts(m.content),
      }));
  }

  private formatParts(content: string | ContentPart[]): Part[] {
    if (typeof content === 'string') return [{ text: content }];
    return content.map((part): Part => {
      if (part.type === 'text') {
        return { text: part.text ?? '' };
      }
      return {
        inlineData: {
          mimeType: part.mimeType ?? 'image/jpeg',
          data: part.imageData ?? '',
        },
      };
    });
  }
}
