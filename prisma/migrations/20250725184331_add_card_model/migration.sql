-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'USER_CARD_CREATED';

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profile_id" TEXT NOT NULL,
    "moon_card_id" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL,
    "available_balance" DECIMAL(10,2) NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "display_expiration" TEXT NOT NULL,
    "card_product_id" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "cvv" TEXT NOT NULL,
    "support_token" TEXT NOT NULL,
    "terminated" BOOLEAN NOT NULL DEFAULT false,
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cards_moon_card_id_key" ON "cards"("moon_card_id");

-- CreateIndex
CREATE INDEX "cards_profile_id_idx" ON "cards"("profile_id");

-- CreateIndex
CREATE INDEX "cards_moon_card_id_idx" ON "cards"("moon_card_id");

-- CreateIndex
CREATE INDEX "cards_terminated_idx" ON "cards"("terminated");

-- CreateIndex
CREATE INDEX "cards_frozen_idx" ON "cards"("frozen");

-- CreateIndex
CREATE INDEX "cards_is_active_idx" ON "cards"("is_active");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
