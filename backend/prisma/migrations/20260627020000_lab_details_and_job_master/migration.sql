-- Add extended lab detail fields
ALTER TABLE "Lab" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Lab" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "Lab" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Lab" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "Lab" ADD COLUMN IF NOT EXISTS "pinCode" TEXT;
ALTER TABLE "Lab" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;

-- Add master instrument reference to Job (selected at job creation)
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "masterInstrumentId" TEXT;
ALTER TABLE "Job" ADD CONSTRAINT "Job_masterInstrumentId_fkey"
  FOREIGN KEY ("masterInstrumentId") REFERENCES "MasterInstrument"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
