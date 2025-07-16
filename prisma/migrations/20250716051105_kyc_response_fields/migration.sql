-- CreateEnum
CREATE TYPE "CapabilityStatus" AS ENUM ('pending', 'active', 'inactive', 'rejected');

-- CreateEnum
CREATE TYPE "EndorsementStatus" AS ENUM ('incomplete', 'approved', 'revoked');

-- AlterTable
ALTER TABLE "kyc_profiles" ADD COLUMN     "future_requirements_due" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "has_accepted_terms_of_service" BOOLEAN DEFAULT false,
ADD COLUMN     "payin_crypto" "CapabilityStatus" DEFAULT 'pending',
ADD COLUMN     "payin_fiat" "CapabilityStatus" DEFAULT 'pending',
ADD COLUMN     "payout_crypto" "CapabilityStatus" DEFAULT 'pending',
ADD COLUMN     "payout_fiat" "CapabilityStatus" DEFAULT 'pending',
ADD COLUMN     "requirements_due" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "rejection_reasons" (
    "id" TEXT NOT NULL,
    "kyc_profile_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "developer_reason" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "bridge_created_at" TIMESTAMP(3),

    CONSTRAINT "rejection_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rejection_reasons_kyc_profile_id_idx" ON "rejection_reasons"("kyc_profile_id");

-- AddForeignKey
ALTER TABLE "rejection_reasons" ADD CONSTRAINT "rejection_reasons_kyc_profile_id_fkey" FOREIGN KEY ("kyc_profile_id") REFERENCES "kyc_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
