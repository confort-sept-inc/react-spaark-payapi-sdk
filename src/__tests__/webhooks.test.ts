import { WebhooksModule } from '../modules/webhooks';

const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
};

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('WebhooksModule', () => {
  let webhooks: WebhooksModule;
  const webhookSecret = 'whsec_test_secret_key_123';

  beforeEach(() => {
    jest.clearAllMocks();
    webhooks = new WebhooksModule(
      mockHttpClient as any,
      mockLogger as any,
      { webhookSecret }
    );
  });

  describe('parseEvent', () => {
    it('should parse valid webhook JSON', () => {
      const payload = JSON.stringify({
        eventId: 'evt-123',
        eventType: 'deposit.completed',
        timestamp: '2025-01-15T10:00:00Z',
        data: {
          depositId: 'dep-123',
          status: 'COMPLETED',
          amount: '5000.00',
          currency: 'XAF',
        },
      });

      const event = webhooks.parseEvent(payload);

      expect(event.eventId).toBe('evt-123');
      expect(event.eventType).toBe('deposit.completed');
    });

    it('should throw on invalid JSON', () => {
      expect(() => webhooks.parseEvent('invalid json')).toThrow();
    });

    it('should throw on missing eventType', () => {
      const payload = JSON.stringify({
        eventId: 'evt-123',
        data: {},
      });

      expect(() => webhooks.parseEvent(payload)).toThrow();
    });
  });

  describe('isDepositEvent', () => {
    it('should return true for deposit events', () => {
      expect(webhooks.isDepositEvent('deposit.completed')).toBe(true);
      expect(webhooks.isDepositEvent('deposit.failed')).toBe(true);
      expect(webhooks.isDepositEvent('deposit.accepted')).toBe(true);
    });

    it('should return false for non-deposit events', () => {
      expect(webhooks.isDepositEvent('payout.completed')).toBe(false);
      expect(webhooks.isDepositEvent('refund.completed')).toBe(false);
    });
  });

  describe('isPayoutEvent', () => {
    it('should return true for payout events', () => {
      expect(webhooks.isPayoutEvent('payout.completed')).toBe(true);
      expect(webhooks.isPayoutEvent('payout.failed')).toBe(true);
      expect(webhooks.isPayoutEvent('payout.accepted')).toBe(true);
    });

    it('should return false for non-payout events', () => {
      expect(webhooks.isPayoutEvent('deposit.completed')).toBe(false);
      expect(webhooks.isPayoutEvent('refund.completed')).toBe(false);
    });
  });

  describe('isRefundEvent', () => {
    it('should return true for refund events', () => {
      expect(webhooks.isRefundEvent('refund.completed')).toBe(true);
      expect(webhooks.isRefundEvent('refund.failed')).toBe(true);
    });

    it('should return false for non-refund events', () => {
      expect(webhooks.isRefundEvent('deposit.completed')).toBe(false);
      expect(webhooks.isRefundEvent('payout.completed')).toBe(false);
    });
  });

  describe('isSuccessEvent', () => {
    it('should return true for completed events', () => {
      expect(webhooks.isSuccessEvent('deposit.completed')).toBe(true);
      expect(webhooks.isSuccessEvent('payout.completed')).toBe(true);
      expect(webhooks.isSuccessEvent('refund.completed')).toBe(true);
    });

    it('should return false for non-completed events', () => {
      expect(webhooks.isSuccessEvent('deposit.failed')).toBe(false);
      expect(webhooks.isSuccessEvent('payout.accepted')).toBe(false);
    });
  });

  describe('isFailureEvent', () => {
    it('should return true for failed events', () => {
      expect(webhooks.isFailureEvent('deposit.failed')).toBe(true);
      expect(webhooks.isFailureEvent('payout.failed')).toBe(true);
      expect(webhooks.isFailureEvent('refund.failed')).toBe(true);
    });

    it('should return false for non-failed events', () => {
      expect(webhooks.isFailureEvent('deposit.completed')).toBe(false);
      expect(webhooks.isFailureEvent('payout.accepted')).toBe(false);
    });
  });

  describe('setWebhookSecret', () => {
    it('should update the webhook secret', () => {
      const newWebhooks = new WebhooksModule(
        mockHttpClient as any,
        mockLogger as any
      );
      newWebhooks.setWebhookSecret('new_secret_key');
      expect(() => newWebhooks.setWebhookSecret('another_secret')).not.toThrow();
    });
  });

  describe('verifySignature', () => {
    it('should return true when secret not configured', () => {
      const noSecretWebhooks = new WebhooksModule(
        mockHttpClient as any,
        mockLogger as any
      );

      const result = noSecretWebhooks.verifySignature('payload', 'signature');
      expect(result).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('not configured')
      );
    });

    it('should return false when no signature provided', () => {
      const result = webhooks.verifySignature('payload', '');
      expect(result).toBe(false);
    });
  });
});
