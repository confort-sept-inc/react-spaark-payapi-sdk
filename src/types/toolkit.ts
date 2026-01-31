// Provider Availability - V2
export type OperationType = 'DEPOSIT' | 'PAYOUT' | 'REFUND' | 'REMITTANCE';
export type OperationStatus = 'OPERATIONAL' | 'DELAYED' | 'CLOSED';

export interface ProviderOperationStatus {
  operationType: OperationType;
  status: OperationStatus;
}

export interface ProviderAvailability {
  provider: string;
  operationTypes: ProviderOperationStatus[];
}

export interface CountryAvailability {
  country: string;
  providers: ProviderAvailability[];
}

// Predict Provider - V2
export interface PredictProviderRequest {
  phoneNumber: string;
}

export interface PredictProviderResponse {
  country: string;
  provider: string;
  phoneNumber: string;
}

// Active Configuration - V2
export interface ActiveConfigResponse {
  companyName: string;
  signatureConfiguration: {
    signedRequestsOnly?: boolean;
    signedCallbacks?: boolean;
  };
  countries: CountryConfig[];
}

export interface CountryConfig {
  country: string;
  displayName: Record<string, string>;
  prefix: string;
  flag: string;
  providers: ProviderConfig[];
}

export interface ProviderConfig {
  provider: string;
  displayName: string;
  nameDisplayedToCustomer: string;
  currencies: CurrencyConfig[];
}

export interface CurrencyConfig {
  currency: string;
  displayName: string;
  operationTypes: {
    DEPOSIT?: OperationTypeConfig;
    PAYOUT?: OperationTypeConfig;
    REFUND?: OperationTypeConfig;
    REMITTANCE?: OperationTypeConfig;
    USSD_DEPOSIT?: { callbackUrl?: string };
  };
}

export interface OperationTypeConfig {
  minAmount?: string;
  maxAmount?: string;
  decimalsInAmount?: 'TWO_PLACES' | 'NONE';
  status?: OperationStatus;
  callbackUrl?: string;
  authorisationType?: string;
  authorisationInstructions?: Record<string, string>;
}

// Public Keys - V2
export interface PublicKeyResponse {
  id: string;
  key: string;
}
