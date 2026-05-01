import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, ChatMessage, ChatOptions, AIResponse, ContentPart } from '../types';
import { normalizeError } from '../errors';

export class AnthropicProvider implements AIProvider {
  readonly name = 'claude';
  readonly supportsVision = true;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const client = this.createClient(key);
      await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      });
      return true;
    } catch (error) {
      const normalized = normalizeError(error);
      if (normalized.type === 'auth') return false;
      throw normalized;
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse> {
    const client = this.createClient(this.apiKey);
    const { systemPrompt, chatMessages } = this.separateSystem(messages);

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: options?.maxTokens ?? 4096,
        ...(options?.temperature != null && { temperature: options.temperature }),
        ...(systemPrompt || options?.systemPrompt
          ? { system: options?.systemPrompt ?? systemPrompt ?? '' }
          : {}),
        messages: chatMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: this.formatContent(m.content),
        })),
      });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

      return {
        content: text,
        usage: response.usage
          ? { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens }
          : undefined,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  private createClient(key: string): Anthropic {
    return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  }

  private separateSystem(messages: ChatMessage[]) {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');
    const systemPrompt = systemMessages.length
      ? systemMessages.map((m) => (typeof m.content === 'string' ? m.content : '')).join('\n')
      : undefined;
    return { systemPrompt, chatMessages };
  }

  private formatContent(
    content: string | ContentPart[],
  ): string | Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> {
    if (typeof content === 'string') return content;
    return content.map((part) => {
      if (part.type === 'text') {
        return { type: 'text' as const, text: part.text ?? '' };
      }
      return {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: (part.mimeType ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: part.imageData ?? '',
        },
      };
    });
  }
}
