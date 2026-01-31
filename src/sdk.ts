import type { SpaarkPayApiSdkConfig, ResolvedConfig, LogLevel } from './types/config';
import { resolveConfig, getConfigFromEnv } from './config';
import { HttpClient } from './core/http-client';
import { Logger } from './core/logger';
import { TransactionsModule } from './modules/transactions';
import { ProductsModule } from './modules/products';
import { WebhooksModule } from './modules/webhooks';
import { UtilsModule } from './modules/utils';
import { FinancesModule } from './modules/finances';

export class SpaarkPayApiSdk {
  private readonly config: ResolvedConfig;
  private readonly logger: Logger;
  private readonly httpClient: HttpClient;

  readonly transactions: TransactionsModule;
  readonly products: ProductsModule;
  readonly webhooks: WebhooksModule;
  readonly utils: UtilsModule;
  readonly finances: FinancesModule;

  constructor(config: SpaarkPayApiSdkConfig) {
    const envConfig = getConfigFromEnv();
    const mergedConfig: SpaarkPayApiSdkConfig = {
      ...envConfig,
      ...config,
    };

    this.config = resolveConfig(mergedConfig);
    this.logger = new Logger('SpaarkPayApiSdk', this.config.logLevel);
    this.httpClient = HttpClient.fromConfig(this.config, this.logger);

    this.transactions = new TransactionsModule(this.httpClient, this.logger);
    this.products = new ProductsModule(this.logger);
    this.webhooks = new WebhooksModule(this.httpClient, this.logger, {
      webhookSecret: this.getWebhookSecretFromEnv(),
    });
    this.utils = new UtilsModule(this.httpClient, this.logger);
    this.finances = new FinancesModule(this.httpClient, this.logger);

    this.logger.info(`SpaarkPayApiSdk initialized`, {
      environment: this.config.environment,
      baseUrl: this.config.baseUrl,
    });
  }

  private getWebhookSecretFromEnv(): string | undefined {
    if (typeof process !== 'undefined' && process.env) {
      return process.env['PAWAPAY_WEBHOOK_SECRET'];
    }
    return undefined;
  }

  getConfig(): Readonly<ResolvedConfig> {
    return { ...this.config };
  }

  setLogLevel(level: LogLevel): void {
    this.logger.setLevel(level);
  }

  setWebhookSecret(secret: string): void {
    this.webhooks.setWebhookSecret(secret);
  }
}
