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
