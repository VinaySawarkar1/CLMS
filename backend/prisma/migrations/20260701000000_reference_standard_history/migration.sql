-- Reference standard certificate version history (Module 3.1)
CREATE TABLE "ReferenceStandardCertificate" (
    "id" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileData" TEXT NOT NULL,
    "certificateNumber" TEXT,
    "calibratedDate" TIMESTAMP(3),
    "calibrationDue" TIMESTAMP(3),
    "traceability" TEXT,
    "uncertainty" TEXT,
    "remarks" TEXT,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceStandardCertificate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReferenceStandardCertificate_masterId_idx" ON "ReferenceStandardCertificate"("masterId");

ALTER TABLE "ReferenceStandardCertificate" ADD CONSTRAINT "ReferenceStandardCertificate_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "MasterInstrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reference standard maintenance history (Module 3.2)
CREATE TABLE "ReferenceStandardMaintenance" (
    "id" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceStandardMaintenance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReferenceStandardMaintenance_masterId_idx" ON "ReferenceStandardMaintenance"("masterId");

ALTER TABLE "ReferenceStandardMaintenance" ADD CONSTRAINT "ReferenceStandardMaintenance_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "MasterInstrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
