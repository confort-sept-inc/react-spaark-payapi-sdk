import { Logger } from './logger';
import { PawapayError } from './errors';

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.3 * delay;
  return Math.min(delay + jitter, config.maxDelay);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  logger?: Logger
): Promise<T> {
  const resolvedConfig: Required<RetryConfig> = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= resolvedConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable =
        error instanceof PawapayError
          ? error.retryable
          : isNetworkError(error);

      if (!isRetryable || attempt === resolvedConfig.maxAttempts) {
        throw error;
      }

      const delay = calculateDelay(attempt, resolvedConfig);

      logger?.warn(
        `Attempt ${attempt}/${resolvedConfig.maxAttempts} failed, retrying in ${Math.round(delay)}ms`,
        { error: lastError.message }
      );

      await sleep(delay);
    }
  }

  throw lastError ?? new Error('Retry failed without error');
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof PawapayError) {
    return error.retryable;
  }

  if (error instanceof Error) {
    const networkErrorMessages = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'Network Error',
      'timeout',
      'socket hang up',
    ];

    return networkErrorMessages.some(
      (msg) =>
        error.message.includes(msg) ||
        (error as NodeJS.ErrnoException).code === msg
    );
  }

  return false;
}
