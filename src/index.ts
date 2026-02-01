export { SpaarkPayApiSdk } from './sdk';

export { PawapayError } from './core/errors';
export { Logger } from './core/logger';

export type {
  SpaarkPayApiSdkConfig,
  ResolvedConfig,
  Environment,
  LogLevel,
} from './types/config';

export type {
  TransactionStatus,
  Currency,
  MMOAccount,
  FinancialAddress,
  DepositRequest,
  DepositResponse,
  PayoutRequest,
  PayoutResponse,
  PaymentPageRequest,
  PaymentPageResponse,
  RefundRequest,
  RefundResponse,
  TransactionStatusResponse,
  ActionResponse,
  PollOptions,
  TransactionFilters,
  FailureReason,
  DepositFailureCode,
  PayoutFailureCode,
} from './types/transactions';

export type {
  ProductCreateRequest,
  Product,
  DomainAddRequest,
} from './types/products';

export type {
  WebhookEventType,
  PawapayWebhookEvent,
  DepositCallbackData,
  PayoutCallbackData,
} from './types/webhooks';

export type {
  OperationType,
  OperationStatus,
  ProviderOperationStatus,
  ProviderAvailability,
  CountryAvailability,
  PredictProviderRequest,
  PredictProviderResponse,
  ActiveConfigResponse,
  CountryConfig,
  ProviderConfig,
  CurrencyConfig,
  OperationTypeConfig,
  PublicKeyResponse,
} from './types/toolkit';

export type {
  WalletBalance,
  WalletBalancesResponse,
  StatementWallet,
  StatementRequest,
  StatementStatus,
  StatementResponse,
  StatementFailureCode,
  StatementStatusResponse,
  StatementData,
  StatementCallbackData,
} from './types/finances';

export {
  CORRESPONDENTS,
  CORRESPONDENT_INFO,
  DEFAULT_LIMITS,
  type Correspondent,
  type CorrespondentInfo,
  type CorrespondentFeature,
  type TransactionLimits,
} from './constants/correspondents';

export {
  ERROR_CODES,
  type ErrorCode,
} from './constants/errors';

export type { MMOAvailability } from './modules/utils';

// React components are available via 'spaark-payapi-sdk/react' subpath
// Do NOT re-export them here to avoid bundling React in server-side code
