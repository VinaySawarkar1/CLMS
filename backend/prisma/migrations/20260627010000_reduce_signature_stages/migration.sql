-- Reduce SignatureStage enum to only TECHNICAL_MANAGER and QUALITY_MANAGER.
DELETE FROM "DigitalSignature" WHERE stage NOT IN ('TECHNICAL_MANAGER', 'QUALITY_MANAGER');
ALTER TYPE "SignatureStage" RENAME TO "SignatureStage_old";
CREATE TYPE "SignatureStage" AS ENUM ('TECHNICAL_MANAGER', 'QUALITY_MANAGER');
ALTER TABLE "DigitalSignature" ALTER COLUMN "stage" TYPE "SignatureStage" USING "stage"::text::"SignatureStage";
DROP TYPE "SignatureStage_old";
