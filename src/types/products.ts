import type { Currency } from './transactions';

export interface ProductCreateRequest {
  name: string;
  description?: string;
  price: number;
  currency: Currency;
  metadata?: Record<string, unknown>;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  domains: string[];
  created: string;
  updated: string;
}

export interface DomainAddRequest {
  productId: string;
  domain: string;
}
