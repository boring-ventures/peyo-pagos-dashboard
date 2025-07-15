-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('active', 'awaiting_questionnaire', 'awaiting_ubo', 'incomplete', 'not_started', 'offboarded', 'paused', 'rejected', 'under_review');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('drivers_license', 'matriculate_id', 'military_id', 'national_id', 'passport', 'permanent_residency_id', 'state_or_provisional_id', 'visa');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "document_type" "DocumentType",
ADD COLUMN     "id_back_image_url" TEXT,
ADD COLUMN     "id_front_image_url" TEXT,
ADD COLUMN     "issuing_country" TEXT,
ADD COLUMN     "kyc_approved_at" TIMESTAMP(3),
ADD COLUMN     "kyc_rejected_at" TIMESTAMP(3),
ADD COLUMN     "kyc_rejection_reason" TEXT,
ADD COLUMN     "kyc_status" "KYCStatus" NOT NULL DEFAULT 'not_started',
ADD COLUMN     "kyc_submitted_at" TIMESTAMP(3),
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "selfie_image_url" TEXT;

-- CreateIndex
CREATE INDEX "profiles_kyc_status_idx" ON "profiles"("kyc_status");
