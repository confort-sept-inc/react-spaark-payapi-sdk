import { z } from 'zod';
import type { Logger } from '../core/logger';
import { PawapayError } from '../core/errors';
import type {
  Product,
  ProductCreateRequest,
  DomainAddRequest,
} from '../types/products';

const productCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  currency: z.enum(['XAF', 'XOF', 'USD']),
  metadata: z.record(z.unknown()).optional(),
});

const domainAddSchema = z.object({
  productId: z.string().uuid(),
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/),
});

interface StoredProduct extends Product {
  metadata?: Record<string, unknown>;
}

export class ProductsModule {
  private products: Map<string, StoredProduct> = new Map();

  constructor(private readonly logger: Logger) {}

  async create(request: ProductCreateRequest): Promise<Product> {
    const validated = productCreateSchema.parse(request);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const product: StoredProduct = {
      id,
      name: validated.name,
      description: validated.description,
      price: validated.price,
      currency: validated.currency,
      domains: [],
      created: now,
      updated: now,
      metadata: validated.metadata,
    };

    this.products.set(id, product);

    this.logger.info(`Created product ${id}`, { name: validated.name });

    return this.toProduct(product);
  }

  async get(productId: string): Promise<Product> {
    const product = this.products.get(productId);

    if (!product) {
      throw PawapayError.notFound(`Product ${productId} not found`);
    }

    return this.toProduct(product);
  }

  async list(): Promise<Product[]> {
    return Array.from(this.products.values()).map((p) => this.toProduct(p));
  }

  async update(
    productId: string,
    updates: Partial<ProductCreateRequest>
  ): Promise<Product> {
    const product = this.products.get(productId);

    if (!product) {
      throw PawapayError.notFound(`Product ${productId} not found`);
    }

    const validated = productCreateSchema.partial().parse(updates);

    const updatedProduct: StoredProduct = {
      ...product,
      ...validated,
      updated: new Date().toISOString(),
    };

    this.products.set(productId, updatedProduct);

    this.logger.info(`Updated product ${productId}`);

    return this.toProduct(updatedProduct);
  }

  async delete(productId: string): Promise<void> {
    const product = this.products.get(productId);

    if (!product) {
      throw PawapayError.notFound(`Product ${productId} not found`);
    }

    this.products.delete(productId);

    this.logger.info(`Deleted product ${productId}`);
  }

  async addDomain(request: DomainAddRequest): Promise<Product> {
    const validated = domainAddSchema.parse(request);

    const product = this.products.get(validated.productId);

    if (!product) {
      throw PawapayError.notFound(`Product ${validated.productId} not found`);
    }

    if (product.domains.includes(validated.domain)) {
      throw PawapayError.validation(`Domain ${validated.domain} already added to product`);
    }

    product.domains.push(validated.domain);
    product.updated = new Date().toISOString();

    this.logger.info(`Added domain ${validated.domain} to product ${validated.productId}`);

    return this.toProduct(product);
  }

  async removeDomain(productId: string, domain: string): Promise<Product> {
    const product = this.products.get(productId);

    if (!product) {
      throw PawapayError.notFound(`Product ${productId} not found`);
    }

    const domainIndex = product.domains.indexOf(domain);

    if (domainIndex === -1) {
      throw PawapayError.notFound(`Domain ${domain} not found in product`);
    }

    product.domains.splice(domainIndex, 1);
    product.updated = new Date().toISOString();

    this.logger.info(`Removed domain ${domain} from product ${productId}`);

    return this.toProduct(product);
  }

  private toProduct(stored: StoredProduct): Product {
    return {
      id: stored.id,
      name: stored.name,
      description: stored.description,
      price: stored.price,
      currency: stored.currency,
      domains: [...stored.domains],
      created: stored.created,
      updated: stored.updated,
    };
  }
}
