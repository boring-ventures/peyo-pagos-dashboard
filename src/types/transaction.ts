export interface TransactionWithDetails {
  id: string;
  createdAt: string;
  updatedAt: string;
  bridgeTransactionId: string;
  walletId: string;
  amount: string;
  developerFee: string | null;
  customerId: string;
  sourcePaymentRail: string | null;
  sourceCurrency: string | null;
  destinationPaymentRail: string | null;
  destinationCurrency: string | null;
  bridgeCreatedAt: string;
  bridgeUpdatedAt: string;
  bridgeRawData: any | null;
  wallet: {
    id: string;
    address: string;
    chain: string;
    walletTag: string;
    profile: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      userTag: string | null;
      status: string;
    };
  };
}

export interface TransactionFilters {
  search?: string;
  walletId?: string;
  customerId?: string;
  sourceCurrency?: string;
  destinationCurrency?: string;
  sourcePaymentRail?: string;
  destinationPaymentRail?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TransactionStats {
  totalTransactions: number;
  recentTransactions: number;
  totalVolume: string;
  uniqueCustomers: number;
  uniqueWallets: number;
  currencyBreakdown: Array<{
    currency: string;
    count: number;
    volume: string;
  }>;
  paymentRailBreakdown: Array<{
    paymentRail: string;
    count: number;
  }>;
  volumeBreakdown: Array<{
    currency: string;
    volume: string;
  }>;
  dailyStats: Array<{
    date: string;
    count: number;
  }>;
}

export interface TransactionResponse {
  transactions: TransactionWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface TransactionDetailsModalProps {
  transaction: TransactionWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface TransactionFiltersState {
  search: string;
  walletId: string;
  customerId: string;
  sourceCurrency: string;
  destinationCurrency: string;
  sourcePaymentRail: string;
  destinationPaymentRail: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
}

export const SORT_OPTIONS = [
  { value: "bridgeCreatedAt", label: "Date Created" },
  { value: "bridgeUpdatedAt", label: "Date Updated" },
  { value: "amount", label: "Amount" },
  { value: "sourceCurrency", label: "Source Currency" },
  { value: "destinationCurrency", label: "Destination Currency" },
] as const;

export const CURRENCY_OPTIONS = [
  "USDC",
  "USDT",
  "ETH",
  "BTC",
  "SOL",
  "MATIC",
] as const;

export const PAYMENT_RAIL_OPTIONS = [
  "solana",
  "base",
  "ethereum",
  "polygon",
  "bitcoin",
] as const;
