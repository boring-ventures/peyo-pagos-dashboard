/*
  Warnings:

  - You are about to drop the column `birth_date` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `nationality` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `kyc_profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "kyc_profiles" ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "bridge_verification_status" TEXT DEFAULT 'not_started',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "birth_date",
DROP COLUMN "nationality",
DROP COLUMN "phone";

-- CreateIndex
CREATE UNIQUE INDEX "kyc_profiles_email_key" ON "kyc_profiles"("email");

-- CreateIndex
CREATE INDEX "kyc_profiles_bridge_verification_status_idx" ON "kyc_profiles"("bridge_verification_status");

-- CreateIndex
CREATE INDEX "profiles_role_idx" ON "profiles"("role");
