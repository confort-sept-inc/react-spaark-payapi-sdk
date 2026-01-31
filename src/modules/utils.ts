import { v4 as uuidv4, validate as uuidValidate, version as uuidVersion } from 'uuid';
import {
  CORRESPONDENTS,
  CORRESPONDENT_INFO,
  DEFAULT_LIMITS,
  type Correspondent,
  type CorrespondentInfo,
  type TransactionLimits,
} from '../constants/correspondents';
import type { HttpClient } from '../core/http-client';
import type { Logger } from '../core/logger';
import type {
  CountryAvailability,
  PredictProviderResponse,
  ActiveConfigResponse,
  PublicKeyResponse,
  OperationType,
} from '../types/toolkit';

export interface MMOAvailability {
  correspondent: Correspondent;
  available: boolean;
  degraded: boolean;
  estimatedRecovery?: string;
  message?: string;
}

export class UtilsModule {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly logger: Logger
  ) {}

  generateTransactionId(): string {
    return uuidv4();
  }

  validateTransactionId(id: string): boolean {
    return uuidValidate(id) && uuidVersion(id) === 4;
  }

  /**
   * Get active configuration - V2 API
   * Returns your account configuration including countries, providers, and limits
   */
  async getActiveConfiguration(options?: {
    country?: string;
    operationType?: OperationType;
  }): Promise<ActiveConfigResponse> {
    const params: Record<string, string> = {};
    if (options?.country) params.country = options.country;
    if (options?.operationType) params.operationType = options.operationType;

    this.logger.info('Fetching active configuration', options);

    const response = await this.httpClient.get<ActiveConfigResponse>('/v2/active-conf', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });

    this.logger.info(`Retrieved configuration for ${response.countries.length} countries`);

    return response;
  }

  /**
   * Get provider availability - V2 API
   * Returns current processing status for all providers
   */
  async getProviderAvailability(options?: {
    country?: string;
    operationType?: OperationType;
  }): Promise<CountryAvailability[]> {
    const params: Record<string, string> = {};
    if (options?.country) params.country = options.country;
    if (options?.operationType) params.operationType = options.operationType;

    this.logger.info('Fetching provider availability', options);

    const response = await this.httpClient.get<CountryAvailability[]>('/v2/availability', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });

    return response;
  }

  /**
   * Predict provider from phone number - V2 API
   * Returns the predicted provider and sanitized phone number
   */
  async predictProvider(phoneNumber: string): Promise<PredictProviderResponse> {
    this.logger.info('Predicting provider for phone number');

    const response = await this.httpClient.post<PredictProviderResponse>(
      '/v2/predict-provider',
      { phoneNumber }
    );

    this.logger.info(`Predicted provider: ${response.provider} (${response.country})`);

    return response;
  }

  /**
   * Get public keys for callback verification - V2 API
   */
  async getPublicKeys(): Promise<PublicKeyResponse[]> {
    this.logger.info('Fetching public keys');

    const response = await this.httpClient.get<PublicKeyResponse[]>('/v2/public-key/http');

    this.logger.info(`Retrieved ${response.length} public keys`);

    return response;
  }

  async getTransactionLimits(correspondent: Correspondent): Promise<TransactionLimits> {
    try {
      const config = await this.getActiveConfiguration();

      for (const country of config.countries) {
        for (const provider of country.providers) {
          if (provider.provider === correspondent) {
            const currency = provider.currencies[0];
            if (currency?.operationTypes) {
              const deposit = currency.operationTypes.DEPOSIT;
              const payout = currency.operationTypes.PAYOUT;
              const defaults = DEFAULT_LIMITS[correspondent];

              return {
                minDeposit: deposit?.minAmount ? parseFloat(deposit.minAmount) : defaults.minDeposit,
                maxDeposit: deposit?.maxAmount ? parseFloat(deposit.maxAmount) : defaults.maxDeposit,
                minPayout: payout?.minAmount ? parseFloat(payout.minAmount) : defaults.minPayout,
                maxPayout: payout?.maxAmount ? parseFloat(payout.maxAmount) : defaults.maxPayout,
                currency: currency.currency,
                dailyLimit: defaults.dailyLimit,
              };
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch live limits for ${correspondent}, using defaults`, error);
    }

    return DEFAULT_LIMITS[correspondent];
  }

  async checkMMOAvailability(correspondent: Correspondent): Promise<MMOAvailability> {
    try {
      const availability = await this.getProviderAvailability();

      for (const country of availability) {
        const provider = country.providers.find((p) => p.provider === correspondent);
        if (provider) {
          const depositStatus = provider.operationTypes.find((op) => op.operationType === 'DEPOSIT');
          const payoutStatus = provider.operationTypes.find((op) => op.operationType === 'PAYOUT');

          const isOperational =
            depositStatus?.status === 'OPERATIONAL' ||
            payoutStatus?.status === 'OPERATIONAL';
          const isDelayed =
            depositStatus?.status === 'DELAYED' ||
            payoutStatus?.status === 'DELAYED';
          const isClosed =
            depositStatus?.status === 'CLOSED' &&
            payoutStatus?.status === 'CLOSED';

          return {
            correspondent,
            available: isOperational || isDelayed,
            degraded: isDelayed,
            message: isClosed ? 'Provider is currently closed' : undefined,
          };
        }
      }

      return {
        correspondent,
        available: false,
        degraded: false,
        message: 'Correspondent not found in availability list',
      };
    } catch (error) {
      this.logger.warn(`Failed to check MMO availability for ${correspondent}`, error);

      return {
        correspondent,
        available: false,
        degraded: true,
        message: 'Unable to verify availability',
      };
    }
  }

  formatPhoneNumber(phone: string, countryCode: string): string {
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('00')) {
      cleaned = cleaned.slice(2);
    }

    const countryPrefixes: Record<string, string> = {
      CMR: '237',
      COG: '242',
      GAB: '241',
      ZMB: '260',
      GHA: '233',
      KEN: '254',
      TZA: '255',
      UGA: '256',
      RWA: '250',
      BEN: '229',
      CIV: '225',
      SEN: '221',
    };

    const prefix = countryPrefixes[countryCode.toUpperCase()];

    if (prefix && !cleaned.startsWith(prefix)) {
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.slice(1);
      }
      cleaned = prefix + cleaned;
    }

    return cleaned;
  }

  validatePhoneNumber(phone: string, correspondent: Correspondent): boolean {
    const info = CORRESPONDENT_INFO[correspondent];
    if (!info) {
      return false;
    }

    const cleaned = phone.replace(/\D/g, '');
    return info.phoneRegex.test(cleaned);
  }

  getSupportedCorrespondents(): readonly Correspondent[] {
    return CORRESPONDENTS;
  }

  getCorrespondentInfo(correspondent: Correspondent): CorrespondentInfo {
    return CORRESPONDENT_INFO[correspondent];
  }

  getAllCorrespondentsInfo(): CorrespondentInfo[] {
    return Object.values(CORRESPONDENT_INFO);
  }

  detectCorrespondent(phone: string): Correspondent | null {
    const cleaned = phone.replace(/\D/g, '');

    for (const [correspondent, info] of Object.entries(CORRESPONDENT_INFO)) {
      if (info.phoneRegex.test(cleaned)) {
        return correspondent as Correspondent;
      }
    }

    return null;
  }
}
