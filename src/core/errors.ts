import type { FailureReason } from '../types/transactions';
import { ERROR_CODES, type ErrorCode, getErrorMapping } from '../constants/errors';

export class PawapayError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly failureReason?: FailureReason;
  readonly retryable: boolean;
  readonly originalError?: Error;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    options?: {
      failureReason?: FailureReason;
      retryable?: boolean;
      originalError?: Error;
    }
  ) {
    super(message);
    this.name = 'PawapayError';
    this.code = code;
    this.statusCode = statusCode;
    this.failureReason = options?.failureReason;
    this.retryable = options?.retryable ?? false;
    this.originalError = options?.originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PawapayError);
    }
  }

  static fromPawapayResponse(
    pawapayCode: string,
    message?: string,
    originalError?: Error
  ): PawapayError {
    const mapping = getErrorMapping(pawapayCode);

    if (mapping) {
      return new PawapayError(
        message ?? mapping.message,
        mapping.sdkCode,
        mapping.httpStatus,
        {
          retryable: mapping.retryable,
          originalError,
        }
      );
    }

    return new PawapayError(
      message ?? 'Unknown error occurred',
      ERROR_CODES.SERVER_ERROR,
      500,
      {
        retryable: false,
        originalError,
      }
    );
  }

  static validation(message: string): PawapayError {
    return new PawapayError(message, ERROR_CODES.VALIDATION_ERROR, 400, {
      retryable: false,
    });
  }

  static network(message: string, originalError?: Error): PawapayError {
    return new PawapayError(message, ERROR_CODES.NETWORK_ERROR, 0, {
      retryable: true,
      originalError,
    });
  }

  static timeout(message: string = 'Request timed out'): PawapayError {
    return new PawapayError(message, ERROR_CODES.TIMEOUT, 408, {
      retryable: true,
    });
  }

  static unauthorized(message: string = 'Invalid or expired API key'): PawapayError {
    return new PawapayError(message, ERROR_CODES.UNAUTHORIZED, 401, {
      retryable: false,
    });
  }

  static notFound(message: string = 'Resource not found'): PawapayError {
    return new PawapayError(message, ERROR_CODES.NOT_FOUND, 404, {
      retryable: false,
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      failureReason: this.failureReason,
      retryable: this.retryable,
    };
  }
}
