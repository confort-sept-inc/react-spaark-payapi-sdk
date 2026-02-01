import type {
  WebhookEventType,
  PawapayWebhookEvent,
  DepositCallbackData,
  PayoutCallbackData,
} from '../types/webhooks';
import type { Correspondent } from '../constants/correspondents';

export interface WebhookGeneratorOptions {
  transactionId?: string;
  amount?: string;
  currency?: string;
  correspondent?: Correspondent;
  phoneNumber?: string;
  status?: 'COMPLETED' | 'FAILED';
  failureCode?: string;
  failureMessage?: string;
}

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function generateDepositWebhook(
  eventType: 'deposit.accepted' | 'deposit.completed' | 'deposit.failed',
  options: WebhookGeneratorOptions = {}
): PawapayWebhookEvent<DepositCallbackData> {
  const {
    transactionId = generateUUID(),
    amount = '5000',
    currency = 'XAF',
    correspondent = 'MTN_MOMO_CMR',
    phoneNumber = '237670000000',
    status = eventType === 'deposit.failed' ? 'FAILED' : 'COMPLETED',
    failureCode = 'INSUFFICIENT_FUNDS',
    failureMessage = 'The payer has insufficient funds',
  } = options;

  const now = new Date().toISOString();

  const data: DepositCallbackData = {
    depositId: transactionId,
    status,
    amount,
    currency,
    correspondent,
    payer: {
      type: 'MSISDN',
      address: {
        value: phoneNumber,
      },
    },
    customerTimestamp: now,
    created: now,
  };

  if (status === 'COMPLETED') {
    data.receivedByPayer = now;
  }

  if (status === 'FAILED') {
    data.failureReason = {
      failureCode,
      failureMessage,
    };
  }

  return {
    eventId: generateUUID(),
    eventType,
    timestamp: now,
    data,
  };
}

export function generatePayoutWebhook(
  eventType: 'payout.accepted' | 'payout.completed' | 'payout.failed',
  options: WebhookGeneratorOptions = {}
): PawapayWebhookEvent<PayoutCallbackData> {
  const {
    transactionId = generateUUID(),
    amount = '5000',
    currency = 'XAF',
    correspondent = 'MTN_MOMO_CMR',
    phoneNumber = '237670000000',
    status = eventType === 'payout.failed' ? 'FAILED' : 'COMPLETED',
    failureCode = 'RECIPIENT_NOT_FOUND',
    failureMessage = 'The recipient account was not found',
  } = options;

  const now = new Date().toISOString();

  const data: PayoutCallbackData = {
    payoutId: transactionId,
    status,
    amount,
    currency,
    correspondent,
    recipient: {
      type: 'MSISDN',
      address: {
        value: phoneNumber,
      },
    },
    customerTimestamp: now,
    created: now,
  };

  if (status === 'COMPLETED') {
    data.receivedByRecipient = now;
  }

  if (status === 'FAILED') {
    data.failureReason = {
      failureCode,
      failureMessage,
    };
  }

  return {
    eventId: generateUUID(),
    eventType,
    timestamp: now,
    data,
  };
}

export interface RefundCallbackData {
  refundId: string;
  depositId: string;
  status: 'COMPLETED' | 'FAILED';
  amount: string;
  currency: string;
  correspondent: string;
  recipient: {
    type: string;
    address: {
      value: string;
    };
  };
  created: string;
  failureReason?: {
    failureCode: string;
    failureMessage: string;
  };
}

export function generateRefundWebhook(
  eventType: 'refund.completed' | 'refund.failed',
  options: WebhookGeneratorOptions & { depositId?: string } = {}
): PawapayWebhookEvent<RefundCallbackData> {
  const {
    transactionId = generateUUID(),
    depositId = generateUUID(),
    amount = '5000',
    currency = 'XAF',
    correspondent = 'MTN_MOMO_CMR',
    phoneNumber = '237670000000',
    status = eventType === 'refund.failed' ? 'FAILED' : 'COMPLETED',
    failureCode = 'REFUND_LIMIT_EXCEEDED',
    failureMessage = 'The refund limit has been exceeded',
  } = options;

  const now = new Date().toISOString();

  const data: RefundCallbackData = {
    refundId: transactionId,
    depositId,
    status,
    amount,
    currency,
    correspondent,
    recipient: {
      type: 'MSISDN',
      address: {
        value: phoneNumber,
      },
    },
    created: now,
  };

  if (status === 'FAILED') {
    data.failureReason = {
      failureCode,
      failureMessage,
    };
  }

  return {
    eventId: generateUUID(),
    eventType,
    timestamp: now,
    data,
  };
}

export type MockWebhookEvent =
  | PawapayWebhookEvent<DepositCallbackData>
  | PawapayWebhookEvent<PayoutCallbackData>
  | PawapayWebhookEvent<RefundCallbackData>;

export function generateWebhook(
  eventType: WebhookEventType,
  options: WebhookGeneratorOptions & { depositId?: string } = {}
): MockWebhookEvent {
  if (eventType.startsWith('deposit.')) {
    return generateDepositWebhook(
      eventType as 'deposit.accepted' | 'deposit.completed' | 'deposit.failed',
      options
    );
  }

  if (eventType.startsWith('payout.')) {
    return generatePayoutWebhook(
      eventType as 'payout.accepted' | 'payout.completed' | 'payout.failed',
      options
    );
  }

  return generateRefundWebhook(
    eventType as 'refund.completed' | 'refund.failed',
    options
  );
}

export const WEBHOOK_EVENT_TYPES: WebhookEventType[] = [
  'deposit.accepted',
  'deposit.completed',
  'deposit.failed',
  'payout.accepted',
  'payout.completed',
  'payout.failed',
  'refund.completed',
  'refund.failed',
];

export const FAILURE_CODES = {
  deposit: [
    { code: 'INSUFFICIENT_FUNDS', message: 'The payer has insufficient funds' },
    { code: 'INVALID_PHONE_NUMBER', message: 'The phone number is invalid' },
    { code: 'TIMEOUT', message: 'The transaction timed out' },
    { code: 'RECIPIENT_NOT_REGISTERED', message: 'The recipient is not registered for mobile money' },
    { code: 'DECLINED', message: 'The transaction was declined by the payer' },
  ],
  payout: [
    { code: 'RECIPIENT_NOT_FOUND', message: 'The recipient account was not found' },
    { code: 'RECIPIENT_NOT_REGISTERED', message: 'The recipient is not registered for mobile money' },
    { code: 'INVALID_PHONE_NUMBER', message: 'The phone number is invalid' },
    { code: 'TIMEOUT', message: 'The transaction timed out' },
    { code: 'DAILY_LIMIT_EXCEEDED', message: 'The daily transaction limit has been exceeded' },
  ],
  refund: [
    { code: 'REFUND_LIMIT_EXCEEDED', message: 'The refund limit has been exceeded' },
    { code: 'ORIGINAL_DEPOSIT_NOT_FOUND', message: 'The original deposit was not found' },
    { code: 'REFUND_ALREADY_PROCESSED', message: 'A refund has already been processed for this deposit' },
    { code: 'TIMEOUT', message: 'The refund request timed out' },
  ],
};
