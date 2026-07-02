-- Restore 2-stage signature workflow: ENGINEER and TECHNICAL_MANAGER
DELETE FROM "DigitalSignature" WHERE stage NOT IN ('ENGINEER', 'TECHNICAL_MANAGER');
ALTER TYPE "SignatureStage" RENAME TO "SignatureStage_old";
CREATE TYPE "SignatureStage" AS ENUM ('ENGINEER', 'TECHNICAL_MANAGER');
ALTER TABLE "DigitalSignature" ALTER COLUMN "stage" TYPE "SignatureStage" USING "stage"::text::"SignatureStage";
DROP TYPE "SignatureStage_old";
