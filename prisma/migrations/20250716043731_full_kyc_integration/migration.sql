/*
  Warnings:

  - You are about to drop the column `active` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `date_of_birth` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `document_type` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `id_back_image_url` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `id_front_image_url` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `issuing_country` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `kyc_approved_at` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `kyc_rejected_at` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `kyc_rejection_reason` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `kyc_status` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `kyc_submitted_at` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `postal_code` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `selfie_image_url` on the `profiles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('individual', 'business');

-- CreateEnum
CREATE TYPE "ExpectedMonthlyPaymentsUSD" AS ENUM ('zero_4999', 'five_thousand_9999', 'ten_thousand_49999', 'fifty_thousand_plus');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('employed', 'homemaker', 'retired', 'self_employed', 'student', 'unemployed');

-- CreateEnum
CREATE TYPE "AccountPurpose" AS ENUM ('charitable_donations', 'ecommerce_retail_payments', 'investment_purposes', 'operating_a_company', 'other', 'payments_to_friends_or_family_abroad', 'personal_or_living_expenses', 'protect_wealth', 'purchase_goods_and_services', 'receive_payment_for_freelancing', 'receive_salary');

-- CreateEnum
CREATE TYPE "SourceOfFunds" AS ENUM ('salary', 'business_income', 'investment_returns', 'inheritance', 'government_benefits', 'loans', 'other');

-- CreateEnum
CREATE TYPE "DocumentPurpose" AS ENUM ('proof_of_account_purpose', 'proof_of_address', 'proof_of_individual_name_change', 'proof_of_relationship', 'proof_of_source_of_funds', 'proof_of_source_of_wealth', 'proof_of_tax_identification', 'other');

-- CreateEnum
CREATE TYPE "EndorsementType" AS ENUM ('base', 'sepa', 'spei');

-- DropIndex
DROP INDEX "profiles_kyc_status_idx";

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "active",
DROP COLUMN "address",
DROP COLUMN "city",
DROP COLUMN "date_of_birth",
DROP COLUMN "document_type",
DROP COLUMN "first_name",
DROP COLUMN "id_back_image_url",
DROP COLUMN "id_front_image_url",
DROP COLUMN "issuing_country",
DROP COLUMN "kyc_approved_at",
DROP COLUMN "kyc_rejected_at",
DROP COLUMN "kyc_rejection_reason",
DROP COLUMN "kyc_status",
DROP COLUMN "kyc_submitted_at",
DROP COLUMN "last_name",
DROP COLUMN "postal_code",
DROP COLUMN "province",
DROP COLUMN "selfie_image_url";

-- CreateTable
CREATE TABLE "kyc_profiles" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "bridge_customer_id" TEXT,
    "customer_type" "CustomerType" NOT NULL DEFAULT 'individual',
    "first_name" TEXT,
    "middle_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "birth_date" TIMESTAMP(3),
    "nationality" TEXT,
    "kyc_status" "KYCStatus" NOT NULL DEFAULT 'not_started',
    "kyc_submitted_at" TIMESTAMP(3),
    "kyc_approved_at" TIMESTAMP(3),
    "kyc_rejected_at" TIMESTAMP(3),
    "kyc_rejection_reason" TEXT,
    "signed_agreement_id" TEXT,
    "verified_selfie_at" TIMESTAMP(3),
    "completed_customer_safety_check_at" TIMESTAMP(3),
    "account_purpose" "AccountPurpose",
    "account_purpose_other" TEXT,
    "employment_status" "EmploymentStatus",
    "expected_monthly_payments_usd" "ExpectedMonthlyPaymentsUSD",
    "most_recent_occupation" TEXT,

    CONSTRAINT "kyc_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "kyc_profile_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "street_line_1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "street_line_2" TEXT,
    "subdivision" TEXT,
    "postal_code" TEXT,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "kyc_profile_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "purposes" "DocumentPurpose"[],
    "file_url" TEXT,
    "file_size" INTEGER,
    "description" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identifying_information" (
    "id" TEXT NOT NULL,
    "kyc_profile_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "issuing_country" TEXT NOT NULL,
    "number" TEXT,
    "description" TEXT,
    "expiration" TIMESTAMP(3),
    "image_front" TEXT,
    "image_back" TEXT,

    CONSTRAINT "identifying_information_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kyc_profiles_profile_id_key" ON "kyc_profiles"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_profiles_bridge_customer_id_key" ON "kyc_profiles"("bridge_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_profiles_email_key" ON "kyc_profiles"("email");

-- CreateIndex
CREATE INDEX "kyc_profiles_kyc_status_idx" ON "kyc_profiles"("kyc_status");

-- CreateIndex
CREATE INDEX "kyc_profiles_bridge_customer_id_idx" ON "kyc_profiles"("bridge_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_kyc_profile_id_key" ON "addresses"("kyc_profile_id");

-- CreateIndex
CREATE INDEX "documents_kyc_profile_id_idx" ON "documents"("kyc_profile_id");

-- CreateIndex
CREATE INDEX "identifying_information_kyc_profile_id_idx" ON "identifying_information"("kyc_profile_id");

-- CreateIndex
CREATE INDEX "identifying_information_document_type_idx" ON "identifying_information"("document_type");

-- AddForeignKey
ALTER TABLE "kyc_profiles" ADD CONSTRAINT "kyc_profiles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_kyc_profile_id_fkey" FOREIGN KEY ("kyc_profile_id") REFERENCES "kyc_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_kyc_profile_id_fkey" FOREIGN KEY ("kyc_profile_id") REFERENCES "kyc_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identifying_information" ADD CONSTRAINT "identifying_information_kyc_profile_id_fkey" FOREIGN KEY ("kyc_profile_id") REFERENCES "kyc_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
