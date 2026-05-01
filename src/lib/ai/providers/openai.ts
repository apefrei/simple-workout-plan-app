import OpenAI from 'openai';
import type { AIProvider, ChatMessage, ChatOptions, AIResponse, ContentPart } from '../types';
import { normalizeError } from '../errors';

export class OpenAIProvider implements AIProvider {
  readonly name = 'gpt';
  readonly supportsVision = true;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
      await client.chat.completions.create({
        model: 'gpt-4o-mini',
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
    const client = new OpenAI({ apiKey: this.apiKey, dangerouslyAllowBrowser: true });

    const openaiMessages = this.formatMessages(messages, options?.systemPrompt);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: options?.maxTokens ?? 4096,
        ...(options?.temperature != null && { temperature: options.temperature }),
        messages: openaiMessages,
      });

      return {
        content: response.choices[0]?.message?.content ?? '',
        usage: response.usage
          ? { inputTokens: response.usage.prompt_tokens, outputTokens: response.usage.completion_tokens ?? 0 }
          : undefined,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  private formatMessages(
    messages: ChatMessage[],
    systemPrompt?: string,
  ): OpenAI.ChatCompletionMessageParam[] {
    const result: OpenAI.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      result.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      if (msg.role === 'system') {
        result.push({ role: 'system', content: typeof msg.content === 'string' ? msg.content : '' });
      } else if (msg.role === 'assistant') {
        result.push({ role: 'assistant', content: typeof msg.content === 'string' ? msg.content : '' });
      } else {
        result.push({ role: 'user', content: this.formatContent(msg.content) });
      }
    }

    return result;
  }

  private formatContent(content: string | ContentPart[]): string | OpenAI.ChatCompletionContentPart[] {
    if (typeof content === 'string') return content;
    return content.map((part): OpenAI.ChatCompletionContentPart => {
      if (part.type === 'text') {
        return { type: 'text', text: part.text ?? '' };
      }
      return {
        type: 'image_url',
        image_url: { url: `data:${part.mimeType ?? 'image/jpeg'};base64,${part.imageData ?? ''}` },
      };
    });
  }
}
