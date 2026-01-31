import type { LogLevel } from '../types/config';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

export class Logger {
  private readonly prefix: string;
  private level: LogLevel;

  constructor(prefix: string, level: LogLevel = 'info') {
    this.prefix = prefix;
    this.level = level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase().padEnd(5)} [${this.prefix}] ${message}`;
  }

  private sanitize(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['apiKey', 'api_key', 'authorization', 'password', 'secret', 'token'];

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message);
      if (data !== undefined) {
        console.debug(formatted, this.sanitize(data));
      } else {
        console.debug(formatted);
      }
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message);
      if (data !== undefined) {
        console.info(formatted, this.sanitize(data));
      } else {
        console.info(formatted);
      }
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message);
      if (data !== undefined) {
        console.warn(formatted, this.sanitize(data));
      } else {
        console.warn(formatted);
      }
    }
  }

  error(message: string, error?: Error | unknown): void {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message);
      if (error !== undefined) {
        console.error(formatted, this.sanitize(error));
      } else {
        console.error(formatted);
      }
    }
  }
}
