import type { Correspondent } from '../constants/correspondents';

export type TransactionStatus =
  | 'ACCEPTED'
  | 'PENDING'
  | 'ENQUEUED'
  | 'PROCESSING'
  | 'IN_RECONCILIATION'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REJECTED'
  | 'DUPLICATE_IGNORED';

export type Currency = 'XAF' | 'XOF' | 'USD' | 'RWF' | 'GHS' | 'KES' | 'TZS' | 'UGX' | 'ZMW';

// V2 API format - MMO Account
export interface MMOAccount {
  type: 'MMO';
  accountDetails: {
    phoneNumber: string;
    provider: Correspondent;
  };
}

// Legacy V1 format (kept for backwards compatibility in responses)
export interface FinancialAddress {
  type: 'MSISDN';
  address: {
    value: string;
  };
}

// V2 Deposit Request - simplified interface for SDK users
export interface DepositRequest {
  amount: number;
  currency: Currency;
  provider: Correspondent;
  phoneNumber: string;
  transactionId: string;
  preAuthorisationCode?: string;
  clientReferenceId?: string;
  customerMessage?: string;
  metadata?: Array<Record<string, unknown>>;
}

// V2 Deposit Response
export interface DepositResponse {
  depositId: string;
  status: TransactionStatus;
  created: string;
  nextStep?: 'FINAL_STATUS' | 'REDIRECT' | 'PRE_AUTHORISATION';
  redirectUrl?: string;
}

// V2 Payout Request - simplified interface for SDK users
export interface PayoutRequest {
  amount: number;
  currency: Currency;
  provider: Correspondent;
  phoneNumber: string;
  transactionId: string;
  clientReferenceId?: string;
  customerMessage?: string;
  metadata?: Array<Record<string, unknown>>;
}

// V2 Payout Response
export interface PayoutResponse {
  payoutId: string;
  status: TransactionStatus;
  created: string;
}

// Payment Page (hosted checkout) - V2
export interface PaymentPageRequest {
  depositId: string;
  returnUrl: string;
  phoneNumber?: string;
  amountDetails?: {
    amount: number;
    currency: Currency;
  };
  language?: 'EN' | 'FR';
  country?: string;
  reason?: string;
  customerMessage?: string;
  metadata?: Array<Record<string, unknown> & { isPII?: boolean }>;
}

export interface PaymentPageResponse {
  redirectUrl: string;
}

// Refund
export interface RefundRequest {
  depositId: string;
  amount: number;
  transactionId: string;
}

export interface RefundResponse {
  refundId: string;
  depositId: string;
  status: TransactionStatus;
  amount: number;
  created: string;
}

// V2 Status check response
export interface TransactionStatusResponse {
  depositId?: string;
  payoutId?: string;
  status: TransactionStatus;
  amount: string;
  currency: string;
  country: string;
  payer?: MMOAccount;
  recipient?: MMOAccount;
  created: string;
  customerMessage?: string;
  clientReferenceId?: string;
  providerTransactionId?: string;
  failureReason?: {
    failureCode: DepositFailureCode | PayoutFailureCode;
    failureMessage?: string;
  };
  metadata?: Record<string, string>;
}

export type DepositFailureCode =
  | 'PAYER_NOT_FOUND'
  | 'PAYMENT_NOT_APPROVED'
  | 'PAYER_LIMIT_REACHED'
  | 'PAYMENT_IN_PROGRESS'
  | 'INSUFFICIENT_BALANCE'
  | 'WALLET_LIMIT_REACHED'
  | 'UNSPECIFIED_FAILURE'
  | 'UNKNOWN_ERROR';

export type PayoutFailureCode =
  | 'PAWAPAY_WALLET_OUT_OF_FUNDS'
  | 'RECIPIENT_NOT_FOUND'
  | 'WALLET_LIMIT_REACHED'
  | 'MANUALLY_CANCELLED'
  | 'UNSPECIFIED_FAILURE'
  | 'UNKNOWN_ERROR';

// Resend callback / Cancel enqueued response
export interface ActionResponse {
  depositId?: string;
  payoutId?: string;
  status: 'ACCEPTED' | 'REJECTED';
  failureReason?: {
    failureCode: 'NOT_FOUND' | 'INVALID_STATE';
    failureMessage?: string;
  };
}

export interface PollOptions {
  /** Polling interval in milliseconds (default: 5000) */
  interval?: number;
  /** Maximum number of polling attempts (default: 12) */
  maxAttempts?: number;
  /** Callback when status changes */
  onStatusChange?: (status: TransactionStatus) => void;
  /** Maximum NOT_FOUND responses before throwing error - handles eventual consistency (default: 5) */
  maxNotFoundAttempts?: number;
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  status?: TransactionStatus;
  provider?: Correspondent;
  limit?: number;
  offset?: number;
}

// Legacy failure reasons (kept for backwards compatibility)
export type FailureReason =
  | 'INSUFFICIENT_FUNDS'
  | 'RECIPIENT_NOT_FOUND'
  | 'TRANSACTION_LIMIT_EXCEEDED'
  | 'INVALID_PHONE_NUMBER'
  | 'OPERATOR_ERROR'
  | 'TIMEOUT'
  | 'DUPLICATE_TRANSACTION'
  | 'REFUND_NOT_ALLOWED'
  | 'AMOUNT_TOO_LOW'
  | 'AMOUNT_TOO_HIGH'
  | 'SERVICE_UNAVAILABLE';
