-- Certificate detail fields (NABL format) — separate migration so it applies
-- cleanly on databases that already have 20260625120000 recorded as applied.

-- Job: administrative & procedure fields for the certificate
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "challanNo" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "poNumber" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "conditionOfItem" TEXT DEFAULT 'OK (As Received)';
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "calibrationProcedureNo" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "referenceDocumentNo" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "calibrationProcedure" TEXT;

-- Instrument: internal lab ID number and quantity (for sets)
ALTER TABLE "Instrument" ADD COLUMN IF NOT EXISTS "labIdNo" TEXT;
ALTER TABLE "Instrument" ADD COLUMN IF NOT EXISTS "quantity" INTEGER;
