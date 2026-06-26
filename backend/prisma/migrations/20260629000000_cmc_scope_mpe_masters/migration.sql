-- CMC / NABL Scope master (Module 4.3 + 4.4)
CREATE TABLE "CmcScope" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "rangeMin" DOUBLE PRECISION,
    "rangeMax" DOUBLE PRECISION,
    "rangeText" TEXT,
    "unit" TEXT,
    "cmc" TEXT,
    "cmcValue" DOUBLE PRECISION,
    "method" TEXT,
    "scope" TEXT,
    "revision" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmcScope_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CmcScope_labId_idx" ON "CmcScope"("labId");

-- MPE rule master (Module 4.2)
CREATE TABLE "MpeRule" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "instrumentType" TEXT,
    "accuracyClass" TEXT,
    "standard" TEXT,
    "rangeMin" DOUBLE PRECISION,
    "rangeMax" DOUBLE PRECISION,
    "unit" TEXT,
    "mpeValue" DOUBLE PRECISION NOT NULL,
    "mpeIsPercent" BOOLEAN NOT NULL DEFAULT false,
    "resolution" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MpeRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MpeRule_labId_idx" ON "MpeRule"("labId");
