-- Restore full 5-stage signature workflow
ALTER TYPE "SignatureStage" RENAME TO "SignatureStage_old";
CREATE TYPE "SignatureStage" AS ENUM ('ENGINEER', 'REVIEWER', 'TECHNICAL_MANAGER', 'QUALITY_MANAGER', 'FINAL_LOCK');
ALTER TABLE "DigitalSignature" ALTER COLUMN "stage" TYPE "SignatureStage" USING "stage"::text::"SignatureStage";
DROP TYPE "SignatureStage_old";
