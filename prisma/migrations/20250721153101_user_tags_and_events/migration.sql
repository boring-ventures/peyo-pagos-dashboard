-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('USER_SIGNED_UP', 'USER_SUBMITTED_KYC', 'USER_KYC_UNDER_VERIFICATION', 'USER_KYC_APPROVED', 'USER_KYC_REJECTED');

-- CreateEnum
CREATE TYPE "EventModule" AS ENUM ('AUTH', 'KYC', 'PROFILE');

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "EventType" NOT NULL,
    "module" "EventModule" NOT NULL,
    "description" TEXT,
    "profile_id" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_profile_id_idx" ON "events"("profile_id");

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE INDEX "events_module_idx" ON "events"("module");

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "events"("createdAt");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
