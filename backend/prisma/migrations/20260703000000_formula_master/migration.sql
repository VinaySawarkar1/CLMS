-- Module 13: Reusable formula master
CREATE TABLE "FormulaMaster" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expression" TEXT NOT NULL,
    "variables" TEXT[],
    "constants" JSONB,
    "unit" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FormulaMaster_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FormulaMaster_labId_idx" ON "FormulaMaster"("labId");
