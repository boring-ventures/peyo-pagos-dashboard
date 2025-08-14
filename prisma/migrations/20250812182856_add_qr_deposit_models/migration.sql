-- CreateEnum
CREATE TYPE "QrDepositStatus" AS ENUM ('PENDING', 'PAID_UNCONFIRMED', 'TRANSFERRING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QrPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'CLEANUP');

-- CreateTable
CREATE TABLE "deposit_qr_requests" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "bridge_customer_id" TEXT NOT NULL,
    "target_wallet_id" TEXT NOT NULL,
    "qr_reference_id" TEXT NOT NULL,
    "amount_bs" DECIMAL(12,2) NOT NULL,
    "amount_usd" DECIMAL(12,6) NOT NULL,
    "exchange_rate" DECIMAL(10,4) NOT NULL,
    "status" "QrDepositStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "QrPriority" NOT NULL DEFAULT 'HIGH',
    "verification_count" INTEGER NOT NULL DEFAULT 0,
    "last_verified_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "deposit_qr_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_generated" INTEGER NOT NULL DEFAULT 0,
    "total_paid" INTEGER NOT NULL DEFAULT 0,
    "avg_payment_time_min" INTEGER,
    "success_rate" DECIMAL(5,4),
    "api_calls_count" INTEGER NOT NULL DEFAULT 0,
    "avg_response_time_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deposit_qr_requests_qr_reference_id_key" ON "deposit_qr_requests"("qr_reference_id");

-- CreateIndex
CREATE INDEX "deposit_qr_requests_status_priority_last_verified_at_idx" ON "deposit_qr_requests"("status", "priority", "last_verified_at");

-- CreateIndex
CREATE INDEX "deposit_qr_requests_profile_id_status_idx" ON "deposit_qr_requests"("profile_id", "status");

-- CreateIndex
CREATE INDEX "deposit_qr_requests_qr_reference_id_idx" ON "deposit_qr_requests"("qr_reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "qr_analytics_date_key" ON "qr_analytics"("date");

-- AddForeignKey
ALTER TABLE "deposit_qr_requests" ADD CONSTRAINT "deposit_qr_requests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_qr_requests" ADD CONSTRAINT "deposit_qr_requests_target_wallet_id_fkey" FOREIGN KEY ("target_wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
