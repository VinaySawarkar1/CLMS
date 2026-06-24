-- Calibration features: reference standards, instrument due dates, onsite jobs, quotations

-- Quotation status enum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED');

-- Instrument: calibration interval & recall tracking
ALTER TABLE "Instrument" ADD COLUMN "calibrationIntervalMonths" INTEGER;
ALTER TABLE "Instrument" ADD COLUMN "lastCalibrationDate" TIMESTAMP(3);
ALTER TABLE "Instrument" ADD COLUMN "nextDueDate" TIMESTAMP(3);

-- MasterInstrument (reference standards): traceability detail
ALTER TABLE "MasterInstrument" ADD COLUMN "certificateNumber" TEXT;
ALTER TABLE "MasterInstrument" ADD COLUMN "uncertainty" TEXT;
ALTER TABLE "MasterInstrument" ADD COLUMN "calibratedDate" TIMESTAMP(3);

-- Job: onsite calibration
ALTER TABLE "Job" ADD COLUMN "isOnsite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Job" ADD COLUMN "siteAddress" TEXT;
ALTER TABLE "Job" ADD COLUMN "siteContact" TEXT;
ALTER TABLE "Job" ADD COLUMN "visitDate" TIMESTAMP(3);

-- Quotation
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "items" JSONB NOT NULL DEFAULT '[]',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Quotation_labId_idx" ON "Quotation"("labId");
CREATE UNIQUE INDEX "Quotation_labId_quoteNumber_key" ON "Quotation"("labId", "quoteNumber");

ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Certificate fields on Job
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "challanNo" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "poNumber" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "conditionOfItem" TEXT DEFAULT 'OK (As Received)';
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "calibrationProcedureNo" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "referenceDocumentNo" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "calibrationProcedure" TEXT;

-- Lab ID No. and quantity on Instrument
ALTER TABLE "Instrument" ADD COLUMN IF NOT EXISTS "labIdNo" TEXT;
ALTER TABLE "Instrument" ADD COLUMN IF NOT EXISTS "quantity" INTEGER;
