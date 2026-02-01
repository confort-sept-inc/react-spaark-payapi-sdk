'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  XCircle,
  RefreshCw,
  Search,
  ChevronDown,
  Settings,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  Plus,
  Ban,
  Hourglass,
  CircleDot,
} from 'lucide-react';
import type { Correspondent } from '../constants/correspondents';

export type TransactionType = 'deposit' | 'payout' | 'refund';

export type TransactionStatus =
  | 'ACCEPTED'
  | 'PENDING'
  | 'ENQUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REJECTED';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  provider: Correspondent;
  phoneNumber: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  failureReason?: string;
}

export interface SpaarkPaySdkFinanceDashboardProps {
  transactions: Transaction[];
  title?: string;
  subtitle?: string;
  locale?: 'fr' | 'en';
  className?: string;
  showExpertMode?: boolean;
  onExpertModeClick?: () => void;
  onTransactionClick?: (transaction: Transaction) => void;
  onRefresh?: () => void;
  onAddTransaction?: () => void;
  onSettings?: () => void;
  isLoading?: boolean;
}

const translations = {
  fr: {
    title: 'Tableau de bord financier',
    subtitle: 'Vue d\'ensemble de vos transactions',
    totalVolume: 'Volume Total',
    deposits: 'Dépôts',
    payouts: 'Retraits',
    failed: 'Échecs',
    refunds: 'Remboursements',
    pending: 'En attente',
    completed: 'Complétées',
    cancelled: 'Annulées',
    search: 'Rechercher par ID ou téléphone...',
    allTypes: 'Tous les types',
    allStatuses: 'Tous les statuts',
    deposit: 'Dépôt',
    payout: 'Retrait',
    refund: 'Remboursement',
    expertMode: 'Mode Expert',
    refresh: 'Actualiser',
    settings: 'Paramètres',
    noTransactions: 'Aucune transaction',
    noTransactionsDesc: 'Les transactions apparaîtront ici une fois effectuées.',
    addTransaction: 'Nouvelle transaction',
    id: 'ID',
    type: 'Type',
    amount: 'Montant',
    status: 'Statut',
    provider: 'Opérateur',
    phone: 'Téléphone',
    date: 'Date',
    page: 'Page',
    of: 'sur',
    transactions: 'transactions',
    copied: 'Copié !',
  },
  en: {
    title: 'Finance Dashboard',
    subtitle: 'Overview of your transactions',
    totalVolume: 'Total Volume',
    deposits: 'Deposits',
    payouts: 'Payouts',
    failed: 'Failed',
    refunds: 'Refunds',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    search: 'Search by ID or phone...',
    allTypes: 'All types',
    allStatuses: 'All statuses',
    deposit: 'Deposit',
    payout: 'Payout',
    refund: 'Refund',
    expertMode: 'Expert Mode',
    refresh: 'Refresh',
    settings: 'Settings',
    noTransactions: 'No transactions',
    noTransactionsDesc: 'Transactions will appear here once made.',
    addTransaction: 'New transaction',
    id: 'ID',
    type: 'Type',
    amount: 'Amount',
    status: 'Status',
    provider: 'Provider',
    phone: 'Phone',
    date: 'Date',
    page: 'Page',
    of: 'of',
    transactions: 'transactions',
    copied: 'Copied!',
  },
};

const STATUS_COLORS: Record<TransactionStatus, string> = {
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ENQUEUED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const StatusIcon = ({ status }: { status: TransactionStatus }) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'FAILED':
    case 'REJECTED':
      return <XCircle className="w-3.5 h-3.5" />;
    case 'CANCELLED':
      return <Ban className="w-3.5 h-3.5" />;
    case 'PENDING':
    case 'ENQUEUED':
      return <Clock className="w-3.5 h-3.5" />;
    case 'PROCESSING':
    case 'ACCEPTED':
      return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    default:
      return <AlertCircle className="w-3.5 h-3.5" />;
  }
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + currency;
};

const formatDate = (dateString: string, locale: 'fr' | 'en') => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const ITEMS_PER_PAGE = 10;

