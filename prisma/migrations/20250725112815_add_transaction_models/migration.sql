-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bridge_transaction_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "developer_fee" TEXT,
    "customer_id" TEXT NOT NULL,
    "source_payment_rail" TEXT,
    "source_currency" TEXT,
    "destination_payment_rail" TEXT,
    "destination_currency" TEXT,
    "bridge_created_at" TIMESTAMP(3) NOT NULL,
    "bridge_updated_at" TIMESTAMP(3) NOT NULL,
    "bridge_raw_data" JSONB,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_syncs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3) NOT NULL,
    "last_sync_transaction_count" INTEGER NOT NULL DEFAULT 0,
    "new_transactions_found" INTEGER NOT NULL DEFAULT 0,
    "sync_status" TEXT NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "last_processed_bridge_created_at" TIMESTAMP(3),

    CONSTRAINT "transaction_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_bridge_transaction_id_key" ON "transactions"("bridge_transaction_id");

-- CreateIndex
CREATE INDEX "transactions_wallet_id_idx" ON "transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "transactions_bridge_transaction_id_idx" ON "transactions"("bridge_transaction_id");

-- CreateIndex
CREATE INDEX "transactions_customer_id_idx" ON "transactions"("customer_id");

-- CreateIndex
CREATE INDEX "transactions_bridge_created_at_idx" ON "transactions"("bridge_created_at");

-- CreateIndex
CREATE INDEX "transaction_syncs_wallet_id_idx" ON "transaction_syncs"("wallet_id");

-- CreateIndex
CREATE INDEX "transaction_syncs_last_sync_at_idx" ON "transaction_syncs"("last_sync_at");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
