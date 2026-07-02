-- Multi-instrument intake grouping (Module 2.1)
CREATE TABLE "JobBatch" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "challanNo" TEXT,
    "poNumber" TEXT,
    "remarks" TEXT,
    "isOnsite" BOOLEAN NOT NULL DEFAULT false,
    "siteAddress" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobBatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobBatch_labId_batchNumber_key" ON "JobBatch"("labId", "batchNumber");
CREATE INDEX "JobBatch_labId_idx" ON "JobBatch"("labId");
CREATE INDEX "JobBatch_customerId_idx" ON "JobBatch"("customerId");

ALTER TABLE "JobBatch" ADD CONSTRAINT "JobBatch_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Link jobs to their batch
ALTER TABLE "Job" ADD COLUMN "batchId" TEXT;
CREATE INDEX "Job_batchId_idx" ON "Job"("batchId");
ALTER TABLE "Job" ADD CONSTRAINT "Job_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "JobBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
