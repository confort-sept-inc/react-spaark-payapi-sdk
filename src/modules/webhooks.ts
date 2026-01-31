import { createHmac, timingSafeEqual } from 'crypto';
import type { HttpClient } from '../core/http-client';
import type { Logger } from '../core/logger';
import { PawapayError } from '../core/errors';
import type { PawapayWebhookEvent, WebhookEventType } from '../types/webhooks';

export interface WebhooksConfig {
  webhookSecret?: string;
}

export class WebhooksModule {
  private webhookSecret?: string;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly logger: Logger,
    config?: WebhooksConfig
  ) {
    this.webhookSecret = config?.webhookSecret;
  }

  setWebhookSecret(secret: string): void {
    this.webhookSecret = secret;
  }

  verifySignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret not configured, skipping signature verification');
      return true;
    }

    if (!signature) {
      this.logger.warn('No signature provided in webhook request');
      return false;
    }

    try {
      const expectedSignature = createHmac('sha256', this.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');

      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch (error) {
      this.logger.error('Error verifying webhook signature', error);
      return false;
    }
  }

  parseEvent<T = unknown>(payload: string): PawapayWebhookEvent<T> {
    try {
      const event = JSON.parse(payload) as PawapayWebhookEvent<T>;

      if (!event.eventId || !event.eventType || !event.timestamp) {
        throw new Error('Invalid webhook event structure');
      }

      return event;
    } catch (error) {
      throw PawapayError.validation(
        `Failed to parse webhook event: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  constructEvent<T = unknown>(
    payload: string,
    signature: string
  ): PawapayWebhookEvent<T> {
    if (!this.verifySignature(payload, signature)) {
      throw PawapayError.unauthorized('Invalid webhook signature');
    }

    return this.parseEvent<T>(payload);
  }

  async registerCallback(url: string): Promise<void> {
    this.logger.info(`Registering callback URL: ${url}`);

    await this.httpClient.post('/webhooks', { url });

    this.logger.info('Callback URL registered successfully');
  }

  async unregisterCallback(): Promise<void> {
    this.logger.info('Unregistering callback URL');

    await this.httpClient.delete('/webhooks');

    this.logger.info('Callback URL unregistered successfully');
  }

  isDepositEvent(eventType: WebhookEventType): boolean {
    return eventType.startsWith('deposit.');
  }

  isPayoutEvent(eventType: WebhookEventType): boolean {
    return eventType.startsWith('payout.');
  }

  isRefundEvent(eventType: WebhookEventType): boolean {
    return eventType.startsWith('refund.');
  }

  isSuccessEvent(eventType: WebhookEventType): boolean {
    return eventType.endsWith('.completed');
  }

  isFailureEvent(eventType: WebhookEventType): boolean {
    return eventType.endsWith('.failed');
  }
}
