-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('CREATED', 'ENGINEERING', 'PROCUREMENT', 'MATERIAL_AVAILABLE', 'PRODUCTION', 'INSPECTION', 'DISPATCH_READY', 'DISPATCHED', 'INVOICED', 'PAYMENT_PENDING', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'UNDER_REVIEW', 'APPROVED', 'FROZEN', 'RELEASED', 'SUPERSEDED', 'ARCHIVED', 'REJECTED', 'OBSOLETE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIAL_RECEIPT', 'CLOSED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "SubcontractOrderStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIAL_RECEIPT', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('PASS', 'REWORK', 'SCRAP');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('GRN_RECEIPT', 'MATERIAL_ISSUE', 'MATERIAL_RETURN', 'ADJUSTMENT', 'SCRAP');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CostEventType" AS ENUM ('ESTIMATED_MATERIAL', 'ACTUAL_MATERIAL', 'MATERIAL_CONSUMPTION', 'MACHINE_COST', 'LABOUR_COST', 'OUTSIDE_PROCESS', 'INSPECTION_COST', 'PACKING_COST', 'DISPATCH_COST', 'REVENUE');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('MATERIAL_SUPPLIER', 'HEAT_TREATMENT', 'PLATING', 'GRINDING', 'COATING', 'TOOL_SUPPLIER');

-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('IN_PROCESS', 'FINAL_PDI', 'FIRST_PIECE', 'FINAL', 'PDI');

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('ADMIN', 'SALES', 'SALES_ENGINEER', 'ENGINEERING', 'PURCHASE', 'STORES', 'PRODUCTION', 'QUALITY', 'FINANCE');

-- CreateEnum
CREATE TYPE "ProductionSection" AS ENUM ('MACHINE_SHOP', 'TOOL_ROOM_FITTING', 'PRESS_SHOP', 'FABRICATION_INDIAN', 'FABRICATION_EXPORT');

-- CreateEnum
CREATE TYPE "GlobalAssetStatus" AS ENUM ('AVAILABLE', 'ISSUED', 'MAINTENANCE', 'RESERVED', 'LOST', 'SCRAPPED');

-- CreateEnum
CREATE TYPE "GlobalAssetIssueStatus" AS ENUM ('ISSUED', 'PARTIALLY_RETURNED', 'RETURNED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "GlobalAssetMaintenanceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('NEW', 'ESTIMATION', 'QUOTED', 'REVISION', 'WON', 'LOST', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "SystemRole" NOT NULL DEFAULT 'PRODUCTION',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "employeeId" TEXT,
    "hourlyRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "plantId" TEXT,
    "primaryPlantId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "companyCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "gstNumber" TEXT,
    "pan" TEXT,
    "address" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" TEXT NOT NULL,
    "plantCode" TEXT NOT NULL,
    "plantName" TEXT NOT NULL,
    "address" TEXT,
    "workingHours" TEXT,
    "companyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "gstNumber" TEXT,
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "paymentTerms" TEXT,
    "companyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "vendorCode" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorType" "VendorType" NOT NULL,
    "gstNumber" TEXT,
    "address" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "companyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "materialGrade" TEXT NOT NULL,
    "materialCategory" TEXT,
    "density" DECIMAL(65,30),
    "standardCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "defaultUom" TEXT NOT NULL,
    "defaultVendor" TEXT,
    "shapeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "hsnCode" TEXT,
    "gstPercent" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_shapes" (
    "id" TEXT NOT NULL,
    "shapeName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "material_shapes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "machineCode" TEXT NOT NULL,
    "machineName" TEXT NOT NULL,
    "machineType" TEXT NOT NULL,
    "hourlyRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "capacity" TEXT,
    "plantId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations" (
    "id" TEXT NOT NULL,
    "operationCode" TEXT NOT NULL,
    "operationName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" TEXT NOT NULL,
    "toolCode" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "toolType" TEXT,
    "toolLife" TEXT,
    "cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "hourlyRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "shiftId" TEXT,
    "departmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "employeeType" "EmployeeType" NOT NULL DEFAULT 'INTERNAL',

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "shiftName" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "warehouseCode" TEXT NOT NULL,
    "warehouseName" TEXT NOT NULL,
    "warehouseType" TEXT,
    "plantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_locations" (
    "id" TEXT NOT NULL,
    "locationCode" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "storage_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uoms" (
    "id" TEXT NOT NULL,
    "uomCode" TEXT NOT NULL,
    "uomName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "uoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_standards" (
    "id" TEXT NOT NULL,
    "standardCode" TEXT NOT NULL,
    "standardName" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "inspection_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_rates" (
    "id" TEXT NOT NULL,
    "rateType" TEXT NOT NULL,
    "rateName" TEXT NOT NULL,
    "rateValue" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "cost_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" TEXT NOT NULL,
    "typeCode" TEXT NOT NULL,
    "typeName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "projectNumber" TEXT NOT NULL,
    "customerPoNumber" TEXT,
    "partName" TEXT NOT NULL,
    "description" TEXT,
    "targetDeliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "currentStage" "ProjectStatus" NOT NULL DEFAULT 'CREATED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "progress" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "projectOwner" TEXT,
    "customerId" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "rfqHeaderId" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_documents" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "documentNumber" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_revisions" (
    "id" TEXT NOT NULL,
    "projectDocumentId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "changeDescription" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "document_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_of_material_headers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentNumber" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "totalEstimatedCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "bill_of_material_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_of_material_items" (
    "id" TEXT NOT NULL,
    "bomHeaderId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "rawSize" TEXT,
    "dimensions" TEXT,
    "hsnCode" TEXT,
    "calculatedWeight" DECIMAL(65,30),
    "requiredQty" DECIMAL(65,30) NOT NULL,
    "estimatedCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isAssembly" BOOLEAN NOT NULL DEFAULT false,
    "customFields" JSONB,
    "catalogSize" TEXT,
    "stockSize" TEXT,
    "parentItemId" TEXT,

    CONSTRAINT "bill_of_material_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_headers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentNumber" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "routing_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_operations" (
    "id" TEXT NOT NULL,
    "routingHeaderId" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "operationId" TEXT NOT NULL,
    "estimatedHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "completedQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estimatedSetupTime" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "plannedMachineId" TEXT,
    "remainingQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "routing_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_requirements" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "requiredQty" DECIMAL(65,30) NOT NULL,
    "requiredDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "material_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_headers" (
    "purchaseRequestId" TEXT,
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "documentNumber" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "expectedDeliveryDate" TIMESTAMP(3),
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "vendorGstNumber" TEXT,
    "costCentre" TEXT,
    "gstPercent" DECIMAL(65,30),
    "hsnCode" TEXT,
    "customFields" JSONB,

    CONSTRAINT "purchase_order_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "poHeaderId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "orderedQty" DECIMAL(65,30) NOT NULL,
    "agreedRate" DECIMAL(65,30) NOT NULL,
    "lineTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "receivedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customFields" JSONB,
    "dimensions" TEXT,
    "gstPercent" DECIMAL(65,30),
    "hsnCode" TEXT,
    "uom" TEXT,
    "discount" DECIMAL(65,30),
    "cgst" DECIMAL(65,30),
    "sgst" DECIMAL(65,30),
    "igst" DECIMAL(65,30),
    "basicValue" DECIMAL(65,30),

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_headers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "poHeaderId" TEXT NOT NULL,
    "grnNumber" TEXT NOT NULL,
    "supplierChallan" TEXT,
    "documentNumber" TEXT,
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "vendorInvoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "customFields" JSONB,

    CONSTRAINT "goods_receipt_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_items" (
    "id" TEXT NOT NULL,
    "grnHeaderId" TEXT NOT NULL,
    "poItemId" TEXT NOT NULL,
    "receivedQty" DECIMAL(65,30) NOT NULL,
    "acceptedQty" DECIMAL(65,30) NOT NULL,
    "rejectedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "heatNumber" TEXT,
    "actualRate" DECIMAL(65,30) NOT NULL,
    "actualMaterialCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "batchNumber" TEXT,
    "hsnCode" TEXT,
    "warehouseId" TEXT,
    "gstPercent" DECIMAL(65,30),
    "rackLocation" TEXT,
    "toolNo" TEXT,
    "detNo" TEXT,
    "length" DECIMAL(65,30),
    "width" DECIMAL(65,30),
    "height" DECIMAL(65,30),
    "apWeight" DECIMAL(65,30),
    "totalWeight" DECIMAL(65,30),
    "basicCost" DECIMAL(65,30),
    "gst" DECIMAL(65,30),
    "total" DECIMAL(65,30),

    CONSTRAINT "goods_receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_issue_headers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "issueNumber" TEXT NOT NULL,
    "documentNumber" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "remarks" TEXT,
    "productionSection" TEXT,
    "jobCardId" TEXT,
    "isPartial" BOOLEAN NOT NULL DEFAULT false,
    "expectedManufactureQty" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "material_issue_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_issue_items" (
    "id" TEXT NOT NULL,
    "issueHeaderId" TEXT NOT NULL,
    "inventoryBatchId" TEXT NOT NULL,
    "issuedQty" DECIMAL(65,30) NOT NULL,
    "materialValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remainingBatchQty" DECIMAL(65,30),
    "isPartial" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "material_issue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_headers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "productionOperationId" TEXT,
    "inspectionNumber" TEXT NOT NULL,
    "documentNumber" TEXT,
    "inspectedQty" DECIMAL(65,30) NOT NULL,
    "passedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reworkQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "scrapQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "result" "InspectionResult" NOT NULL DEFAULT 'PASS',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "inspectionType" "InspectionType" NOT NULL DEFAULT 'IN_PROCESS',
    "routingOperationId" TEXT,

    CONSTRAINT "inspection_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_measurements" (
    "id" TEXT NOT NULL,
    "inspectionHeaderId" TEXT NOT NULL,
    "inspectionStandardId" TEXT NOT NULL,
    "nominalValue" DECIMAL(65,30) NOT NULL,
    "upperTolerance" DECIMAL(65,30),
    "lowerTolerance" DECIMAL(65,30),
    "actualValue" DECIMAL(65,30) NOT NULL,
    "result" "InspectionResult" NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "inspection_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ncr_reports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ncrNumber" TEXT NOT NULL,
    "defectDescription" TEXT NOT NULL,
    "rootCause" TEXT,
    "disposition" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "ncr_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_notes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "dispatchNumber" TEXT NOT NULL,
    "documentNumber" TEXT,
    "dispatchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchQty" DECIMAL(65,30) NOT NULL,
    "transporterName" TEXT,
    "transporterDetails" TEXT,
    "vehicleNumber" TEXT,
    "logisticsCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "driverDetails" TEXT,
    "trackingReference" TEXT,

    CONSTRAINT "dispatch_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_items" (
    "id" TEXT NOT NULL,
    "dispatchNoteId" TEXT NOT NULL,
    "partDescription" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "dispatch_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_headers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "dispatchNoteId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "documentNumber" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "profit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "amountPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_headers_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceHeaderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "lineTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stock" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "currentQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reservedQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "availableQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_batches" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "grnItemId" TEXT,
    "batchNumber" TEXT NOT NULL,
    "heatNumber" TEXT,
    "locationId" TEXT,
    "receivedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currentQty" DECIMAL(65,30) NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "subcontractReceiptItemId" TEXT,
    "availableQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "issuedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reservedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rack" TEXT,
    "parentBatchId" TEXT,
    "bin" TEXT,
    "isOffcut" BOOLEAN NOT NULL DEFAULT false,
    "isReusable" BOOLEAN NOT NULL DEFAULT false,
    "length" DECIMAL(65,30),
    "width" DECIMAL(65,30),
    "height" DECIMAL(65,30),
    "thickness" DECIMAL(65,30),

    CONSTRAINT "inventory_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "inventoryBatchId" TEXT NOT NULL,
    "movementType" "InventoryMovementType" NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "referenceDocType" TEXT,
    "referenceDocId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_reservations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "reservedQty" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_batches" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "production_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_operations" (
    "id" TEXT NOT NULL,
    "productionBatchId" TEXT NOT NULL,
    "routingOperationId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "producedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "scrapQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "calculatedMachineHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "calculatedMachineCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "calculatedLabourHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "calculatedLabourCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "production_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_shop_daily_reports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "setupTime" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cuttingTime" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "idleTime" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "producedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "scrapQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reworkQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "actualLabourHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "actualMachineHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "inventoryBatchId" TEXT,
    "materialIssueId" TEXT,
    "routingOperationId" TEXT,
    "variance" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "machine_shop_daily_reports_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "project_timeline" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromStage" "ProjectStatus" NOT NULL,
    "toStage" "ProjectStatus" NOT NULL,
    "transitionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transitionedBy" TEXT,
    "remarks" TEXT,

    CONSTRAINT "project_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_activities" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_work_logs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "designerName" TEXT NOT NULL,
    "designerId" TEXT,
    "workStage" TEXT NOT NULL,
    "partName" TEXT,
    "drawingNumber" TEXT,
    "revision" TEXT,
    "description" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TEXT,
    "endTime" TEXT,
    "hoursSpent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "cadFileUrl" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "design_work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_cost_events" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "costType" "CostEventType" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "referenceDocType" TEXT,
    "referenceDocId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "project_cost_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_cost_summary" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "estimatedMaterialCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "actualMaterialCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "materialConsumptionCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "machineCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "labourCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "outsideProcessCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "inspectionCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "packingCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dispatchCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profitability" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estimatedLabourCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estimatedMachineCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estimatedManufacturingCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estimatedOutsideProcessCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estimatedProjectCost" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "project_cost_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontract_orders" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "challanNumber" TEXT NOT NULL,
    "documentNumber" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "totalEstimatedCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "expectedReturnDate" TIMESTAMP(3),
    "status" "SubcontractOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "subcontract_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontract_order_items" (
    "id" TEXT NOT NULL,
    "subcontractOrderId" TEXT NOT NULL,
    "inventoryBatchId" TEXT,
    "operationId" TEXT NOT NULL,
    "sentQty" DECIMAL(65,30) NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "lineEstimatedCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "subcontract_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontract_receipts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subcontractOrderId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "documentNumber" TEXT,
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "subcontract_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontract_receipt_items" (
    "id" TEXT NOT NULL,
    "subcontractReceiptId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "receivedQty" DECIMAL(65,30) NOT NULL,
    "acceptedQty" DECIMAL(65,30) NOT NULL,
    "rejectedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "actualRate" DECIMAL(65,30) NOT NULL,
    "actualProcessCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "subcontract_receipt_items_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "planning_runs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "runBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_exceptions" (
    "id" TEXT NOT NULL,
    "planningRunId" TEXT NOT NULL,
    "materialId" TEXT,
    "exceptionType" TEXT NOT NULL DEFAULT 'MATERIAL_SHORTAGE',
    "exceptionMessage" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_recommendations" (
    "id" TEXT NOT NULL,
    "planningRunId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "recommendationNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_recommendation_items" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "requiredQuantity" DECIMAL(65,30) NOT NULL,
    "requiredDate" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'PURCHASE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,

    CONSTRAINT "planning_recommendation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_headers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "prNumber" TEXT NOT NULL,
    "department" TEXT,
    "requestedBy" TEXT,
    "requiredDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "category" TEXT NOT NULL DEFAULT 'RAW_MATERIAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "purpose" TEXT,
    "remarks" TEXT,
    "estimatedTotalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "purchase_request_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_items" (
    "id" TEXT NOT NULL,
    "prHeaderId" TEXT NOT NULL,
    "materialId" TEXT,
    "itemCode" TEXT,
    "itemName" TEXT,
    "materialGrade" TEXT,
    "dimensions" TEXT,
    "rawSize" TEXT,
    "requiredQuantity" DECIMAL(65,30) NOT NULL,
    "orderedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'PCS',
    "estimatedRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estimatedTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "detNo" TEXT,
    "suggestedVendor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bills" (
    "id" TEXT NOT NULL,
    "poHeaderId" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "projectId" TEXT NOT NULL,
    "updatedBy" TEXT,
    "vendorId" TEXT,
    "billDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "gstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "vendor_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bill_items" (
    "id" TEXT NOT NULL,
    "vendorBillId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "vendor_bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_returns" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "poHeaderId" TEXT NOT NULL,
    "returnNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "purchase_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_return_items" (
    "id" TEXT NOT NULL,
    "purchaseReturnId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "purchase_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "msdr_headers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "msdrNumber" TEXT,
    "productionSection" "ProductionSection" NOT NULL DEFAULT 'MACHINE_SHOP',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "machineId" TEXT,
    "employeeId" TEXT,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shift" TEXT,
    "supervisorId" TEXT,
    "remarks" TEXT,

    CONSTRAINT "msdr_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "msdr_operations" (
    "id" TEXT NOT NULL,
    "msdrHeaderId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "routingOperationId" TEXT,
    "producedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "scrapQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "runningHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "materialIssueId" TEXT,
    "inventoryBatchId" TEXT,
    "toolNo" TEXT,
    "detNo" TEXT,
    "description" TEXT,
    "rawMatlSize" TEXT,
    "materialId" TEXT,
    "finishMatlSize" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "setupTime" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "msdr_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_card_time_logs" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "operatorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "duration" DECIMAL(65,30),

    CONSTRAINT "job_card_time_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_budgets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "estimatedCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "actualCost" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "project_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_teams" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "project_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_entries" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entryDate" TIMESTAMP(3),
    "entryType" TEXT,
    "category" TEXT,
    "referenceDocType" TEXT,

    CONSTRAINT "account_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assembly_headers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assemblyNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assemblyName" TEXT,
    "parentAssemblyId" TEXT,

    CONSTRAINT "assembly_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_trials" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "trialNumber" TEXT NOT NULL,
    "trialDate" TIMESTAMP(3),
    "trialStage" TEXT DEFAULT 'T0',
    "machineName" TEXT,
    "pressTonnage" TEXT,
    "spmRate" TEXT,
    "bolsterHeight" TEXT,
    "cushionPressure" TEXT,
    "sampleQty" INTEGER DEFAULT 10,
    "result" TEXT DEFAULT 'PASS',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "defectLog" TEXT,
    "customerSignoff" BOOLEAN NOT NULL DEFAULT false,
    "signoffDate" TIMESTAMP(3),
    "signoffBy" TEXT,
    "inspectorName" TEXT,
    "reportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_trials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_rework_orders" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reworkNumber" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partNumber" TEXT,
    "bomItemId" TEXT,
    "sourceStage" TEXT NOT NULL DEFAULT 'MACHINING',
    "reworkType" TEXT NOT NULL DEFAULT 'CORRECTIVE_MACHINING',
    "defectReason" TEXT NOT NULL DEFAULT 'DIMENSION_DEVIATION',
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "severity" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "targetDepartment" TEXT NOT NULL DEFAULT 'MACHINE_SHOP',
    "assignedTo" TEXT,
    "machineId" TEXT,
    "estimatedHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "actualHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "costImpact" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "inspectionResult" TEXT DEFAULT 'PENDING',
    "resolutionNotes" TEXT,
    "trialId" TEXT,
    "ncrId" TEXT,
    "requestedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_rework_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assembly_components" (
    "id" TEXT NOT NULL,
    "assemblyHeaderId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "assembly_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_links" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'REFERENCE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceEntityType" TEXT,
    "targetEntityType" TEXT,

    CONSTRAINT "document_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_registries" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "document_registries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_export_jobs" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "failedRecords" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entityType" TEXT,
    "processedRow" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "import_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "templateCode" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateKey" TEXT,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateKey" TEXT,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_sequences" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "padding" INTEGER NOT NULL DEFAULT 4,
    "suffix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "zeroPadding" BOOLEAN NOT NULL DEFAULT true,
    "financialYear" TEXT,

    CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plantId" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workflowName" TEXT,
    "completedAt" TIMESTAMP(3),
    "entityType" TEXT,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_step_instances" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stepOrder" INTEGER NOT NULL DEFAULT 0,
    "errorPayload" JSONB,
    "completedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_step_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT 'MACHINE',
    "machineId" TEXT,
    "dieToolName" TEXT,
    "toolNumber" TEXT,
    "brokenComponent" TEXT,
    "strokeCountAtFailure" INTEGER,
    "failureMode" TEXT,
    "actionRequired" TEXT,
    "issueDescription" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "lotoApplied" BOOLEAN NOT NULL DEFAULT false,
    "reportedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "projectId" TEXT,
    "plantId" TEXT,
    "totalCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "category" TEXT,
    "downtimeStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "maintenance_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "timeSpentHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "loggedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_spare_parts" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantityConsumed" DECIMAL(65,30) NOT NULL,
    "costAtTime" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_spare_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "snapshot" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "SystemRole" NOT NULL,
    "module" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_asset_categories" (
    "id" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "global_asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_asset_locations" (
    "id" TEXT NOT NULL,
    "locationCode" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "building" TEXT,
    "room" TEXT,
    "rackBin" TEXT,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "global_asset_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_assets" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subCategory" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "partNumber" TEXT,
    "description" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "availableQty" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "issuedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'NOS',
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "locationId" TEXT,
    "storageRack" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "warrantyExpiry" TIMESTAMP(3),
    "status" "GlobalAssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "qrCode" TEXT,
    "barcode" TEXT,
    "imageUrl" TEXT,
    "documentUrls" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "global_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_asset_issue_transactions" (
    "id" TEXT NOT NULL,
    "issueNumber" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" TIMESTAMP(3),
    "actualReturnDate" TIMESTAMP(3),
    "conditionBeforeIssue" TEXT NOT NULL DEFAULT 'GOOD',
    "conditionAfterReturn" TEXT,
    "status" "GlobalAssetIssueStatus" NOT NULL DEFAULT 'ISSUED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "global_asset_issue_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_asset_return_transactions" (
    "id" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "issueTransactionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "returnedQty" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conditionAfterReturn" TEXT NOT NULL DEFAULT 'GOOD',
    "damageDetails" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "global_asset_return_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_asset_maintenance_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "issueReported" TEXT NOT NULL,
    "assignedTechnician" TEXT,
    "maintenanceStart" TIMESTAMP(3),
    "maintenanceEnd" TIMESTAMP(3),
    "cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "GlobalAssetMaintenanceStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "global_asset_maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_asset_audit_logs" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_asset_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_monthly_salaries" (
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
CREATE TABLE "master_category_options" (
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
CREATE TABLE "idempotency_records" (
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

-- CreateTable
CREATE TABLE "rfq_headers" (
    "id" TEXT NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "expectedDeliveryDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RfqStatus" NOT NULL DEFAULT 'NEW',
    "projectId" TEXT,
    "lostReason" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "rfq_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_items" (
    "id" TEXT NOT NULL,
    "rfqHeaderId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partDescription" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "uom" TEXT NOT NULL DEFAULT 'NOS',
    "specifications" TEXT,
    "drawingReference" TEXT,
    "targetPrice" DECIMAL(65,30),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "rfq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_cost_estimates" (
    "id" TEXT NOT NULL,
    "rfqItemId" TEXT NOT NULL,
    "materialCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "machiningHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "machiningCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "labourHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "labourCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subcontractCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overheadPercent" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "overheadCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalEstimatedCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "rfq_cost_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "rfqHeaderId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "markupPercent" DECIMAL(65,30) NOT NULL DEFAULT 15,
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxPercent" DECIMAL(65,30) NOT NULL DEFAULT 18,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "validUntil" TIMESTAMP(3),
    "termsAndConditions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "rfqItemId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "uom" TEXT NOT NULL DEFAULT 'NOS',
    "unitPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_companyCode_key" ON "companies"("companyCode");

-- CreateIndex
CREATE UNIQUE INDEX "plants_plantCode_key" ON "plants"("plantCode");

-- CreateIndex
CREATE UNIQUE INDEX "departments_departmentCode_key" ON "departments"("departmentCode");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customerCode_key" ON "customers"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_vendorCode_key" ON "vendors"("vendorCode");

-- CreateIndex
CREATE UNIQUE INDEX "materials_materialCode_key" ON "materials"("materialCode");

-- CreateIndex
CREATE UNIQUE INDEX "material_shapes_shapeName_key" ON "material_shapes"("shapeName");

-- CreateIndex
CREATE UNIQUE INDEX "machines_machineCode_key" ON "machines"("machineCode");

-- CreateIndex
CREATE UNIQUE INDEX "operations_operationCode_key" ON "operations"("operationCode");

-- CreateIndex
CREATE UNIQUE INDEX "tools_toolCode_key" ON "tools"("toolCode");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeCode_key" ON "employees"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_shiftName_key" ON "shifts"("shiftName");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_warehouseCode_key" ON "warehouses"("warehouseCode");

-- CreateIndex
CREATE UNIQUE INDEX "storage_locations_locationCode_key" ON "storage_locations"("locationCode");

-- CreateIndex
CREATE UNIQUE INDEX "uoms_uomCode_key" ON "uoms"("uomCode");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_standards_standardCode_key" ON "inspection_standards"("standardCode");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_typeCode_key" ON "document_types"("typeCode");

-- CreateIndex
CREATE UNIQUE INDEX "projects_projectNumber_key" ON "projects"("projectNumber");

-- CreateIndex
CREATE INDEX "projects_plantId_status_idx" ON "projects"("plantId", "status");

-- CreateIndex
CREATE INDEX "projects_currentStage_idx" ON "projects"("currentStage");

-- CreateIndex
CREATE INDEX "projects_customerId_idx" ON "projects"("customerId");

-- CreateIndex
CREATE INDEX "projects_createdAt_idx" ON "projects"("createdAt");

-- CreateIndex
CREATE INDEX "bill_of_material_items_bomHeaderId_idx" ON "bill_of_material_items"("bomHeaderId");

-- CreateIndex
CREATE INDEX "bill_of_material_items_materialId_idx" ON "bill_of_material_items"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_headers_poNumber_key" ON "purchase_order_headers"("poNumber");

-- CreateIndex
CREATE INDEX "purchase_order_headers_projectId_status_idx" ON "purchase_order_headers"("projectId", "status");

-- CreateIndex
CREATE INDEX "purchase_order_headers_vendorId_idx" ON "purchase_order_headers"("vendorId");

-- CreateIndex
CREATE INDEX "purchase_order_items_poHeaderId_idx" ON "purchase_order_items"("poHeaderId");

-- CreateIndex
CREATE INDEX "purchase_order_items_materialId_idx" ON "purchase_order_items"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipt_headers_grnNumber_key" ON "goods_receipt_headers"("grnNumber");

-- CreateIndex
CREATE INDEX "goods_receipt_headers_projectId_idx" ON "goods_receipt_headers"("projectId");

-- CreateIndex
CREATE INDEX "goods_receipt_headers_poHeaderId_idx" ON "goods_receipt_headers"("poHeaderId");

-- CreateIndex
CREATE INDEX "goods_receipt_items_grnHeaderId_idx" ON "goods_receipt_items"("grnHeaderId");

-- CreateIndex
CREATE INDEX "goods_receipt_items_poItemId_idx" ON "goods_receipt_items"("poItemId");

-- CreateIndex
CREATE UNIQUE INDEX "material_issue_headers_issueNumber_key" ON "material_issue_headers"("issueNumber");

-- CreateIndex
CREATE INDEX "material_issue_items_issueHeaderId_idx" ON "material_issue_items"("issueHeaderId");

-- CreateIndex
CREATE INDEX "material_issue_items_inventoryBatchId_idx" ON "material_issue_items"("inventoryBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_headers_inspectionNumber_key" ON "inspection_headers"("inspectionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ncr_reports_ncrNumber_key" ON "ncr_reports"("ncrNumber");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_notes_dispatchNumber_key" ON "dispatch_notes"("dispatchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_headers_invoiceNumber_key" ON "invoice_headers"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoice_headers_projectId_idx" ON "invoice_headers"("projectId");

-- CreateIndex
CREATE INDEX "invoice_headers_paymentStatus_idx" ON "invoice_headers"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stock_materialId_warehouseId_key" ON "inventory_stock"("materialId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_batches_batchNumber_key" ON "inventory_batches"("batchNumber");

-- CreateIndex
CREATE INDEX "inventory_batches_materialId_status_idx" ON "inventory_batches"("materialId", "status");

-- CreateIndex
CREATE INDEX "inventory_batches_grnItemId_idx" ON "inventory_batches"("grnItemId");

-- CreateIndex
CREATE INDEX "inventory_transactions_projectId_idx" ON "inventory_transactions"("projectId");

-- CreateIndex
CREATE INDEX "inventory_transactions_inventoryBatchId_idx" ON "inventory_transactions"("inventoryBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "production_batches_batchNumber_key" ON "production_batches"("batchNumber");

-- CreateIndex
CREATE INDEX "project_activities_projectId_idx" ON "project_activities"("projectId");

-- CreateIndex
CREATE INDEX "design_work_logs_projectId_idx" ON "design_work_logs"("projectId");

-- CreateIndex
CREATE INDEX "project_cost_events_projectId_idx" ON "project_cost_events"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_cost_summary_projectId_key" ON "project_cost_summary"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "subcontract_orders_challanNumber_key" ON "subcontract_orders"("challanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "subcontract_receipts_receiptNumber_key" ON "subcontract_receipts"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "dynamic_forms_formId_key" ON "dynamic_forms"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "planning_recommendations_recommendationNo_key" ON "planning_recommendations"("recommendationNo");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_request_headers_prNumber_key" ON "purchase_request_headers"("prNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_bills_billNumber_key" ON "vendor_bills"("billNumber");

-- CreateIndex
CREATE UNIQUE INDEX "project_budgets_projectId_key" ON "project_budgets"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "assembly_headers_assemblyNumber_key" ON "assembly_headers"("assemblyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "part_rework_orders_reworkNumber_key" ON "part_rework_orders"("reworkNumber");

-- CreateIndex
CREATE INDEX "part_rework_orders_projectId_status_idx" ON "part_rework_orders"("projectId", "status");

-- CreateIndex
CREATE INDEX "part_rework_orders_sourceStage_idx" ON "part_rework_orders"("sourceStage");

-- CreateIndex
CREATE UNIQUE INDEX "document_registries_documentNumber_key" ON "document_registries"("documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_templateCode_key" ON "notification_templates"("templateCode");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_templateKey_key" ON "notification_templates"("templateKey");

-- CreateIndex
CREATE UNIQUE INDEX "document_sequences_documentType_key" ON "document_sequences"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_settingKey_key" ON "system_settings"("settingKey");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_plantId_settingKey_key" ON "system_settings"("plantId", "settingKey");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_tickets_ticketNumber_key" ON "maintenance_tickets"("ticketNumber");

-- CreateIndex
CREATE INDEX "maintenance_tickets_targetType_idx" ON "maintenance_tickets"("targetType");

-- CreateIndex
CREATE INDEX "maintenance_tickets_status_idx" ON "maintenance_tickets"("status");

-- CreateIndex
CREATE INDEX "audit_logs_entityId_idx" ON "audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_performedBy_idx" ON "audit_logs"("performedBy");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_module_key" ON "role_permissions"("role", "module");

-- CreateIndex
CREATE UNIQUE INDEX "global_asset_categories_categoryCode_key" ON "global_asset_categories"("categoryCode");

-- CreateIndex
CREATE UNIQUE INDEX "global_asset_locations_locationCode_key" ON "global_asset_locations"("locationCode");

-- CreateIndex
CREATE UNIQUE INDEX "global_assets_assetId_key" ON "global_assets"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "global_assets_assetCode_key" ON "global_assets"("assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "global_asset_issue_transactions_issueNumber_key" ON "global_asset_issue_transactions"("issueNumber");

-- CreateIndex
CREATE UNIQUE INDEX "global_asset_return_transactions_returnNumber_key" ON "global_asset_return_transactions"("returnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "global_asset_maintenance_requests_requestNumber_key" ON "global_asset_maintenance_requests"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "employee_monthly_salaries_employeeId_monthYear_key" ON "employee_monthly_salaries"("employeeId", "monthYear");

-- CreateIndex
CREATE UNIQUE INDEX "master_category_options_category_code_key" ON "master_category_options"("category", "code");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_key_key" ON "idempotency_records"("key");

-- CreateIndex
CREATE INDEX "idempotency_records_key_idx" ON "idempotency_records"("key");

-- CreateIndex
CREATE INDEX "idempotency_records_expiresAt_idx" ON "idempotency_records"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_headers_rfqNumber_key" ON "rfq_headers"("rfqNumber");

-- CreateIndex
CREATE INDEX "rfq_headers_customerId_idx" ON "rfq_headers"("customerId");

-- CreateIndex
CREATE INDEX "rfq_headers_projectId_idx" ON "rfq_headers"("projectId");

-- CreateIndex
CREATE INDEX "rfq_headers_status_idx" ON "rfq_headers"("status");

-- CreateIndex
CREATE INDEX "rfq_headers_createdAt_idx" ON "rfq_headers"("createdAt");

-- CreateIndex
CREATE INDEX "rfq_items_rfqHeaderId_idx" ON "rfq_items"("rfqHeaderId");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_cost_estimates_rfqItemId_key" ON "rfq_cost_estimates"("rfqItemId");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotationNumber_key" ON "quotations"("quotationNumber");

-- CreateIndex
CREATE INDEX "quotations_rfqHeaderId_idx" ON "quotations"("rfqHeaderId");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotation_items_quotationId_idx" ON "quotation_items"("quotationId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_primaryPlantId_fkey" FOREIGN KEY ("primaryPlantId") REFERENCES "plants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "material_shapes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_rfqHeaderId_fkey" FOREIGN KEY ("rfqHeaderId") REFERENCES "rfq_headers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_revisions" ADD CONSTRAINT "document_revisions_projectDocumentId_fkey" FOREIGN KEY ("projectDocumentId") REFERENCES "project_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_material_headers" ADD CONSTRAINT "bill_of_material_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_material_items" ADD CONSTRAINT "bill_of_material_items_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "bill_of_material_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bill_of_material_items" ADD CONSTRAINT "bill_of_material_items_bomHeaderId_fkey" FOREIGN KEY ("bomHeaderId") REFERENCES "bill_of_material_headers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_material_items" ADD CONSTRAINT "bill_of_material_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_headers" ADD CONSTRAINT "routing_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_operations" ADD CONSTRAINT "routing_operations_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_operations" ADD CONSTRAINT "routing_operations_plannedMachineId_fkey" FOREIGN KEY ("plannedMachineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_operations" ADD CONSTRAINT "routing_operations_routingHeaderId_fkey" FOREIGN KEY ("routingHeaderId") REFERENCES "routing_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requirements" ADD CONSTRAINT "material_requirements_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requirements" ADD CONSTRAINT "material_requirements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_headers" ADD CONSTRAINT "purchase_order_headers_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "purchase_request_headers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_headers" ADD CONSTRAINT "purchase_order_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_headers" ADD CONSTRAINT "purchase_order_headers_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_poHeaderId_fkey" FOREIGN KEY ("poHeaderId") REFERENCES "purchase_order_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_headers" ADD CONSTRAINT "goods_receipt_headers_poHeaderId_fkey" FOREIGN KEY ("poHeaderId") REFERENCES "purchase_order_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_headers" ADD CONSTRAINT "goods_receipt_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_grnHeaderId_fkey" FOREIGN KEY ("grnHeaderId") REFERENCES "goods_receipt_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "purchase_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issue_headers" ADD CONSTRAINT "material_issue_headers_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issue_headers" ADD CONSTRAINT "material_issue_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issue_items" ADD CONSTRAINT "material_issue_items_inventoryBatchId_fkey" FOREIGN KEY ("inventoryBatchId") REFERENCES "inventory_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_issue_items" ADD CONSTRAINT "material_issue_items_issueHeaderId_fkey" FOREIGN KEY ("issueHeaderId") REFERENCES "material_issue_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_headers" ADD CONSTRAINT "inspection_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_headers" ADD CONSTRAINT "inspection_headers_routingOperationId_fkey" FOREIGN KEY ("routingOperationId") REFERENCES "routing_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_measurements" ADD CONSTRAINT "inspection_measurements_inspectionHeaderId_fkey" FOREIGN KEY ("inspectionHeaderId") REFERENCES "inspection_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_measurements" ADD CONSTRAINT "inspection_measurements_inspectionStandardId_fkey" FOREIGN KEY ("inspectionStandardId") REFERENCES "inspection_standards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncr_reports" ADD CONSTRAINT "ncr_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_notes" ADD CONSTRAINT "dispatch_notes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_notes" ADD CONSTRAINT "dispatch_notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_dispatchNoteId_fkey" FOREIGN KEY ("dispatchNoteId") REFERENCES "dispatch_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_headers" ADD CONSTRAINT "invoice_headers_dispatchNoteId_fkey" FOREIGN KEY ("dispatchNoteId") REFERENCES "dispatch_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_headers" ADD CONSTRAINT "invoice_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoiceHeaderId_fkey" FOREIGN KEY ("invoiceHeaderId") REFERENCES "invoice_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceHeaderId_fkey" FOREIGN KEY ("invoiceHeaderId") REFERENCES "invoice_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_grnItemId_fkey" FOREIGN KEY ("grnItemId") REFERENCES "goods_receipt_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "storage_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_subcontractReceiptItemId_fkey" FOREIGN KEY ("subcontractReceiptItemId") REFERENCES "subcontract_receipt_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventoryBatchId_fkey" FOREIGN KEY ("inventoryBatchId") REFERENCES "inventory_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_operations" ADD CONSTRAINT "production_operations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_operations" ADD CONSTRAINT "production_operations_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_operations" ADD CONSTRAINT "production_operations_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "production_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_operations" ADD CONSTRAINT "production_operations_routingOperationId_fkey" FOREIGN KEY ("routingOperationId") REFERENCES "routing_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_shop_daily_reports" ADD CONSTRAINT "machine_shop_daily_reports_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_shop_daily_reports" ADD CONSTRAINT "machine_shop_daily_reports_inventoryBatchId_fkey" FOREIGN KEY ("inventoryBatchId") REFERENCES "inventory_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_shop_daily_reports" ADD CONSTRAINT "machine_shop_daily_reports_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "design_work_logs" ADD CONSTRAINT "design_work_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_cost_events" ADD CONSTRAINT "project_cost_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_cost_summary" ADD CONSTRAINT "project_cost_summary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_orders" ADD CONSTRAINT "subcontract_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_orders" ADD CONSTRAINT "subcontract_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_order_items" ADD CONSTRAINT "subcontract_order_items_inventoryBatchId_fkey" FOREIGN KEY ("inventoryBatchId") REFERENCES "inventory_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_order_items" ADD CONSTRAINT "subcontract_order_items_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_order_items" ADD CONSTRAINT "subcontract_order_items_subcontractOrderId_fkey" FOREIGN KEY ("subcontractOrderId") REFERENCES "subcontract_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_receipts" ADD CONSTRAINT "subcontract_receipts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_receipts" ADD CONSTRAINT "subcontract_receipts_subcontractOrderId_fkey" FOREIGN KEY ("subcontractOrderId") REFERENCES "subcontract_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_receipt_items" ADD CONSTRAINT "subcontract_receipt_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "subcontract_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_receipt_items" ADD CONSTRAINT "subcontract_receipt_items_subcontractReceiptId_fkey" FOREIGN KEY ("subcontractReceiptId") REFERENCES "subcontract_receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "planning_runs" ADD CONSTRAINT "planning_runs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_exceptions" ADD CONSTRAINT "planning_exceptions_planningRunId_fkey" FOREIGN KEY ("planningRunId") REFERENCES "planning_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_exceptions" ADD CONSTRAINT "planning_exceptions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_recommendations" ADD CONSTRAINT "planning_recommendations_planningRunId_fkey" FOREIGN KEY ("planningRunId") REFERENCES "planning_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_recommendation_items" ADD CONSTRAINT "planning_recommendation_items_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "planning_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_recommendation_items" ADD CONSTRAINT "planning_recommendation_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_headers" ADD CONSTRAINT "purchase_request_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_prHeaderId_fkey" FOREIGN KEY ("prHeaderId") REFERENCES "purchase_request_headers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_poHeaderId_fkey" FOREIGN KEY ("poHeaderId") REFERENCES "purchase_order_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill_items" ADD CONSTRAINT "vendor_bill_items_vendorBillId_fkey" FOREIGN KEY ("vendorBillId") REFERENCES "vendor_bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill_items" ADD CONSTRAINT "vendor_bill_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "purchase_returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msdr_headers" ADD CONSTRAINT "msdr_headers_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msdr_headers" ADD CONSTRAINT "msdr_headers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msdr_operations" ADD CONSTRAINT "msdr_operations_msdrHeaderId_fkey" FOREIGN KEY ("msdrHeaderId") REFERENCES "msdr_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msdr_operations" ADD CONSTRAINT "msdr_operations_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_card_time_logs" ADD CONSTRAINT "job_card_time_logs_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_budgets" ADD CONSTRAINT "project_budgets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_teams" ADD CONSTRAINT "project_teams_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_teams" ADD CONSTRAINT "project_teams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_entries" ADD CONSTRAINT "account_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_headers" ADD CONSTRAINT "assembly_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_headers" ADD CONSTRAINT "assembly_headers_parentAssemblyId_fkey" FOREIGN KEY ("parentAssemblyId") REFERENCES "assembly_headers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_trials" ADD CONSTRAINT "project_trials_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_rework_orders" ADD CONSTRAINT "part_rework_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_rework_orders" ADD CONSTRAINT "part_rework_orders_trialId_fkey" FOREIGN KEY ("trialId") REFERENCES "project_trials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_components" ADD CONSTRAINT "assembly_components_assemblyHeaderId_fkey" FOREIGN KEY ("assemblyHeaderId") REFERENCES "assembly_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_components" ADD CONSTRAINT "assembly_components_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_step_instances" ADD CONSTRAINT "workflow_step_instances_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "maintenance_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_spare_parts" ADD CONSTRAINT "maintenance_spare_parts_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "maintenance_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_spare_parts" ADD CONSTRAINT "maintenance_spare_parts_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_assets" ADD CONSTRAINT "global_assets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "global_asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_assets" ADD CONSTRAINT "global_assets_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "global_asset_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_asset_issue_transactions" ADD CONSTRAINT "global_asset_issue_transactions_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "global_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_asset_issue_transactions" ADD CONSTRAINT "global_asset_issue_transactions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_asset_return_transactions" ADD CONSTRAINT "global_asset_return_transactions_issueTransactionId_fkey" FOREIGN KEY ("issueTransactionId") REFERENCES "global_asset_issue_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_asset_return_transactions" ADD CONSTRAINT "global_asset_return_transactions_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "global_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_asset_return_transactions" ADD CONSTRAINT "global_asset_return_transactions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_asset_maintenance_requests" ADD CONSTRAINT "global_asset_maintenance_requests_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "global_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_asset_audit_logs" ADD CONSTRAINT "global_asset_audit_logs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "global_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_monthly_salaries" ADD CONSTRAINT "employee_monthly_salaries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_headers" ADD CONSTRAINT "rfq_headers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_headers" ADD CONSTRAINT "rfq_headers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_rfqHeaderId_fkey" FOREIGN KEY ("rfqHeaderId") REFERENCES "rfq_headers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_cost_estimates" ADD CONSTRAINT "rfq_cost_estimates_rfqItemId_fkey" FOREIGN KEY ("rfqItemId") REFERENCES "rfq_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_rfqHeaderId_fkey" FOREIGN KEY ("rfqHeaderId") REFERENCES "rfq_headers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_rfqItemId_fkey" FOREIGN KEY ("rfqItemId") REFERENCES "rfq_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

