-- Module 8: Instrument images
CREATE TABLE "InstrumentImage" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "jobId" TEXT,
    "instrumentId" TEXT,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileData" TEXT NOT NULL,
    "remarks" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstrumentImage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InstrumentImage_labId_idx" ON "InstrumentImage"("labId");
CREATE INDEX "InstrumentImage_jobId_idx" ON "InstrumentImage"("jobId");
CREATE INDEX "InstrumentImage_instrumentId_idx" ON "InstrumentImage"("instrumentId");

-- Module 9: Complaint management
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "complaintNo" TEXT NOT NULL,
    "customerId" TEXT,
    "certificateId" TEXT,
    "subject" TEXT,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "investigation" TEXT,
    "capa" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closureRemarks" TEXT,
    "closedAt" TIMESTAMP(3),
    "raisedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Complaint_labId_complaintNo_key" ON "Complaint"("labId", "complaintNo");
CREATE INDEX "Complaint_labId_idx" ON "Complaint"("labId");

-- Module 11: Customer feedback
CREATE TABLE "CustomerFeedback" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "customerId" TEXT,
    "jobId" TEXT,
    "serviceRating" INTEGER NOT NULL,
    "qualityRating" INTEGER NOT NULL,
    "tatRating" INTEGER NOT NULL,
    "supportRating" INTEGER NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerFeedback_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CustomerFeedback_labId_idx" ON "CustomerFeedback"("labId");
CREATE INDEX "CustomerFeedback_customerId_idx" ON "CustomerFeedback"("customerId");
