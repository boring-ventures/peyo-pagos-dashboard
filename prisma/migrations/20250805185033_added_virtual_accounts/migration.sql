-- CreateEnum
CREATE TYPE "VirtualAccountStatus" AS ENUM ('active', 'inactive', 'suspended', 'closed');

-- CreateEnum
CREATE TYPE "VirtualAccountType" AS ENUM ('iban', 'account_number', 'routing_number');

-- CreateEnum
CREATE TYPE "VirtualAccountActivityType" AS ENUM ('credit', 'debit', 'fee', 'adjustment', 'reversal');

-- CreateEnum
CREATE TYPE "VirtualAccountActivityStatus" AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "virtual_accounts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bridge_virtual_account_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "account_type" "VirtualAccountType" NOT NULL DEFAULT 'iban',
    "account_number" TEXT NOT NULL,
    "routing_number" TEXT,
    "bank_name" TEXT NOT NULL,
    "bank_code" TEXT,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "VirtualAccountStatus" NOT NULL DEFAULT 'active',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "current_balance" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "available_balance" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "pending_balance" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "bridge_created_at" TIMESTAMP(3) NOT NULL,
    "bridge_updated_at" TIMESTAMP(3) NOT NULL,
    "last_activity_at" TIMESTAMP(3),
    "bridge_raw_data" JSONB,

    CONSTRAINT "virtual_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_account_activities" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bridge_activity_id" TEXT NOT NULL,
    "virtual_account_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "type" "VirtualAccountActivityType" NOT NULL,
    "status" "VirtualAccountActivityStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fee" DECIMAL(20,8),
    "description" TEXT,
    "reference" TEXT,
    "memo" TEXT,
    "source_account" TEXT,
    "destination_account" TEXT,
    "source_name" TEXT,
    "destination_name" TEXT,
    "balance_before" DECIMAL(20,8) NOT NULL,
    "balance_after" DECIMAL(20,8) NOT NULL,
    "available_balance_before" DECIMAL(20,8) NOT NULL,
    "available_balance_after" DECIMAL(20,8) NOT NULL,
    "bridge_created_at" TIMESTAMP(3) NOT NULL,
    "bridge_updated_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "error_code" TEXT,
    "error_message" TEXT,
    "bridge_raw_data" JSONB,

    CONSTRAINT "virtual_account_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "virtual_accounts_bridge_virtual_account_id_key" ON "virtual_accounts"("bridge_virtual_account_id");

-- CreateIndex
CREATE INDEX "virtual_accounts_profile_id_idx" ON "virtual_accounts"("profile_id");

-- CreateIndex
CREATE INDEX "virtual_accounts_customer_id_idx" ON "virtual_accounts"("customer_id");

-- CreateIndex
CREATE INDEX "virtual_accounts_bridge_virtual_account_id_idx" ON "virtual_accounts"("bridge_virtual_account_id");

-- CreateIndex
CREATE INDEX "virtual_accounts_account_number_idx" ON "virtual_accounts"("account_number");

-- CreateIndex
CREATE INDEX "virtual_accounts_status_idx" ON "virtual_accounts"("status");

-- CreateIndex
CREATE INDEX "virtual_accounts_is_active_idx" ON "virtual_accounts"("is_active");

-- CreateIndex
CREATE INDEX "virtual_accounts_country_idx" ON "virtual_accounts"("country");

-- CreateIndex
CREATE INDEX "virtual_accounts_currency_idx" ON "virtual_accounts"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_account_activities_bridge_activity_id_key" ON "virtual_account_activities"("bridge_activity_id");

-- CreateIndex
CREATE INDEX "virtual_account_activities_virtual_account_id_idx" ON "virtual_account_activities"("virtual_account_id");

-- CreateIndex
CREATE INDEX "virtual_account_activities_customer_id_idx" ON "virtual_account_activities"("customer_id");

-- CreateIndex
CREATE INDEX "virtual_account_activities_bridge_activity_id_idx" ON "virtual_account_activities"("bridge_activity_id");

-- CreateIndex
CREATE INDEX "virtual_account_activities_type_idx" ON "virtual_account_activities"("type");

-- CreateIndex
CREATE INDEX "virtual_account_activities_status_idx" ON "virtual_account_activities"("status");

-- CreateIndex
CREATE INDEX "virtual_account_activities_bridge_created_at_idx" ON "virtual_account_activities"("bridge_created_at");

-- CreateIndex
CREATE INDEX "virtual_account_activities_processed_at_idx" ON "virtual_account_activities"("processed_at");

-- AddForeignKey
ALTER TABLE "virtual_accounts" ADD CONSTRAINT "virtual_accounts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_account_activities" ADD CONSTRAINT "virtual_account_activities_virtual_account_id_fkey" FOREIGN KEY ("virtual_account_id") REFERENCES "virtual_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
