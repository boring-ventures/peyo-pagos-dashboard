-- CreateTable
CREATE TABLE "liquidation_addresses" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bridge_liquidation_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "destination_payment_rail" TEXT NOT NULL,
    "destination_currency" TEXT NOT NULL,
    "destination_address" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'active',
    "bridge_created_at" TIMESTAMP(3) NOT NULL,
    "bridge_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidation_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "liquidation_addresses_bridge_liquidation_id_key" ON "liquidation_addresses"("bridge_liquidation_id");

-- CreateIndex
CREATE INDEX "liquidation_addresses_profile_id_idx" ON "liquidation_addresses"("profile_id");

-- CreateIndex
CREATE INDEX "liquidation_addresses_customer_id_idx" ON "liquidation_addresses"("customer_id");

-- CreateIndex
CREATE INDEX "liquidation_addresses_bridge_liquidation_id_idx" ON "liquidation_addresses"("bridge_liquidation_id");

-- CreateIndex
CREATE INDEX "liquidation_addresses_chain_idx" ON "liquidation_addresses"("chain");

-- CreateIndex
CREATE INDEX "liquidation_addresses_state_idx" ON "liquidation_addresses"("state");

-- AddForeignKey
ALTER TABLE "liquidation_addresses" ADD CONSTRAINT "liquidation_addresses_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
