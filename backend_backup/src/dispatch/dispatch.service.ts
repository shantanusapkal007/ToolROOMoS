// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEngine } from '../platform/audit.engine';
import { EventBus } from '../platform/event.bus';

@Injectable()
export class DispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditEngine,
    private readonly eventBus: EventBus
  ) {}

  async getDispatches(projectId?: string) {
    const where = projectId ? { projectId } : {};
    return this.prisma.dispatchNote.findMany({
      where,
      include: {
        customer: true,
        project: true,
        items: { include: { material: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDispatch(data: {
    projectId: string;
    customerId: string;
    vehicleNumber?: string;
    logisticsCost?: number;
    items: Array<{ materialId: string; quantity: number; partDescription: string }>;
    userId?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const dispatchNumber = `DC-${Date.now()}`;
      
      const dispatchNote = await tx.dispatchNote.create({
        data: {
          projectId: data.projectId,
          customerId: data.customerId,
          dispatchNumber,
          vehicleNumber: data.vehicleNumber,
          logisticsCost: data.logisticsCost || 0,
          dispatchQty: data.items.reduce((acc, item) => acc + item.quantity, 0),
          createdBy: data.userId || 'SYSTEM',
          status: 'COMPLETED', // Execute instantly for prototype
          items: {
            create: data.items.map(item => ({
              materialId: item.materialId,
              partDescription: item.partDescription,
              quantity: item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // Emit DispatchCreated event for Cost Engine
      this.eventBus.emit('DispatchCreated', {
        projectId: dispatchNote.projectId,
        dispatchId: dispatchNote.id,
        dispatchNumber: dispatchNote.dispatchNumber,
        logisticsCost: Number(data.logisticsCost) || 0,
        userId: data.userId || 'SYSTEM'
      });

      // Execute stock depletion logic immediately
      const warehouseId = 'MAIN_WH';

      for (const item of dispatchNote.items) {
        if (!item.materialId) continue;

        const requiredQty = Number(item.quantity);

        const stock = await tx.inventoryStock.findUnique({
          where: { materialId_warehouseId: { materialId: item.materialId, warehouseId } },
        });

        if (!stock || Number(stock.availableQuantity) < requiredQty) {
          throw new BadRequestException(`Insufficient stock for material ID: ${item.materialId}`);
        }

        // Deduct Stock
        await tx.inventoryStock.update({
          where: { id: stock.id },
          data: {
            availableQuantity: { decrement: requiredQty },
            currentQuantity: { decrement: requiredQty },
          },
        });

        // Find available batch to log transaction against
        const batch = await tx.inventoryBatch.findFirst({
          where: { materialId: item.materialId, availableQty: { gte: requiredQty } },
        });

        if (batch) {
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: {
              availableQty: { decrement: requiredQty },
              currentQty: { decrement: requiredQty },
            },
          });
        }

        // Log SALES_DISPATCH Transaction
        await tx.inventoryTransaction.create({
          data: {
            inventoryBatchId: batch ? batch.id : 'VIRTUAL',
            movementType: 'SALES_DISPATCH',
            quantity: -requiredQty,
            referenceDocType: 'DISPATCH_NOTE',
            referenceDocId: dispatchNote.id,
            remarks: `Dispatched against Delivery Challan ${dispatchNumber}`,
          },
        });
      }

      await this.audit.logAction(dispatchNote.id, 'DISPATCH', 'CREATE_AND_EXECUTE', data.userId || 'SYSTEM', dispatchNote);
      return dispatchNote;
    });
  }
}
