import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding crypto deposit configurations...');

  // Create Ethereum configuration
  const ethereum = await prisma.cryptoDepositConfig.create({
    data: {
      chainId: 'ethereum',
      chainName: 'Ethereum',
      displayName: 'Ethereum (ETH)',
      isEnabled: true,
      depositInstructions: 'Send only Ethereum (ETH) and ERC-20 tokens to this address. Sending other assets may result in permanent loss.',
      processingTime: '15-30 minutes',
      riskLevel: 'medium',
      iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      explorerUrl: 'https://etherscan.io',
      networkFee: 5.0,
      minimumAmount: 10.0,
      maximumAmount: 50000.0,
      supportedTokens: [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          isEnabled: true,
          minimumDeposit: 0.001,
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          contractAddress: '0xA0b86a33E6441C9eE8A0c0c0c0c0c0c0c0c',
          decimals: 6,
          isEnabled: true,
          minimumDeposit: 10,
        },
        {
          symbol: 'USDT',
          name: 'Tether USD',
          contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          decimals: 6,
          isEnabled: true,
          minimumDeposit: 10,
        },
      ],
      lastModifiedBy: 'system',
      lastModifiedAt: new Date(),
    },
  });

  // Create Arbitrum configuration
  const arbitrum = await prisma.cryptoDepositConfig.create({
    data: {
      chainId: 'arbitrum',
      chainName: 'Arbitrum',
      displayName: 'Arbitrum One',
      isEnabled: true,
      depositInstructions: 'Send only Arbitrum network tokens to this address. This is an Arbitrum One address, not Ethereum mainnet.',
      processingTime: '5-10 minutes',
      riskLevel: 'low',
      iconUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
      explorerUrl: 'https://arbiscan.io',
      networkFee: 0.5,
      minimumAmount: 5.0,
      maximumAmount: 25000.0,
      supportedTokens: [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          isEnabled: true,
          minimumDeposit: 0.001,
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          contractAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          decimals: 6,
          isEnabled: true,
          minimumDeposit: 5,
        },
      ],
      lastModifiedBy: 'system',
      lastModifiedAt: new Date(),
    },
  });

  // Create Base configuration
  const base = await prisma.cryptoDepositConfig.create({
    data: {
      chainId: 'base',
      chainName: 'Base',
      displayName: 'Base',
      isEnabled: true,
      depositInstructions: 'Send only Base network tokens to this address. This is a Base network address, not Ethereum mainnet.',
      processingTime: '2-5 minutes',
      riskLevel: 'low',
      iconUrl: 'https://cryptologos.cc/logos/base-base-logo.png',
      explorerUrl: 'https://basescan.org',
      networkFee: 0.1,
      minimumAmount: 1.0,
      maximumAmount: 10000.0,
      supportedTokens: [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          isEnabled: true,
          minimumDeposit: 0.001,
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          decimals: 6,
          isEnabled: true,
          minimumDeposit: 1,
        },
      ],
      lastModifiedBy: 'system',
      lastModifiedAt: new Date(),
    },
  });

  // Create Solana configuration (disabled by default)
  const solana = await prisma.cryptoDepositConfig.create({
    data: {
      chainId: 'solana',
      chainName: 'Solana',
      displayName: 'Solana',
      isEnabled: false,
      depositInstructions: 'Send only Solana (SOL) and SPL tokens to this address. Sending other assets may result in permanent loss.',
      processingTime: '1-2 minutes',
      riskLevel: 'medium',
      iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
      explorerUrl: 'https://explorer.solana.com',
      networkFee: 0.01,
      minimumAmount: 0.1,
      maximumAmount: 5000.0,
      supportedTokens: [
        {
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9,
          isEnabled: true,
          minimumDeposit: 0.01,
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          decimals: 6,
          isEnabled: true,
          minimumDeposit: 1,
        },
      ],
      lastModifiedBy: 'system',
      lastModifiedAt: new Date(),
    },
  });

  // Create history records for each configuration
  await prisma.cryptoDepositHistory.createMany({
    data: [
      {
        configId: ethereum.id,
        changeType: 'created',
        newValues: { chainId: 'ethereum', isEnabled: true },
        changeReason: 'Initial configuration',
        modifiedBy: 'system',
      },
      {
        configId: arbitrum.id,
        changeType: 'created',
        newValues: { chainId: 'arbitrum', isEnabled: true },
        changeReason: 'Initial configuration',
        modifiedBy: 'system',
      },
      {
        configId: base.id,
        changeType: 'created',
        newValues: { chainId: 'base', isEnabled: true },
        changeReason: 'Initial configuration',
        modifiedBy: 'system',
      },
      {
        configId: solana.id,
        changeType: 'created',
        newValues: { chainId: 'solana', isEnabled: false },
        changeReason: 'Initial configuration (disabled)',
        modifiedBy: 'system',
      },
    ],
  });

  console.log('✅ Crypto deposit configurations seeded successfully!');
  console.log(`Created configurations for: ${ethereum.chainId}, ${arbitrum.chainId}, ${base.chainId}, ${solana.chainId}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding crypto deposit configurations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });