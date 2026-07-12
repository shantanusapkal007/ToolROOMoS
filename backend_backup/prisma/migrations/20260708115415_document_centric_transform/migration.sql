/*
  Warnings:

  - You are about to drop the column `machineId` on the `routing_operations` table. All the data in the column will be lost.
  - You are about to drop the `drawings` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('FIRST_PIECE', 'IN_PROCESS', 'FINAL', 'PDI', 'FINAL_PDI');

-- AlterEnum
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'ON_HOLD';

-- DropForeignKey
ALTER TABLE "approvals" DROP CONSTRAINT "approvals_projectId_fkey";

-- DropForeignKey
ALTER TABLE "bill_of_material_headers" DROP CONSTRAINT "bill_of_material_headers_projectId_fkey";

-- DropForeignKey
ALTER TABLE "dispatch_notes" DROP CONSTRAINT "dispatch_notes_projectId_fkey";

-- DropForeignKey
ALTER TABLE "drawings" DROP CONSTRAINT "drawings_projectId_fkey";

-- DropForeignKey
ALTER TABLE "goods_receipt_headers" DROP CONSTRAINT "goods_receipt_headers_projectId_fkey";

-- DropForeignKey
ALTER TABLE "inspection_headers" DROP CONSTRAINT "inspection_headers_projectId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_reservations" DROP CONSTRAINT "inventory_reservations_projectId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_transactions" DROP CONSTRAINT "inventory_transactions_projectId_fkey";

-- DropForeignKey
ALTER TABLE "invoice_headers" DROP CONSTRAINT "invoice_headers_projectId_fkey";

-- DropForeignKey
ALTER TABLE "machine_shop_daily_reports" DROP CONSTRAINT "machine_shop_daily_reports_projectId_fkey";

-- DropForeignKey
ALTER TABLE "material_issue_headers" DROP CONSTRAINT "material_issue_headers_projectId_fkey";

-- DropForeignKey
ALTER TABLE "material_requirements" DROP CONSTRAINT "material_requirements_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ncr_reports" DROP CONSTRAINT "ncr_reports_projectId_fkey";

-- DropForeignKey
ALTER TABLE "production_batches" DROP CONSTRAINT "production_batches_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_activities" DROP CONSTRAINT "project_activities_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_cost_events" DROP CONSTRAINT "project_cost_events_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_cost_summary" DROP CONSTRAINT "project_cost_summary_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_documents" DROP CONSTRAINT "project_documents_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_timeline" DROP CONSTRAINT "project_timeline_projectId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order_headers" DROP CONSTRAINT "purchase_order_headers_projectId_fkey";

-- DropForeignKey
ALTER TABLE "routing_headers" DROP CONSTRAINT "routing_headers_projectId_fkey";

-- DropForeignKey
ALTER TABLE "routing_operations" DROP CONSTRAINT "routing_operations_machineId_fkey";

-- DropForeignKey
ALTER TABLE "subcontract_orders" DROP CONSTRAINT "subcontract_orders_projectId_fkey";

-- DropForeignKey
ALTER TABLE "subcontract_receipts" DROP CONSTRAINT "subcontract_receipts_projectId_fkey";

-- AlterTable
ALTER TABLE "bill_of_material_items" ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "finishSize" TEXT,
ADD COLUMN     "heatTreatment" TEXT,
ADD COLUMN     "isAssembly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "partName" TEXT,
ADD COLUMN     "partNo" TEXT,
ADD COLUMN     "supplier" TEXT,
ADD COLUMN     "weight" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "dispatch_notes" ADD COLUMN     "boxes" INTEGER,
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "driverDetails" TEXT,
ADD COLUMN     "lrNumber" TEXT,
ADD COLUMN     "packing" TEXT,
ADD COLUMN     "photos" JSONB,
ADD COLUMN     "trackingReference" TEXT,
ADD COLUMN     "transport" TEXT,
ADD COLUMN     "weight" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "employeeType" "EmployeeType" NOT NULL DEFAULT 'INTERNAL';

-- AlterTable
ALTER TABLE "inspection_headers" ADD COLUMN     "inspectionType" "InspectionType" NOT NULL DEFAULT 'IN_PROCESS',
ADD COLUMN     "routingOperationId" TEXT;

-- AlterTable
ALTER TABLE "inventory_batches" ADD COLUMN     "availableQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "issuedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "reservedQty" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "invoice_headers" ADD COLUMN     "amountPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "profit" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "machine_shop_daily_reports" ADD COLUMN     "actualLabourHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "actualMachineHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "approval" TEXT DEFAULT 'PENDING',
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "downtime" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "inventoryBatchId" TEXT,
ADD COLUMN     "machineCondition" TEXT,
ADD COLUMN     "materialIssueId" TEXT,
ADD COLUMN     "routingOperationId" TEXT,
ADD COLUMN     "toolChange" TEXT,
ADD COLUMN     "variance" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "gstPercent" DECIMAL(65,30),
ADD COLUMN     "hsnCode" TEXT,
ADD COLUMN     "standardLength" DECIMAL(65,30),
ADD COLUMN     "standardThickness" DECIMAL(65,30),
ADD COLUMN     "standardWidth" DECIMAL(65,30),
ADD COLUMN     "weightFormula" TEXT;

-- AlterTable
ALTER TABLE "ncr_reports" ADD COLUMN     "correctiveAction" TEXT,
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "preventiveAction" TEXT,
ADD COLUMN     "responsiblePerson" TEXT,
ADD COLUMN     "targetDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "project_cost_summary" ADD COLUMN     "estimatedLabourCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "estimatedMachineCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "estimatedManufacturingCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "estimatedOutsideProcessCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "estimatedProjectCost" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "closedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "purchase_order_headers" ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "freight" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "gstPercent" DECIMAL(65,30),
ADD COLUMN     "hsnCode" TEXT;

-- AlterTable
ALTER TABLE "purchase_order_items" ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "dimensions" TEXT,
ADD COLUMN     "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "gstPercent" DECIMAL(65,30),
ADD COLUMN     "heatNumber" TEXT,
ADD COLUMN     "hsnCode" TEXT,
ADD COLUMN     "millCertificate" TEXT,
ADD COLUMN     "receivedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "routing_operations" DROP COLUMN "machineId",
ADD COLUMN     "completedQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "cycleTime" DECIMAL(65,30),
ADD COLUMN     "estimatedSetupTime" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "inspectionRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "machineGroup" TEXT,
ADD COLUMN     "machineType" TEXT,
ADD COLUMN     "operationName" TEXT,
ADD COLUMN     "outsource" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plannedMachineId" TEXT,
ADD COLUMN     "remainingQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hourlyRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "plantId" TEXT;

-- DropTable
DROP TABLE "drawings";

-- CreateTable
CREATE TABLE "invoice_payments" (
    "id" TEXT NOT NULL,
    "invoiceHeaderId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentReference" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_cards" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "routingOperationId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "job_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_rate_history" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldRate" DECIMAL(65,30) NOT NULL,
    "newRate" DECIMAL(65,30) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "recordedBy" TEXT,

    CONSTRAINT "cost_rate_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_tasks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "dependsOn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynamic_forms" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dynamic_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wip_ledger" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "batchId" TEXT,
    "routingOperationId" TEXT,
    "machineId" TEXT,
    "qtyInWip" DECIMAL(65,30) NOT NULL,
    "accruedMaterialCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "accruedMachineCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "accruedLabourCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'IN_PROCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wip_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wip_valuation_snapshots" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "totalWipValue" DECIMAL(65,30) NOT NULL,
    "totalMaterialCost" DECIMAL(65,30) NOT NULL,
    "totalMachineCost" DECIMAL(65,30) NOT NULL,
    "totalLabourCost" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wip_valuation_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_calendars" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shiftId" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "plannedMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_schedules" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledStartTime" TIMESTAMP(3) NOT NULL,
    "scheduledEndTime" TIMESTAMP(3) NOT NULL,
    "estimatedHours" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oee_daily_logs" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "logDate" TIMESTAMP(3) NOT NULL,
    "availabilityScore" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "performanceScore" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "qualityScore" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "oeeScore" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "plannedTime" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "operatingTime" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalParts" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "goodParts" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oee_daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_definitions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "options" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_maintenance" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "vendorId" TEXT,
    "cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "nextServiceDate" TIMESTAMP(3),
    "remarks" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "machine_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_rates" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bills" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "vendor_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_entries" (
    "id" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "entryType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "referenceDocType" TEXT,
    "referenceDocId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "exchangeRate" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "description" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "account_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dynamic_forms_formId_key" ON "dynamic_forms"("formId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "attachments_entityType_entityId_idx" ON "attachments"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definitions_module_fieldName_key" ON "custom_field_definitions"("module", "fieldName");

-- CreateIndex
CREATE INDEX "currency_rates_currency_date_idx" ON "currency_rates"("currency", "date");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_bills_billNumber_key" ON "vendor_bills"("billNumber");

-- CreateIndex
CREATE INDEX "account_entries_category_entryDate_idx" ON "account_entries"("category", "entryDate");

-- CreateIndex
CREATE INDEX "inventory_batches_materialId_status_idx" ON "inventory_batches"("materialId", "status");

-- CreateIndex
CREATE INDEX "inventory_batches_grnItemId_idx" ON "inventory_batches"("grnItemId");

-- CreateIndex
CREATE INDEX "material_issue_items_issueHeaderId_idx" ON "material_issue_items"("issueHeaderId");

-- CreateIndex
CREATE INDEX "material_issue_items_inventoryBatchId_idx" ON "material_issue_items"("inventoryBatchId");

-- CreateIndex
CREATE INDEX "project_activities_projectId_idx" ON "project_activities"("projectId");

-- CreateIndex
CREATE INDEX "project_cost_events_projectId_idx" ON "project_cost_events"("projectId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_material_headers" ADD CONSTRAINT "bill_of_material_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_headers" ADD CONSTRAINT "routing_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_operations" ADD CONSTRAINT "routing_operations_plannedMachineId_fkey" FOREIGN KEY ("plannedMachineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requirements" ADD CONSTRAINT "material_requirements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_headers" ADD CONSTRAINT "purchase_order_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_headers" ADD CONSTRAINT "goods_receipt_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issue_headers" ADD CONSTRAINT "material_issue_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_headers" ADD CONSTRAINT "inspection_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_headers" ADD CONSTRAINT "inspection_headers_routingOperationId_fkey" FOREIGN KEY ("routingOperationId") REFERENCES "routing_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncr_reports" ADD CONSTRAINT "ncr_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_notes" ADD CONSTRAINT "dispatch_notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_headers" ADD CONSTRAINT "invoice_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoiceHeaderId_fkey" FOREIGN KEY ("invoiceHeaderId") REFERENCES "invoice_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_shop_daily_reports" ADD CONSTRAINT "machine_shop_daily_reports_inventoryBatchId_fkey" FOREIGN KEY ("inventoryBatchId") REFERENCES "inventory_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_shop_daily_reports" ADD CONSTRAINT "machine_shop_daily_reports_materialIssueId_fkey" FOREIGN KEY ("materialIssueId") REFERENCES "material_issue_headers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_shop_daily_reports" ADD CONSTRAINT "machine_shop_daily_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_shop_daily_reports" ADD CONSTRAINT "machine_shop_daily_reports_routingOperationId_fkey" FOREIGN KEY ("routingOperationId") REFERENCES "routing_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_routingOperationId_fkey" FOREIGN KEY ("routingOperationId") REFERENCES "routing_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_timeline" ADD CONSTRAINT "project_timeline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_cost_events" ADD CONSTRAINT "project_cost_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_cost_summary" ADD CONSTRAINT "project_cost_summary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_orders" ADD CONSTRAINT "subcontract_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_receipts" ADD CONSTRAINT "subcontract_receipts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wip_ledger" ADD CONSTRAINT "wip_ledger_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wip_ledger" ADD CONSTRAINT "wip_ledger_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wip_ledger" ADD CONSTRAINT "wip_ledger_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "inventory_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wip_ledger" ADD CONSTRAINT "wip_ledger_routingOperationId_fkey" FOREIGN KEY ("routingOperationId") REFERENCES "routing_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wip_ledger" ADD CONSTRAINT "wip_ledger_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_calendars" ADD CONSTRAINT "machine_calendars_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_calendars" ADD CONSTRAINT "machine_calendars_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_schedules" ADD CONSTRAINT "production_schedules_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_schedules" ADD CONSTRAINT "production_schedules_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_schedules" ADD CONSTRAINT "production_schedules_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oee_daily_logs" ADD CONSTRAINT "oee_daily_logs_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_maintenance" ADD CONSTRAINT "machine_maintenance_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
