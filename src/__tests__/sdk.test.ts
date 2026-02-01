import { SpaarkPayApiSdk } from '../sdk';

describe('SpaarkPayApiSdk', () => {
  describe('constructor', () => {
    it('should create SDK instance with required config', () => {
      const sdk = new SpaarkPayApiSdk({
        apiKey: 'test-api-key',
        environment: 'sandbox',
      });

      expect(sdk).toBeDefined();
      expect(sdk.transactions).toBeDefined();
      expect(sdk.webhooks).toBeDefined();
      expect(sdk.utils).toBeDefined();
      expect(sdk.finances).toBeDefined();
      expect(sdk.products).toBeDefined();
    });

    it('should use sandbox environment', () => {
      const sdk = new SpaarkPayApiSdk({
        apiKey: 'test-api-key',
        environment: 'sandbox',
      });

      const config = sdk.getConfig();
      expect(config.environment).toBe('sandbox');
    });

    it('should use production environment when specified', () => {
      const sdk = new SpaarkPayApiSdk({
        apiKey: 'test-api-key',
        environment: 'production',
      });

      const config = sdk.getConfig();
      expect(config.environment).toBe('production');
    });

    it('should apply default timeout', () => {
      const sdk = new SpaarkPayApiSdk({
        apiKey: 'test-api-key',
        environment: 'sandbox',
      });

      const config = sdk.getConfig();
      expect(config.timeout).toBe(30000);
    });

    it('should apply custom timeout', () => {
      const sdk = new SpaarkPayApiSdk({
        apiKey: 'test-api-key',
        environment: 'sandbox',
        timeout: 60000,
      });

      const config = sdk.getConfig();
      expect(config.timeout).toBe(60000);
    });

    it('should apply default retries', () => {
      const sdk = new SpaarkPayApiSdk({
        apiKey: 'test-api-key',
        environment: 'sandbox',
      });

      const config = sdk.getConfig();
      expect(config.retries).toBe(3);
    });
  });

  describe('setLogLevel', () => {
    it('should not throw when setting log level', () => {
      const sdk = new SpaarkPayApiSdk({
        apiKey: 'test-api-key',
        environment: 'sandbox',
      });

      expect(() => sdk.setLogLevel('debug')).not.toThrow();
    });
  });

  describe('setWebhookSecret', () => {
    it('should set webhook secret', () => {
      const sdk = new SpaarkPayApiSdk({
        apiKey: 'test-api-key',
        environment: 'sandbox',
      });

      sdk.setWebhookSecret('whsec_test_secret');
      expect(sdk.webhooks).toBeDefined();
    });
  });
});
