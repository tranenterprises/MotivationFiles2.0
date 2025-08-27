// Retry utilities for edge functions
// Adapted from existing API retry patterns

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  exponentialBackoff?: boolean;
  retryIf?: (error: any) => boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  exponentialBackoff: true,
  retryIf: isRetryableError,
};

export function isRetryableError(error: any): boolean {
  if (!error) return false;

  const status = error?.status || error?.response?.status;

  // HTTP status codes that warrant retry
  const retryableStatuses = [429, 500, 502, 503, 504, 520, 521, 522, 523, 524];
  if (retryableStatuses.includes(status)) {
    return true;
  }

  // Network/connection errors
  const message = error?.message?.toLowerCase() || '';
  const networkErrors = [
    'network error',
    'connection timeout',
    'connection reset',
    'socket timeout',
    'enotfound',
    'econnreset',
    'etimedout',
    'fetch failed',
    'network request failed',
  ];

  if (networkErrors.some(errorType => message.includes(errorType))) {
    return true;
  }

  return false;
}

export function isVoiceError(error: any): boolean {
  if (!error) return false;

  const message = error?.message?.toLowerCase() || '';
  const voiceErrors = [
    'voice not found',
    'voice unavailable',
    'voice model error',
    'invalid voice',
    'voice id not found',
    'voice quota exceeded',
  ];

  return voiceErrors.some(errorType => message.includes(errorType));
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function calculateDelay(attempt: number, options: RetryOptions): number {
  const {
    baseDelayMs,
    maxDelayMs = 10000,
    exponentialBackoff = true,
  } = options;

  let delay = exponentialBackoff
    ? baseDelayMs * Math.pow(2, attempt - 1)
    : baseDelayMs;

  // Add jitter to prevent thundering herd
  delay *= 0.5 + Math.random() * 0.5;

  return Math.min(delay, maxDelayMs);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if we should retry this error
      if (!opts.retryIf || !opts.retryIf(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      const delay = calculateDelay(attempt, opts);
      console.warn(
        `Operation failed on attempt ${attempt}/${opts.maxRetries}, retrying in ${delay}ms...`,
        error.message
      );

      await sleep(delay);
    }
  }

  throw new Error(
    `Operation failed after ${opts.maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`
  );
}
