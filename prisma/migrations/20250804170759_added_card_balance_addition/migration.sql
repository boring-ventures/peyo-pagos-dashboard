-- CreateEnum
CREATE TYPE "BalanceAdditionStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "BalanceAdditionSource" AS ENUM ('crypto_deposit', 'bank_transfer', 'card_top_up', 'refund', 'adjustment', 'bonus', 'other');

-- CreateEnum
CREATE TYPE "BalanceAdditionMethod" AS ENUM ('automatic', 'manual', 'api', 'dashboard');

-- CreateTable
CREATE TABLE "card_balance_additions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "card_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "source" "BalanceAdditionSource" NOT NULL,
    "method" "BalanceAdditionMethod" NOT NULL DEFAULT 'automatic',
    "status" "BalanceAdditionStatus" NOT NULL DEFAULT 'pending',
    "processed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "fee_amount" DECIMAL(10,2),
    "fee_currency" TEXT DEFAULT 'USD',
    "net_amount" DECIMAL(10,2) NOT NULL,
    "source_transaction_id" TEXT,
    "source_wallet_address" TEXT,
    "source_chain" TEXT,
    "source_currency" TEXT,
    "bank_account_number" TEXT,
    "bank_name" TEXT,
    "moon_transaction_id" TEXT,
    "moon_response" JSONB,
    "balance_before" DECIMAL(10,2) NOT NULL,
    "balance_after" DECIMAL(10,2) NOT NULL,
    "available_balance_before" DECIMAL(10,2) NOT NULL,
    "available_balance_after" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "error_code" TEXT,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "initiated_by" TEXT,
    "approved_by" TEXT,

    CONSTRAINT "card_balance_additions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_balance_additions_card_id_idx" ON "card_balance_additions"("card_id");

-- CreateIndex
CREATE INDEX "card_balance_additions_profile_id_idx" ON "card_balance_additions"("profile_id");

-- CreateIndex
CREATE INDEX "card_balance_additions_status_idx" ON "card_balance_additions"("status");

-- CreateIndex
CREATE INDEX "card_balance_additions_source_idx" ON "card_balance_additions"("source");

-- CreateIndex
CREATE INDEX "card_balance_additions_createdAt_idx" ON "card_balance_additions"("createdAt");

-- CreateIndex
CREATE INDEX "card_balance_additions_processed_at_idx" ON "card_balance_additions"("processed_at");

-- CreateIndex
CREATE INDEX "card_balance_additions_source_transaction_id_idx" ON "card_balance_additions"("source_transaction_id");

-- CreateIndex
CREATE INDEX "card_balance_additions_moon_transaction_id_idx" ON "card_balance_additions"("moon_transaction_id");

-- AddForeignKey
ALTER TABLE "card_balance_additions" ADD CONSTRAINT "card_balance_additions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_balance_additions" ADD CONSTRAINT "card_balance_additions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
