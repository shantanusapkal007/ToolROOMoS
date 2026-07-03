-- CreateEnum
CREATE TYPE "SubcontractOrderStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIAL_RECEIPT', 'CLOSED', 'CANCELLED');

-- AlterTable
ALTER TABLE "inventory_batches" ADD COLUMN     "subcontractReceiptItemId" TEXT;

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

-- CreateIndex
CREATE UNIQUE INDEX "subcontract_orders_challanNumber_key" ON "subcontract_orders"("challanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "subcontract_receipts_receiptNumber_key" ON "subcontract_receipts"("receiptNumber");

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_subcontractReceiptItemId_fkey" FOREIGN KEY ("subcontractReceiptItemId") REFERENCES "subcontract_receipt_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_orders" ADD CONSTRAINT "subcontract_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_orders" ADD CONSTRAINT "subcontract_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_order_items" ADD CONSTRAINT "subcontract_order_items_subcontractOrderId_fkey" FOREIGN KEY ("subcontractOrderId") REFERENCES "subcontract_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_order_items" ADD CONSTRAINT "subcontract_order_items_inventoryBatchId_fkey" FOREIGN KEY ("inventoryBatchId") REFERENCES "inventory_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_order_items" ADD CONSTRAINT "subcontract_order_items_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_receipts" ADD CONSTRAINT "subcontract_receipts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_receipts" ADD CONSTRAINT "subcontract_receipts_subcontractOrderId_fkey" FOREIGN KEY ("subcontractOrderId") REFERENCES "subcontract_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_receipt_items" ADD CONSTRAINT "subcontract_receipt_items_subcontractReceiptId_fkey" FOREIGN KEY ("subcontractReceiptId") REFERENCES "subcontract_receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontract_receipt_items" ADD CONSTRAINT "subcontract_receipt_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "subcontract_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
