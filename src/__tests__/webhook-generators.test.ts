import {
  generateWebhook,
  WEBHOOK_EVENT_TYPES,
} from '../mocks/webhook-generators';

describe('webhook-generators', () => {
  describe('WEBHOOK_EVENT_TYPES', () => {
    it('should include deposit event types', () => {
      expect(WEBHOOK_EVENT_TYPES).toContain('deposit.accepted');
      expect(WEBHOOK_EVENT_TYPES).toContain('deposit.completed');
      expect(WEBHOOK_EVENT_TYPES).toContain('deposit.failed');
    });

    it('should include payout event types', () => {
      expect(WEBHOOK_EVENT_TYPES).toContain('payout.accepted');
      expect(WEBHOOK_EVENT_TYPES).toContain('payout.completed');
      expect(WEBHOOK_EVENT_TYPES).toContain('payout.failed');
    });

    it('should include refund event types', () => {
      expect(WEBHOOK_EVENT_TYPES).toContain('refund.completed');
      expect(WEBHOOK_EVENT_TYPES).toContain('refund.failed');
    });
  });

  describe('generateWebhook', () => {
    it('should generate deposit.completed webhook', () => {
      const webhook = generateWebhook('deposit.completed', {
        amount: '5000',
        phoneNumber: '237670000000',
        correspondent: 'MTN_MOMO_CMR',
      });

      expect(webhook.eventType).toBe('deposit.completed');
      expect(webhook.eventId).toBeDefined();
      expect(webhook.timestamp).toBeDefined();
      expect(webhook.data).toBeDefined();
      expect(webhook.data.amount).toBe('5000');
      expect(webhook.data.status).toBe('COMPLETED');
    });

    it('should generate deposit.failed webhook', () => {
      const webhook = generateWebhook('deposit.failed', {
        amount: '5000',
        phoneNumber: '237670000000',
        correspondent: 'MTN_MOMO_CMR',
      });

      expect(webhook.eventType).toBe('deposit.failed');
      expect(webhook.data.status).toBe('FAILED');
      expect(webhook.data.failureReason).toBeDefined();
    });

    it('should generate payout.completed webhook', () => {
      const webhook = generateWebhook('payout.completed', {
        amount: '3000',
        phoneNumber: '237690000000',
        correspondent: 'ORANGE_CMR',
      });

      expect(webhook.eventType).toBe('payout.completed');
      expect(webhook.data.status).toBe('COMPLETED');
    });

    it('should generate refund.completed webhook', () => {
      const webhook = generateWebhook('refund.completed', {
        amount: '2000',
        phoneNumber: '237670000000',
        correspondent: 'MTN_MOMO_CMR',
      });

      expect(webhook.eventType).toBe('refund.completed');
      expect(webhook.data.status).toBe('COMPLETED');
    });

    it('should use default values when options not provided', () => {
      const webhook = generateWebhook('deposit.completed');

      expect(webhook.data.amount).toBeDefined();
    });

    it('should generate unique event IDs', () => {
      const webhook1 = generateWebhook('deposit.completed');
      const webhook2 = generateWebhook('deposit.completed');

      expect(webhook1.eventId).not.toBe(webhook2.eventId);
    });
  });
});
