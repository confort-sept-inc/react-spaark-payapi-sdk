import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
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
  private readonly client: AxiosInstance;
  private readonly logger: Logger;
  private readonly retries: number;
  private readonly retryDelay: number;

  constructor(config: HttpClientConfig) {
    this.logger = config.logger;
    this.retries = config.retries;
    this.retryDelay = config.retryDelay;

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
        });
        return config;
      },
      (error: unknown) => {
        this.logger.error('Request error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `${response.config.method?.toUpperCase()} ${response.config.url} -> ${response.status}`,
          { data: response.data }
        );
        return response;
      },
      (error: unknown) => {
        if (axios.isAxiosError(error)) {
          this.logger.error(
            `Request failed: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
            {
              status: error.response?.status,
              data: error.response?.data,
            }
          );
        }
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw PawapayError.timeout();
      }

      if (!error.response) {
        throw PawapayError.network(
          error.message || 'Network error',
          error
        );
      }

      const { status, data } = error.response;
      const errorData = data as PawapayErrorResponse | undefined;

      if (status === 401) {
        throw PawapayError.unauthorized();
      }

      if (status === 404) {
        throw PawapayError.notFound();
      }

      const pawapayCode =
        errorData?.errorCode ??
        errorData?.rejectionReason?.rejectionCode;

      if (pawapayCode) {
        throw PawapayError.fromPawapayResponse(
          pawapayCode,
          errorData?.errorMessage ?? errorData?.rejectionReason?.rejectionMessage,
          error
        );
      }

      throw new PawapayError(
        errorData?.errorMessage ?? `HTTP error ${status}`,
        'SERVER_ERROR',
        status,
        {
          retryable: status >= 500,
          originalError: error,
        }
      );
    }

    if (error instanceof PawapayError) {
      throw error;
    }

    throw PawapayError.network(
      error instanceof Error ? error.message : 'Unknown error',
      error instanceof Error ? error : undefined
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return withRetry(
      async () => {
        try {
          const response: AxiosResponse<T> = await this.client.get(url, config);
          return response.data;
        } catch (error) {
          this.handleError(error);
        }
      },
      { maxAttempts: this.retries, initialDelay: this.retryDelay },
      this.logger
    );
  }

  async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    return withRetry(
      async () => {
        try {
          const response: AxiosResponse<T> = await this.client.post(url, data, config);
          return response.data;
        } catch (error) {
          this.handleError(error);
        }
      },
      { maxAttempts: this.retries, initialDelay: this.retryDelay },
      this.logger
    );
  }

  async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    return withRetry(
      async () => {
        try {
          const response: AxiosResponse<T> = await this.client.put(url, data, config);
          return response.data;
        } catch (error) {
          this.handleError(error);
        }
      },
      { maxAttempts: this.retries, initialDelay: this.retryDelay },
      this.logger
    );
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return withRetry(
      async () => {
        try {
          const response: AxiosResponse<T> = await this.client.delete(url, config);
          return response.data;
        } catch (error) {
          this.handleError(error);
        }
      },
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
