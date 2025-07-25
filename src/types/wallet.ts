import type { JsonValue } from "@prisma/client/runtime/library";

// Wallet types based on Bridge API response format

// Bridge API Wallet Balance
export interface BridgeWalletBalance {
  balance: string;
  currency: string;
  chain: string;
  contract_address: string | null;
}

// Bridge API Wallet Response (including balances)
export interface BridgeWallet {
  id: string;
  chain: string;
  address: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  balances?: BridgeWalletBalance[];
}

// Bridge API Response Format
export interface BridgeWalletResponse {
  count: number;
  data: BridgeWallet[];
}

// Internal Wallet Model (matches Prisma schema)
export interface Wallet {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  profileId: string;
  walletTag: "general_use" | "p2p";
  isActive: boolean;
  bridgeWalletId: string;
  chain: "solana" | "base";
  address: string;
  bridgeTags: string[];
  bridgeCreatedAt: Date | null;
  bridgeUpdatedAt: Date | null;
}

// User with Wallets (for display purposes)
export interface UserWithWallets {
  id: string;
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  wallets?: Wallet[];
  walletsCount?: number;
  liquidationAddresses?: LiquidationAddress[];
  liquidationAddressesCount?: number;
  kycProfile?: {
    bridgeCustomerId?: string | null;
  };
}

// Wallet Sync Request
export interface WalletSyncRequest {
  profileId: string;
  bridgeCustomerId: string;
}

// Wallet Sync Response
export interface WalletSyncResponse {
  success: boolean;
  syncedCount: number;
  newWallets: number;
  updatedWallets: number;
  message: string;
}

// Wallet Stats
export interface WalletStats {
  totalUsersWithWallets: number;
  totalWallets: number;
  walletsByChain: {
    [chain: string]: number;
  };
  walletsByTag: {
    general_use: number;
    p2p: number;
  };
  recentActivity: {
    newWalletsToday: number;
    activeChains: number;
    usersWithMultipleWallets: number;
  };
}

// Wallet Filters
export interface WalletFilters {
  chain: string;
  hasWallets: string;
  search: string;
  walletTag?: string;
}

// Chain information for display
export interface ChainInfo {
  name: string;
  displayName: string;
  color: string;
  icon?: string;
}

// Known blockchain chains
export const SUPPORTED_CHAINS: Record<string, ChainInfo> = {
  solana: {
    name: "solana",
    displayName: "Solana",
    color: "#9945FF",
  },
  base: {
    name: "base",
    displayName: "Base",
    color: "#0052FF",
  },
};

// Wallet tags for display
export const WALLET_TAGS = {
  general_use: {
    label: "General Use",
    description: "General purpose wallet for standard operations",
    color: "blue",
  },
  p2p: {
    label: "P2P",
    description: "Peer-to-peer transactions and trading",
    color: "green",
  },
} as const;

// Pagination (reusable - imported from user types)
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// API Response Types
export interface WalletApiResponse {
  users: UserWithWallets[];
  pagination: PaginationMeta;
}

export type WalletStatsApiResponse = WalletStats;

export interface UserWalletApiResponse {
  user: UserWithWallets;
  wallets: Wallet[];
}

// API Error Response
export interface WalletApiError {
  error: string;
  details?: string;
}

// Transaction types based on Bridge API response format

// Bridge API Transaction Response
export interface BridgeTransaction {
  amount: string;
  developer_fee: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  source: {
    payment_rail: string;
    currency: string;
  };
  destination: {
    payment_rail: string;
    currency: string;
  };
}

// Bridge API Transaction History Response
export interface BridgeTransactionHistoryResponse {
  count: number;
  data: BridgeTransaction[];
}

// Internal Transaction Model (matches Prisma schema)
export interface Transaction {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  bridgeTransactionId: string;
  walletId: string;
  amount: string;
  developerFee: string | null;
  customerId: string;
  sourcePaymentRail: string | null;
  sourceCurrency: string | null;
  destinationPaymentRail: string | null;
  destinationCurrency: string | null;
  bridgeCreatedAt: Date;
  bridgeUpdatedAt: Date;
  bridgeRawData: JsonValue | null;
}

// Transaction Sync Model
export interface TransactionSync {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  walletId: string;
  lastSyncAt: Date;
  lastSyncTransactionCount: number;
  newTransactionsFound: number;
  syncStatus: string;
  errorMessage: string | null;
  lastProcessedBridgeCreatedAt: Date | null;
}

// Transaction Sync Response
export interface TransactionSyncResponse {
  success: boolean;
  syncedCount: number;
  newTransactions: number;
  totalTransactions: number;
  lastSyncAt: Date;
  message: string;
}

// Wallet with Transactions and Balances (for display purposes)
export interface WalletWithTransactions extends Wallet {
  transactions?: Transaction[];
  transactionCount?: number;
  lastTransactionAt?: Date | null;
  balances?: BridgeWalletBalance[];
  profile?: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

// Transaction Filters
export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  currency?: string;
  paymentRail?: string;
}

// Transaction API Response Types
export interface TransactionHistoryApiResponse {
  transactions: Transaction[];
  pagination: PaginationMeta;
  syncInfo?: TransactionSync;
}

export interface WalletTransactionApiResponse {
  wallet: WalletWithTransactions;
  transactions: Transaction[];
  pagination: PaginationMeta;
  syncInfo?: TransactionSync;
}

// Transaction Stats
export interface TransactionStats {
  totalTransactions: number;
  totalAmount: string;
  averageAmount: string;
  transactionsByPaymentRail: {
    [rail: string]: number;
  };
  transactionsByCurrency: {
    [currency: string]: number;
  };
  recentActivity: {
    transactionsToday: number;
    transactionsThisWeek: number;
    transactionsThisMonth: number;
  };
}

// Wallet Creation types
export interface WalletCreationRequest {
  chain: "base" | "solana";
  walletTag: "general_use" | "p2p";
}

export interface WalletCreationResponse {
  success: boolean;
  wallet: Wallet;
  message: string;
}

export interface WalletCreationApiError {
  error: string;
  details?: string;
}

// Liquidation Address types

// Bridge API Liquidation Address Response
export interface BridgeLiquidationAddress {
  id: string;
  chain: string;
  address: string;
  currency: string;
  customer_id: string;
  destination_payment_rail: string;
  destination_currency: string;
  destination_address: string;
  created_at: string;
  updated_at: string;
  state: string;
}

// Bridge API Liquidation Addresses Response
export interface BridgeLiquidationAddressesResponse {
  count: number;
  data: BridgeLiquidationAddress[];
}

// Internal Liquidation Address Model (matches Prisma schema)
export interface LiquidationAddress {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  bridgeLiquidationId: string;
  profileId: string;
  customerId: string;
  chain: string;
  address: string;
  currency: string;
  destinationPaymentRail: string;
  destinationCurrency: string;
  destinationAddress: string;
  state: string;
  bridgeCreatedAt: Date;
  bridgeUpdatedAt: Date;
}

// Liquidation Address Sync Response
export interface LiquidationAddressSyncResponse {
  success: boolean;
  syncedCount: number;
  newAddresses: number;
  updatedAddresses: number;
  totalAddresses: number;
  lastSyncAt: Date;
  message: string;
}

// User with Liquidation Addresses (for display purposes)
export interface UserWithLiquidationAddresses {
  id: string;
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  liquidationAddresses?: LiquidationAddress[];
  liquidationAddressesCount?: number;
}
