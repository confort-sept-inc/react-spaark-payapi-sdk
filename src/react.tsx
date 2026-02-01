'use client';

import { useState, useCallback } from 'react';
import type { Correspondent } from './constants/correspondents';
import type { DepositResponse, PayoutResponse } from './types/transactions';
import type { WebhookEventType } from './types/webhooks';
import {
  generateWebhook,
  WEBHOOK_EVENT_TYPES,
} from './mocks/webhook-generators';

type OperationStatus = 'idle' | 'loading' | 'success' | 'error';
type TabType = 'deposit' | 'payout' | 'status' | 'toolkit' | 'finances' | 'webhooks';

interface TestResult {
  id: string;
  operation: string;
  status: OperationStatus;
  response?: unknown;
  error?: string;
  timestamp: string;
}

interface WebhookTestEvent {
  id: string;
  eventType: string;
  payload: unknown;
  signature: string;
  receivedAt: string;
  isVerified: boolean | null;
}

export interface PawapayTestDashboardProps {
  apiKey?: string;
  environment?: 'sandbox' | 'production';
  className?: string;
  demoMode?: boolean;
  /** Base path for API routes (e.g., '/api/pawapay'). When set, requests go through your server instead of directly to Pawapay. */
  apiBasePath?: string;
  onDepositComplete?: (response: DepositResponse) => void;
  onPayoutComplete?: (response: PayoutResponse) => void;
  onError?: (error: Error) => void;
}

// Mock response generators for demo mode (V2 API format)
const createMockDepositResponse = (txId: string): DepositResponse => ({
  depositId: txId,
  status: 'ACCEPTED',
  created: new Date().toISOString(),
  nextStep: 'FINAL_STATUS',
});

const createMockPayoutResponse = (txId: string): PayoutResponse => ({
  payoutId: txId,
  status: 'ACCEPTED',
  created: new Date().toISOString(),
});

const createMockStatusResponse = (txId: string) => ({
  depositId: txId,
  status: ['COMPLETED', 'ACCEPTED', 'PROCESSING', 'ENQUEUED'][Math.floor(Math.random() * 4)],
  created: new Date(Date.now() - 60000).toISOString(),
  amount: '5000',
  currency: 'XAF',
  country: 'CMR',
  payer: {
    type: 'MMO',
    accountDetails: {
      phoneNumber: '237670000000',
      provider: 'MTN_MOMO_CMR',
    },
  },
});

const createMockAvailabilityResponse = () => [
  {
    country: 'CMR',
    providers: [
      {
        provider: 'MTN_MOMO_CMR',
        operationTypes: [
          { operationType: 'DEPOSIT', status: 'OPERATIONAL' },
          { operationType: 'PAYOUT', status: 'OPERATIONAL' },
        ],
      },
      {
        provider: 'ORANGE_CMR',
        operationTypes: [
          { operationType: 'DEPOSIT', status: 'OPERATIONAL' },
          { operationType: 'PAYOUT', status: 'DELAYED' },
        ],
      },
    ],
  },
];

const createMockPredictResponse = (phone: string) => ({
  country: 'CMR',
  provider: phone.startsWith('23767') ? 'MTN_MOMO_CMR' : 'ORANGE_CMR',
  phoneNumber: phone.replace(/\D/g, ''),
});

const createMockActiveConfigResponse = () => ({
  companyName: 'Demo Company',
  signatureConfiguration: {
    signedRequestsOnly: false,
    signedCallbacks: true,
  },
  countries: [
    {
      country: 'CMR',
      displayName: { en: 'Cameroon', fr: 'Cameroun' },
      prefix: '237',
      flag: 'https://cdn.pawapay.io/flags/cmr.svg',
      providers: [
        {
          provider: 'MTN_MOMO_CMR',
          displayName: 'MTN Mobile Money',
          nameDisplayedToCustomer: 'MTN MoMo',
          currencies: [
            {
              currency: 'XAF',
              displayName: 'CFA Franc',
              operationTypes: {
                DEPOSIT: { minAmount: '100', maxAmount: '1000000', status: 'OPERATIONAL' },
                PAYOUT: { minAmount: '100', maxAmount: '500000', status: 'OPERATIONAL' },
              },
            },
          ],
        },
      ],
    },
  ],
});

