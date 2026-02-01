'use client';

import { useState, useMemo, useCallback, forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as SelectPrimitive from '@radix-ui/react-select';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
} from '@tanstack/react-table';
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
  Plus,
  Ban,
  Hourglass,
  Inbox,
  BarChart3,
  LayoutDashboard,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '../lib/utils';
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
    dashboard: 'Tableau de bord',
    charts: 'Graphiques',
    volumeOverTime: 'Volume dans le temps',
    transactionsByType: 'Par type',
    statusDistribution: 'Par statut',
    noDataForCharts: 'Pas de données pour les graphiques',
    loading: 'Chargement...',
    previous: 'Précédent',
    next: 'Suivant',
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
    dashboard: 'Dashboard',
    charts: 'Charts',
    volumeOverTime: 'Volume over time',
    transactionsByType: 'By type',
    statusDistribution: 'By status',
    noDataForCharts: 'No data for charts',
    loading: 'Loading...',
    previous: 'Previous',
    next: 'Next',
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

const CHART_COLORS = {
  deposit: '#22c55e',
  payout: '#3b82f6',
  refund: '#f97316',
  COMPLETED: '#22c55e',
  PENDING: '#eab308',
  PROCESSING: '#3b82f6',
  ACCEPTED: '#3b82f6',
  FAILED: '#ef4444',
  CANCELLED: '#6b7280',
  REJECTED: '#ef4444',
  ENQUEUED: '#eab308',
};

// ============================================================================
// shadcn/ui-like Components
// ============================================================================

// Button
const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  }
>(({ className, variant = 'default', size = 'default', ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      {
        'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
        'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
        'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
      },
      {
        'h-10 px-4 py-2': size === 'default',
        'h-9 rounded-md px-3': size === 'sm',
        'h-11 rounded-md px-8': size === 'lg',
        'h-10 w-10': size === 'icon',
      },
      className
    )}
    {...props}
  />
));
Button.displayName = 'Button';

// Tabs
const Tabs = TabsPrimitive.Root;

const TabsList = forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=inactive]:text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// Select
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

// Card
const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

// Input
const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

// Table (shadcn/ui style)
const Table = forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

const TableRow = forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

const TableCell = forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />
  )
);
TableCell.displayName = 'TableCell';

// Skeleton
const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
);

