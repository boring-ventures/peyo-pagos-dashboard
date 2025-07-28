import { ConfigType, ConfigStatus, FeeType } from "@prisma/client";

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
  value: any;
  defaultValue?: any;
  minValue?: any;
  maxValue?: any;
  allowedValues?: any;
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
  oldValue?: any;
  newValue: any;
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
  value: any;
  defaultValue?: any;
  minValue?: any;
  maxValue?: any;
  allowedValues?: any;
  validationRule?: string;
  category?: string;
  tags?: string[];
}

export interface UpdateSystemConfigRequest {
  name?: string;
  description?: string;
  value?: any;
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

// Utility Types
export interface ConfigValue {
  [key: string]: any;
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
