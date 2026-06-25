-- Add locked calibration procedure fields to Job
-- These are set at job creation and remain immutable throughout the job lifecycle.

ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "procedureId" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "procedureRangeIndex" INTEGER;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "unitOfMeasurement" TEXT;
