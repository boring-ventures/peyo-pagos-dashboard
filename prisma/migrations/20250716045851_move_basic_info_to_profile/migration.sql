/*
  Warnings:

  - You are about to drop the column `active` on the `kyc_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `birth_date` on the `kyc_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `kyc_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `kyc_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `kyc_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `nationality` on the `kyc_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `kyc_profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled', 'deleted');

-- DropIndex
DROP INDEX "kyc_profiles_email_key";

-- AlterTable
ALTER TABLE "kyc_profiles" DROP COLUMN "active",
DROP COLUMN "birth_date",
DROP COLUMN "email",
DROP COLUMN "first_name",
DROP COLUMN "last_name",
DROP COLUMN "nationality",
DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_status_idx" ON "profiles"("status");

-- CreateIndex
CREATE INDEX "profiles_email_idx" ON "profiles"("email");
