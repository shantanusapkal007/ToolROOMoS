// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../platform/event.bus';
import { AuditEngine } from '../platform/audit.engine';

/**
 * @deprecated Use specific domain services (MaterialIssuesService, StockQueryService, GoodsReceiptSubscriber)
 */
@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
// @ts-nocheck
  ) {}

  // ================= GRN (GOODS RECEIPT NOTE) =================
  async getGoodsReceipts() {
    return this.prisma.goodsReceiptHeader.findMany({
      include: {
        poHeader: true,
        items: { include: { poItem: { include: { material: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGoodsReceipt(poHeaderId: string, vendorId: string, items: any[], userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrderHeader.findUnique({ where: { id: poHeaderId } });
      if (!po) throw new BadRequestException('PO not found');

      // 1. Create GRN Header
      const grnHeader = await tx.goodsReceiptHeader.create({
        data: {
          poHeaderId,
          projectId: po.projectId,
          grnNumber: `GRN-${Date.now()}`,
          createdBy: userId,
          items: {
            create: items.map(item => ({
              poItemId: item.poItemId,
              receivedQty: item.receivedQty,
              acceptedQty: item.receivedQty, // Pre-inspection assumption
              actualRate: item.actualRate || 0,
              warehouseId: item.warehouseId,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of grnHeader.items) {
        // 2. Fetch poItem to get materialId and update receivedQty
        let materialId = '';
        if (item.poItemId) {
          const poItem = await tx.purchaseOrderItem.update({
            where: { id: item.poItemId },
            data: { receivedQty: { increment: item.receivedQty } },
          });
          materialId = poItem.materialId;
        }

        if (!materialId) throw new BadRequestException('Material ID could not be resolved from PO Item');

        // 3. Create Inventory Batch (Traceability)
        const batch = await tx.inventoryBatch.create({
          data: {
            materialId,
            grnItemId: item.id,
            batchNumber: `BCH-${Date.now()}-${materialId.substring(0, 4)}`,
            receivedQty: item.receivedQty,
            currentQty: item.receivedQty,
            availableQty: item.receivedQty,
          },
        });

        const warehouseId = item.warehouseId || 'MAIN_WH';

        // 4. Update Global Stock Ledger
        const existingStock = await tx.inventoryStock.findUnique({
          where: { materialId_warehouseId: { materialId, warehouseId } },
        });

        if (existingStock) {
          await tx.inventoryStock.update({
            where: { id: existingStock.id },
            data: {
              currentQuantity: { increment: item.receivedQty },
              availableQuantity: { increment: item.receivedQty },
            },
          });
        } else {
          await tx.inventoryStock.create({
            data: {
              materialId,
              warehouseId,
              currentQuantity: item.receivedQty,
              availableQuantity: item.receivedQty,
            },
          });
        }

        // 5. Log Inventory Transaction (IN)
        await tx.inventoryTransaction.create({
          data: {
            inventoryBatchId: batch.id,
            movementType: 'GRN_RECEIPT',
            quantity: item.receivedQty,
            referenceDocType: 'GRN',
            referenceDocId: grnHeader.id,
            remarks: `Received via PO`,
          },
        });
      }

      await this.audit.logAction(grnHeader.id, 'GOODS_RECEIPT', 'CREATE', userId, grnHeader);
      return grnHeader;
    });
  }

  // ================= MATERIAL ISSUE =================
  async getMaterialIssues(projectId?: string) {
    const where = projectId ? { projectId } : {};
    return this.prisma.materialIssueHeader.findMany({
      where,
      include: {
        project: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMaterialIssue(projectId: string, departmentId: string, items: any[], userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Issue Header
      const issueHeader = await tx.materialIssueHeader.create({
        data: {
          projectId,
          departmentId,
          issueNumber: `ISS-${Date.now()}`,
          issuedBy: userId,
          items: {
            create: items.map(item => ({
              materialId: item.materialId,
              issuedQty: item.issuedQty,
              inventoryBatchId: item.inventoryBatchId,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of issueHeader.items) {
        // Find warehouse for this batch
        const batch = await tx.inventoryBatch.findUnique({
          where: { id: item.inventoryBatchId },
          include: { grnItem: true },
        });

        if (!batch) throw new BadRequestException(`Batch ${item.inventoryBatchId} not found`);
        const warehouseId = batch.grnItem?.warehouseId || 'MAIN_WH';
        const materialId = batch.materialId;

        if (batch.availableQty < item.issuedQty) {
          throw new BadRequestException(`Insufficient stock in Batch ${batch.batchNumber}`);
        }

        // 2. Decrement Batch Available Qty
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: { availableQty: { decrement: item.issuedQty }, currentQty: { decrement: item.issuedQty } },
        });

        // 3. Decrement Global Stock
        await tx.inventoryStock.update({
          where: { materialId_warehouseId: { materialId, warehouseId } },
          data: {
            currentQuantity: { decrement: item.issuedQty },
            availableQuantity: { decrement: item.issuedQty },
          },
        });

        // 4. Log Inventory Transaction (OUT)
        await tx.inventoryTransaction.create({
          data: {
            inventoryBatchId: batch.id,
            movementType: 'MATERIAL_ISSUE',
            quantity: -Math.abs(Number(item.issuedQty)),
            referenceDocType: 'ISSUE',
            referenceDocId: issueHeader.id,
            remarks: `Issued to project`,
          },
        });
      }

      await this.audit.logAction(issueHeader.id, 'MATERIAL_ISSUE', 'CREATE', userId, issueHeader);
      return issueHeader;
    });
  }

  // ================= STOCK REPORT =================
  async getGlobalStock() {
    return this.prisma.inventoryStock.findMany({
      include: {
        material: true,
        warehouse: true,
      },
    });
  }
}

