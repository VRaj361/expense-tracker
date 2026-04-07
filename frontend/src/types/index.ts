export interface User {
  _id: string;
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  phone?: string;
  currency: string;
  notificationPreferences: {
    email: boolean;
    whatsapp: boolean;
    inApp: boolean;
  };
}

export interface Expense {
  _id: string;
  userId: string;
  amount: number;
  type: 'expense' | 'income';
  categoryId?: string;
  categoryName?: string;
  date: string;
  description?: string;
  paymentMethod?: string;
  vendor?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  userId?: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
  isDefault: boolean;
}

export interface Budget {
  _id: string;
  userId: string;
  categoryId?: string;
  categoryName?: string;
  limit: number;
  spent: number;
  percentage?: number;
  startDate: string;
  endDate: string;
  alertAt80: boolean;
  alertAtLimit: boolean;
}

export interface RecurringExpense {
  _id: string;
  userId: string;
  amount: number;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  paymentMethod?: string;
  vendor?: string;
  nextDueDate: string;
  lastProcessedDate?: string;
  isActive: boolean;
  type: 'expense' | 'income';
}

export interface Reminder {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  notifyVia: string[];
  isPaid: boolean;
  isActive: boolean;
}

export interface Loan {
  _id: string;
  userId: string;
  name: string;
  loanAmount: number;
  interestRate: number;
  emiAmount: number;
  tenure: number;
  paidEmis: number;
  remainingBalance: number;
  extraPaid: number;
  startDate: string;
  nextEmiDate?: string;
  emiDay: number;
  autoDeduct: boolean;
  isActive: boolean;
  loanType: string;
  payments: { date: string; amount: number; type: string; note: string }[];
}

export interface Investment {
  _id: string;
  userId: string;
  name: string;
  type: 'stocks' | 'mutual_funds' | 'crypto' | 'fixed_deposit' | 'other';
  investedAmount: number;
  currentValue: number;
  units?: number;
  purchaseDate?: string;
  notes?: string;
}

export interface AppNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AutomationRule {
  _id: string;
  userId: string;
  name: string;
  condition: {
    field: string;
    operator: string;
    value: any;
  };
  action: {
    type: string;
    value: any;
  };
  isActive: boolean;
}

export interface VendorMapping {
  _id: string;
  userId: string;
  vendorPattern: string;
  categoryId: string;
  categoryName: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MonthlyStats {
  totalExpenses: number;
  totalIncome: number;
  savings: number;
}

export interface OverviewStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  transactionCount: number;
}

export interface SpendingPrediction {
  predictedExpenses: number;
  predictedSavings: number;
  monthlyData: number[];
  trend: 'increasing' | 'decreasing' | 'stable';
  avgMonthlyExpense: number;
}

export interface BankProfile {
  _id: string;
  userId?: string;
  bankName: string;
  dateColumn: string;
  descriptionColumn: string;
  withdrawalColumn?: string;
  depositColumn?: string;
  amountColumn?: string;
  balanceColumn?: string;
  dateFormat: string;
  headerRowIndex: number;
  delimiter: string;
  isGlobal: boolean;
  notes?: string;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  withdrawal: number;
  deposit: number;
  balance?: number;
  type: 'expense' | 'income';
  amount: number;
}

/** Shared wallets (group expenses — separate from personal FinTrack transactions) */
export interface SharedWallet {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  currency: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SharedWalletMemberRow {
  _id: string;
  walletId: string;
  userId?: { _id: string; name: string; email: string; avatar?: string };
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'pending' | 'active' | 'removed';
  invitedBy?: string;
  /** Wallet-only label; owner can set. UI falls back to userId.name. */
  displayName?: string;
}

export interface SharedWalletEntryRow {
  _id: string;
  walletId: string;
  amount: number;
  category?: string;
  description?: string;
  spentAt: string;
  type: 'expense' | 'income';
  createdByUserId?: { _id: string; name: string; email: string; avatar?: string };
  onBehalfOfUserId?: { _id: string; name: string; email: string; avatar?: string };
}

export interface SharedWalletSummary {
  currency: string;
  expenseTotal: number;
  entryCount: number;
  byUser: { userId: string; name: string; total: number; count: number }[];
  highestSpender: { userId: string; name: string; total: number; count: number } | null;
  lowestSpender: { userId: string; name: string; total: number; count: number } | null;
}

export interface SharedWalletBalanceMember {
  userId: string;
  name: string;
  attributedSpend: number;
  fairShare: number;
  netBeforeSettlements: number;
  netAfterSettlements: number;
}

export interface SharedWalletSuggestedTransfer {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
}

export interface SharedWalletBalances {
  currency: string;
  fairSharePerMember: number;
  members: SharedWalletBalanceMember[];
  suggestedTransfers: SharedWalletSuggestedTransfer[];
}
