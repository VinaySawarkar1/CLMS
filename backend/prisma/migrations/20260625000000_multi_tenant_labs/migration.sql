-- Multi-tenant labs migration
-- Replaces Branch with Lab, adds labId to all tenant-scoped tables,
-- updates Role enum, adds LabRolePermission table.

-- Step 1: Create new enums
CREATE TYPE "LabStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- Step 2: Add new Role values before removing old ones
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LAB_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SERVICE_ENGINEER';

-- Step 3: Migrate any users with roles that will be removed to DATA_ENTRY_OPERATOR
UPDATE "User" SET role = 'DATA_ENTRY_OPERATOR'
WHERE role IN ('LAB_DIRECTOR', 'QUALITY_MANAGER', 'REVIEWER', 'SALES', 'ACCOUNTS', 'STORE_MANAGER', 'CUSTOMER', 'AUDITOR');

-- Step 4: Create Lab table
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accreditationNumber" TEXT,
    "address" TEXT,
    "contactEmail" TEXT,
    "status" "LabStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- Step 5: Migrate existing Branch data to Lab
INSERT INTO "Lab" ("id", "name", "address", "status", "createdAt", "updatedAt")
SELECT "id", "name", COALESCE("address", ''), 'APPROVED', "createdAt", CURRENT_TIMESTAMP
FROM "Branch";

