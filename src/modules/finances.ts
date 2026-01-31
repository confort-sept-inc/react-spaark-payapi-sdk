import { z } from 'zod';
import type { HttpClient } from '../core/http-client';
import type { Logger } from '../core/logger';
import { PawapayError } from '../core/errors';
import type {
  WalletBalance,
  WalletBalancesResponse,
  StatementRequest,
  StatementResponse,
  StatementStatusResponse,
  StatementData,
} from '../types/finances';

const statementRequestSchema = z.object({
  wallet: z.object({
    country: z.string().length(3),
    currency: z.string().length(3),
    provider: z.string().optional(),
  }),
  callbackUrl: z.string().url(),
  startDate: z.string(),
  endDate: z.string(),
  compressed: z.boolean().optional(),
});

export class FinancesModule {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly logger: Logger
  ) {}

  /**
   * Get wallet balances - V2 API
   * Returns balances for all wallets configured on your account
   */
  async getWalletBalances(): Promise<WalletBalance[]> {
    this.logger.info('Fetching wallet balances');

    const response = await this.httpClient.get<WalletBalancesResponse>(
      '/v2/wallets/balances'
    );

    this.logger.info(`Retrieved ${response.balances.length} wallet balances`);

    return response.balances;
  }

  /**
   * Generate a statement for a wallet - V2 API
   * The statement can be downloaded from the callback URL or checked via status endpoint
   */
  async generateStatement(request: StatementRequest): Promise<StatementResponse> {
    const validated = statementRequestSchema.parse(request);

    this.logger.info('Generating statement', {
      wallet: validated.wallet,
      startDate: validated.startDate,
      endDate: validated.endDate,
    });

    const response = await this.httpClient.post<StatementResponse>(
      '/v2/statements',
      validated
    );

    if (response.status === 'REJECTED' && response.failureReason) {
      throw PawapayError.fromPawapayResponse(
        response.failureReason.failureCode,
        response.failureReason.failureMessage
      );
    }

    this.logger.info(`Statement ${response.statementId} status: ${response.status}`);

    return response;
  }

  /**
   * Check statement status - V2 API
   */
  async checkStatementStatus(statementId: string): Promise<StatementData> {
    if (!z.string().uuid().safeParse(statementId).success) {
      throw PawapayError.validation('Invalid statement ID format');
    }

    const response = await this.httpClient.get<StatementStatusResponse>(
      `/v2/statements/${statementId}`
    );

    if (response.status === 'NOT_FOUND' || !response.data) {
      throw PawapayError.notFound(`Statement ${statementId} not found`);
    }

    this.logger.info(`Statement ${statementId} status: ${response.data.status}`);

    return response.data;
  }

  /**
   * Poll until statement is ready
   */
  async pollStatementUntilComplete(
    statementId: string,
    options: { interval?: number; maxAttempts?: number } = {}
  ): Promise<StatementData> {
    const { interval = 5000, maxAttempts = 24 } = options;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const status = await this.checkStatementStatus(statementId);

      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        return status;
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    return this.checkStatementStatus(statementId);
  }
}