// Spinner
const Spinner = ({ className }: { className?: string }) => (
  <svg className={cn('animate-spin', className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// Empty State
const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
      <Icon className="h-10 w-10 text-muted-foreground" />
    </div>
    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
    {description && <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

// Status Icon
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
      return <Spinner className="w-3.5 h-3.5" />;
    default:
      return <AlertCircle className="w-3.5 h-3.5" />;
  }
};

// ============================================================================
// Utilities
// ============================================================================

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

// ============================================================================
// Main Component
// ============================================================================

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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

    const depositsTotal = deposits.filter(tx => tx.status === 'COMPLETED').reduce((sum, tx) => sum + tx.amount, 0);
    const payoutsTotal = payouts.filter(tx => tx.status === 'COMPLETED').reduce((sum, tx) => sum + tx.amount, 0);
    const refundsTotal = refunds.filter(tx => tx.status === 'COMPLETED').reduce((sum, tx) => sum + tx.amount, 0);

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

  const chartData = useMemo(() => {
    const byDate: Record<string, { date: string; deposits: number; payouts: number; refunds: number }> = {};

    transactions.forEach(tx => {
      const date = new Date(tx.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
        day: '2-digit',
        month: 'short',
      });

      if (!byDate[date]) {
        byDate[date] = { date, deposits: 0, payouts: 0, refunds: 0 };
      }

      if (tx.status === 'COMPLETED') {
        byDate[date][tx.type === 'deposit' ? 'deposits' : tx.type === 'payout' ? 'payouts' : 'refunds'] += tx.amount;
      }
    });

    const volumeData = Object.values(byDate).slice(-7);
    const typeData = [
      { name: t.deposit, value: stats.depositsTotal, count: stats.depositsCount, fill: CHART_COLORS.deposit },
      { name: t.payout, value: stats.payoutsTotal, count: stats.payoutsCount, fill: CHART_COLORS.payout },
      { name: t.refund, value: stats.refundsTotal, count: stats.refundsCount, fill: CHART_COLORS.refund },
    ];
    const statusData = [
      { name: 'Completed', value: stats.completedCount, fill: CHART_COLORS.COMPLETED },
      { name: 'Pending', value: stats.pendingCount, fill: CHART_COLORS.PENDING },
      { name: 'Failed', value: stats.failedCount, fill: CHART_COLORS.FAILED },
      { name: 'Cancelled', value: stats.cancelledCount, fill: CHART_COLORS.CANCELLED },
    ].filter(d => d.value > 0);

    return { volumeData, typeData, statusData };
  }, [transactions, stats, locale, t]);

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

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const mainCurrency = transactions[0]?.currency || 'XAF';

  // Table columns with @tanstack/react-table
  const columns: ColumnDef<Transaction>[] = useMemo(() => [
    {
      accessorKey: 'id',
      header: t.id,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs truncate max-w-[100px]" title={row.original.id}>
            {row.original.id.slice(0, 8)}...
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(row.original.id);
            }}
          >
            {copiedId === row.original.id ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: t.type,
      cell: ({ row }) => (
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full',
          row.original.type === 'deposit' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          row.original.type === 'payout' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          row.original.type === 'refund' && 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        )}>
          {row.original.type === 'deposit' && <ArrowDownCircle className="w-3 h-3" />}
          {row.original.type === 'payout' && <ArrowUpCircle className="w-3 h-3" />}
          {row.original.type === 'refund' && <RefreshCw className="w-3 h-3" />}
          {t[row.original.type]}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: t.amount,
      cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.original.amount, row.original.currency)}</span>,
    },
    {
      accessorKey: 'status',
      header: t.status,
      cell: ({ row }) => (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full', STATUS_COLORS[row.original.status])}>
          <StatusIcon status={row.original.status} />
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'provider',
      header: t.provider,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.provider.replace(/_/g, ' ')}</span>,
    },
    {
      accessorKey: 'phoneNumber',
      header: t.phone,
      cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.original.phoneNumber}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: t.date,
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt, locale)}</span>,
    },
  ], [t, locale, copiedId, copyToClipboard]);

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: { columnFilters },
    initialState: { pagination: { pageSize: 10 } },
  });

  // Skeleton loading for table
  const TableSkeleton = () => (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );

  // Skeleton loading for cards
  const CardSkeleton = () => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title || t.title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle || t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              {t.dashboard}
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              {t.charts}
            </TabsTrigger>
          </TabsList>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              {t.refresh}
            </Button>
          )}
          {onSettings && (
            <Button variant="outline" size="icon" onClick={onSettings} title={t.settings}>
              <Settings className="w-4 h-4" />
            </Button>
          )}
          {showExpertMode && onExpertModeClick && (
            <Button onClick={onExpertModeClick}>{t.expertMode}</Button>
          )}
        </div>
      </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoading ? (
              <>
                {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-primary/10">
                        <TrendingUp className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{t.totalVolume}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalVolume, mainCurrency)}</p>
                    <p className="text-xs text-muted-foreground">{transactions.length} {t.transactions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-green-500/10">
                        <ArrowDownCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{t.deposits}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(stats.depositsTotal, mainCurrency)}</p>
                    <p className="text-xs text-muted-foreground">{stats.depositsCount} {t.transactions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-blue-500/10">
                        <ArrowUpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{t.payouts}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(stats.payoutsTotal, mainCurrency)}</p>
                    <p className="text-xs text-muted-foreground">{stats.payoutsCount} {t.transactions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-orange-500/10">
                        <RefreshCw className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{t.refunds}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(stats.refundsTotal, mainCurrency)}</p>
                    <p className="text-xs text-muted-foreground">{stats.refundsCount} {t.transactions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-yellow-500/10">
                        <Hourglass className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{t.pending}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.pendingCount}</p>
                    <p className="text-xs text-muted-foreground">{t.transactions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-green-500/10">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{t.completed}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.completedCount}</p>
                    <p className="text-xs text-muted-foreground">{t.transactions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-red-500/10">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{t.failed}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.failedCount}</p>
                    <p className="text-xs text-muted-foreground">{t.transactions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-gray-500/10">
                        <Ban className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{t.cancelled}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.cancelledCount}</p>
                    <p className="text-xs text-muted-foreground">{t.transactions}</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionType | 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t.allTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTypes}</SelectItem>
                <SelectItem value="deposit">{t.deposit}</SelectItem>
                <SelectItem value="payout">{t.payout}</SelectItem>
                <SelectItem value="refund">{t.refund}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TransactionStatus | 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t.allStatuses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                <SelectItem value="PENDING">PENDING</SelectItem>
                <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                <SelectItem value="ACCEPTED">ACCEPTED</SelectItem>
                <SelectItem value="FAILED">FAILED</SelectItem>
                <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                <SelectItem value="REJECTED">REJECTED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          <Card>
            {isLoading ? (
              <TableSkeleton />
            ) : filteredTransactions.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={t.noTransactions}
                description={t.noTransactionsDesc}
                action={
                  onAddTransaction && (
                    <Button onClick={onAddTransaction}>
                      <Plus className="w-4 h-4" />
                      {t.addTransaction}
                    </Button>
                  )
                }
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map(row => (
                      <TableRow
                        key={row.id}
                        onClick={() => onTransactionClick?.(row.original)}
                        className={onTransactionClick ? 'cursor-pointer' : ''}
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    {filteredTransactions.length} {t.transactions}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {t.previous}
                    </Button>
                    <span className="text-sm px-2">
                      {t.page} {table.getState().pagination.pageIndex + 1} {t.of} {table.getPageCount()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      {t.next}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          {transactions.length === 0 ? (
            <Card>
              <EmptyState
                icon={BarChart3}
                title={t.noDataForCharts}
                description={t.noTransactionsDesc}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t.volumeOverTime}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.volumeData}>
                        <defs>
                          <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.deposit} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={CHART_COLORS.deposit} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorPayouts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.payout} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={CHART_COLORS.payout} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="deposits" name={t.deposits} stroke={CHART_COLORS.deposit} fillOpacity={1} fill="url(#colorDeposits)" />
                        <Area type="monotone" dataKey="payouts" name={t.payouts} stroke={CHART_COLORS.payout} fillOpacity={1} fill="url(#colorPayouts)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.transactionsByType}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.typeData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => formatCurrency(value, mainCurrency)} />
                        <Bar dataKey="value" name={t.amount} radius={[4, 4, 0, 0]}>
                          {chartData.typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.statusDistribution}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {chartData.statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
    </Tabs>
  );
}

export default SpaarkPaySdkFinanceDashboard;
