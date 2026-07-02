-- Create PlanTier enum
CREATE TYPE "PlanTier" AS ENUM ('STARTER', 'GROWTH', 'BUSINESS', 'ENTERPRISE');

-- Add plan fields to Lab
ALTER TABLE "Lab" ADD COLUMN "plan" "PlanTier" NOT NULL DEFAULT 'STARTER';
ALTER TABLE "Lab" ADD COLUMN "planExpiresAt" TIMESTAMP(3);
ALTER TABLE "Lab" ADD COLUMN "maxUsers" INTEGER NOT NULL DEFAULT 25;

-- Add account lockout fields to User
ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockedUntil" TIMESTAMP(3);
