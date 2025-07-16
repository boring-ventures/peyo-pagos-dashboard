/*
  Warnings:

  - You are about to drop the column `bridge_verification_status` on the `kyc_profiles` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "kyc_profiles_bridge_verification_status_idx";

-- AlterTable
ALTER TABLE "kyc_profiles" DROP COLUMN "bridge_verification_status";
