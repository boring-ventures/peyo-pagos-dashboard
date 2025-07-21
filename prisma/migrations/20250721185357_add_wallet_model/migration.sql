-- CreateEnum
CREATE TYPE "WalletChain" AS ENUM ('solana', 'base');

-- CreateEnum
CREATE TYPE "WalletTag" AS ENUM ('general_use', 'p2p');

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profile_id" TEXT NOT NULL,
    "wallet_tag" "WalletTag" NOT NULL DEFAULT 'general_use',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "bridge_wallet_id" TEXT NOT NULL,
    "chain" "WalletChain" NOT NULL,
    "address" TEXT NOT NULL,
    "bridge_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bridge_created_at" TIMESTAMP(3),
    "bridge_updated_at" TIMESTAMP(3),

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_bridge_wallet_id_key" ON "wallets"("bridge_wallet_id");

-- CreateIndex
CREATE INDEX "wallets_profile_id_idx" ON "wallets"("profile_id");

-- CreateIndex
CREATE INDEX "wallets_bridge_wallet_id_idx" ON "wallets"("bridge_wallet_id");

-- CreateIndex
CREATE INDEX "wallets_address_idx" ON "wallets"("address");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
