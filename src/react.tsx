'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Settings,
  PlayCircle,
  Wallet,
  Smartphone,
  RefreshCw,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Wrench,
  BarChart3,
  Search,
  Wifi,
  Key,
  Zap,
  Shield,
  Code,
  LayoutDashboard,
  Beaker,
  Globe,
  Lock,
} from 'lucide-react';
import type { Correspondent } from './constants/correspondents';
import type { DepositResponse, PayoutResponse } from './types/transactions';
import type { WebhookEventType } from './types/webhooks';
import {
  generateWebhook,
  WEBHOOK_EVENT_TYPES,
} from './mocks/webhook-generators';

export {
  SpaarkPaySdkFinanceDashboard,
  type SpaarkPaySdkFinanceDashboardProps,
  type Transaction,
  type TransactionType,
  type TransactionStatus,
} from './components/SpaarkPaySdkFinanceDashboard';

import { SpaarkPaySdkFinanceDashboard, type Transaction } from './components/SpaarkPaySdkFinanceDashboard';

type OperationStatus = 'idle' | 'loading' | 'success' | 'error';
type TabType = 'deposit' | 'payout' | 'status' | 'toolkit' | 'finances' | 'webhooks';
type DashboardMode = 'demo' | 'demo-expert' | 'sandbox' | 'production';

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

export interface SpaarkPaySdkTestDashboardProps {
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

// Generate mock transactions for demo mode
const generateMockTransactions = (): Transaction[] => {
  const types: Array<'deposit' | 'payout' | 'refund'> = ['deposit', 'payout', 'refund'];
  const statuses: Array<'COMPLETED' | 'PENDING' | 'FAILED' | 'PROCESSING'> = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'FAILED', 'PROCESSING'];
  const providers: Correspondent[] = ['MTN_MOMO_CMR', 'ORANGE_CMR', 'MTN_MOMO_COG', 'AIRTEL_COG'];

  const transactions: Transaction[] = [];
  const now = Date.now();

