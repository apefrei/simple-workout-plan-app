import type { AIProvider, ProviderName } from './types';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';

export function createProvider(name: ProviderName, apiKey: string): AIProvider {
  switch (name) {
    case 'claude':
      return new AnthropicProvider(apiKey);
    case 'gpt':
      return new OpenAIProvider(apiKey);
    case 'gemini':
      return new GeminiProvider(apiKey);
    default: {
      const _exhaustive: never = name;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}
