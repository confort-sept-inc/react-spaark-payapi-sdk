export type Environment = 'sandbox' | 'production';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

export interface SpaarkPayApiSdkConfig {
  apiKey: string;
  environment: Environment;
  baseUrl?: string;
  callbackUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  logLevel?: LogLevel;
}

export interface ResolvedConfig {
  apiKey: string;
  environment: Environment;
  baseUrl: string;
  callbackUrl?: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  logLevel: LogLevel;
}

export const DEFAULT_CONFIG = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  logLevel: 'info' as LogLevel,
  sandboxUrl: 'https://api.sandbox.pawapay.io',
  productionUrl: 'https://api.pawapay.io',
} as const;