const createMockWalletBalancesResponse = () => ({
  balances: [
    { country: 'CMR', currency: 'XAF', balance: '1250000.00' },
    { country: 'COG', currency: 'XAF', balance: '450000.00' },
    { country: 'GAB', currency: 'XAF', balance: '780000.00' },
  ],
});

const createMockPublicKeysResponse = () => [
  {
    id: 'key-001',
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
  },
];

const simulateDelay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms + Math.random() * 400));

// HMAC-SHA256 computation using Web Crypto API (browser-compatible)
async function computeHmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const PROVIDER_OPTIONS: Array<{ value: Correspondent; label: string; country: string }> = [
  { value: 'MTN_MOMO_CMR', label: 'MTN Mobile Money', country: 'Cameroun' },
  { value: 'ORANGE_CMR', label: 'Orange Money', country: 'Cameroun' },
  { value: 'MTN_MOMO_COG', label: 'MTN Mobile Money', country: 'Congo' },
  { value: 'AIRTEL_COG', label: 'Airtel Money', country: 'Congo' },
  { value: 'MTN_MOMO_GAB', label: 'MTN Mobile Money', country: 'Gabon' },
  { value: 'AIRTEL_GAB', label: 'Airtel Money', country: 'Gabon' },
];

const CURRENCY_OPTIONS = [
  { value: 'XAF', label: 'XAF (CFA Franc BEAC)' },
  { value: 'XOF', label: 'XOF (CFA Franc BCEAO)' },
  { value: 'GHS', label: 'GHS (Ghana Cedi)' },
  { value: 'KES', label: 'KES (Kenyan Shilling)' },
  { value: 'RWF', label: 'RWF (Rwandan Franc)' },
  { value: 'TZS', label: 'TZS (Tanzanian Shilling)' },
  { value: 'UGX', label: 'UGX (Ugandan Shilling)' },
  { value: 'ZMW', label: 'ZMW (Zambian Kwacha)' },
];

