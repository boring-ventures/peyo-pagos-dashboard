import { FeeType, ConfigStatus, Prisma } from "@prisma/client";
import { FeeCalculation, ConfigValue, FeeConfig } from "@/types/system-config";
import prisma from "@/lib/prisma";

// Cache for system configurations to avoid repeated database calls
const configCache = new Map<
  string,
  { value: ConfigValue; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get a system configuration value by key
 */
export async function getSystemConfig(key: string): Promise<ConfigValue> {
  // Check cache first
  const cached = configCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  const config = await prisma.systemConfig.findUnique({
    where: { key, status: ConfigStatus.active },
  });

  if (!config) {
    return null;
  }

  // Cache the result
  configCache.set(key, {
    value: config.value as ConfigValue,
    timestamp: Date.now(),
  });

  return config.value as ConfigValue;
}

/**
 * Get multiple system configuration values by keys
 */
export async function getSystemConfigs(
  keys: string[]
): Promise<Record<string, ConfigValue>> {
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: { in: keys },
      status: ConfigStatus.active,
    },
  });

  const result: Record<string, ConfigValue> = {};

  for (const config of configs) {
    result[config.key] = config.value as ConfigValue;
  }

  return result;
}

/**
 * Update a system configuration value
 */
export async function updateSystemConfig(
  key: string,
  value: ConfigValue,
  modifiedBy: string,
  changeReason?: string
): Promise<void> {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!config) {
    throw new Error(`System configuration with key '${key}' not found`);
  }

  // Validate the new value
  await validateConfigValue({
    minValue: config.minValue as ConfigValue,
    maxValue: config.maxValue as ConfigValue,
    allowedValues: config.allowedValues as ConfigValue[],
    validationRule: config.validationRule || undefined,
  }, value);

  // Create history record
  await prisma.systemConfigHistory.create({
    data: {
      configId: config.id,
      oldValue: config.value as Prisma.InputJsonValue,
      newValue: value as Prisma.InputJsonValue,
      changeReason,
      modifiedBy,
    },
  });

  // Update the configuration
  await prisma.systemConfig.update({
    where: { key },
    data: {
      value: value as Prisma.InputJsonValue,
      lastModifiedBy: modifiedBy,
      lastModifiedAt: new Date(),
    },
  });

  // Clear cache
  configCache.delete(key);
}

/**
 * Validate a configuration value against constraints
 */
async function validateConfigValue(
  config: {
    minValue?: ConfigValue;
    maxValue?: ConfigValue;
    allowedValues?: ConfigValue[];
    validationRule?: string;
  },
  value: ConfigValue
): Promise<void> {
  // Check min/max values for numeric configs
  if (typeof value === "number") {
    if (config.minValue !== null && typeof config.minValue === "number" && value < config.minValue) {
      throw new Error(`Value ${value} is below minimum ${config.minValue}`);
    }
    if (config.maxValue !== null && typeof config.maxValue === "number" && value > config.maxValue) {
      throw new Error(`Value ${value} is above maximum ${config.maxValue}`);
    }
  }

  // Check allowed values for enum-like configs
  if (config.allowedValues && !config.allowedValues.includes(value)) {
    throw new Error(
      `Value ${value} is not in allowed values: ${config.allowedValues.join(", ")}`
    );
  }

  // Check custom validation rule
  if (config.validationRule) {
    const regex = new RegExp(config.validationRule);
    if (!regex.test(String(value))) {
      throw new Error(
        `Value ${value} does not match validation rule: ${config.validationRule}`
      );
    }
  }
}

/**
 * Get fee configuration by type
 */
export async function getFeeConfig(feeType: FeeType): Promise<FeeConfig | null> {
  const feeConfig = await prisma.feeConfig.findFirst({
    where: {
      feeType,
      isActive: true,
    },
  });

  return feeConfig ? {
    id: feeConfig.id,
    name: feeConfig.name,
    feeType: feeConfig.feeType,
    description: feeConfig.description || undefined,
    amount: Number(feeConfig.amount),
    currency: feeConfig.currency,
    feeStructure: feeConfig.feeStructure,
    minAmount: feeConfig.minAmount ? Number(feeConfig.minAmount) : undefined,
    maxAmount: feeConfig.maxAmount ? Number(feeConfig.maxAmount) : undefined,
    isActive: feeConfig.isActive,
    appliesTo: feeConfig.appliesTo,
    excludedFrom: feeConfig.excludedFrom,
    category: feeConfig.category || undefined,
    tags: feeConfig.tags,
    lastModifiedBy: feeConfig.lastModifiedBy || undefined,
    lastModifiedAt: feeConfig.lastModifiedAt || undefined,
    createdAt: feeConfig.createdAt,
    updatedAt: feeConfig.updatedAt,
  } : null;
}

/**
 * Calculate fee for a transaction or service
 */
export async function calculateFee(
  baseAmount: number,
  feeType: FeeType,
  currency: string = "USD"
): Promise<FeeCalculation> {
  const feeConfig = await getFeeConfig(feeType);

  if (!feeConfig) {
    throw new Error(`No active fee configuration found for type: ${feeType}`);
  }

  let feeAmount = 0;
  let feePercentage = 0;

  // Calculate fee based on structure
  switch (feeConfig.feeStructure) {
    case "percentage":
      feePercentage = feeConfig.amount;
      feeAmount = (baseAmount * feeConfig.amount) / 100;

      // Apply minimum transaction amount check
      if (feeConfig.minAmount && baseAmount < feeConfig.minAmount) {
        throw new Error(
          `Transaction amount ${baseAmount} is below minimum ${feeConfig.minAmount}`
        );
      }

      // Apply maximum fee amount
      if (feeConfig.maxAmount && feeAmount > feeConfig.maxAmount) {
        feeAmount = feeConfig.maxAmount;
      }
      break;

    case "fixed_amount":
      feeAmount = feeConfig.amount;
      feePercentage = (feeAmount / baseAmount) * 100;
      break;

    case "tiered":
      // Implement tiered fee calculation logic here
      feeAmount = calculateTieredFee(baseAmount, feeConfig);
      feePercentage = (feeAmount / baseAmount) * 100;
      break;

    default:
      throw new Error(`Unsupported fee structure: ${feeConfig.feeStructure}`);
  }

  return {
    baseAmount,
    feeAmount,
    feePercentage,
    totalAmount: baseAmount + feeAmount,
    currency,
    feeType,
    appliedFee: feeConfig,
  };
}

