import { z } from 'zod';
import { CORRESPONDENTS } from '../constants/correspondents';
import type { HttpClient } from '../core/http-client';
import type { Logger } from '../core/logger';
import { PawapayError } from '../core/errors';
import type {
  DepositRequest,
  DepositResponse,
  PayoutRequest,
  PayoutResponse,
  RefundRequest,
  RefundResponse,
  TransactionStatusResponse,
  TransactionStatus,
  PollOptions,
  TransactionFilters,
  PaymentPageRequest,
  PaymentPageResponse,
  ActionResponse,
} from '../types/transactions';

// V2 API validation schemas
const depositRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(10_000_000),
  currency: z.string().min(3).max(3),
  provider: z.enum(CORRESPONDENTS),
  phoneNumber: z.string().regex(/^[0-9]{9,15}$/, 'Phone number must be 9-15 digits'),
  transactionId: z.string().uuid(),
  preAuthorisationCode: z.string().optional(),
  clientReferenceId: z.string().optional(),
  customerMessage: z.string().min(4).max(22).optional(),
  metadata: z.array(z.record(z.unknown())).max(10).optional(),
});

const payoutRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(10_000_000),
  currency: z.string().min(3).max(3),
  provider: z.enum(CORRESPONDENTS),
  phoneNumber: z.string().regex(/^[0-9]{9,15}$/, 'Phone number must be 9-15 digits'),
  transactionId: z.string().uuid(),
  clientReferenceId: z.string().optional(),
  customerMessage: z.string().min(4).max(22).optional(),
  metadata: z.array(z.record(z.unknown())).max(10).optional(),
});

const paymentPageRequestSchema = z.object({
  depositId: z.string().uuid(),
  returnUrl: z.string().url(),
  phoneNumber: z.string().optional(),
  amountDetails: z.object({
    amount: z.number().positive(),
    currency: z.string().length(3),
  }).optional(),
  language: z.enum(['EN', 'FR']).optional(),
  country: z.string().length(3).optional(),
  reason: z.string().max(50).optional(),
  customerMessage: z.string().min(4).max(22).optional(),
  metadata: z.array(z.record(z.unknown())).max(10).optional(),
});

const refundRequestSchema = z.object({
  depositId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  transactionId: z.string().uuid(),
});

// V2 Pawapay API request/response interfaces
interface PawapayV2DepositRequest {
  depositId: string;
  amount: string;
  currency: string;
  payer: {
    type: 'MMO';
    accountDetails: {
      phoneNumber: string;
      provider: string;
    };
  };
  preAuthorisationCode?: string;
  clientReferenceId?: string;
  customerMessage?: string;
  metadata?: Array<Record<string, unknown>>;
}

interface PawapayV2PayoutRequest {
  payoutId: string;
  amount: string;
  currency: string;
  recipient: {
    type: 'MMO';
    accountDetails: {
      phoneNumber: string;
      provider: string;
    };
  };
  clientReferenceId?: string;
  customerMessage?: string;
  metadata?: Array<Record<string, unknown>>;
}

interface PawapayV2PaymentPageRequest {
  depositId: string;
  returnUrl: string;
  phoneNumber?: string;
  amountDetails?: {
    amount: string;
    currency: string;
  };
  language?: 'EN' | 'FR';
  country?: string;
  reason?: string;
  customerMessage?: string;
  metadata?: Array<Record<string, unknown>>;
}

interface PawapayV2DepositResponse {
  depositId: string;
  status: string;
  created?: string;
  nextStep?: string;
  redirectUrl?: string;
  rejectionReason?: {
    rejectionCode: string;
    rejectionMessage: string;
  };
}

interface PawapayV2PayoutResponse {
  payoutId: string;
  status: string;
  created?: string;
  rejectionReason?: {
    rejectionCode: string;
    rejectionMessage: string;
  };
}

interface PawapayV2PaymentPageResponse {
  redirectUrl: string;
}

interface PawapayRefundRequest {
  refundId: string;
  depositId: string;
  amount?: string;
}

interface PawapayRefundResponse {
  refundId: string;
  status: string;
  created?: string;
  rejectionReason?: {
    rejectionCode: string;
    rejectionMessage: string;
  };
}

// V2 Status check response wrapper
interface PawapayV2StatusWrapper {
  status: 'FOUND' | 'NOT_FOUND';
  data?: PawapayV2StatusData;
}

