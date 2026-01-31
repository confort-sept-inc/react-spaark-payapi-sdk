import { z } from 'zod';
import type { SpaarkPayApiSdkConfig, ResolvedConfig, LogLevel } from './types/config';
import { DEFAULT_CONFIG } from './types/config';
import { PawapayError } from './core/errors';

const configSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  environment: z.enum(['sandbox', 'production']),
  baseUrl: z.string().url().optional(),
  callbackUrl: z.string().url().optional(),
  timeout: z.number().positive().max(600000).optional(),
  retries: z.number().int().min(0).max(10).optional(),
  retryDelay: z.number().positive().max(60000).optional(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error', 'none']).optional(),
});

export function resolveConfig(config: SpaarkPayApiSdkConfig): ResolvedConfig {
  const result = configSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw PawapayError.validation(`Invalid SDK configuration: ${errors.join(', ')}`);
  }

  const validated = result.data;

  const baseUrl =
    validated.baseUrl ??
    (validated.environment === 'production'
      ? DEFAULT_CONFIG.productionUrl
      : DEFAULT_CONFIG.sandboxUrl);

  return {
    apiKey: validated.apiKey,
    environment: validated.environment,
    baseUrl,
    callbackUrl: validated.callbackUrl,
    timeout: validated.timeout ?? DEFAULT_CONFIG.timeout,
    retries: validated.retries ?? DEFAULT_CONFIG.retries,
    retryDelay: validated.retryDelay ?? DEFAULT_CONFIG.retryDelay,
    logLevel: validated.logLevel ?? DEFAULT_CONFIG.logLevel,
  };
}

export function getConfigFromEnv(): Partial<SpaarkPayApiSdkConfig> {
  const env = typeof process !== 'undefined' ? process.env : {};

  const config: Partial<SpaarkPayApiSdkConfig> = {};

  if (env['PAWAPAY_API_KEY']) {
    config.apiKey = env['PAWAPAY_API_KEY'];
  }

  if (env['PAWAPAY_ENVIRONMENT']) {
    const envValue = env['PAWAPAY_ENVIRONMENT'].toLowerCase();
    if (envValue === 'production' || envValue === 'sandbox') {
      config.environment = envValue;
    }
  }

  if (env['PAWAPAY_BASE_URL']) {
    config.baseUrl = env['PAWAPAY_BASE_URL'];
  }

  if (env['PAWAPAY_CALLBACK_URL']) {
    config.callbackUrl = env['PAWAPAY_CALLBACK_URL'];
  }

  if (env['PAWAPAY_TIMEOUT']) {
    const timeout = parseInt(env['PAWAPAY_TIMEOUT'], 10);
    if (!isNaN(timeout)) {
      config.timeout = timeout;
    }
  }

  if (env['PAWAPAY_RETRIES']) {
    const retries = parseInt(env['PAWAPAY_RETRIES'], 10);
    if (!isNaN(retries)) {
      config.retries = retries;
    }
  }

  if (env['PAWAPAY_LOG_LEVEL']) {
    const level = env['PAWAPAY_LOG_LEVEL'].toLowerCase() as LogLevel;
    if (['debug', 'info', 'warn', 'error', 'none'].includes(level)) {
      config.logLevel = level;
    }
  }

  return config;
}
