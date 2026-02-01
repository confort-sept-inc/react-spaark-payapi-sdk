# spaark-payapi-sdk

TypeScript SDK for Pawapay Mobile Money API (V2). Simplifies integration with Mobile Money operators in Africa.

[![npm version](https://img.shields.io/npm/v/spaark-payapi-sdk.svg)](https://www.npmjs.com/package/spaark-payapi-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
# npm
npm install spaark-payapi-sdk

# pnpm
pnpm add spaark-payapi-sdk

# yarn
yarn add spaark-payapi-sdk
```

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

- **Transactions**: Deposits, Payouts, Refunds, Payment Page
- **Toolkit**: Predict Provider, Active Configuration, Provider Availability
- **Finances**: Wallet Balances, Statement Generation
- **Webhooks**: Signature verification, Event parsing
- **React Components**: Test dashboard + Finance dashboard
- **Full TypeScript**: Complete type definitions
- **i18n**: French/English support

## Supported Providers

| Provider | Country | Currency |
|----------|---------|----------|
| `MTN_MOMO_CMR` | Cameroon | XAF |
| `ORANGE_CMR` | Cameroon | XAF |
| `MTN_MOMO_COG` | Congo | XAF |
| `AIRTEL_COG` | Congo | XAF |
| `MTN_MOMO_GAB` | Gabon | XAF |
| `AIRTEL_GAB` | Gabon | XAF |

## API Reference

### Initialization

```typescript
import { SpaarkPayApiSdk } from 'spaark-payapi-sdk';

const sdk = new SpaarkPayApiSdk({
  apiKey: process.env.PAWAPAY_API_KEY,
  environment: 'sandbox', // 'sandbox' | 'production'
  timeout: 30000,         // Optional: request timeout in ms
  retries: 3,             // Optional: retry attempts
  logLevel: 'info',       // Optional: 'debug' | 'info' | 'warn' | 'error' | 'none'
});
```

### Transactions

#### Initiate Deposit (Collect Payment)

```typescript
const deposit = await sdk.transactions.initiateDeposit({
  amount: 5000,
  currency: 'XAF',
  provider: 'MTN_MOMO_CMR',
  phoneNumber: '237670000000',
  transactionId: sdk.utils.generateTransactionId(),
  customerMessage: 'Payment description', // 4-22 chars
  clientReferenceId: 'order-123',         // Optional
  metadata: [{ orderId: 'ORD-123' }],     // Optional
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
  interval: 5000,      // Poll every 5 seconds
  maxAttempts: 12,     // Max 12 attempts (1 minute)
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
  language: 'FR',                                     // Optional
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
  operationType: 'DEPOSIT', // Optional
});
```

#### Active Configuration

```typescript
const config = await sdk.utils.getActiveConfiguration();
```

#### Check MMO Availability

```typescript
const status = await sdk.utils.checkMMOAvailability('MTN_MOMO_CMR');
// { correspondent: 'MTN_MOMO_CMR', available: true, degraded: false }
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

const result = await sdk.finances.pollStatementUntilComplete(statement.statementId);
console.log(result.downloadUrl);
```

### Webhooks

```typescript
// Set secret
sdk.setWebhookSecret(process.env.PAWAPAY_WEBHOOK_SECRET);

// Verify signature
const isValid = sdk.webhooks.verifySignature(body, signature);

// Parse event
const event = sdk.webhooks.parseEvent(body);

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
}
```

### Utilities

```typescript
// Generate UUID v4
const txId = sdk.utils.generateTransactionId();

// Validate transaction ID
const isValid = sdk.utils.validateTransactionId(txId);

// Format phone number
const phone = sdk.utils.formatPhoneNumber('670000000', 'CMR');

// Validate phone for provider
const isValid = sdk.utils.validatePhoneNumber('237670000000', 'MTN_MOMO_CMR');

// Get provider info
const info = sdk.utils.getCorrespondentInfo('MTN_MOMO_CMR');

// Detect provider from phone
const provider = sdk.utils.detectCorrespondent('237670000000');

// Get transaction limits
const limits = await sdk.utils.getTransactionLimits('MTN_MOMO_CMR');
```

## React Components

### Test Dashboard

```tsx
import { PawapayTestDashboard } from 'spaark-payapi-sdk/react';

export default function TestPage() {
  return (
    <PawapayTestDashboard
      environment="sandbox"
      apiBasePath="/api/pawapay"
      demoMode={false}
      onDepositComplete={(res) => console.log('Deposit:', res)}
      onPayoutComplete={(res) => console.log('Payout:', res)}
      onError={(err) => console.error(err)}
    />
  );
}
```

Use `demoMode={true}` to test without API key.

### Finance Dashboard

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
  // ... more transactions
];

export default function FinancePage() {
  return (
    <SpaarkPaySdkFinanceDashboard
      transactions={transactions}
      title="My Finance Dashboard"        // Customizable
      locale="fr"                          // 'fr' | 'en'
      onRefresh={() => fetchData()}        // Refresh button handler
      onTransactionClick={(tx) => {}}      // Row click handler
      onExpertModeClick={() => {}}         // Expert mode button
      showExpertMode={true}                // Show/hide expert button
      isLoading={false}                    // Loading state
    />
  );
}
```

**Features:**
- 5 KPI cards (Total Volume, Deposits, Payouts, Failed, Refunds)
- Search by transaction ID or phone number
- Filter by type (deposit/payout/refund) and status
- Paginated transactions table
- Copy transaction ID to clipboard
- i18n support (French/English)
- Customizable title
- Expert Mode button integration

## TypeScript Types

```typescript
import type {
  SpaarkPayApiSdkConfig,
  DepositRequest,
  DepositResponse,
  PayoutRequest,
  PayoutResponse,
  TransactionStatus,
  TransactionStatusResponse,
  Correspondent,
  Currency,
  Transaction,
  TransactionType,
  // ... and more
} from 'spaark-payapi-sdk';
```

## Error Handling

```typescript
import { PawapayError } from 'spaark-payapi-sdk';

try {
  await sdk.transactions.initiateDeposit({ ... });
} catch (error) {
  if (error instanceof PawapayError) {
    console.log(error.code);       // Error code
    console.log(error.message);    // Human-readable message
    console.log(error.retryable);  // Whether to retry
    console.log(error.statusCode); // HTTP status
  }
}
```

## Environment Variables

```bash
PAWAPAY_API_KEY=pk_sandbox_xxxxxxxxxxxx
PAWAPAY_ENVIRONMENT=sandbox
PAWAPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

## License

MIT
