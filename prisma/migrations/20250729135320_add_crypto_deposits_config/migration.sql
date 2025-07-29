-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "crypto_deposit_configs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chain_id" TEXT NOT NULL,
    "chain_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "deposit_instructions" TEXT NOT NULL,
    "minimum_amount" DECIMAL(20,8),
    "maximum_amount" DECIMAL(20,8),
    "network_fee" DECIMAL(20,8),
    "processing_time" TEXT NOT NULL,
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'low',
    "icon_url" TEXT,
    "explorer_url" TEXT,
    "supported_tokens" JSONB NOT NULL DEFAULT '[]',
    "last_modified_by" TEXT,
    "last_modified_at" TIMESTAMP(3),

    CONSTRAINT "crypto_deposit_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crypto_deposit_history" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "config_id" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB NOT NULL,
    "change_reason" TEXT,
    "modified_by" TEXT NOT NULL,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crypto_deposit_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crypto_deposit_configs_chain_id_key" ON "crypto_deposit_configs"("chain_id");

-- CreateIndex
CREATE INDEX "crypto_deposit_configs_chain_id_idx" ON "crypto_deposit_configs"("chain_id");

-- CreateIndex
CREATE INDEX "crypto_deposit_configs_is_enabled_idx" ON "crypto_deposit_configs"("is_enabled");

-- CreateIndex
CREATE INDEX "crypto_deposit_configs_risk_level_idx" ON "crypto_deposit_configs"("risk_level");

-- CreateIndex
CREATE INDEX "crypto_deposit_history_config_id_idx" ON "crypto_deposit_history"("config_id");

-- CreateIndex
CREATE INDEX "crypto_deposit_history_modified_at_idx" ON "crypto_deposit_history"("modified_at");

-- CreateIndex
CREATE INDEX "crypto_deposit_history_change_type_idx" ON "crypto_deposit_history"("change_type");

-- AddForeignKey
ALTER TABLE "crypto_deposit_history" ADD CONSTRAINT "crypto_deposit_history_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "crypto_deposit_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
