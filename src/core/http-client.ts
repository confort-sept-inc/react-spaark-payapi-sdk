import type { ResolvedConfig } from '../types/config';
import { PawapayError } from './errors';
import { Logger } from './logger';
import { withRetry } from './retry';

export interface HttpClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  logger: Logger;
}

export interface RequestConfig {
  params?: Record<string, string | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface PawapayErrorResponse {
  errorId?: string;
  errorCode?: string;
  errorMessage?: string;
  rejectionReason?: {
    rejectionCode?: string;
    rejectionMessage?: string;
  };
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeout: number;
  private readonly logger: Logger;
  private readonly retries: number;
  private readonly retryDelay: number;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    };
    this.timeout = config.timeout;
    this.logger = config.logger;
    this.retries = config.retries;
    this.retryDelay = config.retryDelay;
  }

  private buildUrl(path: string, params?: Record<string, string | undefined>): string {
    const url = new URL(path, this.baseUrl + '/');
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }

  private async request<T>(
    method: string,
    path: string,
    options?: { data?: unknown; config?: RequestConfig }
  ): Promise<T> {
    const url = this.buildUrl(path, options?.config?.params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    this.logger.debug(`${method.toUpperCase()} ${path}`, {
      params: options?.config?.params,
    });

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...options?.config?.headers,
        },
        body: options?.data !== undefined ? JSON.stringify(options.data) : undefined,
        signal: options?.config?.signal ?? controller.signal,
      });

      this.logger.debug(
        `${method.toUpperCase()} ${path} -> ${response.status}`,
        { status: response.status }
      );

      if (!response.ok) {
        let errorData: PawapayErrorResponse | undefined;
        try {
          errorData = (await response.json()) as PawapayErrorResponse;
        } catch {
          // Response body may not be JSON
        }
        this.handleHttpError(response.status, errorData);
      }

      const data = (await response.json()) as T;
      return data;
    } catch (error) {
      this.handleError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private handleHttpError(status: number, data?: PawapayErrorResponse): never {
    if (status === 401) {
      throw PawapayError.unauthorized();
    }

    if (status === 404) {
      throw PawapayError.notFound();
    }

    const pawapayCode =
      data?.errorCode ??
      data?.rejectionReason?.rejectionCode;

    if (pawapayCode) {
      throw PawapayError.fromPawapayResponse(
        pawapayCode,
        data?.errorMessage ?? data?.rejectionReason?.rejectionMessage,
      );
    }

    throw new PawapayError(
      data?.errorMessage ?? `HTTP error ${status}`,
      'SERVER_ERROR',
      status,
      {
        retryable: status >= 500,
      }
    );
  }

  private handleError(error: unknown): never {
    if (error instanceof PawapayError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw PawapayError.timeout();
    }

    if (error instanceof TypeError) {
      throw PawapayError.network(error.message, error);
    }

    throw PawapayError.network(
      error instanceof Error ? error.message : 'Unknown error',
      error instanceof Error ? error : undefined
    );
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return withRetry(
      async () => this.request<T>('GET', url, { config }),
      { maxAttempts: this.retries, initialDelay: this.retryDelay },
      this.logger
    );
  }

  async post<T, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<T> {
    return withRetry(
      async () => this.request<T>('POST', url, { data, config }),
      { maxAttempts: this.retries, initialDelay: this.retryDelay },
      this.logger
    );
  }

  async put<T, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<T> {
    return withRetry(
      async () => this.request<T>('PUT', url, { data, config }),
      { maxAttempts: this.retries, initialDelay: this.retryDelay },
      this.logger
    );
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return withRetry(
      async () => this.request<T>('DELETE', url, { config }),
      { maxAttempts: this.retries, initialDelay: this.retryDelay },
      this.logger
    );
  }

  static fromConfig(config: ResolvedConfig, logger: Logger): HttpClient {
    return new HttpClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      timeout: config.timeout,
      retries: config.retries,
      retryDelay: config.retryDelay,
      logger,
    });
  }
}
