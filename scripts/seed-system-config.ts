import {
  PrismaClient,
  FeeType,
  ConfigType,
  ConfigStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function seedSystemConfig() {
  console.log("🌱 Seeding system configuration...");

  try {
    // Create default fee configurations
    const feeConfigs = [
      {
        feeType: FeeType.DEVELOPER_FEE,
        name: "Developer Fee",
        description:
          "Fee applied to crypto transactions for platform maintenance and development",
        amount: 0.025, // 2.5%
        currency: "USD",
        feeStructure: "percentage",
        minAmount: 1.0, // Minimum $1 transaction
        maxAmount: 50.0, // Maximum $50 fee
        isActive: true,
        appliesTo: ["crypto_transactions", "bridge_transactions"],
        excludedFrom: ["internal_transfers"],
        category: "crypto",
        tags: ["transaction", "bridge", "developer"],
      },
      {
        feeType: FeeType.CREDIT_CARD_EMISSION_FEE,
        name: "Credit Card Emission Fee",
        description: "Fee charged when creating new PayWithMoon debit cards",
        amount: 5.0, // $5 fixed fee
        currency: "USD",
        feeStructure: "fixed_amount",
        minAmount: null, // No minimum for card creation
        maxAmount: null, // No maximum for fixed fee
        isActive: true,
        appliesTo: ["card_creation", "paywithmoon"],
        excludedFrom: [],
        category: "cards",
        tags: ["card", "emission", "paywithmoon"],
      },
    ];

    for (const feeConfig of feeConfigs) {
      const existing = await prisma.feeConfig.findFirst({
        where: { feeType: feeConfig.feeType },
      });

      if (!existing) {
        const created = await prisma.feeConfig.create({
          data: feeConfig,
        });
        console.log(
          `✅ Created fee config: ${created.name} (${created.feeType})`
        );
      } else {
        console.log(
          `⏭️  Fee config already exists: ${existing.name} (${existing.feeType})`
        );
      }
    }

    // Create default system configurations
    const systemConfigs = [
      {
        key: "developer_fee_percentage",
        name: "Developer Fee Percentage",
        description: "Default percentage fee for crypto transactions",
        type: ConfigType.FEE,
        status: ConfigStatus.active,
        value: 2.5, // 2.5%
        defaultValue: 2.5,
        minValue: 0.1, // Minimum 0.1%
        maxValue: 10.0, // Maximum 10%
        category: "fees",
        tags: ["crypto", "transaction", "percentage"],
      },
      {
        key: "credit_card_emission_fee",
        name: "Credit Card Emission Fee",
        description: "Fixed fee for creating new PayWithMoon debit cards",
        type: ConfigType.FEE,
        status: ConfigStatus.active,
        value: 5.0, // $5
        defaultValue: 5.0,
        minValue: 0.0, // Minimum $0
        maxValue: 50.0, // Maximum $50
        category: "fees",
        tags: ["card", "emission", "fixed"],
      },
      {
        key: "max_transaction_amount",
        name: "Maximum Transaction Amount",
        description: "Maximum allowed transaction amount in USD",
        type: ConfigType.LIMIT,
        status: ConfigStatus.active,
        value: 10000.0, // $10,000
        defaultValue: 10000.0,
        minValue: 100.0, // Minimum $100
        maxValue: 100000.0, // Maximum $100,000
        category: "limits",
        tags: ["transaction", "amount", "limit"],
      },
      {
        key: "kyc_required",
        name: "KYC Required",
        description: "Whether KYC verification is required for all users",
        type: ConfigType.FEATURE_FLAG,
        status: ConfigStatus.active,
        value: true,
        defaultValue: true,
        allowedValues: [true, false],
        category: "features",
        tags: ["kyc", "verification", "compliance"],
      },
    ];

    for (const config of systemConfigs) {
      const existing = await prisma.systemConfig.findUnique({
        where: { key: config.key },
      });

      if (!existing) {
        const created = await prisma.systemConfig.create({
          data: config,
        });
        console.log(
          `✅ Created system config: ${created.name} (${created.key})`
        );
      } else {
        console.log(
          `⏭️  System config already exists: ${existing.name} (${existing.key})`
        );
      }
    }

    console.log("✅ System configuration seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding system configuration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedSystemConfig().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
