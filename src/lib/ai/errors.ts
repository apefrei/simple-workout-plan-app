import type { AIError, AIErrorType } from './types';

export function normalizeError(error: unknown): AIError {
  if (error instanceof Error) {
    const errObj = error as unknown as Record<string, unknown>;
    const status = errObj.status as number | undefined;
    const code = errObj.code as string | undefined;

    if (status === 429 || code === 'rate_limit_error') {
      return { type: 'rate_limit', message: 'Rate limit exceeded. Please wait a moment and try again.', cause: error };
    }
    if (status === 401 || status === 403 || code === 'authentication_error' || code === 'invalid_api_key') {
      return { type: 'auth', message: 'Invalid or expired API key. Please check your settings.', cause: error };
    }
    if (error.message.includes('fetch') || error.message.includes('network') || code === 'ECONNREFUSED') {
      return { type: 'network', message: 'Network error. Please check your connection.', cause: error };
    }
    return { type: inferErrorType(error.message), message: error.message, cause: error };
  }
  return { type: 'unknown', message: 'An unexpected error occurred.', cause: error };
}

function inferErrorType(message: string): AIErrorType {
  const lower = message.toLowerCase();
  if (lower.includes('rate') || lower.includes('429') || lower.includes('quota')) return 'rate_limit';
  if (lower.includes('auth') || lower.includes('key') || lower.includes('401') || lower.includes('403')) return 'auth';
  if (lower.includes('network') || lower.includes('timeout') || lower.includes('connect')) return 'network';
  return 'unknown';
}
