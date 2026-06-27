-- CRM Modules: Customer Enhancement + Purchase Orders + Delivery Challans + Invoice/Quotation Enhancement

-- New enums
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED');
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED', 'CLOSED');
CREATE TYPE "DeliveryChallanStatus" AS ENUM ('DRAFT', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'CANCELLED');

-- Extend QuotationStatus
ALTER TYPE "QuotationStatus" ADD VALUE IF NOT EXISTS 'VIEWED';
ALTER TYPE "QuotationStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "QuotationStatus" ADD VALUE IF NOT EXISTS 'SUPERSEDED';

-- Extend InvoiceStatus
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'OVERDUE';

-- Extend Customer table
ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "customerType"     TEXT    NOT NULL DEFAULT 'BUSINESS',
  ADD COLUMN IF NOT EXISTS "pan"              TEXT,
  ADD COLUMN IF NOT EXISTS "website"         TEXT,
  ADD COLUMN IF NOT EXISTS "billingAddress"  TEXT,
  ADD COLUMN IF NOT EXISTS "billingCity"     TEXT,
  ADD COLUMN IF NOT EXISTS "billingState"    TEXT,
  ADD COLUMN IF NOT EXISTS "billingPinCode"  TEXT,
  ADD COLUMN IF NOT EXISTS "billingCountry"  TEXT    DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS "paymentTerms"    TEXT,
  ADD COLUMN IF NOT EXISTS "creditLimit"     DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "creditDays"      INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "openingBalance"  DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "category"        TEXT,
  ADD COLUMN IF NOT EXISTS "salesExecutive"  TEXT,
  ADD COLUMN IF NOT EXISTS "tags"            TEXT[]  DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "notes"           TEXT,
  ADD COLUMN IF NOT EXISTS "customerStatus"  "CustomerStatus" NOT NULL DEFAULT 'ACTIVE';

-- Customer Shipping Addresses
CREATE TABLE IF NOT EXISTS "CustomerAddress" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "customerId"  TEXT NOT NULL,
  "label"       TEXT NOT NULL DEFAULT 'Shipping Address',
  "address"     TEXT,
  "city"        TEXT,
  "state"       TEXT,
  "pinCode"     TEXT,
  "country"     TEXT DEFAULT 'India',
  "isDefault"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CustomerAddress_customerId_idx" ON "CustomerAddress"("customerId");

-- Extend Quotation table
ALTER TABLE "Quotation"
  ADD COLUMN IF NOT EXISTS "subject"          TEXT,
  ADD COLUMN IF NOT EXISTS "reference"        TEXT,
  ADD COLUMN IF NOT EXISTS "contactPerson"    TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryTerms"    TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryPeriod"   TEXT,
  ADD COLUMN IF NOT EXISTS "termsConditions"  TEXT,
  ADD COLUMN IF NOT EXISTS "placeOfSupply"    TEXT,
  ADD COLUMN IF NOT EXISTS "discountTotal"    DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "cgst"             DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sgst"             DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "igst"             DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "linkedInvoiceId"  TEXT;

-- Extend Invoice table
ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "lineItems"         JSONB    DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "dueDate"           TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "placeOfSupply"     TEXT,
  ADD COLUMN IF NOT EXISTS "customerPoNumber"  TEXT,
  ADD COLUMN IF NOT EXISTS "paymentTerms"      TEXT,
  ADD COLUMN IF NOT EXISTS "termsConditions"   TEXT,
  ADD COLUMN IF NOT EXISTS "notes"             TEXT,
  ADD COLUMN IF NOT EXISTS "discountTotal"     DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "cgst"              DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sgst"              DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "igst"              DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "linkedQuotationId" TEXT,
  ADD COLUMN IF NOT EXISTS "linkedChallanId"   TEXT;

-- Purchase Orders
CREATE TABLE IF NOT EXISTS "PurchaseOrder" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "labId"           TEXT NOT NULL,
  "poNumber"        TEXT NOT NULL,
  "poDate"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "supplierId"      TEXT NOT NULL,
  "supplierRef"     TEXT,
  "contactPerson"   TEXT,
  "expectedDate"    TIMESTAMP(3),
  "deliveryAddress" TEXT,
  "paymentTerms"    TEXT,
  "status"          "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "lineItems"       JSONB NOT NULL DEFAULT '[]',
  "subTotal"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discountTotal"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cgst"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sgst"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "igst"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalAmount"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes"           TEXT,
  "internalNotes"   TEXT,
  "cancelReason"    TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PurchaseOrder_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Customer"("id") ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseOrder_labId_poNumber_key" ON "PurchaseOrder"("labId", "poNumber");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_labId_idx" ON "PurchaseOrder"("labId");

-- Delivery Challans
CREATE TABLE IF NOT EXISTS "DeliveryChallan" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "labId"             TEXT NOT NULL,
  "challanNumber"     TEXT NOT NULL,
  "challanDate"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "challanType"       TEXT NOT NULL DEFAULT 'SALE',
  "customerId"        TEXT NOT NULL,
  "contactPerson"     TEXT,
  "deliveryAddress"   TEXT,
  "linkedQuotationId" TEXT,
  "linkedInvoiceId"   TEXT,
  "lineItems"         JSONB NOT NULL DEFAULT '[]',
  "status"            "DeliveryChallanStatus" NOT NULL DEFAULT 'DRAFT',
  "dispatchDate"      TIMESTAMP(3),
  "expectedDelivery"  TIMESTAMP(3),
  "transportMode"     TEXT,
  "transporterName"   TEXT,
  "vehicleNumber"     TEXT,
  "driverName"        TEXT,
  "driverMobile"      TEXT,
  "lrNumber"          TEXT,
  "lrDate"            TIMESTAMP(3),
  "eWayBillNumber"    TEXT,
  "numberOfPackages"  INTEGER,
  "weightKg"          DOUBLE PRECISION,
  "remarks"           TEXT,
  "podUploaded"       BOOLEAN NOT NULL DEFAULT false,
  "cancelReason"      TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeliveryChallan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DeliveryChallan_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DeliveryChallan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryChallan_labId_challanNumber_key" ON "DeliveryChallan"("labId", "challanNumber");
CREATE INDEX IF NOT EXISTS "DeliveryChallan_labId_idx" ON "DeliveryChallan"("labId");
