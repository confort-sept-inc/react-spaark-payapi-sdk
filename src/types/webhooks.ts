export type WebhookEventType =
  | 'deposit.accepted'
  | 'deposit.completed'
  | 'deposit.failed'
  | 'payout.accepted'
  | 'payout.completed'
  | 'payout.failed'
  | 'refund.completed'
  | 'refund.failed';

export interface PawapayWebhookEvent<T = unknown> {
  eventId: string;
  eventType: WebhookEventType;
  timestamp: string;
  data: T;
}

export interface DepositCallbackData {
  depositId: string;
  status: 'COMPLETED' | 'FAILED';
  amount: string;
  currency: string;
  correspondent: string;
  payer: {
    type: string;
    address: {
      value: string;
    };
  };
  customerTimestamp: string;
  created: string;
  receivedByPayer?: string;
  failureReason?: {
    failureCode: string;
    failureMessage: string;
  };
  metadata?: Record<string, unknown>;
}

export interface PayoutCallbackData {
  payoutId: string;
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
  customerTimestamp: string;
  created: string;
  receivedByRecipient?: string;
  failureReason?: {
    failureCode: string;
    failureMessage: string;
  };
  metadata?: Record<string, unknown>;
}
