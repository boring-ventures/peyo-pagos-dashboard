-- CreateEnum
CREATE TYPE "ConfigType" AS ENUM ('FEE', 'LIMIT', 'FEATURE_FLAG', 'INTEGRATION_SETTING');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('DEVELOPER_FEE', 'CREDIT_CARD_EMISSION_FEE', 'TRANSACTION_FEE', 'WITHDRAWAL_FEE', 'DEPOSIT_FEE');

-- CreateEnum
CREATE TYPE "ConfigStatus" AS ENUM ('active', 'inactive', 'deprecated');

-- AlterEnum
ALTER TYPE "EventModule" ADD VALUE 'SYSTEM_CONFIG';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'SYSTEM_CONFIG_UPDATED';
ALTER TYPE "EventType" ADD VALUE 'SYSTEM_CONFIG_CREATED';
ALTER TYPE "EventType" ADD VALUE 'SYSTEM_CONFIG_DELETED';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "fee_config_id" TEXT,
ADD COLUMN     "system_config_id" TEXT;

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ConfigType" NOT NULL,
    "status" "ConfigStatus" NOT NULL DEFAULT 'active',
    "value" JSONB NOT NULL,
    "defaultValue" JSONB,
    "minValue" JSONB,
    "maxValue" JSONB,
    "allowedValues" JSONB,
    "validationRule" TEXT,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_modified_by" TEXT,
    "last_modified_at" TIMESTAMP(3),

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config_history" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "config_id" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB NOT NULL,
    "change_reason" TEXT,
    "modified_by" TEXT NOT NULL,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_config_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_configs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fee_type" "FeeType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fee_structure" TEXT NOT NULL DEFAULT 'percentage',
    "min_amount" DECIMAL(10,2),
    "max_amount" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "applies_to" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excluded_from" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_modified_by" TEXT,
    "last_modified_at" TIMESTAMP(3),

    CONSTRAINT "fee_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_config_history" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fee_id" TEXT NOT NULL,
    "old_amount" DECIMAL(10,4),
    "new_amount" DECIMAL(10,4) NOT NULL,
    "old_currency" TEXT,
    "new_currency" TEXT NOT NULL,
    "change_reason" TEXT,
    "modified_by" TEXT NOT NULL,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_config_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_key_idx" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_type_idx" ON "system_configs"("type");

-- CreateIndex
CREATE INDEX "system_configs_status_idx" ON "system_configs"("status");

-- CreateIndex
CREATE INDEX "system_configs_category_idx" ON "system_configs"("category");

-- CreateIndex
CREATE INDEX "system_config_history_config_id_idx" ON "system_config_history"("config_id");

-- CreateIndex
CREATE INDEX "system_config_history_modified_at_idx" ON "system_config_history"("modified_at");

-- CreateIndex
CREATE INDEX "fee_configs_fee_type_idx" ON "fee_configs"("fee_type");

-- CreateIndex
CREATE INDEX "fee_configs_is_active_idx" ON "fee_configs"("is_active");

-- CreateIndex
CREATE INDEX "fee_configs_category_idx" ON "fee_configs"("category");

-- CreateIndex
CREATE INDEX "fee_config_history_fee_id_idx" ON "fee_config_history"("fee_id");

-- CreateIndex
CREATE INDEX "fee_config_history_modified_at_idx" ON "fee_config_history"("modified_at");

-- CreateIndex
CREATE INDEX "events_system_config_id_idx" ON "events"("system_config_id");

-- CreateIndex
CREATE INDEX "events_fee_config_id_idx" ON "events"("fee_config_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_system_config_id_fkey" FOREIGN KEY ("system_config_id") REFERENCES "system_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_fee_config_id_fkey" FOREIGN KEY ("fee_config_id") REFERENCES "fee_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_config_history" ADD CONSTRAINT "system_config_history_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "system_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_config_history" ADD CONSTRAINT "fee_config_history_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "fee_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
