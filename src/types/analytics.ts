// Analytics types for platform cost tracking

export interface AnalyticsDateRange {
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
}

export interface KYCAnalytics {
  totalKYCs: number;
  kycsByStatus: {
    active: number;
    under_review: number;
    rejected: number;
    incomplete: number;
    awaiting_questionnaire: number;
    awaiting_ubo: number;
    not_started: number;
    offboarded: number;
    paused: number;
  };
  totalKYCCost: number; // Total cost in USD
  costPerKYC: number; // Cost per KYC (3 USD)
}

export interface WalletAnalytics {
  totalWallets: number;
  walletsToday: number;
  totalUsersWithWallets: number;
  totalWalletCost: number; // Total cost in USD
  costPerWallet: number; // Cost per wallet (0.25 USD)
  walletsByChain: {
    [chain: string]: number;
  };
}

export interface CostEntry {
  id: string;
  type: 'kyc' | 'wallet';
  userId: string;
  userEmail: string;
  userName: string;
  profileId: string;
  description: string;
  amount: number;
  currency: 'USD';
  createdAt: string;
  metadata: {
    kycStatus?: string;
    bridgeCustomerId?: string;
    walletChain?: string;
    walletAddress?: string;
    bridgeWalletId?: string;
  };
}

export interface PlatformAnalytics {
  kyc: KYCAnalytics;
  wallets: WalletAnalytics;
  totalPlatformCost: number; // Combined KYC + Wallet costs
  costEntries: CostEntry[]; // Individual cost entries for the table
  monthlyBreakdown: {
    month: string;
    kycCosts: number;
    walletCosts: number;
    totalCosts: number;
  }[];
  recentActivity: {
    newKYCsToday: number;
    newWalletsToday: number;
    totalCostsToday: number;
  };
}

export interface AnalyticsApiResponse {
  analytics: PlatformAnalytics;
  lastUpdated: string;
}

export interface CostEntryDetail {
  id: string;
  type: 'kyc' | 'wallet';
  userId: string;
  userEmail: string;
  userName: string;
  profileId: string;
  description: string;
  amount: number;
  currency: 'USD';
  createdAt: string;
  metadata: {
    kycStatus?: string;
    bridgeCustomerId?: string;
    walletChain?: string;
    walletAddress?: string;
    bridgeWalletId?: string;
  };
  relatedEntries?: CostEntry[]; // Related costs for the same user
}

// Cost constants
export const COSTS = {
  KYC_COST_USD: 3.0,
  WALLET_COST_USD: 0.25,
} as const;