  for (let i = 0; i < 25; i++) {
    const type = types[Math.floor(Math.random() * types.length)]!;
    const status = statuses[Math.floor(Math.random() * statuses.length)]!;
    const provider = providers[Math.floor(Math.random() * providers.length)]!
    const amount = Math.floor(Math.random() * 50000) + 1000;
    const daysAgo = Math.floor(Math.random() * 30);

    transactions.push({
      id: `tx-${String(i + 1).padStart(3, '0')}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      amount,
      currency: 'XAF',
      status,
      provider,
      phoneNumber: `237${6 + Math.floor(Math.random() * 3)}${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      createdAt: new Date(now - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      ...(status === 'FAILED' && { failureReason: 'INSUFFICIENT_FUNDS' }),
    });
  }

  return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

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

const MODE_CONFIG: Record<DashboardMode, { label: string; description: string; color: string; bgColor: string }> = {
  'demo': {
    label: 'DEMO',
    description: 'Données fictives - Visualisez le dashboard',
    color: 'text-purple-800 dark:text-purple-200',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
  },
  'demo-expert': {
    label: 'EXPERT',
    description: 'Console de test API - Réponses simulées',
    color: 'text-amber-800 dark:text-amber-200',
    bgColor: 'bg-amber-100 dark:bg-amber-900',
  },
  'sandbox': {
    label: 'SANDBOX',
    description: 'Environnement de test Pawapay',
    color: 'text-blue-800 dark:text-blue-200',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
  },
  'production': {
    label: 'PRODUCTION',
    description: 'Environnement de production - Transactions réelles',
    color: 'text-green-800 dark:text-green-200',
    bgColor: 'bg-green-100 dark:bg-green-900',
  },
};

export function SpaarkPaySdkTestDashboard({
  apiKey: initialApiKey = '',
  environment: initialEnvironment = 'sandbox',
  className = '',
  demoMode: initialDemoMode = false,
  apiBasePath = '/api/pawapay',
  onDepositComplete,
  onPayoutComplete,
  onError,
}: SpaarkPaySdkTestDashboardProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [mode, setMode] = useState<DashboardMode | null>(
    initialDemoMode ? 'demo' : initialApiKey ? initialEnvironment : null
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

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

  // Load mock data for demo mode
  useEffect(() => {
    if (mode === 'demo') {
      setIsLoadingTransactions(true);
      setTimeout(() => {
        setTransactions(generateMockTransactions());
        setIsLoadingTransactions(false);
      }, 800);
    }
  }, [mode]);

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

  const handleSelectMode = useCallback((selectedMode: DashboardMode) => {
    if (selectedMode === 'sandbox' || selectedMode === 'production') {
      if (!apiKey.trim()) {
        return;
      }
    }
    setMode(selectedMode);
    if (selectedMode === 'demo') {
      addResult('Configuration', 'success', { mode: 'demo', message: 'Mode démo activé - données fictives' });
    } else if (selectedMode === 'demo-expert') {
      addResult('Configuration', 'success', { mode: 'demo-expert', message: 'Mode expert activé - réponses simulées' });
    } else {
      addResult('Configuration', 'success', { mode: selectedMode, apiBasePath });
    }
  }, [apiKey, apiBasePath, addResult]);

  const handleDeposit = useCallback(async () => {
    if (mode !== 'demo-expert' && mode !== 'sandbox' && mode !== 'production') return;
    setCurrentStatus('loading');

    try {
      const txId = generateUUID();
      setTransactionId(txId);

      let response: DepositResponse;

      if (mode === 'demo-expert') {
        await simulateDelay();
        response = createMockDepositResponse(txId);
      } else {
        const res = await fetch(`${apiBasePath}/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            environment: mode,
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
  }, [apiKey, apiBasePath, mode, amount, currency, provider, phoneNumber, description, addResult, onDepositComplete, onError]);

  const handlePayout = useCallback(async () => {
    if (mode !== 'demo-expert' && mode !== 'sandbox' && mode !== 'production') return;
    setCurrentStatus('loading');

    try {
      const txId = generateUUID();
      setTransactionId(txId);

      let response: PayoutResponse;

      if (mode === 'demo-expert') {
        await simulateDelay();
        response = createMockPayoutResponse(txId);
      } else {
        const res = await fetch(`${apiBasePath}/payout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            environment: mode,
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
  }, [apiKey, apiBasePath, mode, amount, currency, provider, phoneNumber, addResult, onPayoutComplete, onError]);

  const handleCheckStatus = useCallback(async () => {
    if ((mode !== 'demo-expert' && mode !== 'sandbox' && mode !== 'production') || !transactionId) {
      addResult('Check Status', 'error', undefined, 'No transaction ID');
      return;
    }
    setCurrentStatus('loading');

    try {
      let response;

      if (mode === 'demo-expert') {
        await simulateDelay();
        response = createMockStatusResponse(transactionId);
      } else {
        const res = await fetch(`${apiBasePath}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, environment: mode, transactionId }),
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
  }, [apiKey, apiBasePath, mode, transactionId, addResult, onError]);

  const handleGetAvailability = useCallback(async () => {
    if (mode !== 'demo-expert' && mode !== 'sandbox' && mode !== 'production') return;
    setCurrentStatus('loading');

    try {
      let response;

      if (mode === 'demo-expert') {
        await simulateDelay();
        response = createMockAvailabilityResponse();
      } else {
        const res = await fetch(`${apiBasePath}/availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, environment: mode }),
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
  }, [apiKey, apiBasePath, mode, addResult, onError]);

  const handlePredictProvider = useCallback(async () => {
    if (mode !== 'demo-expert' && mode !== 'sandbox' && mode !== 'production') return;
    setCurrentStatus('loading');

    try {
      let response;

      if (mode === 'demo-expert') {
        await simulateDelay();
        response = createMockPredictResponse(phoneNumber);
      } else {
        const res = await fetch(`${apiBasePath}/predict-provider`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, environment: mode, phoneNumber }),
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
  }, [apiKey, apiBasePath, mode, phoneNumber, addResult, onError]);

  const handleGetActiveConfig = useCallback(async () => {
    if (mode !== 'demo-expert' && mode !== 'sandbox' && mode !== 'production') return;
    setCurrentStatus('loading');

    try {
      let response;

      if (mode === 'demo-expert') {
        await simulateDelay();
        response = createMockActiveConfigResponse();
      } else {
        const res = await fetch(`${apiBasePath}/active-config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, environment: mode }),
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
  }, [apiKey, apiBasePath, mode, addResult, onError]);

  const handleGetPublicKeys = useCallback(async () => {
    if (mode !== 'demo-expert' && mode !== 'sandbox' && mode !== 'production') return;
    setCurrentStatus('loading');

    try {
      let response;

      if (mode === 'demo-expert') {
        await simulateDelay();
        response = createMockPublicKeysResponse();
      } else {
        const res = await fetch(`${apiBasePath}/public-keys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, environment: mode }),
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
  }, [apiKey, apiBasePath, mode, addResult, onError]);

  const handleGetWalletBalances = useCallback(async () => {
    if (mode !== 'demo-expert' && mode !== 'sandbox' && mode !== 'production') return;
    setCurrentStatus('loading');

    try {
      let response;

      if (mode === 'demo-expert') {
        await simulateDelay();
        response = createMockWalletBalancesResponse();
      } else {
        const res = await fetch(`${apiBasePath}/wallet-balances`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, environment: mode }),
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
  }, [apiKey, apiBasePath, mode, addResult, onError]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Mode selection screen
  if (!mode) {
    return (
      <div className={`space-y-8 ${className}`}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Spaark Pay Console</h1>
          <p className="text-muted-foreground mt-1">
            Choisissez un mode pour commencer
          </p>
        </div>

        {/* API Key input for sandbox/production */}
        <div className="border border-border bg-background p-6 max-w-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-md">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Configuration API</h2>
              <p className="text-xs text-muted-foreground">Requis pour les modes Sandbox et Production</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">API Key</label>
            <input
              type="password"
              placeholder="pk_sandbox_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-input bg-transparent rounded-md outline-none focus:border-ring"
            />
          </div>
        </div>

        {/* Mode selection */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          {/* Demo Mode */}
          <button
            onClick={() => handleSelectMode('demo')}
            className="p-6 border border-border bg-background hover:bg-muted/50 transition-colors text-left space-y-3 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 flex items-center justify-center rounded-md">
                <LayoutDashboard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${MODE_CONFIG['demo'].bgColor} ${MODE_CONFIG['demo'].color}`}>
                  DEMO
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Mode Démonstration</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Visualisez le dashboard financier avec des données fictives. Idéal pour découvrir l'interface.
              </p>
            </div>
          </button>

          {/* Demo Expert Mode */}
          <button
            onClick={() => handleSelectMode('demo-expert')}
            className="p-6 border border-border bg-background hover:bg-muted/50 transition-colors text-left space-y-3 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 flex items-center justify-center rounded-md">
                <FlaskConical className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${MODE_CONFIG['demo-expert'].bgColor} ${MODE_CONFIG['demo-expert'].color}`}>
                  EXPERT
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Mode Expert (Test API)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Console de test avec réponses simulées. Testez les endpoints sans clé API.
              </p>
            </div>
          </button>

          {/* Sandbox Mode */}
          <button
            onClick={() => handleSelectMode('sandbox')}
            disabled={!apiKey.trim()}
            className="p-6 border border-border bg-background hover:bg-muted/50 transition-colors text-left space-y-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 flex items-center justify-center rounded-md">
                <Beaker className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${MODE_CONFIG['sandbox'].bgColor} ${MODE_CONFIG['sandbox'].color}`}>
                  SANDBOX
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Mode Sandbox</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Connecté à l'API Pawapay Sandbox. Transactions de test réelles.
                {!apiKey.trim() && <span className="block text-amber-600 mt-1">Entrez une clé API ci-dessus</span>}
              </p>
            </div>
          </button>

          {/* Production Mode */}
          <button
            onClick={() => handleSelectMode('production')}
            disabled={!apiKey.trim()}
            className="p-6 border border-border bg-background hover:bg-muted/50 transition-colors text-left space-y-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 flex items-center justify-center rounded-md">
                <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${MODE_CONFIG['production'].bgColor} ${MODE_CONFIG['production'].color}`}>
                  PRODUCTION
                </span>
                <Lock className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Mode Production</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Environnement de production. Transactions réelles avec argent réel.
                {!apiKey.trim() && <span className="block text-amber-600 mt-1">Entrez une clé API ci-dessus</span>}
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Demo mode - Show Finance Dashboard with mock data
  if (mode === 'demo') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${MODE_CONFIG[mode].bgColor} ${MODE_CONFIG[mode].color}`}>
              {MODE_CONFIG[mode].label}
            </span>
            <span className="text-sm text-muted-foreground">{MODE_CONFIG[mode].description}</span>
          </div>
          <button
            onClick={() => setMode(null)}
            className="h-8 px-3 text-xs font-medium border border-border bg-background hover:bg-muted transition-colors flex items-center gap-2 rounded-md"
          >
            <Settings className="w-4 h-4" />
            Changer de mode
          </button>
        </div>

        <SpaarkPaySdkFinanceDashboard
          transactions={transactions}
          locale="fr"
          isLoading={isLoadingTransactions}
          onRefresh={() => {
            setIsLoadingTransactions(true);
            setTimeout(() => {
              setTransactions(generateMockTransactions());
              setIsLoadingTransactions(false);
            }, 800);
          }}
          showExpertMode={true}
          onExpertModeClick={() => setMode('demo-expert')}
        />
      </div>
    );
  }

  // Sandbox/Production mode - Show Finance Dashboard with real data
  if (mode === 'sandbox' || mode === 'production') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${MODE_CONFIG[mode].bgColor} ${MODE_CONFIG[mode].color}`}>
              {MODE_CONFIG[mode].label}
            </span>
            <span className="text-sm text-muted-foreground">{MODE_CONFIG[mode].description}</span>
          </div>
          <button
            onClick={() => setMode(null)}
            className="h-8 px-3 text-xs font-medium border border-border bg-background hover:bg-muted transition-colors flex items-center gap-2 rounded-md"
          >
            <Settings className="w-4 h-4" />
            Changer de mode
          </button>
        </div>

        <SpaarkPaySdkFinanceDashboard
          transactions={transactions}
          locale="fr"
          isLoading={isLoadingTransactions}
          onRefresh={() => {
            // TODO: Implement real API call to fetch transactions
            addResult('Refresh', 'success', { message: 'Transactions refreshed' });
          }}
          showExpertMode={true}
          onExpertModeClick={() => setMode('demo-expert')}
        />
      </div>
    );
  }

  // Demo Expert mode - Show Test Dashboard
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Spaark Pay Console</h1>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${MODE_CONFIG[mode].bgColor} ${MODE_CONFIG[mode].color}`}>
              {MODE_CONFIG[mode].label}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">{MODE_CONFIG[mode].description}</p>
        </div>
        <button
          onClick={() => setMode(null)}
          className="h-8 px-3 text-xs font-medium border border-border bg-background hover:bg-muted transition-colors flex items-center gap-2 rounded-md"
        >
          <Settings className="w-4 h-4" />
          Changer de mode
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-md">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex-1 min-w-[80px] h-8 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 rounded-sm ${
                activeTab === 'deposit' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Wallet className="w-4 h-4" />
              Deposit
            </button>
            <button
              onClick={() => setActiveTab('payout')}
              className={`flex-1 min-w-[80px] h-8 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 rounded-sm ${
                activeTab === 'payout' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Payout
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`flex-1 min-w-[80px] h-8 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 rounded-sm ${
                activeTab === 'status' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Status
            </button>
            <button
              onClick={() => setActiveTab('toolkit')}
              className={`flex-1 min-w-[80px] h-8 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 rounded-sm ${
                activeTab === 'toolkit' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Toolkit
            </button>
            <button
              onClick={() => setActiveTab('finances')}
              className={`flex-1 min-w-[80px] h-8 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 rounded-sm ${
                activeTab === 'finances' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Finances
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`flex-1 min-w-[80px] h-8 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 rounded-sm ${
                activeTab === 'webhooks' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Zap className="w-4 h-4" />
              Webhooks
            </button>
          </div>

          {/* Deposit Tab */}
          {activeTab === 'deposit' && (
            <div className="border border-border bg-background p-6 space-y-4 rounded-lg">
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
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Amount</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
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
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
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
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
                  />
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={currentStatus === 'loading'}
                className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 rounded-md"
              >
                {currentStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                Execute Deposit
              </button>
            </div>
          )}

          {/* Payout Tab */}
          {activeTab === 'payout' && (
            <div className="border border-border bg-background p-6 space-y-4 rounded-lg">
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
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Amount</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
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
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
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
                className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 rounded-md"
              >
                {currentStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                Execute Payout
              </button>
            </div>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="border border-border bg-background p-6 space-y-4 rounded-lg">
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
                      className="flex-1 h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring font-mono"
                    />
                    {transactionId && (
                      <button
                        onClick={() => copyToClipboard(transactionId)}
                        className="w-8 h-8 border border-border bg-background hover:bg-muted transition-colors flex items-center justify-center rounded-md"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCheckStatus}
                  disabled={currentStatus === 'loading' || !transactionId}
                  className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 rounded-md"
                >
                  {currentStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Check Status
                </button>
              </div>
            </div>
          )}

          {/* Toolkit Tab */}
          {activeTab === 'toolkit' && (
            <div className="space-y-4">
              <div className="border border-border bg-background p-6 space-y-4 rounded-lg">
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
                    className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
                  />
                </div>

                <button
                  onClick={handlePredictProvider}
                  disabled={currentStatus === 'loading'}
                  className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 rounded-md"
                >
                  {currentStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Predict Provider
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  onClick={handleGetAvailability}
                  disabled={currentStatus === 'loading'}
                  className="h-10 px-3 text-xs font-medium border border-border bg-background hover:bg-muted disabled:opacity-50 transition-colors flex items-center justify-center gap-2 rounded-md"
                >
                  <Wifi className="w-4 h-4" />
                  Provider Availability
                </button>
                <button
                  onClick={handleGetActiveConfig}
                  disabled={currentStatus === 'loading'}
                  className="h-10 px-3 text-xs font-medium border border-border bg-background hover:bg-muted disabled:opacity-50 transition-colors flex items-center justify-center gap-2 rounded-md"
                >
                  <Settings className="w-4 h-4" />
                  Active Config
                </button>
                <button
                  onClick={handleGetPublicKeys}
                  disabled={currentStatus === 'loading'}
                  className="h-10 px-3 text-xs font-medium border border-border bg-background hover:bg-muted disabled:opacity-50 transition-colors flex items-center justify-center gap-2 rounded-md"
                >
                  <Key className="w-4 h-4" />
                  Public Keys
                </button>
              </div>
            </div>
          )}

          {/* Finances Tab */}
          {activeTab === 'finances' && (
            <div className="space-y-4">
              <div className="border border-border bg-background p-6 space-y-4 rounded-lg">
                <div>
                  <h3 className="font-semibold">Wallet Balances</h3>
                  <p className="text-xs text-muted-foreground">View balances for all your wallets</p>
                </div>

                <button
                  onClick={handleGetWalletBalances}
                  disabled={currentStatus === 'loading'}
                  className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 rounded-md"
                >
                  {currentStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                  Get Wallet Balances
                </button>
              </div>

              <div className="border border-border bg-background p-6 space-y-4 rounded-lg">
                <div>
                  <h3 className="font-semibold">Statements</h3>
                  <p className="text-xs text-muted-foreground">Generate financial statements for your wallets</p>
                </div>

                <div className="p-4 bg-muted/50 text-xs text-muted-foreground rounded-md">
                  Statement generation requires callback URL configuration. Use the SDK directly:
                  <pre className="mt-2 p-2 bg-background overflow-x-auto rounded">
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
              <div className="border border-border bg-background p-6 space-y-4 rounded-lg">
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
                    className="w-full h-8 px-2.5 text-xs font-mono border border-input bg-transparent rounded-md outline-none focus:border-ring"
                  />
                </div>
              </div>

              {/* Webhook Simulator */}
              <div className="border border-border bg-background p-6 space-y-4 rounded-lg">
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
                      className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
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
                      className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Phone Number</label>
                    <input
                      placeholder="237670000000"
                      value={webhookPhone}
                      onChange={(e) => setWebhookPhone(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Provider</label>
                    <select
                      value={webhookProvider}
                      onChange={(e) => setWebhookProvider(e.target.value as Correspondent)}
                      className="w-full h-8 px-2.5 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
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
                  className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 rounded-md"
                >
                  <PlayCircle className="w-4 h-4" />
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
                    <pre className="text-xs bg-muted p-3 overflow-x-auto max-h-48 rounded-md">
                      {generatedPayload}
                    </pre>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium">Signature:</label>
                      <code className="text-xs bg-muted px-2 py-1 font-mono flex-1 overflow-x-auto rounded">
                        {generatedSignature}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generatedSignature)}
                        className="w-8 h-8 border border-border bg-background hover:bg-muted transition-colors flex items-center justify-center rounded-md"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Signature Verifier */}
              <div className="border border-border bg-background p-6 space-y-4 rounded-lg">
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
                      className="w-full px-2.5 py-2 text-xs font-mono border border-input bg-transparent rounded-md outline-none focus:border-ring resize-none"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Signature</label>
                      <input
                        placeholder="HMAC-SHA256 signature"
                        value={verifySignature}
                        onChange={(e) => setVerifySignature(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs font-mono border border-input bg-transparent rounded-md outline-none focus:border-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Secret</label>
                      <input
                        type="password"
                        placeholder="whsec_..."
                        value={verifySecret}
                        onChange={(e) => setVerifySecret(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs font-mono border border-input bg-transparent rounded-md outline-none focus:border-ring"
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
                    className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 rounded-md"
                  >
                    <Shield className="w-4 h-4" />
                    Verify Signature
                  </button>

                  {verifyResult !== null && (
                    <div className={`p-3 text-xs flex items-center gap-2 rounded-md ${
                      verifyResult ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {verifyResult ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                      {verifyResult ? 'Signature is valid' : 'Signature is invalid'}
                    </div>
                  )}
                </div>
              </div>

              {/* Event Parser */}
              <div className="border border-border bg-background p-6 space-y-4 rounded-lg">
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
                      className="w-full px-2.5 py-2 text-xs font-mono border border-input bg-transparent rounded-md outline-none focus:border-ring resize-none"
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
                    className="w-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 rounded-md"
                  >
                    <Code className="w-4 h-4" />
                    Parse Event
                  </button>

                  {parseError && (
                    <div className="p-3 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-md">
                      {parseError}
                    </div>
                  )}

                  {parsedEvent && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-muted rounded">
                          <span className="text-muted-foreground">Event ID:</span>
                          <p className="font-mono truncate">{String(parsedEvent.eventId ?? 'N/A')}</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <span className="text-muted-foreground">Event Type:</span>
                          <p className="font-medium">{String(parsedEvent.eventType ?? 'N/A')}</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <span className="text-muted-foreground">Timestamp:</span>
                          <p className="font-mono truncate">{String(parsedEvent.timestamp ?? 'N/A')}</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <span className="text-muted-foreground">Status:</span>
                          <p className="font-medium">{String((parsedEvent.data as Record<string, unknown>)?.status ?? 'N/A')}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Full Data</label>
                        <pre className="text-xs bg-muted p-3 overflow-x-auto max-h-48 rounded-md">
                          {JSON.stringify(parsedEvent, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Log */}
              <div className="border border-border bg-background p-6 space-y-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Event Log</h3>
                    <p className="text-xs text-muted-foreground">History of generated webhook events</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={eventLogFilter}
                      onChange={(e) => setEventLogFilter(e.target.value as 'all' | 'deposit' | 'payout' | 'refund')}
                      className="h-8 px-2 text-xs border border-input bg-transparent rounded-md outline-none focus:border-ring"
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
                              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
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

          <div className="border border-border bg-background divide-y divide-border max-h-[600px] overflow-y-auto rounded-lg">
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
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium text-sm">{result.operation}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                  </div>

                  {result.error ? (
                    <p className="text-xs text-red-600">{result.error}</p>
                  ) : (
                    <pre className="text-xs bg-muted p-2 overflow-x-auto max-h-48 rounded">
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

export default SpaarkPaySdkTestDashboard;
