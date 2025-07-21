/*
  Warnings:

  - A unique constraint covering the columns `[user_tag]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "user_tag" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_tag_key" ON "profiles"("user_tag");
