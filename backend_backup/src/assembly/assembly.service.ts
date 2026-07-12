// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEngine } from '../platform/audit.engine';

@Injectable()
export class AssemblyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditEngine,
  ) {}

  async getPendingAssemblies(projectId?: string) {
    const where = projectId ? { bomHeader: { projectId }, isAssembly: true } : { isAssembly: true };
    return this.prisma.billOfMaterialItem.findMany({
      where,
      include: {
        bomHeader: { include: { project: true } },
        material: true,
        childItems: { include: { material: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async executeAssembly(bomItemId: string, qtyToAssemble: number, userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch Assembly BOM Item
      const parentItem = await tx.billOfMaterialItem.findUnique({
        where: { id: bomItemId },
        include: {
          material: true,
          childItems: { include: { material: true } },
          bomHeader: true,
        },
      });

      if (!parentItem) throw new NotFoundException('Assembly BOM Item not found');
      if (!parentItem.isAssembly) throw new BadRequestException('BOM Item is not flagged as an assembly');

      let totalMaterialCost = 0;
      const warehouseId = 'MAIN_WH'; // Default for prototype

      // 2. Consume Child Components
      for (const child of parentItem.childItems) {
        const requiredQtyForBatch = Number(child.requiredQty) * qtyToAssemble;

        // Check stock
        const stock = await tx.inventoryStock.findUnique({
          where: { materialId_warehouseId: { materialId: child.materialId, warehouseId } },
        });

        if (!stock || Number(stock.availableQuantity) < requiredQtyForBatch) {
          throw new BadRequestException(`Insufficient stock for child component: ${child.material?.materialCode}`);
        }

        // Deduct Stock
        await tx.inventoryStock.update({
          where: { id: stock.id },
          data: {
            availableQuantity: { decrement: requiredQtyForBatch },
            currentQuantity: { decrement: requiredQtyForBatch },
          },
        });

        // Find available batches to deduct (FIFO ideally, but taking first available for prototype)
        const batch = await tx.inventoryBatch.findFirst({
          where: { materialId: child.materialId, availableQty: { gte: requiredQtyForBatch } },
        });

        let batchIdForTx = null;
        if (batch) {
          batchIdForTx = batch.id;
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: {
              availableQty: { decrement: requiredQtyForBatch },
              currentQty: { decrement: requiredQtyForBatch },
            },
          });
          totalMaterialCost += (Number(batch.unitCost) * requiredQtyForBatch);
        } else {
          // Fallback estimated cost
          totalMaterialCost += (Number(child.material?.purchaseCost || 0) * requiredQtyForBatch);
        }

        // Log Issue Transaction
        await tx.inventoryTransaction.create({
          data: {
            inventoryBatchId: batchIdForTx || 'VIRTUAL', // Virtual if no batch tracked
            movementType: 'MATERIAL_ISSUE',
            quantity: -requiredQtyForBatch,
            referenceDocType: 'ASSEMBLY_ORDER',
            referenceDocId: parentItem.id,
            remarks: `Consumed for Assembly ${parentItem.material?.materialCode}`,
          },
        });
      }

      // 3. Receive Parent Finished Good
      const assemblyCost = totalMaterialCost + (Number(parentItem.estimatedProcessCost || 0) * qtyToAssemble);
      const unitCost = assemblyCost / qtyToAssemble;

      // Create new Batch for Finished Good
      const newBatch = await tx.inventoryBatch.create({
        data: {
          materialId: parentItem.materialId,
          batchNumber: `FG-ASM-${Date.now()}`,
          receivedQty: qtyToAssemble,
          currentQty: qtyToAssemble,
          availableQty: qtyToAssemble,
          unitCost,
        },
      });

      // Increment Stock for Parent
      const parentStock = await tx.inventoryStock.findUnique({
        where: { materialId_warehouseId: { materialId: parentItem.materialId, warehouseId } },
      });

      if (parentStock) {
        await tx.inventoryStock.update({
          where: { id: parentStock.id },
          data: {
            currentQuantity: { increment: qtyToAssemble },
            availableQuantity: { increment: qtyToAssemble },
          },
        });
      } else {
        await tx.inventoryStock.create({
          data: {
            materialId: parentItem.materialId,
            warehouseId,
            currentQuantity: qtyToAssemble,
            availableQuantity: qtyToAssemble,
          },
        });
      }

      // Log Receipt Transaction
      await tx.inventoryTransaction.create({
        data: {
          inventoryBatchId: newBatch.id,
          movementType: 'GRN_RECEIPT',
          quantity: qtyToAssemble,
          referenceDocType: 'ASSEMBLY_ORDER',
          referenceDocId: parentItem.id,
          remarks: `Received Finished Good from Assembly`,
        },
      });

      await this.audit.logAction(parentItem.id, 'ASSEMBLY', 'EXECUTE', userId, { qtyToAssemble, assemblyCost });
      return { parentItem, assembledQty: qtyToAssemble, newBatchId: newBatch.id };
    });
  }
}