interface PawapayV2StatusData {
  depositId?: string;
  payoutId?: string;
  status: string;
  amount: string;
  currency: string;
  country: string;
  created: string;
  customerMessage?: string;
  clientReferenceId?: string;
  providerTransactionId?: string;
  payer?: {
    type: 'MMO';
    accountDetails: {
      phoneNumber: string;
      provider: string;
    };
  };
  recipient?: {
    type: 'MMO';
    accountDetails: {
      phoneNumber: string;
      provider: string;
    };
  };
  failureReason?: {
    failureCode: string;
    failureMessage?: string;
  };
  metadata?: Record<string, string>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TransactionsModule {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly logger: Logger
  ) {}

  /**
   * Initiate a deposit (collect payment from mobile money user) - V2 API
   */
  async initiateDeposit(request: DepositRequest): Promise<DepositResponse> {
    const validated = depositRequestSchema.parse(request);

    const pawapayRequest: PawapayV2DepositRequest = {
      depositId: validated.transactionId,
      amount: validated.amount.toString(),
      currency: validated.currency,
      payer: {
        type: 'MMO',
        accountDetails: {
          phoneNumber: validated.phoneNumber,
          provider: validated.provider,
        },
      },
      preAuthorisationCode: validated.preAuthorisationCode,
      clientReferenceId: validated.clientReferenceId,
      customerMessage: validated.customerMessage,
      metadata: validated.metadata,
    };

    this.logger.info(`Initiating V2 deposit ${validated.transactionId}`, {
      amount: validated.amount,
      currency: validated.currency,
      provider: validated.provider,
    });

    const response = await this.httpClient.post<PawapayV2DepositResponse>(
      '/v2/deposits',
      pawapayRequest
    );

    if (response.status === 'REJECTED' && response.rejectionReason) {
      throw PawapayError.fromPawapayResponse(
        response.rejectionReason.rejectionCode,
        response.rejectionReason.rejectionMessage
      );
    }

    this.logger.info(`Deposit ${response.depositId} status: ${response.status}`);

    return {
      depositId: response.depositId,
      status: response.status as TransactionStatus,
      created: response.created ?? new Date().toISOString(),
      nextStep: response.nextStep as DepositResponse['nextStep'],
      redirectUrl: response.redirectUrl,
    };
  }

  /**
   * Initiate a payout (send money to mobile money user) - V2 API
   */
  async initiatePayout(request: PayoutRequest): Promise<PayoutResponse> {
    const validated = payoutRequestSchema.parse(request);

    const pawapayRequest: PawapayV2PayoutRequest = {
      payoutId: validated.transactionId,
      amount: validated.amount.toString(),
      currency: validated.currency,
      recipient: {
        type: 'MMO',
        accountDetails: {
          phoneNumber: validated.phoneNumber,
          provider: validated.provider,
        },
      },
      clientReferenceId: validated.clientReferenceId,
      customerMessage: validated.customerMessage,
      metadata: validated.metadata,
    };

    this.logger.info(`Initiating V2 payout ${validated.transactionId}`, {
      amount: validated.amount,
      currency: validated.currency,
      provider: validated.provider,
    });

    const response = await this.httpClient.post<PawapayV2PayoutResponse>(
      '/v2/payouts',
      pawapayRequest
    );

    if (response.status === 'REJECTED' && response.rejectionReason) {
      throw PawapayError.fromPawapayResponse(
        response.rejectionReason.rejectionCode,
        response.rejectionReason.rejectionMessage
      );
    }

    this.logger.info(`Payout ${response.payoutId} status: ${response.status}`);

    return {
      payoutId: response.payoutId,
      status: response.status as TransactionStatus,
      created: response.created ?? new Date().toISOString(),
    };
  }

  /**
   * Create a hosted payment page - V2 API
   */
  async createPaymentPage(request: PaymentPageRequest): Promise<PaymentPageResponse> {
    const validated = paymentPageRequestSchema.parse(request);

    const pawapayRequest: PawapayV2PaymentPageRequest = {
      depositId: validated.depositId,
      returnUrl: validated.returnUrl,
      phoneNumber: validated.phoneNumber,
      amountDetails: validated.amountDetails
        ? {
            amount: validated.amountDetails.amount.toString(),
            currency: validated.amountDetails.currency,
          }
        : undefined,
      language: validated.language,
      country: validated.country,
      reason: validated.reason,
      customerMessage: validated.customerMessage,
      metadata: validated.metadata,
    };

    this.logger.info(`Creating payment page for deposit ${validated.depositId}`);

    const response = await this.httpClient.post<PawapayV2PaymentPageResponse>(
      '/v2/paymentpage',
      pawapayRequest
    );

    this.logger.info(`Payment page created: ${response.redirectUrl}`);

    return {
      redirectUrl: response.redirectUrl,
    };
  }

