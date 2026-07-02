-- Certificate revision control
ALTER TABLE "Certificate" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Certificate" ADD COLUMN "revisionReason" TEXT;

-- Immutable archive of superseded certificate revisions
CREATE TABLE "CertificateRevision" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "qrHash" TEXT,
    "decisionRule" TEXT,
    "revisionReason" TEXT,
    "snapshot" JSONB,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CertificateRevision_certificateId_idx" ON "CertificateRevision"("certificateId");

ALTER TABLE "CertificateRevision" ADD CONSTRAINT "CertificateRevision_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
