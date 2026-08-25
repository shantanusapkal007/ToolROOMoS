-- Consolidated Enterprise Baseline Migration
-- Adds Global Assets, Maintenance Tickets, Employee Salaries, Master Category Options, Idempotency Records and Performance Indexes

-- CreateEnum
CREATE TYPE "GlobalAssetStatus" AS ENUM ('ACTIVE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED', 'SCRAPPED');
CREATE TYPE "GlobalAssetIssueStatus" AS ENUM ('ISSUED', 'RETURNED');
CREATE TYPE "GlobalAssetMaintenanceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE IF NOT EXISTS "global_asset_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "global_asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "global_asset_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "global_asset_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "global_assets" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "locationId" TEXT,
    "serialNumber" TEXT,
    "modelNumber" TEXT,
    "manufacturer" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "GlobalAssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "condition" TEXT,
    "assignedTo" TEXT,
    "specifications" JSONB,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "global_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "global_asset_issue_transactions" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" TIMESTAMP(3),
    "actualReturnDate" TIMESTAMP(3),
    "status" "GlobalAssetIssueStatus" NOT NULL DEFAULT 'ISSUED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    CONSTRAINT "global_asset_issue_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "global_asset_return_transactions" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "issueTransactionId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conditionOnReturn" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    CONSTRAINT "global_asset_return_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "global_asset_maintenance_requests" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "GlobalAssetMaintenanceStatus" NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "estimatedCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "actualCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "performedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    CONSTRAINT "global_asset_maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "global_asset_audit_logs" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "global_asset_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "employee_monthly_salaries" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "actualSalary" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "baseSalary" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "employee_monthly_salaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "master_category_options" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "master_category_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "maintenance_tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "machineId" TEXT,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reportedById" TEXT,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "breakdownHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "costIncurred" DECIMAL(65,30) NOT NULL DEFAULT 0,
    CONSTRAINT "maintenance_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "maintenance_logs" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "technicianId" TEXT,
    "actionTaken" TEXT NOT NULL,
    "hoursSpent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "maintenance_spare_parts" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partNumber" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenance_spare_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "idempotency_records" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestHash" TEXT,
    "responseStatus" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "global_asset_categories_code_key" ON "global_asset_categories"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "global_asset_locations_code_key" ON "global_asset_locations"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "global_assets_assetCode_key" ON "global_assets"("assetCode");
CREATE UNIQUE INDEX IF NOT EXISTS "employee_monthly_salaries_employeeId_monthYear_key" ON "employee_monthly_salaries"("employeeId", "monthYear");
CREATE UNIQUE INDEX IF NOT EXISTS "master_category_options_category_code_key" ON "master_category_options"("category", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "maintenance_tickets_ticketNumber_key" ON "maintenance_tickets"("ticketNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_records_key_key" ON "idempotency_records"("key");
CREATE INDEX IF NOT EXISTS "idempotency_records_expiresAt_idx" ON "idempotency_records"("expiresAt");

-- Performance Composite Indexes
CREATE INDEX IF NOT EXISTS "projects_plantId_status_idx" ON "projects"("plantId", "status");
CREATE INDEX IF NOT EXISTS "projects_currentStage_idx" ON "projects"("currentStage");
CREATE INDEX IF NOT EXISTS "projects_customerId_idx" ON "projects"("customerId");
CREATE INDEX IF NOT EXISTS "projects_createdAt_idx" ON "projects"("createdAt");
CREATE INDEX IF NOT EXISTS "bill_of_material_items_bomHeaderId_idx" ON "bill_of_material_items"("bomHeaderId");
CREATE INDEX IF NOT EXISTS "bill_of_material_items_materialId_idx" ON "bill_of_material_items"("materialId");
CREATE INDEX IF NOT EXISTS "purchase_order_headers_projectId_status_idx" ON "purchase_order_headers"("projectId", "status");
CREATE INDEX IF NOT EXISTS "purchase_order_headers_vendorId_idx" ON "purchase_order_headers"("vendorId");
CREATE INDEX IF NOT EXISTS "purchase_order_items_poHeaderId_idx" ON "purchase_order_items"("poHeaderId");
CREATE INDEX IF NOT EXISTS "purchase_order_items_materialId_idx" ON "purchase_order_items"("materialId");
CREATE INDEX IF NOT EXISTS "goods_receipt_headers_projectId_idx" ON "goods_receipt_headers"("projectId");
CREATE INDEX IF NOT EXISTS "goods_receipt_headers_poHeaderId_idx" ON "goods_receipt_headers"("poHeaderId");
CREATE INDEX IF NOT EXISTS "goods_receipt_items_grnHeaderId_idx" ON "goods_receipt_items"("grnHeaderId");
CREATE INDEX IF NOT EXISTS "goods_receipt_items_poItemId_idx" ON "goods_receipt_items"("poItemId");
CREATE INDEX IF NOT EXISTS "invoice_headers_projectId_idx" ON "invoice_headers"("projectId");
CREATE INDEX IF NOT EXISTS "invoice_headers_paymentStatus_idx" ON "invoice_headers"("paymentStatus");
CREATE INDEX IF NOT EXISTS "inventory_transactions_projectId_idx" ON "inventory_transactions"("projectId");
CREATE INDEX IF NOT EXISTS "inventory_transactions_inventoryBatchId_idx" ON "inventory_transactions"("inventoryBatchId");