  /**
   * Refund a deposit
   */
  async refund(request: RefundRequest): Promise<RefundResponse> {
    const validated = refundRequestSchema.parse(request);

    const pawapayRequest: PawapayRefundRequest = {
      refundId: validated.transactionId,
      depositId: validated.depositId,
      amount: validated.amount.toString(),
    };

    this.logger.info(`Initiating refund ${validated.transactionId}`, {
      depositId: validated.depositId,
      amount: validated.amount,
    });

    const response = await this.httpClient.post<PawapayRefundResponse>(
      '/refunds',
      pawapayRequest
    );

    if (response.status === 'REJECTED' && response.rejectionReason) {
      throw PawapayError.fromPawapayResponse(
        response.rejectionReason.rejectionCode,
        response.rejectionReason.rejectionMessage
      );
    }

    this.logger.info(`Refund ${response.refundId} status: ${response.status}`);

    return {
      refundId: response.refundId,
      depositId: validated.depositId,
      status: response.status as TransactionStatus,
      amount: validated.amount,
      created: response.created ?? new Date().toISOString(),
    };
  }

  /**
   * Check deposit status - V2 API
   */
  async checkDepositStatus(depositId: string): Promise<TransactionStatusResponse> {
    if (!z.string().uuid().safeParse(depositId).success) {
      throw PawapayError.validation('Invalid deposit ID format');
    }

    const response = await this.httpClient.get<PawapayV2StatusWrapper>(
      `/v2/deposits/${depositId}`
    );

    if (response.status === 'NOT_FOUND' || !response.data) {
      throw PawapayError.notFound(`Deposit ${depositId} not found`);
    }

    const data = response.data;
    return {
      depositId: data.depositId,
      status: data.status as TransactionStatus,
      amount: data.amount,
      currency: data.currency,
      country: data.country,
      payer: data.payer as TransactionStatusResponse['payer'],
      created: data.created,
      customerMessage: data.customerMessage,
      clientReferenceId: data.clientReferenceId,
      providerTransactionId: data.providerTransactionId,
      failureReason: data.failureReason as TransactionStatusResponse['failureReason'],
      metadata: data.metadata,
    };
  }

  /**
   * Check payout status - V2 API
   */
  async checkPayoutStatus(payoutId: string): Promise<TransactionStatusResponse> {
    if (!z.string().uuid().safeParse(payoutId).success) {
      throw PawapayError.validation('Invalid payout ID format');
    }

    const response = await this.httpClient.get<PawapayV2StatusWrapper>(
      `/v2/payouts/${payoutId}`
    );

    if (response.status === 'NOT_FOUND' || !response.data) {
      throw PawapayError.notFound(`Payout ${payoutId} not found`);
    }

    const data = response.data;
    return {
      payoutId: data.payoutId,
      status: data.status as TransactionStatus,
      amount: data.amount,
      currency: data.currency,
      country: data.country,
      recipient: data.recipient as TransactionStatusResponse['recipient'],
      created: data.created,
      customerMessage: data.customerMessage,
      clientReferenceId: data.clientReferenceId,
      providerTransactionId: data.providerTransactionId,
      failureReason: data.failureReason as TransactionStatusResponse['failureReason'],
      metadata: data.metadata,
    };
  }

  /**
   * Check transaction status (tries deposit first, then payout) - V2 API
   */
  async checkStatus(transactionId: string): Promise<TransactionStatusResponse> {
    // Try deposit first
    try {
      return await this.checkDepositStatus(transactionId);
    } catch (err) {
      // If not found as deposit, try payout
      if (err instanceof PawapayError && err.code === 'NOT_FOUND') {
        return await this.checkPayoutStatus(transactionId);
      }
      throw err;
    }
  }

