export type Correspondent =
  | 'MTN_MOMO_CMR'
  | 'ORANGE_CMR'
  | 'MTN_MOMO_COG'
  | 'AIRTEL_COG'
  | 'MTN_MOMO_GAB'
  | 'AIRTEL_GAB';

export const CORRESPONDENTS = [
  'MTN_MOMO_CMR',
  'ORANGE_CMR',
  'MTN_MOMO_COG',
  'AIRTEL_COG',
  'MTN_MOMO_GAB',
  'AIRTEL_GAB',
] as const;

export type CorrespondentFeature = 'deposit' | 'payout' | 'refund';

export interface CorrespondentInfo {
  correspondent: Correspondent;
  name: string;
  country: string;
  countryCode: string;
  currency: string;
  features: CorrespondentFeature[];
  phoneRegex: RegExp;
}

export const CORRESPONDENT_INFO: Record<Correspondent, CorrespondentInfo> = {
  MTN_MOMO_CMR: {
    correspondent: 'MTN_MOMO_CMR',
    name: 'MTN Mobile Money',
    country: 'Cameroon',
    countryCode: 'CMR',
    currency: 'XAF',
    features: ['deposit', 'payout', 'refund'],
    phoneRegex: /^237(67|68|65[0-4])\d{6}$/,
  },
  ORANGE_CMR: {
    correspondent: 'ORANGE_CMR',
    name: 'Orange Money',
    country: 'Cameroon',
    countryCode: 'CMR',
    currency: 'XAF',
    features: ['deposit', 'payout', 'refund'],
    phoneRegex: /^237(69|65[5-9])\d{6}$/,
  },
  MTN_MOMO_COG: {
    correspondent: 'MTN_MOMO_COG',
    name: 'MTN Mobile Money',
    country: 'Congo',
    countryCode: 'COG',
    currency: 'XAF',
    features: ['deposit', 'payout', 'refund'],
    phoneRegex: /^242(04|05|06)\d{7}$/,
  },
  AIRTEL_COG: {
    correspondent: 'AIRTEL_COG',
    name: 'Airtel Money',
    country: 'Congo',
    countryCode: 'COG',
    currency: 'XAF',
    features: ['deposit', 'payout'],
    phoneRegex: /^242(01|02|03)\d{7}$/,
  },
  MTN_MOMO_GAB: {
    correspondent: 'MTN_MOMO_GAB',
    name: 'MTN Mobile Money',
    country: 'Gabon',
    countryCode: 'GAB',
    currency: 'XAF',
    features: ['deposit', 'payout', 'refund'],
    phoneRegex: /^241(06|07)\d{6}$/,
  },
  AIRTEL_GAB: {
    correspondent: 'AIRTEL_GAB',
    name: 'Airtel Money',
    country: 'Gabon',
    countryCode: 'GAB',
    currency: 'XAF',
    features: ['deposit', 'payout'],
    phoneRegex: /^241(04|05)\d{6}$/,
  },
};

export interface TransactionLimits {
  minDeposit: number;
  maxDeposit: number;
  minPayout: number;
  maxPayout: number;
  currency: string;
  dailyLimit?: number;
  monthlyLimit?: number;
}

export const DEFAULT_LIMITS: Record<Correspondent, TransactionLimits> = {
  MTN_MOMO_CMR: {
    minDeposit: 100,
    maxDeposit: 1_000_000,
    minPayout: 500,
    maxPayout: 500_000,
    currency: 'XAF',
    dailyLimit: 2_000_000,
  },
  ORANGE_CMR: {
    minDeposit: 100,
    maxDeposit: 1_000_000,
    minPayout: 500,
    maxPayout: 500_000,
    currency: 'XAF',
    dailyLimit: 2_000_000,
  },
  MTN_MOMO_COG: {
    minDeposit: 100,
    maxDeposit: 500_000,
    minPayout: 500,
    maxPayout: 300_000,
    currency: 'XAF',
    dailyLimit: 1_000_000,
  },
  AIRTEL_COG: {
    minDeposit: 100,
    maxDeposit: 500_000,
    minPayout: 500,
    maxPayout: 300_000,
    currency: 'XAF',
    dailyLimit: 1_000_000,
  },
  MTN_MOMO_GAB: {
    minDeposit: 100,
    maxDeposit: 500_000,
    minPayout: 500,
    maxPayout: 300_000,
    currency: 'XAF',
    dailyLimit: 1_000_000,
  },
  AIRTEL_GAB: {
    minDeposit: 100,
    maxDeposit: 500_000,
    minPayout: 500,
    maxPayout: 300_000,
    currency: 'XAF',
    dailyLimit: 1_000_000,
  },
};
