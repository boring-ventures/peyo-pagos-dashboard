// Analytics types for platform cost tracking

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

export interface PlatformAnalytics {
  kyc: KYCAnalytics;
  wallets: WalletAnalytics;
  totalPlatformCost: number; // Combined KYC + Wallet costs
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

// Cost constants
export const COSTS = {
  KYC_COST_USD: 3.0,
  WALLET_COST_USD: 0.25,
} as const;
