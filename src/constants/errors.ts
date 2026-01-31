export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PHONE: 'INVALID_PHONE',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  AMOUNT_TOO_LOW: 'AMOUNT_TOO_LOW',
  AMOUNT_TOO_HIGH: 'AMOUNT_TOO_HIGH',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  DUPLICATE: 'DUPLICATE',
  MMO_UNAVAILABLE: 'MMO_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  REFUND_NOT_ALLOWED: 'REFUND_NOT_ALLOWED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ErrorMapping {
  pawapayCode: string;
  sdkCode: ErrorCode;
  httpStatus: number;
  retryable: boolean;
  message: string;
}

export const ERROR_MAPPINGS: ErrorMapping[] = [
  {
    pawapayCode: 'INVALID_PHONE_NUMBER',
    sdkCode: ERROR_CODES.INVALID_PHONE,
    httpStatus: 400,
    retryable: false,
    message: 'Invalid phone number format',
  },
  {
    pawapayCode: 'INSUFFICIENT_FUNDS',
    sdkCode: ERROR_CODES.INSUFFICIENT_FUNDS,
    httpStatus: 402,
    retryable: false,
    message: 'Insufficient funds in account',
  },
  {
    pawapayCode: 'AMOUNT_TOO_LOW',
    sdkCode: ERROR_CODES.AMOUNT_TOO_LOW,
    httpStatus: 400,
    retryable: false,
    message: 'Amount below minimum',
  },
  {
    pawapayCode: 'AMOUNT_TOO_HIGH',
    sdkCode: ERROR_CODES.AMOUNT_TOO_HIGH,
    httpStatus: 400,
    retryable: false,
    message: 'Amount exceeds maximum',
  },
  {
    pawapayCode: 'TRANSACTION_LIMIT_EXCEEDED',
    sdkCode: ERROR_CODES.LIMIT_EXCEEDED,
    httpStatus: 400,
    retryable: false,
    message: 'Daily or monthly limit exceeded',
  },
  {
    pawapayCode: 'DUPLICATE_TRANSACTION',
    sdkCode: ERROR_CODES.DUPLICATE,
    httpStatus: 409,
    retryable: false,
    message: 'Transaction ID already used',
  },
  {
    pawapayCode: 'CORRESPONDENT_UNAVAILABLE',
    sdkCode: ERROR_CODES.MMO_UNAVAILABLE,
    httpStatus: 503,
    retryable: true,
    message: 'Mobile Money operator temporarily unavailable',
  },
  {
    pawapayCode: 'CORRESPONDENT_TEMPORARILY_UNAVAILABLE',
    sdkCode: ERROR_CODES.MMO_UNAVAILABLE,
    httpStatus: 503,
    retryable: true,
    message: 'Mobile Money operator temporarily unavailable',
  },
  {
    pawapayCode: 'TIMEOUT',
    sdkCode: ERROR_CODES.TIMEOUT,
    httpStatus: 408,
    retryable: true,
    message: 'Transaction timed out',
  },
  {
    pawapayCode: 'INVALID_API_KEY',
    sdkCode: ERROR_CODES.UNAUTHORIZED,
    httpStatus: 401,
    retryable: false,
    message: 'Invalid or expired API key',
  },
  {
    pawapayCode: 'RATE_LIMIT_EXCEEDED',
    sdkCode: ERROR_CODES.RATE_LIMITED,
    httpStatus: 429,
    retryable: true,
    message: 'Too many requests',
  },
  {
    pawapayCode: 'INTERNAL_ERROR',
    sdkCode: ERROR_CODES.SERVER_ERROR,
    httpStatus: 500,
    retryable: true,
    message: 'Pawapay internal error',
  },
  {
    pawapayCode: 'REFUND_NOT_ALLOWED',
    sdkCode: ERROR_CODES.REFUND_NOT_ALLOWED,
    httpStatus: 400,
    retryable: false,
    message: 'Refund not allowed for this transaction',
  },
];

export function getErrorMapping(pawapayCode: string): ErrorMapping | undefined {
  return ERROR_MAPPINGS.find((m) => m.pawapayCode === pawapayCode);
}
