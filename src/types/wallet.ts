// Wallet types based on Bridge API response format

// Bridge API Wallet Response
export interface BridgeWallet {
  id: string;
  chain: string;
  address: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Bridge API Response Format
export interface BridgeWalletResponse {
  count: number;
  data: BridgeWallet[];
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
  wallets?: BridgeWallet[];
  walletsCount?: number;
}

// Wallet Stats
export interface WalletStats {
  totalUsersWithWallets: number;
  totalWallets: number;
  walletsByChain: {
    [chain: string]: number;
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

export interface WalletStatsApiResponse extends WalletStats {}

export interface UserWalletApiResponse {
  user: UserWithWallets;
  wallets: BridgeWallet[];
}

// API Error Response
export interface WalletApiError {
  error: string;
  details?: string;
}
