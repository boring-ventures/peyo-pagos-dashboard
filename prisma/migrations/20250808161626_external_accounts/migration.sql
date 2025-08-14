-- CreateEnum
CREATE TYPE "ExternalAccountType" AS ENUM ('us', 'iban', 'swift');

-- CreateEnum
CREATE TYPE "CheckingOrSavings" AS ENUM ('checking', 'savings');

-- CreateTable
CREATE TABLE "external_accounts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profile_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "bridge_external_account_id" TEXT NOT NULL,
    "account_type" "ExternalAccountType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "bank_name" TEXT,
    "account_owner_name" TEXT,
    "account_owner_type" "CustomerType",
    "first_name" TEXT,
    "last_name" TEXT,
    "business_name" TEXT,
    "last_4" TEXT,
    "routing_number" TEXT,
    "checking_or_savings" "CheckingOrSavings",
    "iban" TEXT,
    "bic" TEXT,
    "iban_country" TEXT,
    "swift_account_number" TEXT,
    "swift_bic" TEXT,
    "swift_country" TEXT,
    "street_line_1" TEXT,
    "street_line_2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "beneficiary_address_valid" BOOLEAN DEFAULT false,
    "bridge_created_at" TIMESTAMP(3),
    "bridge_updated_at" TIMESTAMP(3),
    "bridge_raw_data" JSONB,

    CONSTRAINT "external_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_accounts_bridge_external_account_id_key" ON "external_accounts"("bridge_external_account_id");

-- CreateIndex
CREATE INDEX "external_accounts_profile_id_idx" ON "external_accounts"("profile_id");

-- CreateIndex
CREATE INDEX "external_accounts_customer_id_idx" ON "external_accounts"("customer_id");

-- CreateIndex
CREATE INDEX "external_accounts_bridge_external_account_id_idx" ON "external_accounts"("bridge_external_account_id");

-- CreateIndex
CREATE INDEX "external_accounts_account_type_idx" ON "external_accounts"("account_type");

-- CreateIndex
CREATE INDEX "external_accounts_active_idx" ON "external_accounts"("active");

-- AddForeignKey
ALTER TABLE "external_accounts" ADD CONSTRAINT "external_accounts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
