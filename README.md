# spaark-payapi-sdk

TypeScript SDK for Pawapay Mobile Money API (V2). Simplifies integration with Mobile Money operators in Africa (CEMAC region).

[![npm version](https://img.shields.io/npm/v/spaark-payapi-sdk.svg)](https://www.npmjs.com/package/spaark-payapi-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [Project Architecture](#project-architecture)
- [Supported Providers](#supported-providers)
- [API Reference](#api-reference)
  - [Initialization](#initialization)
  - [Transactions](#transactions)
  - [Toolkit](#toolkit)
  - [Finances](#finances)
  - [Webhooks](#webhooks)
  - [Products](#products)
  - [Utilities](#utilities)
- [React Components](#react-components)
  - [Test Dashboard](#test-dashboard)
  - [Finance Dashboard](#finance-dashboard)
- [TypeScript Types](#typescript-types)
- [Error Handling](#error-handling)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [License](#license)

## Installation

```bash
# npm
npm install spaark-payapi-sdk

# pnpm
pnpm add spaark-payapi-sdk

# yarn
yarn add spaark-payapi-sdk
```

### For React Components (shadcn/ui)

The SDK includes React components built with shadcn/ui patterns. Install the required peer dependencies:

```bash
# Core React dependencies
npm install react react-dom axios

# shadcn/ui prerequisites (via shadcn CLI)
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add tabs
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add chart
pnpm dlx shadcn@latest add skeleton
pnpm dlx shadcn@latest add spinner

# Or install manually
npm install lucide-react @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-dialog recharts @tanstack/react-table

# The following are bundled with the SDK (no need to install):
# - clsx
# - tailwind-merge
# - class-variance-authority
```

> **Note**: The components use shadcn/ui styling conventions. Make sure your project has Tailwind CSS configured with the shadcn/ui theme variables.

## Quick Start

```typescript
import { SpaarkPayApiSdk } from 'spaark-payapi-sdk';

const sdk = new SpaarkPayApiSdk({
  apiKey: 'pk_sandbox_xxxxxxxxxxxx',
  environment: 'sandbox', // or 'production'
});

// Initiate a deposit (collect payment)
const deposit = await sdk.transactions.initiateDeposit({
  amount: 5000,
  currency: 'XAF',
  provider: 'MTN_MOMO_CMR',
  phoneNumber: '237670000000',
  transactionId: sdk.utils.generateTransactionId(),
  customerMessage: 'Payment for order',
});

console.log(deposit.depositId, deposit.status);
```

## Features

### Core SDK
- **Transactions**: Deposits, Payouts, Refunds, Payment Page, Polling
- **Toolkit**: Predict Provider, Active Configuration, Provider Availability, Public Keys
- **Finances**: Wallet Balances, Statement Generation
- **Webhooks**: HMAC-SHA256 signature verification, Event parsing
- **Products**: Product management with domain configuration

### React Components
- **Test Dashboard**: Interactive SDK testing UI with 6 tabs (Deposit, Payout, Status, Toolkit, Finances, Webhooks)
- **Finance Dashboard**: Transaction analytics with charts and KPIs
- **shadcn/ui Components**: Button, Tabs, Select, Card, Input, Table, Skeleton, Spinner
- **Charts**: Area, Bar, Pie charts with Recharts
- **i18n**: French/English support

### Developer Experience
- **Full TypeScript**: Complete type definitions with strict mode
- **Zod Validation**: Input validation for all requests
- **Retry Logic**: Exponential backoff with jitter
- **Logging**: Configurable log levels with sensitive data sanitization
- **Error Handling**: Typed errors with retryable flag

## Project Architecture

```
src/
├── sdk.ts                 # Main SpaarkPayApiSdk class
├── config.ts              # Configuration validation (Zod)
├── index.ts               # Main exports
├── react.tsx              # React components entry point
│
├── modules/
│   ├── transactions.ts    # Deposits, payouts, refunds, polling
│   ├── products.ts        # Product management
│   ├── webhooks.ts        # Signature verification, event parsing
│   ├── utils.ts           # Helpers, availability, prediction
│   └── finances.ts        # Wallet balances, statements
│
├── core/
│   ├── http-client.ts     # Axios wrapper with interceptors
│   ├── retry.ts           # Exponential backoff logic
│   ├── errors.ts          # PawapayError class
│   └── logger.ts          # Configurable logger
│
├── types/
│   ├── config.ts          # SDK configuration types
│   ├── transactions.ts    # Transaction types
│   ├── webhooks.ts        # Webhook event types
│   ├── toolkit.ts         # Toolkit types
│   ├── finances.ts        # Finance types
│   └── products.ts        # Product types
│
├── constants/
│   ├── correspondents.ts  # Provider definitions & limits
│   └── errors.ts          # Error code definitions
│
├── components/
│   └── SpaarkPaySdkFinanceDashboard.tsx
│
├── mocks/
│   └── webhook-generators.ts  # Test webhook generation
│
└── lib/
    └── utils.ts           # Tailwind merge utility
```

## Supported Providers

| Provider | Country | Currency | Deposits | Payouts |
|----------|---------|----------|----------|---------|
| `MTN_MOMO_CMR` | Cameroon | XAF | 100 - 1,000,000 | 500 - 500,000 |
| `ORANGE_CMR` | Cameroon | XAF | 100 - 1,000,000 | 500 - 500,000 |
| `MTN_MOMO_COG` | Congo | XAF | 100 - 1,000,000 | 500 - 500,000 |
| `AIRTEL_COG` | Congo | XAF | 100 - 1,000,000 | 500 - 500,000 |
| `MTN_MOMO_GAB` | Gabon | XAF | 100 - 1,000,000 | 500 - 500,000 |
| `AIRTEL_GAB` | Gabon | XAF | 100 - 1,000,000 | 500 - 500,000 |

### Phone Number Formats

| Country | Format | Example |
|---------|--------|---------|
| Cameroon | `237XXXXXXXXX` | 237670000000 |
| Congo | `242XXXXXXXXX` | 242060000000 |
| Gabon | `241XXXXXXXX` | 24160000000 |

## API Reference

### Initialization

```typescript
import { SpaarkPayApiSdk } from 'spaark-payapi-sdk';

const sdk = new SpaarkPayApiSdk({
  apiKey: process.env.PAWAPAY_API_KEY,      // Required
  environment: 'sandbox',                    // 'sandbox' | 'production'
  timeout: 30000,                            // Request timeout in ms (default: 30000)
  retries: 3,                                // Retry attempts (default: 3)
  logLevel: 'info',                          // 'debug' | 'info' | 'warn' | 'error' | 'none'
});

// Runtime configuration
sdk.setLogLevel('debug');
sdk.setWebhookSecret('whsec_xxxxxxxxxxxx');
```

### Transactions

#### Initiate Deposit (Collect Payment)

```typescript
const deposit = await sdk.transactions.initiateDeposit({
  amount: 5000,
  currency: 'XAF',
  provider: 'MTN_MOMO_CMR',
  phoneNumber: '237670000000',
  transactionId: sdk.utils.generateTransactionId(), // UUID v4 required
  customerMessage: 'Payment description',           // 4-22 chars
  clientReferenceId: 'order-123',                   // Optional
  metadata: [{ orderId: 'ORD-123' }],               // Optional
});

// Response
{
  depositId: 'uuid',
  status: 'ACCEPTED',
  created: '2025-01-31T12:00:00Z',
  nextStep: 'FINAL_STATUS' // or 'REDIRECT' | 'PRE_AUTHORISATION'
}
```

#### Initiate Payout (Send Money)

```typescript
const payout = await sdk.transactions.initiatePayout({
  amount: 5000,
  currency: 'XAF',
  provider: 'MTN_MOMO_CMR',
  phoneNumber: '237670000000',
  transactionId: sdk.utils.generateTransactionId(),
});

// Response
{
  payoutId: 'uuid',
  status: 'ACCEPTED',
  created: '2025-01-31T12:00:00Z'
}
```

#### Check Status

```typescript
// Check deposit status
const status = await sdk.transactions.checkDepositStatus('deposit-uuid');

// Check payout status
const status = await sdk.transactions.checkPayoutStatus('payout-uuid');

// Auto-detect (tries deposit first, then payout)
const status = await sdk.transactions.checkStatus('transaction-uuid');
```

#### Poll Until Complete

```typescript
const result = await sdk.transactions.pollUntilComplete('transaction-uuid', {
  interval: 5000,      // Poll every 5 seconds (default)
  maxAttempts: 12,     // Max 12 attempts (default)
  onStatusChange: (status) => console.log('Status:', status),
});
```

#### Refund

```typescript
const refund = await sdk.transactions.refund({
  depositId: 'original-deposit-uuid',
  amount: 5000,
  transactionId: sdk.utils.generateTransactionId(),
});
```

#### Payment Page (Hosted Checkout)

```typescript
const page = await sdk.transactions.createPaymentPage({
  depositId: deposit.depositId,
  returnUrl: 'https://yoursite.com/payment/complete',
  phoneNumber: '237670000000',                        // Optional
  amountDetails: { amount: 5000, currency: 'XAF' },   // Optional
  language: 'FR',                                     // Optional: 'FR' | 'EN'
  country: 'CMR',                                     // Optional
  reason: 'Ticket purchase',                          // Optional
});

// Redirect customer to:
console.log(page.redirectUrl);
```

#### Resend Callbacks & Cancel

```typescript
await sdk.transactions.resendDepositCallback('deposit-uuid');
await sdk.transactions.resendPayoutCallback('payout-uuid');
await sdk.transactions.cancelEnqueuedPayout('payout-uuid');
```

### Toolkit

#### Predict Provider

```typescript
const prediction = await sdk.utils.predictProvider('+237 670 000 000');
// { country: 'CMR', provider: 'MTN_MOMO_CMR', phoneNumber: '237670000000' }
```

#### Provider Availability

```typescript
const availability = await sdk.utils.getProviderAvailability({
  country: 'CMR',           // Optional
  operationType: 'DEPOSIT', // Optional: 'DEPOSIT' | 'PAYOUT' | 'REFUND'
});
```

#### Active Configuration

```typescript
const config = await sdk.utils.getActiveConfiguration();
// Returns company config, countries, providers, currencies, limits
```

#### Check MMO Availability

```typescript
const status = await sdk.utils.checkMMOAvailability('MTN_MOMO_CMR');
// { correspondent: 'MTN_MOMO_CMR', available: true, degraded: false }
```

#### Get Public Keys

```typescript
const keys = await sdk.utils.getPublicKeys();
// [{ id: 'key-001', key: 'MIIBIjANBgkqhkiG9w0BAQEFAA...' }]
```

### Finances

#### Wallet Balances

```typescript
const balances = await sdk.finances.getWalletBalances();
// [{ country: 'CMR', currency: 'XAF', balance: '1250000.00' }]
```

#### Generate Statement

```typescript
const statement = await sdk.finances.generateStatement({
  wallet: { country: 'CMR', currency: 'XAF' },
  callbackUrl: 'https://yoursite.com/webhooks/statement',
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-31T23:59:59Z',
  compressed: true,
});

// Poll until complete
const result = await sdk.finances.pollStatementUntilComplete(statement.statementId);
console.log(result.downloadUrl);
```

### Webhooks

#### Setup

```typescript
// Set webhook secret
sdk.setWebhookSecret(process.env.PAWAPAY_WEBHOOK_SECRET);
```

#### Verify Signature

```typescript
const isValid = sdk.webhooks.verifySignature(body, signature);
```

#### Parse Event

```typescript
const event = sdk.webhooks.parseEvent(body);

// Or verify + parse in one step
const event = sdk.webhooks.constructEvent(body, signature);
```

#### Event Types

| Event Type | Description |
|------------|-------------|
| `deposit.accepted` | Deposit request accepted |
| `deposit.completed` | Deposit completed successfully |
| `deposit.failed` | Deposit failed |
| `payout.accepted` | Payout request accepted |
| `payout.completed` | Payout completed successfully |
| `payout.failed` | Payout failed |
| `refund.completed` | Refund completed successfully |
| `refund.failed` | Refund failed |

#### Handle Events

```typescript
switch (event.eventType) {
  case 'deposit.completed':
    console.log('Deposit completed:', event.data.depositId);
    break;
  case 'deposit.failed':
    console.log('Deposit failed:', event.data.failureReason);
    break;
  case 'payout.completed':
    console.log('Payout completed:', event.data.payoutId);
    break;
  case 'payout.failed':
    console.log('Payout failed:', event.data.failureReason);
    break;
}
```

### Products

Local product management (in-memory storage):

```typescript
// Create product
const product = await sdk.products.create({
  name: 'Premium Plan',
  price: 10000,
  currency: 'XAF',
  description: 'Monthly subscription',
});

// Get product
const product = await sdk.products.get('product-id');

// List products
const products = await sdk.products.list();

// Update product
await sdk.products.update('product-id', { price: 12000 });

// Delete product
await sdk.products.delete('product-id');

// Add/remove domains
await sdk.products.addDomain({ productId: 'product-id', domain: 'example.com' });
await sdk.products.removeDomain('product-id', 'example.com');
```

### Utilities

```typescript
// Generate UUID v4 transaction ID
const txId = sdk.utils.generateTransactionId();

// Validate transaction ID format
const isValid = sdk.utils.validateTransactionId(txId);

// Format phone number for country
const phone = sdk.utils.formatPhoneNumber('670000000', 'CMR');
// '237670000000'

// Validate phone for provider
const isValid = sdk.utils.validatePhoneNumber('237670000000', 'MTN_MOMO_CMR');

// Get provider info
const info = sdk.utils.getCorrespondentInfo('MTN_MOMO_CMR');

// Detect provider from phone number
const provider = sdk.utils.detectCorrespondent('237670000000');

// Get transaction limits for provider
const limits = await sdk.utils.getTransactionLimits('MTN_MOMO_CMR');
```

## React Components

### Test Dashboard

Interactive testing UI with 6 tabs: Deposit, Payout, Status, Toolkit, Finances, Webhooks.

```tsx
import { SpaarkPaySdkTestDashboard } from 'spaark-payapi-sdk/react';

export default function TestPage() {
  return (
    <SpaarkPaySdkTestDashboard
      apiKey="pk_sandbox_xxx"              // Optional: pre-configured API key
      environment="sandbox"                 // 'sandbox' | 'production'
      apiBasePath="/api/pawapay"           // Backend proxy route
      demoMode={false}                      // Enable demo mode (simulated responses)
      onDepositComplete={(res) => console.log('Deposit:', res)}
      onPayoutComplete={(res) => console.log('Payout:', res)}
      onError={(err) => console.error(err)}
      className="max-w-6xl mx-auto"
    />
  );
}
```

Use `demoMode={true}` to test without API key.

#### Backend Proxy Setup (Next.js)

```typescript
// app/api/pawapay/deposit/route.ts
import { SpaarkPayApiSdk } from 'spaark-payapi-sdk';

export async function POST(request: Request) {
  const body = await request.json();

  const sdk = new SpaarkPayApiSdk({
    apiKey: body.apiKey,
    environment: body.environment,
  });

  const result = await sdk.transactions.initiateDeposit({
    amount: body.amount,
    currency: body.currency,
    provider: body.provider,
    phoneNumber: body.phoneNumber,
    transactionId: body.transactionId,
    customerMessage: body.customerMessage,
  });

  return Response.json(result);
}
```

### Finance Dashboard

Transaction analytics dashboard with KPI cards, filters, pagination, and charts.

```tsx
import {
  SpaarkPaySdkFinanceDashboard,
  type Transaction
} from 'spaark-payapi-sdk/react';

const transactions: Transaction[] = [
  {
    id: 'tx-001',
    type: 'deposit',
    amount: 5000,
    currency: 'XAF',
    status: 'COMPLETED',
    provider: 'MTN_MOMO_CMR',
    phoneNumber: '237670000000',
    createdAt: '2025-01-15T10:00:00Z',
  },
];

export default function FinancePage() {
  return (
    <SpaarkPaySdkFinanceDashboard
      transactions={transactions}
      title="My Finance Dashboard"
      subtitle="Overview of your transactions"
      locale="fr"                              // 'fr' | 'en'
      onRefresh={() => fetchData()}            // Refresh button callback
      onSettings={() => openSettings()}        // Settings button (gear icon)
      onAddTransaction={() => openForm()}      // CTA button when no transactions
      onTransactionClick={(tx) => {}}          // Table row click
      onExpertModeClick={() => {}}             // Expert mode button
      showExpertMode={true}
      isLoading={false}
    />
  );
}
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `transactions` | `Transaction[]` | Array of transactions to display |
| `title` | `string` | Dashboard title (default: "Tableau de bord financier") |
| `subtitle` | `string` | Dashboard subtitle |
| `locale` | `'fr' \| 'en'` | Language (default: 'fr') |
| `onRefresh` | `() => void` | Refresh button callback |
| `onSettings` | `() => void` | Settings button callback (gear icon) |
| `onAddTransaction` | `() => void` | CTA button callback when no transactions |
| `onTransactionClick` | `(tx) => void` | Table row click callback |
| `onExpertModeClick` | `() => void` | Expert mode button callback |
| `showExpertMode` | `boolean` | Show/hide expert mode button |
| `isLoading` | `boolean` | Show loading skeletons |

**Features:**

**Dashboard Tab:**
- 8 KPI cards: Total Volume, Deposits, Payouts, Refunds, Pending, Completed, Failed, Cancelled
- Search by transaction ID or phone number
- Dropdown filters for type and status
- Paginated transactions table with @tanstack/react-table
- Copy transaction ID button
- Empty state with CTA button

**Charts Tab:**
- Area Chart: Volume over time (deposits vs payouts)
- Bar Chart: Transaction amounts by type
- Pie Chart: Status distribution (donut style)

## TypeScript Types

```typescript
import type {
  // SDK Config
  SpaarkPayApiSdkConfig,
  ResolvedConfig,
  Environment,
  LogLevel,

  // Transactions
  DepositRequest,
  DepositResponse,
  PayoutRequest,
  PayoutResponse,
  RefundRequest,
  RefundResponse,
  TransactionStatus,
  TransactionStatusResponse,
  PaymentPageRequest,
  PaymentPageResponse,
  PollOptions,
  FailureReason,
  DepositFailureCode,
  PayoutFailureCode,

  // Providers
  Correspondent,
  CorrespondentInfo,
  TransactionLimits,
  Currency,

  // Webhooks
  WebhookEventType,
  PawapayWebhookEvent,
  DepositCallbackData,
  PayoutCallbackData,

  // Toolkit
  OperationType,
  OperationStatus,
  ProviderAvailability,
  ActiveConfigResponse,
  PredictProviderResponse,
  PublicKeyResponse,

  // Finances
  WalletBalance,
  StatementRequest,
  StatementResponse,
  StatementStatus,

  // Products
  Product,
  ProductCreateRequest,

  // React Components
  Transaction,
  TransactionType,
  SpaarkPaySdkFinanceDashboardProps,
  SpaarkPaySdkTestDashboardProps,
} from 'spaark-payapi-sdk';
```

### Transaction Type (Finance Dashboard)

```typescript
type Transaction = {
  id: string;
  type: 'deposit' | 'payout' | 'refund';
  amount: number;
  currency: string;
  status: 'ACCEPTED' | 'PENDING' | 'ENQUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REJECTED';
  provider: Correspondent;
  phoneNumber: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  failureReason?: string;
};
```

## Error Handling

```typescript
import { PawapayError } from 'spaark-payapi-sdk';

try {
  await sdk.transactions.initiateDeposit({ ... });
} catch (error) {
  if (error instanceof PawapayError) {
    console.log(error.code);         // Error code
    console.log(error.message);      // Human-readable message
    console.log(error.retryable);    // Whether to retry
    console.log(error.statusCode);   // HTTP status code
    console.log(error.failureReason); // Pawapay failure reason
  }
}
```

### Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `VALIDATION_ERROR` | Invalid input data | No |
| `INVALID_PHONE` | Invalid phone number format | No |
| `INSUFFICIENT_FUNDS` | Not enough balance | No |
| `AMOUNT_TOO_LOW` | Below minimum amount | No |
| `AMOUNT_TOO_HIGH` | Above maximum amount | No |
| `LIMIT_EXCEEDED` | Daily/monthly limit exceeded | No |
| `DUPLICATE` | Duplicate transaction ID | No |
| `MMO_UNAVAILABLE` | Provider is unavailable | Yes |
| `TIMEOUT` | Request timeout | Yes |
| `UNAUTHORIZED` | Invalid API key | No |
| `RATE_LIMITED` | Too many requests | Yes |
| `SERVER_ERROR` | Pawapay server error | Yes |
| `NETWORK_ERROR` | Network connectivity issue | Yes |
| `NOT_FOUND` | Transaction not found | No |

## Environment Variables

```bash
# Required
PAWAPAY_API_KEY=pk_sandbox_xxxxxxxxxxxx

# Optional
PAWAPAY_ENVIRONMENT=sandbox              # 'sandbox' | 'production' (default: sandbox)
PAWAPAY_BASE_URL=https://custom.api.url  # Custom API base URL
PAWAPAY_CALLBACK_URL=https://...         # Default webhook callback URL
PAWAPAY_TIMEOUT=30000                    # Request timeout in ms (default: 30000)
PAWAPAY_RETRIES=3                        # Number of retries (default: 3)
PAWAPAY_LOG_LEVEL=info                   # 'debug' | 'info' | 'warn' | 'error' | 'none'
PAWAPAY_WEBHOOK_SECRET=whsec_xxx         # Webhook signature secret
```

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/confort-sept-inc/react-spaark-payapi-sdk.git
cd react-spaark-payapi-sdk

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build with tsup (ESM + CJS + types) |
| `pnpm dev` | Watch mode for development |
| `pnpm test` | Run Jest tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint |
| `pnpm release` | Build, version, and publish |

### Testing

```bash
# Run all tests
pnpm test

# Run with coverage (70% threshold)
pnpm test:coverage

# Run specific test file
pnpm test src/__tests__/sdk.test.ts
```

### Project Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.3
- React 18 or 19 (for components)

## License

MIT
