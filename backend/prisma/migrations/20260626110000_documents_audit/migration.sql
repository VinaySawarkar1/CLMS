-- CreateTable: LabDocument
CREATE TABLE "LabDocument" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT '00',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "content" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reviewDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LabDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InternalAudit
CREATE TABLE "InternalAudit" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "auditNumber" TEXT NOT NULL,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "conductedDate" TIMESTAMP(3),
    "auditor" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InternalAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuditFinding
CREATE TABLE "AuditFinding" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "clause" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "correction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabDocument_labId_idx" ON "LabDocument"("labId");
CREATE INDEX "InternalAudit_labId_idx" ON "InternalAudit"("labId");

-- AddForeignKey
ALTER TABLE "LabDocument" ADD CONSTRAINT "LabDocument_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalAudit" ADD CONSTRAINT "InternalAudit_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "InternalAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
