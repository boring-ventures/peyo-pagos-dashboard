// Crypto deposits configuration types

export interface CryptoDepositConfig {
  id: string;
  chainId: string;
  chainName: string;
  displayName: string;
  isEnabled: boolean;
  supportedTokens: CryptoToken[];
  depositInstructions: string;
  minimumAmount?: number;
  maximumAmount?: number;
  networkFee?: number;
  processingTime: string; // e.g., "5-10 minutes"
  riskLevel: "low" | "medium" | "high";
  iconUrl?: string;
  explorerUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastModifiedBy: string;
}

export interface CryptoToken {
  id: string;
  symbol: string;
  name: string;
  contractAddress?: string;
  decimals: number;
  isEnabled: boolean;
  minimumDeposit?: number;
  maximumDeposit?: number;
  depositInstructions?: string;
  iconUrl?: string;
}

export interface CreateCryptoDepositConfigRequest {
  chainId: string;
  chainName: string;
  displayName: string;
  isEnabled: boolean;
  supportedTokens: Omit<CryptoToken, "id">[];
  depositInstructions: string;
  minimumAmount?: number;
  maximumAmount?: number;
  networkFee?: number;
  processingTime: string;
  riskLevel: "low" | "medium" | "high";
  iconUrl?: string;
  explorerUrl?: string;
}

export interface UpdateCryptoDepositConfigRequest {
  chainName?: string;
  displayName?: string;
  isEnabled?: boolean;
  supportedTokens?: CryptoToken[];
  depositInstructions?: string;
  minimumAmount?: number;
  maximumAmount?: number;
  networkFee?: number;
  processingTime?: string;
  riskLevel?: "low" | "medium" | "high";
  iconUrl?: string;
  explorerUrl?: string;
}

export interface CryptoDepositConfigsResponse {
  configs: CryptoDepositConfig[];
  totalCount: number;
}

export interface CryptoDepositConfigResponse {
  config: CryptoDepositConfig;
}

// Common chain configurations
export const SUPPORTED_CHAINS = [
  {
    chainId: "ethereum",
    chainName: "Ethereum",
    displayName: "Ethereum (ETH)",
    explorerUrl: "https://etherscan.io",
  },
  {
    chainId: "arbitrum",
    chainName: "Arbitrum",
    displayName: "Arbitrum One",
    explorerUrl: "https://arbiscan.io",
  },
  {
    chainId: "base",
    chainName: "Base",
    displayName: "Base",
    explorerUrl: "https://basescan.org",
  },
  {
    chainId: "polygon",
    chainName: "Polygon",
    displayName: "Polygon (MATIC)",
    explorerUrl: "https://polygonscan.com",
  },
  {
    chainId: "optimism",
    chainName: "Optimism",
    displayName: "Optimism",
    explorerUrl: "https://optimistic.etherscan.io",
  },
  {
    chainId: "avalanche",
    chainName: "Avalanche",
    displayName: "Avalanche C-Chain",
    explorerUrl: "https://snowtrace.io",
  },
  {
    chainId: "bsc",
    chainName: "Binance Smart Chain",
    displayName: "BSC",
    explorerUrl: "https://bscscan.com",
  },
  {
    chainId: "solana",
    chainName: "Solana",
    displayName: "Solana",
    explorerUrl: "https://explorer.solana.com",
  },
] as const;

// Common tokens for different chains
export const COMMON_TOKENS = {
  ethereum: [
    {
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
      isEnabled: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      contractAddress: "0xA0b86a33E6441C9eE8A0c0c0c0c0c0c0c0c",
      decimals: 6,
      isEnabled: true,
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
      isEnabled: true,
    },
  ],
  arbitrum: [
    {
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
      isEnabled: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      contractAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      decimals: 6,
      isEnabled: true,
    },
  ],
  base: [
    {
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
      isEnabled: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
      isEnabled: true,
    },
  ],
  solana: [
    {
      symbol: "SOL",
      name: "Solana",
      decimals: 9,
      isEnabled: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      decimals: 6,
      isEnabled: true,
    },
  ],
} as const;