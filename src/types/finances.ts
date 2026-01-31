// Wallet Balances - V2
export interface WalletBalance {
  country: string;
  balance: string;
  currency: string;
  provider?: string;
}

export interface WalletBalancesResponse {
  balances: WalletBalance[];
}

// Statements - V2
export interface StatementWallet {
  country: string;
  currency: string;
  provider?: string;
}

export interface StatementRequest {
  wallet: StatementWallet;
  callbackUrl: string;
  startDate: string;
  endDate: string;
  compressed?: boolean;
}

export type StatementStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface StatementResponse {
  status: 'ACCEPTED' | 'REJECTED';
  statementId?: string;
  created?: string;
  failureReason?: {
    failureCode: StatementFailureCode;
    failureMessage?: string;
  };
}

export type StatementFailureCode =
  | 'NO_AUTHENTICATION'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORISATION_ERROR'
  | 'INVALID_INPUT'
  | 'MISSING_PARAMETER'
  | 'UNSUPPORTED_PARAMETER'
  | 'INVALID_PARAMETER'
  | 'INVALID_CALLBACK_URL'
  | 'INVALID_DATE_RANGE'
  | 'WALLET_NOT_FOUND'
  | 'UNKNOWN_ERROR';

export interface StatementStatusResponse {
  status: 'FOUND' | 'NOT_FOUND';
  data?: StatementData;
}

export interface StatementData {
  statementId: string;
  status: StatementStatus;
  wallet: StatementWallet;
  created: string;
  startDate: string;
  endDate: string;
  fileSize?: number;
  downloadUrl?: string;
  downloadUrlExpiresAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: {
    failureCode: 'UNKNOWN_ERROR';
    failureMessage?: string;
  };
}

// Statement Callback
export interface StatementCallbackData {
  statementId: string;
  status: StatementStatus;
  wallet: StatementWallet;
  created: string;
  startDate: string;
  endDate: string;
  fileSize?: number;
  downloadUrl?: string;
  downloadUrlExpiresAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: {
    failureCode: 'UNKNOWN_ERROR';
    failureMessage?: string;
  };
}