export function SpaarkPaySdkFinanceDashboard({
  transactions,
  title,
  subtitle,
  locale = 'fr',
  className = '',
  showExpertMode = true,
  onExpertModeClick,
  onTransactionClick,
  onRefresh,
  onAddTransaction,
  onSettings,
  isLoading = false,
}: SpaarkPaySdkFinanceDashboardProps) {
  const t = translations[locale];

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const deposits = transactions.filter(tx => tx.type === 'deposit');
    const payouts = transactions.filter(tx => tx.type === 'payout');
    const refunds = transactions.filter(tx => tx.type === 'refund');
    const failed = transactions.filter(tx => tx.status === 'FAILED' || tx.status === 'REJECTED');
    const pending = transactions.filter(tx => ['PENDING', 'ENQUEUED', 'PROCESSING', 'ACCEPTED'].includes(tx.status));
    const completed = transactions.filter(tx => tx.status === 'COMPLETED');
    const cancelled = transactions.filter(tx => tx.status === 'CANCELLED');

    const totalVolume = transactions
      .filter(tx => tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const depositsTotal = deposits
      .filter(tx => tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const payoutsTotal = payouts
      .filter(tx => tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const refundsTotal = refunds
      .filter(tx => tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalVolume,
      depositsCount: deposits.length,
      depositsTotal,
      payoutsCount: payouts.length,
      payoutsTotal,
      failedCount: failed.length,
      refundsCount: refunds.length,
      refundsTotal,
      pendingCount: pending.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = searchQuery === '' ||
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.phoneNumber.includes(searchQuery);

      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, searchQuery, typeFilter, statusFilter]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const mainCurrency = transactions[0]?.currency || 'XAF';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title || t.title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle || t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="h-9 px-4 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </button>
          )}
          {onSettings && (
            <button
              onClick={onSettings}
              className="h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors inline-flex items-center justify-center"
              title={t.settings}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {showExpertMode && onExpertModeClick && (
            <button
              onClick={onExpertModeClick}
              className="h-9 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
            >
              {t.expertMode}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards - 2 rows of 4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Row 1 */}
        {/* Total Volume */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t.totalVolume}</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalVolume, mainCurrency)}</p>
          <p className="text-xs text-muted-foreground">
            {transactions.length} {t.transactions}
          </p>
        </div>

        {/* Deposits */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-green-500/10">
              <ArrowDownCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t.deposits}</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.depositsTotal, mainCurrency)}</p>
          <p className="text-xs text-muted-foreground">
            {stats.depositsCount} {t.transactions}
          </p>
        </div>

        {/* Payouts */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-blue-500/10">
              <ArrowUpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t.payouts}</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.payoutsTotal, mainCurrency)}</p>
          <p className="text-xs text-muted-foreground">
            {stats.payoutsCount} {t.transactions}
          </p>
        </div>

        {/* Refunds */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-orange-500/10">
              <RefreshCw className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t.refunds}</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.refundsTotal, mainCurrency)}</p>
          <p className="text-xs text-muted-foreground">
            {stats.refundsCount} {t.transactions}
          </p>
        </div>

        {/* Row 2 */}
        {/* Pending */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-yellow-500/10">
              <Hourglass className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t.pending}</span>
          </div>
          <p className="text-2xl font-bold">{stats.pendingCount}</p>
          <p className="text-xs text-muted-foreground">{t.transactions}</p>
        </div>

        {/* Completed */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-green-500/10">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t.completed}</span>
          </div>
          <p className="text-2xl font-bold">{stats.completedCount}</p>
          <p className="text-xs text-muted-foreground">{t.transactions}</p>
        </div>

        {/* Failed */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-red-500/10">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t.failed}</span>
          </div>
          <p className="text-2xl font-bold">{stats.failedCount}</p>
          <p className="text-xs text-muted-foreground">{t.transactions}</p>
        </div>

        {/* Cancelled */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-gray-500/10">
              <Ban className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t.cancelled}</span>
          </div>
          <p className="text-2xl font-bold">{stats.cancelledCount}</p>
          <p className="text-xs text-muted-foreground">{t.transactions}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-md border border-input bg-background outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as TransactionType | 'all');
              setCurrentPage(1);
            }}
            className="h-9 pl-3 pr-9 text-sm rounded-md border border-input bg-background outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none cursor-pointer"
          >
            <option value="all">{t.allTypes}</option>
            <option value="deposit">{t.deposit}</option>
            <option value="payout">{t.payout}</option>
            <option value="refund">{t.refund}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as TransactionStatus | 'all');
              setCurrentPage(1);
            }}
            className="h-9 pl-3 pr-9 text-sm rounded-md border border-input bg-background outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none cursor-pointer"
          >
            <option value="all">{t.allStatuses}</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <CircleDot className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg">{t.noTransactions}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">{t.noTransactionsDesc}</p>
            {onAddTransaction && (
              <button
                onClick={onAddTransaction}
                className="h-10 px-6 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t.addTransaction}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground">{t.id}</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">{t.type}</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">{t.amount}</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">{t.status}</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">{t.provider}</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">{t.phone}</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">{t.date}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className={`hover:bg-muted/50 transition-colors ${onTransactionClick ? 'cursor-pointer' : ''}`}
                      onClick={() => onTransactionClick?.(tx)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs truncate max-w-[100px]" title={tx.id}>
                            {tx.id.slice(0, 8)}...
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(tx.id);
                            }}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Copy ID"
                          >
                            {copiedId === tx.id ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                          tx.type === 'deposit' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          tx.type === 'payout' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                          {tx.type === 'deposit' && <ArrowDownCircle className="w-3 h-3" />}
                          {tx.type === 'payout' && <ArrowUpCircle className="w-3 h-3" />}
                          {tx.type === 'refund' && <RefreshCw className="w-3 h-3" />}
                          {t[tx.type]}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">
                        {formatCurrency(tx.amount, tx.currency)}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[tx.status]}`}>
                          <StatusIcon status={tx.status} />
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {tx.provider.replace(/_/g, ' ')}
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {tx.phoneNumber}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatDate(tx.createdAt, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {filteredTransactions.length} {t.transactions}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-md border border-input hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm px-2">
                    {t.page} {currentPage} {t.of} {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-md border border-input hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SpaarkPaySdkFinanceDashboard;
