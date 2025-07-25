-- AlterTable
ALTER TABLE "liquidation_addresses" ADD COLUMN     "wallet_id" TEXT;

-- AddForeignKey
ALTER TABLE "liquidation_addresses" ADD CONSTRAINT "liquidation_addresses_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