export function PawapayTestDashboard({
  apiKey: initialApiKey = '',
  environment: initialEnvironment = 'sandbox',
  className = '',
  demoMode: initialDemoMode = false,
  apiBasePath = '/api/pawapay',
  onDepositComplete,
  onPayoutComplete,
  onError,
}: PawapayTestDashboardProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>(initialEnvironment);
  const [isConfigured, setIsConfigured] = useState(!!initialApiKey || initialDemoMode);
  const [isDemoMode, setIsDemoMode] = useState(initialDemoMode);

  const [activeTab, setActiveTab] = useState<TabType>('deposit');
  const [phoneNumber, setPhoneNumber] = useState('237670000000');
  const [amount, setAmount] = useState('5000');
  const [currency, setCurrency] = useState('XAF');
  const [provider, setProvider] = useState<Correspondent>('MTN_MOMO_CMR');
  const [description, setDescription] = useState('Test Payment');
  const [transactionId, setTransactionId] = useState('');

  const [results, setResults] = useState<TestResult[]>([]);
  const [currentStatus, setCurrentStatus] = useState<OperationStatus>('idle');

  // Webhook testing states
  const [webhookSecret, setWebhookSecret] = useState('whsec_test_secret_key');
  const [webhookEvents, setWebhookEvents] = useState<WebhookTestEvent[]>([]);
  const [webhookEventType, setWebhookEventType] = useState<WebhookEventType>('deposit.completed');
  const [webhookAmount, setWebhookAmount] = useState('5000');
  const [webhookPhone, setWebhookPhone] = useState('237670000000');
  const [webhookProvider, setWebhookProvider] = useState<Correspondent>('MTN_MOMO_CMR');
  const [generatedPayload, setGeneratedPayload] = useState<string>('');
  const [generatedSignature, setGeneratedSignature] = useState<string>('');
  const [verifyPayload, setVerifyPayload] = useState<string>('');
  const [verifySignature, setVerifySignature] = useState<string>('');
  const [verifySecret, setVerifySecret] = useState<string>('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [parseInput, setParseInput] = useState<string>('');
  const [parsedEvent, setParsedEvent] = useState<Record<string, unknown> | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [eventLogFilter, setEventLogFilter] = useState<'all' | 'deposit' | 'payout' | 'refund'>('all');

  const addResult = useCallback((operation: string, status: OperationStatus, response?: unknown, error?: string) => {
    const result: TestResult = {
      id: generateUUID(),
      operation,
      status,
      response,
      error,
      timestamp: new Date().toLocaleTimeString(),
    };
    setResults((prev) => [result, ...prev].slice(0, 20));
  }, []);

  const handleConfigure = useCallback(() => {
    if (!apiKey.trim()) {
      addResult('Configuration', 'error', undefined, 'API Key is required');
      return;
    }
    setIsConfigured(true);
    setIsDemoMode(false);
    addResult('Configuration', 'success', { environment, configured: true, apiBasePath });
  }, [apiKey, environment, apiBasePath, addResult]);

  const handleDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setIsConfigured(true);
    addResult('Configuration', 'success', { mode: 'demo', message: 'Demo mode activated - responses are simulated' });
  }, [addResult]);

  const handleDeposit = useCallback(async () => {
    if (!apiKey && !isDemoMode) return;
    setCurrentStatus('loading');

    try {
      const txId = generateUUID();
      setTransactionId(txId);

      let response: DepositResponse;

      if (isDemoMode) {
        await simulateDelay();
        response = createMockDepositResponse(txId);
      } else {
        const res = await fetch(`${apiBasePath}/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            environment,
            amount: parseFloat(amount),
            currency,
            provider,
            phoneNumber,
            customerMessage: description.slice(0, 22),
            transactionId: txId,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Deposit failed');
        response = data;
      }

      setCurrentStatus('success');
      addResult('Deposit', 'success', response);
      onDepositComplete?.(response);
    } catch (err) {
      setCurrentStatus('error');
      const message = err instanceof Error ? err.message : 'Deposit failed';
      addResult('Deposit', 'error', undefined, message);
      onError?.(err instanceof Error ? err : new Error(message));
    }
  }, [apiKey, apiBasePath, environment, isDemoMode, amount, currency, provider, phoneNumber, description, addResult, onDepositComplete, onError]);

  const handlePayout = useCallback(async () => {
    if (!apiKey && !isDemoMode) return;
    setCurrentStatus('loading');

    try {
      const txId = generateUUID();
      setTransactionId(txId);

      let response: PayoutResponse;

      if (isDemoMode) {
        await simulateDelay();
        response = createMockPayoutResponse(txId);
      } else {
        const res = await fetch(`${apiBasePath}/payout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            environment,
            amount: parseFloat(amount),
            currency,
            provider,
            phoneNumber,
            transactionId: txId,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Payout failed');
        response = data;
      }

      setCurrentStatus('success');
      addResult('Payout', 'success', response);
      onPayoutComplete?.(response);
    } catch (err) {
      setCurrentStatus('error');
      const message = err instanceof Error ? err.message : 'Payout failed';
      addResult('Payout', 'error', undefined, message);
      onError?.(err instanceof Error ? err : new Error(message));
    }
  }, [apiKey, apiBasePath, environment, isDemoMode, amount, currency, provider, phoneNumber, addResult, onPayoutComplete, onError]);

  const handleCheckStatus = useCallback(async () => {
    if ((!apiKey && !isDemoMode) || !transactionId) {
      addResult('Check Status', 'error', undefined, 'No transaction ID');
      return;
    }
    setCurrentStatus('loading');

    try {
      let response;

      if (isDemoMode) {
        await simulateDelay();
        response = createMockStatusResponse(transactionId);
      } else {
        const res = await fetch(`${apiBasePath}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, environment, transactionId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Status check failed');
        response = data;
      }

      setCurrentStatus('success');
      addResult('Check Status', 'success', response);
    } catch (err) {
      setCurrentStatus('error');
      const message = err instanceof Error ? err.message : 'Status check failed';
      addResult('Check Status', 'error', undefined, message);
      onError?.(err instanceof Error ? err : new Error(message));
    }
  }, [apiKey, apiBasePath, environment, isDemoMode, transactionId, addResult, onError]);

  const handleGetAvailability = useCallback(async () => {
    if (!apiKey && !isDemoMode) return;
    setCurrentStatus('loading');

    try {
      let response;

      if (isDemoMode) {
        await simulateDelay();
        response = createMockAvailabilityResponse();
      } else {
        const res = await fetch(`${apiBasePath}/availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, environment }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Availability check failed');
        response = data;
      }

      setCurrentStatus('success');
      addResult('Provider Availability', 'success', response);
    } catch (err) {
      setCurrentStatus('error');
      const message = err instanceof Error ? err.message : 'Availability check failed';
      addResult('Provider Availability', 'error', undefined, message);
      onError?.(err instanceof Error ? err : new Error(message));
    }
  }, [apiKey, apiBasePath, environment, isDemoMode, addResult, onError]);

  const handlePredictProvider = useCallback(async () => {
    if (!apiKey && !isDemoMode) return;
    setCurrentStatus('loading');

    try {
      let response;

      if (isDemoMode) {
        await simulateDelay();
        response = createMockPredictResponse(phoneNumber);
      } else {
        const res = await fetch(`${apiBasePath}/predict-provider`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, environment, phoneNumber }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Prediction failed');
        response = data;
      }

      setCurrentStatus('success');
      addResult('Predict Provider', 'success', response);
    } catch (err) {
      setCurrentStatus('error');
      const message = err instanceof Error ? err.message : 'Prediction failed';
      addResult('Predict Provider', 'error', undefined, message);
      onError?.(err instanceof Error ? err : new Error(message));
    }
  }, [apiKey, apiBasePath, environment, isDemoMode, phoneNumber, addResult, onError]);

  const handleGetActiveConfig = useCallback(async () => {
    if (!apiKey && !isDemoMode) return;
    setCurrentStatus('loading');

    try {
      let response;

      if (isDemoMode) {
        await simulateDelay();
        response = createMockActiveConfigResponse();
      } else {
        const res = await fetch(`${apiBasePath}/active-config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, environment }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get config');
        response = data;
      }

      setCurrentStatus('success');
      addResult('Active Configuration', 'success', response);
    } catch (err) {
      setCurrentStatus('error');
      const message = err instanceof Error ? err.message : 'Failed to get config';
      addResult('Active Configuration', 'error', undefined, message);
      onError?.(err instanceof Error ? err : new Error(message));
    }
  }, [apiKey, apiBasePath, environment, isDemoMode, addResult, onError]);

  const handleGetPublicKeys = useCallback(async () => {
    if (!apiKey && !isDemoMode) return;
    setCurrentStatus('loading');

    try {
      let response;

      if (isDemoMode) {
        await simulateDelay();
        response = createMockPublicKeysResponse();
      } else {
        const res = await fetch(`${apiBasePath}/public-keys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, environment }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get public keys');
        response = data;
      }

      setCurrentStatus('success');
      addResult('Public Keys', 'success', response);
    } catch (err) {
      setCurrentStatus('error');
      const message = err instanceof Error ? err.message : 'Failed to get public keys';
      addResult('Public Keys', 'error', undefined, message);
      onError?.(err instanceof Error ? err : new Error(message));
    }
  }, [apiKey, apiBasePath, environment, isDemoMode, addResult, onError]);

  const handleGetWalletBalances = useCallback(async () => {
    if (!apiKey && !isDemoMode) return;
    setCurrentStatus('loading');

    try {
      let response;

      if (isDemoMode) {
        await simulateDelay();
        response = createMockWalletBalancesResponse();
      } else {
        const res = await fetch(`${apiBasePath}/wallet-balances`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, environment }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get balances');
        response = data;
      }

      setCurrentStatus('success');
      addResult('Wallet Balances', 'success', response);
    } catch (err) {
      setCurrentStatus('error');
      const message = err instanceof Error ? err.message : 'Failed to get balances';
      addResult('Wallet Balances', 'error', undefined, message);
      onError?.(err instanceof Error ? err : new Error(message));
    }
  }, [apiKey, apiBasePath, environment, isDemoMode, addResult, onError]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  if (!isConfigured) {
    return (
      <div className={`space-y-8 ${className}`}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Spaark Pay Console</h1>
          <p className="text-muted-foreground mt-1">
            Configurez vos identifiants PawaPay pour commencer
          </p>
        </div>

        <div className="border border-border bg-background p-6 max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted flex items-center justify-center">
              <SettingsIcon />
            </div>
            <div>
              <h2 className="font-semibold">SDK Configuration</h2>
              <p className="text-xs text-muted-foreground">Enter your API credentials</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">API Key</label>
              <input
                type="password"
                placeholder="pk_sandbox_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Environnement</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEnvironment('sandbox')}
                  className={`h-8 px-3 text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    environment === 'sandbox'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${environment === 'sandbox' ? 'bg-blue-200' : 'bg-blue-500'}`} />
                  Sandbox
                </button>
                <button
                  onClick={() => setEnvironment('production')}
                  className={`h-8 px-3 text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    environment === 'production'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${environment === 'production' ? 'bg-green-200' : 'bg-green-500'}`} />
                  Production
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {environment === 'sandbox'
                  ? 'Utilisez le sandbox pour tester sans frais réels'
                  : 'Attention : les transactions en production sont réelles'
                }
              </p>
            </div>

            <button
              onClick={handleConfigure}
              className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <PlayIcon />
              Initialize SDK
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-3 text-xs text-muted-foreground">ou</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <button
              onClick={handleDemoMode}
              className="w-full h-8 px-3 text-xs font-medium border border-border bg-background hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <BeakerIcon />
              Mode Démo (sans API key)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Spaark Pay Console</h1>
            {isDemoMode ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                DEMO
              </span>
            ) : environment === 'production' ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                PRODUCTION
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                SANDBOX
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {isDemoMode
              ? 'Mode démo - Les réponses sont simulées'
              : environment === 'production'
                ? 'Mode production - Transactions réelles'
                : 'Mode sandbox - Environnement de test'
            }
          </p>
        </div>
        <button
          onClick={() => setIsConfigured(false)}
          className="h-8 px-3 text-xs font-medium border border-border bg-background hover:bg-muted transition-colors flex items-center gap-2"
        >
          <SettingsIcon />
          Reconfigure
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-muted p-1">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex-1 min-w-[80px] h-8 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'deposit' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <WalletIcon />
              Deposit
            </button>
            <button
              onClick={() => setActiveTab('payout')}
              className={`flex-1 min-w-[80px] h-8 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'payout' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <PhoneIcon />
              Payout
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`flex-1 min-w-[80px] h-8 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'status' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <RefreshIcon />
              Status
            </button>
            <button
              onClick={() => setActiveTab('toolkit')}
              className={`flex-1 min-w-[80px] h-8 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'toolkit' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ToolkitIcon />
              Toolkit
            </button>
            <button
              onClick={() => setActiveTab('finances')}
              className={`flex-1 min-w-[80px] h-8 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'finances' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ChartIcon />
              Finances
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`flex-1 min-w-[80px] h-8 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'webhooks' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <WebhookIcon />
              Webhooks
            </button>
          </div>

          {/* Deposit Tab */}
          {activeTab === 'deposit' && (
            <div className="border border-border bg-background p-6 space-y-4">
              <div>
                <h3 className="font-semibold">Initiate Deposit</h3>
                <p className="text-xs text-muted-foreground">Collect payment from a Mobile Money user</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Phone Number</label>
                  <input
                    placeholder="237670000000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Amount</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as Correspondent)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                  >
                    {PROVIDER_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label} ({c.country})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-medium">Customer Message (4-22 chars)</label>
                  <input
                    placeholder="Payment description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={22}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                  />
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={currentStatus === 'loading'}
                className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {currentStatus === 'loading' ? <LoaderIcon /> : <PlayIcon />}
                Execute Deposit
              </button>
            </div>
          )}

          {/* Payout Tab */}
          {activeTab === 'payout' && (
            <div className="border border-border bg-background p-6 space-y-4">
              <div>
                <h3 className="font-semibold">Initiate Payout</h3>
                <p className="text-xs text-muted-foreground">Send money to a Mobile Money account</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Recipient Phone</label>
                  <input
                    placeholder="237670000000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Amount</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as Correspondent)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                  >
                    {PROVIDER_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label} ({c.country})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handlePayout}
                disabled={currentStatus === 'loading'}
                className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {currentStatus === 'loading' ? <LoaderIcon /> : <PlayIcon />}
                Execute Payout
              </button>
            </div>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="border border-border bg-background p-6 space-y-4">
              <div>
                <h3 className="font-semibold">Check Transaction Status</h3>
                <p className="text-xs text-muted-foreground">Query the status of a transaction</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Transaction ID</label>
                  <div className="flex gap-2">
                    <input
                      placeholder="Enter transaction ID (UUID)"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="flex-1 h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring font-mono"
                    />
                    {transactionId && (
                      <button
                        onClick={() => copyToClipboard(transactionId)}
                        className="w-8 h-8 border border-border bg-background hover:bg-muted transition-colors flex items-center justify-center"
                        title="Copy to clipboard"
                      >
                        <CopyIcon />
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCheckStatus}
                  disabled={currentStatus === 'loading' || !transactionId}
                  className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {currentStatus === 'loading' ? <LoaderIcon /> : <RefreshIcon />}
                  Check Status
                </button>
              </div>
            </div>
          )}

          {/* Toolkit Tab */}
          {activeTab === 'toolkit' && (
            <div className="space-y-4">
              <div className="border border-border bg-background p-6 space-y-4">
                <div>
                  <h3 className="font-semibold">Predict Provider</h3>
                  <p className="text-xs text-muted-foreground">Predict the provider from a phone number</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Phone Number</label>
                  <input
                    placeholder="+237 670 000 000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                  />
                </div>

                <button
                  onClick={handlePredictProvider}
                  disabled={currentStatus === 'loading'}
                  className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {currentStatus === 'loading' ? <LoaderIcon /> : <SearchIcon />}
                  Predict Provider
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  onClick={handleGetAvailability}
                  disabled={currentStatus === 'loading'}
                  className="h-10 px-3 text-xs font-medium border border-border bg-background hover:bg-muted disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <SignalIcon />
                  Provider Availability
                </button>
                <button
                  onClick={handleGetActiveConfig}
                  disabled={currentStatus === 'loading'}
                  className="h-10 px-3 text-xs font-medium border border-border bg-background hover:bg-muted disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <SettingsIcon />
                  Active Config
                </button>
                <button
                  onClick={handleGetPublicKeys}
                  disabled={currentStatus === 'loading'}
                  className="h-10 px-3 text-xs font-medium border border-border bg-background hover:bg-muted disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <KeyIcon />
                  Public Keys
                </button>
              </div>
            </div>
          )}

          {/* Finances Tab */}
          {activeTab === 'finances' && (
            <div className="space-y-4">
              <div className="border border-border bg-background p-6 space-y-4">
                <div>
                  <h3 className="font-semibold">Wallet Balances</h3>
                  <p className="text-xs text-muted-foreground">View balances for all your wallets</p>
                </div>

                <button
                  onClick={handleGetWalletBalances}
                  disabled={currentStatus === 'loading'}
                  className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {currentStatus === 'loading' ? <LoaderIcon /> : <WalletIcon />}
                  Get Wallet Balances
                </button>
              </div>

              <div className="border border-border bg-background p-6 space-y-4">
                <div>
                  <h3 className="font-semibold">Statements</h3>
                  <p className="text-xs text-muted-foreground">Generate financial statements for your wallets</p>
                </div>

                <div className="p-4 bg-muted/50 text-xs text-muted-foreground">
                  Statement generation requires callback URL configuration. Use the SDK directly:
                  <pre className="mt-2 p-2 bg-background overflow-x-auto">
{`await sdk.finances.generateStatement({
  wallet: { country: 'CMR', currency: 'XAF' },
  callbackUrl: 'https://your-site.com/callback',
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-31T23:59:59Z',
});`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Webhooks Tab */}
          {activeTab === 'webhooks' && (
            <div className="space-y-4">
              {/* Webhook Secret Configuration */}
              <div className="border border-border bg-background p-6 space-y-4">
                <div>
                  <h3 className="font-semibold">Webhook Secret</h3>
                  <p className="text-xs text-muted-foreground">Configure the secret used for signing webhooks</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Secret Key</label>
                  <input
                    type="text"
                    placeholder="whsec_..."
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs font-mono border border-input bg-transparent rounded-none outline-none focus:border-ring"
                  />
                </div>
              </div>

              {/* Webhook Simulator */}
              <div className="border border-border bg-background p-6 space-y-4">
                <div>
                  <h3 className="font-semibold">Webhook Simulator</h3>
                  <p className="text-xs text-muted-foreground">Generate mock webhook events for testing</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Event Type</label>
                    <select
                      value={webhookEventType}
                      onChange={(e) => setWebhookEventType(e.target.value as WebhookEventType)}
                      className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                    >
                      {WEBHOOK_EVENT_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Amount</label>
                    <input
                      type="number"
                      placeholder="5000"
                      value={webhookAmount}
                      onChange={(e) => setWebhookAmount(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Phone Number</label>
                    <input
                      placeholder="237670000000"
                      value={webhookPhone}
                      onChange={(e) => setWebhookPhone(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Provider</label>
                    <select
                      value={webhookProvider}
                      onChange={(e) => setWebhookProvider(e.target.value as Correspondent)}
                      className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                    >
                      {PROVIDER_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label} ({p.country})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    const event = generateWebhook(webhookEventType, {
                      amount: webhookAmount,
                      phoneNumber: webhookPhone,
                      correspondent: webhookProvider,
                    });
                    const payload = JSON.stringify(event, null, 2);
                    const signature = await computeHmacSha256(JSON.stringify(event), webhookSecret);
                    setGeneratedPayload(payload);
                    setGeneratedSignature(signature);

                    // Add to event log
                    const newEvent: WebhookTestEvent = {
                      id: generateUUID(),
                      eventType: webhookEventType,
                      payload: event,
                      signature,
                      receivedAt: new Date().toLocaleTimeString(),
                      isVerified: null,
                    };
                    setWebhookEvents((prev) => [newEvent, ...prev].slice(0, 50));
                    addResult('Generate Webhook', 'success', { eventType: webhookEventType, eventId: event.eventId });
                  }}
                  className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <PlayIcon />
                  Generate Event
                </button>

                {generatedPayload && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">Generated Payload</label>
                      <button
                        onClick={() => copyToClipboard(generatedPayload)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="text-xs bg-muted p-3 overflow-x-auto max-h-48">
                      {generatedPayload}
                    </pre>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium">Signature:</label>
                      <code className="text-xs bg-muted px-2 py-1 font-mono flex-1 overflow-x-auto">
                        {generatedSignature}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generatedSignature)}
                        className="w-8 h-8 border border-border bg-background hover:bg-muted transition-colors flex items-center justify-center"
                      >
                        <CopyIcon />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Signature Verifier */}
              <div className="border border-border bg-background p-6 space-y-4">
                <div>
                  <h3 className="font-semibold">Signature Verifier</h3>
                  <p className="text-xs text-muted-foreground">Test webhook signature verification</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Payload (JSON)</label>
                    <textarea
                      placeholder='{"eventId": "...", "eventType": "deposit.completed", ...}'
                      value={verifyPayload}
                      onChange={(e) => setVerifyPayload(e.target.value)}
                      rows={4}
                      className="w-full px-2.5 py-2 text-xs font-mono border border-input bg-transparent rounded-none outline-none focus:border-ring resize-none"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Signature</label>
                      <input
                        placeholder="HMAC-SHA256 signature"
                        value={verifySignature}
                        onChange={(e) => setVerifySignature(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs font-mono border border-input bg-transparent rounded-none outline-none focus:border-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Secret</label>
                      <input
                        type="password"
                        placeholder="whsec_..."
                        value={verifySecret}
                        onChange={(e) => setVerifySecret(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs font-mono border border-input bg-transparent rounded-none outline-none focus:border-ring"
                      />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        const parsedPayload = JSON.parse(verifyPayload);
                        const computedSignature = await computeHmacSha256(JSON.stringify(parsedPayload), verifySecret);
                        const isValid = computedSignature === verifySignature;
                        setVerifyResult(isValid);
                        addResult('Verify Signature', isValid ? 'success' : 'error', {
                          isValid,
                          expected: computedSignature,
                          received: verifySignature,
                        });
                      } catch {
                        setVerifyResult(false);
                        addResult('Verify Signature', 'error', undefined, 'Invalid JSON payload');
                      }
                    }}
                    className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldIcon />
                    Verify Signature
                  </button>

                  {verifyResult !== null && (
                    <div className={`p-3 text-xs flex items-center gap-2 ${
                      verifyResult ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {verifyResult ? <CheckIcon className="text-green-600" /> : <XIcon className="text-red-600" />}
                      {verifyResult ? 'Signature is valid' : 'Signature is invalid'}
                    </div>
                  )}
                </div>
              </div>

              {/* Event Parser */}
              <div className="border border-border bg-background p-6 space-y-4">
                <div>
                  <h3 className="font-semibold">Event Parser</h3>
                  <p className="text-xs text-muted-foreground">Parse and analyze raw webhook JSON</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Raw JSON</label>
                    <textarea
                      placeholder='Paste webhook JSON here...'
                      value={parseInput}
                      onChange={(e) => setParseInput(e.target.value)}
                      rows={4}
                      className="w-full px-2.5 py-2 text-xs font-mono border border-input bg-transparent rounded-none outline-none focus:border-ring resize-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(parseInput) as Record<string, unknown>;
                        setParsedEvent(parsed);
                        setParseError('');
                        addResult('Parse Event', 'success', { eventType: parsed.eventType, eventId: parsed.eventId });
                      } catch (e) {
                        setParsedEvent(null);
                        setParseError(e instanceof Error ? e.message : 'Invalid JSON');
                        addResult('Parse Event', 'error', undefined, 'Invalid JSON');
                      }
                    }}
                    className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <CodeIcon />
                    Parse Event
                  </button>

                  {parseError && (
                    <div className="p-3 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {parseError}
                    </div>
                  )}

                  {parsedEvent && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-muted">
                          <span className="text-muted-foreground">Event ID:</span>
                          <p className="font-mono truncate">{String(parsedEvent.eventId ?? 'N/A')}</p>
                        </div>
                        <div className="p-2 bg-muted">
                          <span className="text-muted-foreground">Event Type:</span>
                          <p className="font-medium">{String(parsedEvent.eventType ?? 'N/A')}</p>
                        </div>
                        <div className="p-2 bg-muted">
                          <span className="text-muted-foreground">Timestamp:</span>
                          <p className="font-mono truncate">{String(parsedEvent.timestamp ?? 'N/A')}</p>
                        </div>
                        <div className="p-2 bg-muted">
                          <span className="text-muted-foreground">Status:</span>
                          <p className="font-medium">{String((parsedEvent.data as Record<string, unknown>)?.status ?? 'N/A')}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Full Data</label>
                        <pre className="text-xs bg-muted p-3 overflow-x-auto max-h-48">
                          {JSON.stringify(parsedEvent, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Log */}
              <div className="border border-border bg-background p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Event Log</h3>
                    <p className="text-xs text-muted-foreground">History of generated webhook events</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={eventLogFilter}
                      onChange={(e) => setEventLogFilter(e.target.value as 'all' | 'deposit' | 'payout' | 'refund')}
                      className="h-8 px-2 text-xs border border-input bg-transparent rounded-none outline-none focus:border-ring"
                    >
                      <option value="all">All</option>
                      <option value="deposit">Deposits</option>
                      <option value="payout">Payouts</option>
                      <option value="refund">Refunds</option>
                    </select>
                    {webhookEvents.length > 0 && (
                      <button
                        onClick={() => setWebhookEvents([])}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-border max-h-64 overflow-y-auto">
                  {webhookEvents
                    .filter((event) => eventLogFilter === 'all' || event.eventType.startsWith(eventLogFilter))
                    .length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-xs">
                      No events yet. Generate a webhook event to see it here.
                    </div>
                  ) : (
                    webhookEvents
                      .filter((event) => eventLogFilter === 'all' || event.eventType.startsWith(eventLogFilter))
                      .map((event) => (
                        <div key={event.id} className="py-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 text-xs font-medium ${
                                event.eventType.includes('completed') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                event.eventType.includes('failed') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }`}>
                                {event.eventType}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{event.receivedAt}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            sig: {event.signature.slice(0, 32)}...
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Results</h3>
            {results.length > 0 && (
              <button
                onClick={() => setResults([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          <div className="border border-border bg-background divide-y divide-border max-h-[600px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs">
                No results yet. Execute an operation to see results here.
              </div>
            ) : (
              results.map((result) => (
                <div key={result.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.status === 'success' ? (
                        <CheckIcon className="text-green-600" />
                      ) : (
                        <XIcon className="text-red-600" />
                      )}
                      <span className="font-medium text-sm">{result.operation}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                  </div>

                  {result.error ? (
                    <p className="text-xs text-red-600">{result.error}</p>
                  ) : (
                    <pre className="text-xs bg-muted p-2 overflow-x-auto max-h-48">
                      {JSON.stringify(result.response, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple SVG Icons (no external dependencies)
const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const LoaderIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BeakerIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const ToolkitIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const SignalIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const WebhookIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

export default PawapayTestDashboard;