  /**
   * Poll until transaction reaches final status
   * Handles eventual consistency - NOT_FOUND errors during early attempts are treated as pending
   */
  async pollUntilComplete(
    transactionId: string,
    options: PollOptions = {}
  ): Promise<TransactionStatusResponse> {
    const {
      interval = 5000,
      maxAttempts = 12,
      onStatusChange,
      maxNotFoundAttempts = 5,
    } = options;

    let lastStatus: TransactionStatus | undefined;
    let notFoundCount = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const status = await this.checkStatus(transactionId);

        // Reset NOT_FOUND counter once we find the transaction
        notFoundCount = 0;

        if (status.status !== lastStatus) {
          lastStatus = status.status;
          onStatusChange?.(status.status);
        }

        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          return status;
        }
      } catch (err) {
        // Handle eventual consistency - transaction may not be immediately available
        if (err instanceof PawapayError && err.code === 'NOT_FOUND') {
          notFoundCount++;
          this.logger.debug(
            `Transaction ${transactionId} not found yet (attempt ${notFoundCount}/${maxNotFoundAttempts})`
          );

          // If we've exceeded max NOT_FOUND attempts, throw the error
          if (notFoundCount >= maxNotFoundAttempts) {
            throw err;
          }

          // Notify status change to PENDING if this is the first NOT_FOUND
          if (notFoundCount === 1 && lastStatus !== 'PENDING') {
            lastStatus = 'PENDING';
            onStatusChange?.('PENDING');
          }
        } else {
          // Re-throw non-NOT_FOUND errors
          throw err;
        }
      }

      if (attempt < maxAttempts) {
        await sleep(interval);
      }
    }

    // Final attempt
    const finalStatus = await this.checkStatus(transactionId);
    return finalStatus;
  }

  /**
   * List deposits with filters
   */
  async listDeposits(filters?: TransactionFilters): Promise<DepositResponse[]> {
    const params: Record<string, string> = {};

    if (filters?.from) params.from = filters.from;
    if (filters?.to) params.to = filters.to;
    if (filters?.status) params.status = filters.status;
    if (filters?.provider) params.provider = filters.provider;
    if (filters?.limit) params.limit = String(filters.limit);
    if (filters?.offset) params.offset = String(filters.offset);

    const response = await this.httpClient.get<PawapayV2StatusData[]>('/v2/deposits', {
      params,
    });

    return response.map((deposit): DepositResponse => ({
      depositId: deposit.depositId ?? '',
      status: deposit.status as TransactionStatus,
      created: deposit.created,
    }));
  }

  /**
   * List payouts with filters
   */
  async listPayouts(filters?: TransactionFilters): Promise<PayoutResponse[]> {
    const params: Record<string, string> = {};

    if (filters?.from) params.from = filters.from;
    if (filters?.to) params.to = filters.to;
    if (filters?.status) params.status = filters.status;
    if (filters?.provider) params.provider = filters.provider;
    if (filters?.limit) params.limit = String(filters.limit);
    if (filters?.offset) params.offset = String(filters.offset);

    const response = await this.httpClient.get<PawapayV2StatusData[]>('/v2/payouts', {
      params,
    });

    return response.map((payout): PayoutResponse => ({
      payoutId: payout.payoutId ?? '',
      status: payout.status as TransactionStatus,
      created: payout.created,
    }));
  }

  /**
   * Resend deposit callback - V2 API
   * Triggers a new callback for a deposit transaction
   */
  async resendDepositCallback(depositId: string): Promise<ActionResponse> {
    if (!z.string().uuid().safeParse(depositId).success) {
      throw PawapayError.validation('Invalid deposit ID format');
    }

    this.logger.info(`Resending callback for deposit ${depositId}`);

    const response = await this.httpClient.post<ActionResponse>(
      `/v2/deposits/${depositId}/resend-callback`,
      {}
    );

    this.logger.info(`Resend callback for deposit ${depositId}: ${response.status}`);

    return response;
  }

  /**
   * Resend payout callback - V2 API
   * Triggers a new callback for a payout transaction
   */
  async resendPayoutCallback(payoutId: string): Promise<ActionResponse> {
    if (!z.string().uuid().safeParse(payoutId).success) {
      throw PawapayError.validation('Invalid payout ID format');
    }

    this.logger.info(`Resending callback for payout ${payoutId}`);

    const response = await this.httpClient.post<ActionResponse>(
      `/v2/payouts/${payoutId}/resend-callback`,
      {}
    );

    this.logger.info(`Resend callback for payout ${payoutId}: ${response.status}`);

    return response;
  }

  /**
   * Cancel enqueued payout - V2 API
   * Cancels a payout that is still in ENQUEUED status
   */
  async cancelEnqueuedPayout(payoutId: string): Promise<ActionResponse> {
    if (!z.string().uuid().safeParse(payoutId).success) {
      throw PawapayError.validation('Invalid payout ID format');
    }

    this.logger.info(`Cancelling enqueued payout ${payoutId}`);

    const response = await this.httpClient.post<ActionResponse>(
      `/v2/payouts/${payoutId}/cancel`,
      {}
    );

    this.logger.info(`Cancel payout ${payoutId}: ${response.status}`);

    return response;
  }
}