-- If no branches, create a default lab
INSERT INTO "Lab" ("id", "name", "status", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Default Lab', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Lab");

-- Step 6: Add labId column (nullable first for backfill)
ALTER TABLE "User" ADD COLUMN "labId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "labId" TEXT;
ALTER TABLE "Instrument" ADD COLUMN "labId" TEXT;
ALTER TABLE "Job" ADD COLUMN "labId" TEXT;
ALTER TABLE "Task" ADD COLUMN "labId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "labId" TEXT;
ALTER TABLE "EnvironmentalRecord" ADD COLUMN "labId" TEXT;
ALTER TABLE "NCR" ADD COLUMN "labId" TEXT;
ALTER TABLE "MasterInstrument" ADD COLUMN "labId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "labId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "labId" TEXT;

-- Step 7: Backfill labId from branchId for User and Job
UPDATE "User" SET "labId" = "branchId" WHERE "branchId" IS NOT NULL;
UPDATE "Job" SET "labId" = "branchId" WHERE "branchId" IS NOT NULL;

-- Step 8: Backfill remaining rows using first available lab
UPDATE "User" SET "labId" = (SELECT "id" FROM "Lab" LIMIT 1)
WHERE "labId" IS NULL AND role != 'SUPER_ADMIN';

UPDATE "Customer" SET "labId" = (SELECT "id" FROM "Lab" LIMIT 1) WHERE "labId" IS NULL;
UPDATE "Instrument" SET "labId" = (SELECT "id" FROM "Lab" LIMIT 1) WHERE "labId" IS NULL;
UPDATE "Job" SET "labId" = (SELECT "id" FROM "Lab" LIMIT 1) WHERE "labId" IS NULL;
UPDATE "Task" SET "labId" = (SELECT "id" FROM "Lab" LIMIT 1) WHERE "labId" IS NULL;
UPDATE "Invoice" SET "labId" = (SELECT "id" FROM "Lab" LIMIT 1) WHERE "labId" IS NULL;
UPDATE "EnvironmentalRecord" SET "labId" = (SELECT "id" FROM "Lab" LIMIT 1) WHERE "labId" IS NULL;
UPDATE "NCR" SET "labId" = (SELECT "id" FROM "Lab" LIMIT 1) WHERE "labId" IS NULL;
UPDATE "MasterInstrument" SET "labId" = (SELECT "id" FROM "Lab" LIMIT 1) WHERE "labId" IS NULL;

-- Step 9: Make labId NOT NULL on tenant-specific tables (allow null only on AuditLog, Notification, User)
ALTER TABLE "Customer" ALTER COLUMN "labId" SET NOT NULL;
ALTER TABLE "Instrument" ALTER COLUMN "labId" SET NOT NULL;
ALTER TABLE "Job" ALTER COLUMN "labId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "labId" SET NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "labId" SET NOT NULL;
ALTER TABLE "EnvironmentalRecord" ALTER COLUMN "labId" SET NOT NULL;
ALTER TABLE "NCR" ALTER COLUMN "labId" SET NOT NULL;
ALTER TABLE "MasterInstrument" ALTER COLUMN "labId" SET NOT NULL;

-- Step 10: Add foreign key constraints
ALTER TABLE "User" ADD CONSTRAINT "User_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Instrument" ADD CONSTRAINT "Instrument_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EnvironmentalRecord" ADD CONSTRAINT "EnvironmentalRecord_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NCR" ADD CONSTRAINT "NCR_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MasterInstrument" ADD CONSTRAINT "MasterInstrument_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 11: Fix unique constraints
-- Customer: code uniqueness changes to per-lab
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_code_key";
CREATE UNIQUE INDEX "Customer_labId_code_key" ON "Customer"("labId", "code");

-- MasterInstrument: idNumber uniqueness changes to per-lab
ALTER TABLE "MasterInstrument" DROP CONSTRAINT IF EXISTS "MasterInstrument_idNumber_key";
CREATE UNIQUE INDEX "MasterInstrument_labId_idNumber_key" ON "MasterInstrument"("labId", "idNumber");

-- Job: jobNumber uniqueness changes to per-lab
ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS "Job_jobNumber_key";
CREATE UNIQUE INDEX "Job_labId_jobNumber_key" ON "Job"("labId", "jobNumber");

-- NCR: reference uniqueness changes to per-lab
ALTER TABLE "NCR" DROP CONSTRAINT IF EXISTS "NCR_reference_key";
CREATE UNIQUE INDEX "NCR_labId_reference_key" ON "NCR"("labId", "reference");

-- Step 12: Add indexes
CREATE INDEX "User_labId_idx" ON "User"("labId");
CREATE INDEX "Customer_labId_idx" ON "Customer"("labId");
CREATE INDEX "Instrument_labId_idx" ON "Instrument"("labId");
CREATE INDEX "Job_labId_idx" ON "Job"("labId");
CREATE INDEX "Task_labId_idx" ON "Task"("labId");
CREATE INDEX "Invoice_labId_idx" ON "Invoice"("labId");
CREATE INDEX "EnvironmentalRecord_labId_idx" ON "EnvironmentalRecord"("labId");
CREATE INDEX "NCR_labId_idx" ON "NCR"("labId");
CREATE INDEX "MasterInstrument_labId_idx" ON "MasterInstrument"("labId");
CREATE INDEX "AuditLog_labId_idx" ON "AuditLog"("labId");
CREATE INDEX "Notification_labId_idx" ON "Notification"("labId");

-- Step 13: Create LabRolePermission table
CREATE TABLE "LabRolePermission" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "LabRolePermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LabRolePermission_labId_role_permissionKey_key"
    ON "LabRolePermission"("labId", "role", "permissionKey");
CREATE INDEX "LabRolePermission_labId_role_idx" ON "LabRolePermission"("labId", "role");

ALTER TABLE "LabRolePermission" ADD CONSTRAINT "LabRolePermission_labId_fkey"
    FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 14: Remove Branch column from User and Job
ALTER TABLE "User" DROP COLUMN IF EXISTS "branchId";
ALTER TABLE "Job" DROP COLUMN IF EXISTS "branchId";

-- Step 15: Drop old tables
DROP TABLE IF EXISTS "UserPermission";
DROP TABLE IF EXISTS "Permission";
DROP TABLE IF EXISTS "Branch";

-- Step 16: Remove old Role enum values (requires recreating the type in Postgres)
-- We keep the enum values that still exist in our schema; old values are no longer
-- reachable in the data after the UPDATE in Step 3.
-- PostgreSQL does not support DROP VALUE on enums directly.
-- The remaining values in use: SUPER_ADMIN, LAB_ADMIN, TECHNICAL_MANAGER,
-- CALIBRATION_ENGINEER, SERVICE_ENGINEER, DATA_ENTRY_OPERATOR.
-- Old values (LAB_DIRECTOR etc.) are harmless extra enum labels in Postgres.
