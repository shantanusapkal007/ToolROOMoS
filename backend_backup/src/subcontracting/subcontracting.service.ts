import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../platform/event.bus';
import { AuditEngine } from '../platform/audit.engine';

@Injectable()
export class SubcontractingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
  ) {}

  // ================= OUTWARD: SUBCONTRACT ORDER =================
  async getSubcontractOrders(projectId?: string) {
    const where = projectId ? { projectId } : {};
    return this.prisma.subcontractOrder.findMany({
      where,
      include: {
        vendor: true,
        project: true,
        items: { include: { operation: true, inventoryBatch: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubcontractOrder(projectId: string, vendorId: string, items: any[], userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      let totalEstimatedCost = 0;

      // 1. Create Subcontract Order (Challan)
      const order = await tx.subcontractOrder.create({
        data: {
          projectId,
          vendorId,
          challanNumber: `SUB-CH-${Date.now()}`,
          status: 'ISSUED', // Assuming immediate release for prototype
          createdBy: userId,
          items: {
            create: items.map(item => {
              const lineEstimatedCost = Number(item.sentQty) * Number(item.rate);
              totalEstimatedCost += lineEstimatedCost;
              return {
                inventoryBatchId: item.inventoryBatchId,
                operationId: item.operationId,
                sentQty: item.sentQty,
                rate: item.rate,
                lineEstimatedCost,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Update Total Cost
      await tx.subcontractOrder.update({
        where: { id: order.id },
        data: { totalEstimatedCost },
      });

      // 2. Issue Material to Subcontractor (Decrement Stock)
      const orderItems = await tx.subcontractOrderItem.findMany({ where: { subcontractOrderId: order.id } });
      for (const item of orderItems) {
        if (!item.inventoryBatchId) continue;

        const batch = await tx.inventoryBatch.findUnique({
          where: { id: item.inventoryBatchId },
          include: { grnItem: true },
        });

        if (!batch) throw new BadRequestException(`Batch not found`);
        const warehouseId = batch.grnItem?.warehouseId || 'MAIN_WH';
        const materialId = batch.materialId;

        if (batch.availableQty < item.sentQty) {
          throw new BadRequestException(`Insufficient stock in Batch ${batch.batchNumber}`);
        }

        // Decrement Batch
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: { availableQty: { decrement: item.sentQty }, currentQty: { decrement: item.sentQty } },
        });

        // Decrement Stock
        await tx.inventoryStock.update({
          where: { materialId_warehouseId: { materialId, warehouseId } },
          data: {
            currentQuantity: { decrement: item.sentQty },
            availableQuantity: { decrement: item.sentQty },
          },
        });

        // Log Transaction
        await tx.inventoryTransaction.create({
          data: {
            inventoryBatchId: batch.id,
            movementType: 'MATERIAL_ISSUE',
            quantity: -Math.abs(Number(item.sentQty)),
            referenceDocType: 'SUBCONTRACT_ORDER',
            referenceDocId: order.id,
            remarks: `Issued to subcontractor`,
          },
        });
      }

      await this.audit.logAction(order.id, 'SUBCONTRACT_ORDER', 'CREATE', userId, order);
      return order;
    });
  }

  // ================= INWARD: SUBCONTRACT RECEIPT =================
  async receiveSubcontract(orderId: string, items: any[], userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.subcontractOrder.findUnique({
        where: { id: orderId },
        include: { items: { include: { inventoryBatch: true } } },
      });

      if (!order) throw new NotFoundException('Subcontract Order not found');

      // 1. Create Subcontract Receipt
      const receipt = await tx.subcontractReceipt.create({
        data: {
          projectId: order.projectId,
          subcontractOrderId: order.id,
          receiptNumber: `SUB-RCV-${Date.now()}`,
          createdBy: userId,
          items: {
            create: items.map(item => ({
              orderItemId: item.orderItemId,
              receivedQty: item.receivedQty,
              acceptedQty: item.acceptedQty,
              rejectedQty: item.rejectedQty,
              actualRate: item.actualRate,
              actualProcessCost: Number(item.acceptedQty) * Number(item.actualRate),
            })),
          },
        },
        include: { items: true },
      });

      // 2. Add processed goods back to stock
      for (const item of receipt.items) {
        const orderItem = order.items.find(oi => oi.id === item.orderItemId);
        if (!orderItem || !orderItem.inventoryBatch) continue;

        const originalBatch = orderItem.inventoryBatch;
        const materialId = originalBatch.materialId;

        // Create new batch for received processed goods
        const newBatch = await tx.inventoryBatch.create({
          data: {
            materialId,
            grnItemId: originalBatch.grnItemId, // Inherit origin
            subcontractReceiptItemId: item.id,
            batchNumber: `BCH-SUB-${Date.now()}-${materialId.substring(0, 4)}`,
            receivedQty: item.acceptedQty,
            currentQty: item.acceptedQty,
            availableQty: item.acceptedQty,
            unitCost: Number(originalBatch.unitCost) + Number(item.actualRate), // Material + Process Cost
          },
        });

        // Increment Global Stock
        const warehouseId = 'MAIN_WH'; // Assume received to main WH

        const existingStock = await tx.inventoryStock.findUnique({
          where: { materialId_warehouseId: { materialId, warehouseId } },
        });

        if (existingStock) {
          await tx.inventoryStock.update({
            where: { id: existingStock.id },
            data: {
              currentQuantity: { increment: item.acceptedQty },
              availableQuantity: { increment: item.acceptedQty },
            },
          });
        } else {
          await tx.inventoryStock.create({
            data: {
              materialId,
              warehouseId,
              currentQuantity: item.acceptedQty,
              availableQuantity: item.acceptedQty,
            },
          });
        }

        // Log Inward Transaction
        await tx.inventoryTransaction.create({
          data: {
            inventoryBatchId: newBatch.id,
            movementType: 'GRN_RECEIPT',
            quantity: item.acceptedQty,
            referenceDocType: 'SUBCONTRACT_RECEIPT',
            referenceDocId: receipt.id,
            remarks: `Received from Subcontractor`,
          },
        });
      }

      await tx.subcontractOrder.update({
        where: { id: order.id },
        data: { status: 'CLOSED' },
      });

      await this.audit.logAction(receipt.id, 'SUBCONTRACT_RECEIPT', 'CREATE', userId, receipt);
      return receipt;
    });
  }
}