/**
 * Calculate tiered fee (placeholder implementation)
 */
function calculateTieredFee(
  amount: number,
  feeConfig: { amount: number; feeStructure: string }
): number {
  // This is a placeholder - implement tiered fee logic based on your requirements
  return feeConfig.amount;
}

/**
 * Get developer fee for crypto transactions
 */
export async function getDeveloperFee(
  transactionAmount: number
): Promise<FeeCalculation> {
  return calculateFee(transactionAmount, FeeType.DEVELOPER_FEE);
}

/**
 * Get credit card emission fee
 */
export async function getCreditCardEmissionFee(): Promise<FeeCalculation> {
  // For card emission, we use a fixed amount, so we pass 1 as base amount
  return calculateFee(1, FeeType.CREDIT_CARD_EMISSION_FEE);
}

/**
 * Clear configuration cache
 */
export function clearConfigCache(): void {
  configCache.clear();
}

/**
 * Get all active fee configurations
 */
export async function getAllFeeConfigs(): Promise<
  {
    id: string;
    feeType: FeeType;
    name: string;
    amount: number;
    currency: string;
    feeStructure: string;
    isActive: boolean;
  }[]
> {
  const configs = await prisma.feeConfig.findMany({
    where: { isActive: true },
    orderBy: { feeType: "asc" },
  });

  return configs.map(config => ({
    id: config.id,
    feeType: config.feeType,
    name: config.name,
    amount: Number(config.amount),
    currency: config.currency,
    feeStructure: config.feeStructure,
    isActive: config.isActive,
  }));
}

/**
 * Get all active system configurations
 */
export async function getAllSystemConfigs(): Promise<
  {
    id: string;
    key: string;
    name: string;
    type: string;
    value: ConfigValue;
    category?: string;
  }[]
> {
  const configs = await prisma.systemConfig.findMany({
    where: { status: ConfigStatus.active },
    orderBy: { category: "asc", name: "asc" },
  });

  return configs.map(config => ({
    id: config.id,
    key: config.key,
    name: config.name,
    type: config.type,
    value: config.value as ConfigValue,
    category: config.category || undefined,
  }));
}

/**
 * Check if a feature flag is enabled
 */
export async function isFeatureEnabled(featureKey: string): Promise<boolean> {
  const value = await getSystemConfig(featureKey);
  return value === true;
}

/**
 * Get configuration statistics for dashboard
 */
export async function getSystemConfigStats(): Promise<{
  totalConfigs: number;
  activeConfigs: number;
  inactiveConfigs: number;
  configsByType: Record<string, number>;
  configsByCategory: Record<string, number>;
}> {
  const [totalConfigs, activeConfigs, inactiveConfigs] = await Promise.all([
    prisma.systemConfig.count(),
    prisma.systemConfig.count({ where: { status: ConfigStatus.active } }),
    prisma.systemConfig.count({ where: { status: ConfigStatus.inactive } }),
  ]);

  const configsByType = await prisma.systemConfig.groupBy({
    by: ["type"],
    _count: { type: true },
    where: { status: ConfigStatus.active },
  });

  const configsByCategory = await prisma.systemConfig.groupBy({
    by: ["category"],
    _count: { category: true },
    where: { status: ConfigStatus.active },
  });

  return {
    totalConfigs,
    activeConfigs,
    inactiveConfigs,
    configsByType: Object.fromEntries(
      configsByType.map((item) => [item.type, item._count.type])
    ),
    configsByCategory: Object.fromEntries(
      configsByCategory.map((item) => [
        item.category || "uncategorized",
        item._count.category,
      ])
    ),
  };
}

/**
 * Get fee configuration statistics for dashboard
 */
export async function getFeeConfigStats(): Promise<{
  totalFees: number;
  activeFees: number;
  inactiveFees: number;
  feesByType: Record<string, number>;
  feesByCategory: Record<string, number>;
  totalRevenue: number;
}> {
  const [totalFees, activeFees, inactiveFees] = await Promise.all([
    prisma.feeConfig.count(),
    prisma.feeConfig.count({ where: { isActive: true } }),
    prisma.feeConfig.count({ where: { isActive: false } }),
  ]);

  const feesByType = await prisma.feeConfig.groupBy({
    by: ["feeType"],
    _count: { feeType: true },
    where: { isActive: true },
  });

  const feesByCategory = await prisma.feeConfig.groupBy({
    by: ["category"],
    _count: { category: true },
    where: { isActive: true },
  });

  return {
    totalFees,
    activeFees,
    inactiveFees,
    feesByType: Object.fromEntries(
      feesByType.map((item) => [item.feeType, item._count.feeType])
    ),
    feesByCategory: Object.fromEntries(
      feesByCategory.map((item) => [
        item.category || "uncategorized",
        item._count.category,
      ])
    ),
    totalRevenue: 0, // This would be calculated from actual transaction data
  };
}
