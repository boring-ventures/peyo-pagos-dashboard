-- CreateTable
CREATE TABLE "endorsements" (
    "id" TEXT NOT NULL,
    "kyc_profile_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endorsement_type" "EndorsementType" NOT NULL,
    "status" "EndorsementStatus" NOT NULL DEFAULT 'incomplete',
    "requirements" JSONB,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "endorsements_kyc_profile_id_idx" ON "endorsements"("kyc_profile_id");

-- CreateIndex
CREATE INDEX "endorsements_endorsement_type_idx" ON "endorsements"("endorsement_type");

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_kyc_profile_id_fkey" FOREIGN KEY ("kyc_profile_id") REFERENCES "kyc_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
