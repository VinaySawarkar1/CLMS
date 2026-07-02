-- Safe creation of CRM enums using DO blocks (PostgreSQL does not support CREATE TYPE IF NOT EXISTS)

DO $$ BEGIN
  CREATE TYPE "LeadStage" AS ENUM ('NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "LeadSource" AS ENUM ('WEBSITE','REFERRAL','COLD_CALL','EXHIBITION','SOCIAL_MEDIA','EMAIL_CAMPAIGN','WALK_IN','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ActivityType" AS ENUM ('CALL','EMAIL','MEETING','TASK','NOTE','WHATSAPP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Lead table
CREATE TABLE IF NOT EXISTS "Lead" (
  "id"                  TEXT          NOT NULL,
  "labId"               TEXT          NOT NULL,
  "title"               TEXT          NOT NULL,
  "companyName"         TEXT,
  "contactName"         TEXT,
  "contactEmail"        TEXT,
  "contactPhone"        TEXT,
  "stage"               "LeadStage"   NOT NULL DEFAULT 'NEW',
  "source"              "LeadSource"  NOT NULL DEFAULT 'OTHER',
  "value"               DOUBLE PRECISION,
  "probability"         INTEGER       NOT NULL DEFAULT 20,
  "expectedCloseDate"   TIMESTAMP(3),
  "assignedTo"          TEXT,
  "industry"            TEXT,
  "description"         TEXT,
  "lostReason"          TEXT,
  "convertedCustomerId" TEXT,
  "convertedAt"         TIMESTAMP(3),
  "createdAt"           TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Lead_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Lead_labId_idx"       ON "Lead"("labId");
CREATE INDEX IF NOT EXISTS "Lead_labId_stage_idx" ON "Lead"("labId","stage");

-- CrmActivity table
CREATE TABLE IF NOT EXISTS "CrmActivity" (
  "id"          TEXT          NOT NULL,
  "labId"       TEXT          NOT NULL,
  "type"        "ActivityType" NOT NULL,
  "title"       TEXT          NOT NULL,
  "description" TEXT,
  "outcome"     TEXT,
  "dueDate"     TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "isDone"      BOOLEAN       NOT NULL DEFAULT false,
  "customerId"  TEXT,
  "leadId"      TEXT,
  "createdBy"   TEXT,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmActivity_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "CrmActivity_labId_fkey"     FOREIGN KEY ("labId")      REFERENCES "Lab"("id")      ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "CrmActivity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "CrmActivity_leadId_fkey"    FOREIGN KEY ("leadId")     REFERENCES "Lead"("id")     ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CrmActivity_labId_idx"      ON "CrmActivity"("labId");
CREATE INDEX IF NOT EXISTS "CrmActivity_customerId_idx" ON "CrmActivity"("customerId");
CREATE INDEX IF NOT EXISTS "CrmActivity_leadId_idx"     ON "CrmActivity"("leadId");

-- Enhance Contact table (idempotent)
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "isPrimary"  BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "notes"      TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
