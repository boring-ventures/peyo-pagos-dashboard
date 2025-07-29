import { ConfigType, ConfigStatus, FeeType } from "@prisma/client";

// Define possible configuration value types
export type ConfigValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Record<string, unknown>
  | null;

// System Configuration Types
export interface SystemConfig {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  key: string;
  name: string;
  description?: string;
  type: ConfigType;
  status: ConfigStatus;
  value: ConfigValue;
  defaultValue?: ConfigValue;
  minValue?: ConfigValue;
  maxValue?: ConfigValue;
  allowedValues?: ConfigValue[];
  validationRule?: string;
  category?: string;
  tags: string[];
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
}

export interface SystemConfigHistory {
  id: string;
  createdAt: Date;
  configId: string;
  oldValue?: ConfigValue;
  newValue: ConfigValue;
  changeReason?: string;
  modifiedBy: string;
  modifiedAt: Date;
}

// Fee Configuration Types
export interface FeeConfig {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  feeType: FeeType;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  feeStructure: string;
  minAmount?: number;
  maxAmount?: number;
  isActive: boolean;
  appliesTo: string[];
  excludedFrom: string[];
  category?: string;
  tags: string[];
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
}

export interface FeeConfigHistory {
  id: string;
  createdAt: Date;
  feeId: string;
  oldAmount?: number;
  newAmount: number;
  oldCurrency?: string;
  newCurrency: string;
  changeReason?: string;
  modifiedBy: string;
  modifiedAt: Date;
}

// API Request/Response Types
export interface CreateSystemConfigRequest {
  key: string;
  name: string;
  description?: string;
  type: ConfigType;
  value: ConfigValue;
  defaultValue?: ConfigValue;
  minValue?: ConfigValue;
  maxValue?: ConfigValue;
  allowedValues?: ConfigValue[];
  validationRule?: string;
  category?: string;
  tags?: string[];
}

export interface UpdateSystemConfigRequest {
  name?: string;
  description?: string;
  value?: ConfigValue;
  status?: ConfigStatus;
  category?: string;
  tags?: string[];
  changeReason?: string;
}

export interface CreateFeeConfigRequest {
  feeType: FeeType;
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  feeStructure?: string;
  minAmount?: number;
  maxAmount?: number;
  appliesTo?: string[];
  excludedFrom?: string[];
  category?: string;
  tags?: string[];
}

export interface UpdateFeeConfigRequest {
  name?: string;
  description?: string;
  amount?: number;
  currency?: string;
  feeStructure?: string;
  minAmount?: number;
  maxAmount?: number;
  isActive?: boolean;
  appliesTo?: string[];
  excludedFrom?: string[];
  category?: string;
  tags?: string[];
  changeReason?: string;
}

// Dashboard Types
export interface SystemConfigStats {
  totalConfigs: number;
  activeConfigs: number;
  inactiveConfigs: number;
  configsByType: Record<ConfigType, number>;
  configsByCategory: Record<string, number>;
}

export interface FeeConfigStats {
  totalFees: number;
  activeFees: number;
  inactiveFees: number;
  feesByType: Record<FeeType, number>;
  feesByCategory: Record<string, number>;
  totalRevenue: number;
}

// Utility Types for backwards compatibility
export interface ConfigValueMap {
  [key: string]: ConfigValue;
}

export interface FeeCalculation {
  baseAmount: number;
  feeAmount: number;
  feePercentage: number;
  totalAmount: number;
  currency: string;
  feeType: FeeType;
  appliedFee: FeeConfig;
}
