import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBus } from '../../platform/event.bus';
import { AuditEngine } from '../../platform/audit.engine';

@Injectable()
export class MaterialReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
  ) {}

  async getMaterialReturns(projectId?: string) {
    // Only return MATERIAL_RETURN transactions
    const where = projectId ? { projectId, movementType: 'MATERIAL_RETURN' as any } : { movementType: 'MATERIAL_RETURN' as any };
    return this.prisma.inventoryTransaction.findMany({
      where,
      include: {
        inventoryBatch: {
          include: {
            material: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async returnMaterial(projectId: string, issueId: string, returnQty: number, remarks: string, userId: string = 'SYSTEM') {
    const returnResult = await this.prisma.$transaction(async (tx) => {
      // 1. Fetch the material issue item
      const issueItem = await tx.materialIssueItem.findUnique({
        where: { id: issueId },
        include: {
          issueHeader: true,
          inventoryBatch: {
            include: {
              material: true,
            },
          },
        },
      });

      if (!issueItem) {
        throw new NotFoundException('Material Issue Item not found');
      }

      if (issueItem.issueHeader.projectId !== projectId) {
        throw new BadRequestException('Issue Item does not belong to this project');
      }

      if (returnQty <= 0) {
        throw new BadRequestException('Return quantity must be greater than 0');
      }

      const issuedQty = Number(issueItem.issuedQty);

      // Find previous returns
      const previousReturns = await tx.inventoryTransaction.findMany({
        where: {
          movementType: 'MATERIAL_RETURN' as any,
          referenceDocId: issueId,
        },
      });
      const previouslyReturned = previousReturns.reduce((sum, txItem) => sum + Number(txItem.quantity), 0);

      if (returnQty > (issuedQty - previouslyReturned)) {
        throw new BadRequestException(`Cannot return ${returnQty}. Only ${issuedQty - previouslyReturned} left to return.`);
      }

      const batch = issueItem.inventoryBatch;

      // 2. Increment Batch Available Qty & Current Qty
      await tx.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          availableQty: { increment: returnQty },
          currentQty: { increment: returnQty },
        },
      });

      // 3. Increment Global Stock
      // Assuming return goes back to MAIN_WH for now, ideally fetched from batch.warehouseId
      const warehouseId = 'MAIN_WH'; 
      await tx.inventoryStock.update({
        where: { materialId_warehouseId: { materialId: batch.materialId, warehouseId } },
        data: {
          currentQuantity: { increment: returnQty },
          availableQuantity: { increment: returnQty },
        },
      });

      // 4. Log Inventory Transaction (IN)
      const invTx = await tx.inventoryTransaction.create({
        data: {
          projectId,
          inventoryBatchId: batch.id,
          movementType: 'MATERIAL_RETURN' as any,
          quantity: returnQty, // positive for return (IN)
          referenceDocType: 'ISSUE', // Reference the original issue
          referenceDocId: issueId,
          remarks: remarks || `Returned from project`,
          createdBy: userId,
        },
      });

      await this.audit.logAction(invTx.id, 'MATERIAL_RETURN', 'CREATE', userId, invTx);

      const returnedCost = returnQty * Number(batch.unitCost || 0);

      return { invTx, returnedCost, batchId: batch.id };
    });

    // 5. Emit Domain Event for Cost Engine to reverse consumption costs
    this.eventBus.emit('MaterialReturned', {
      projectId,
      issueId,
      batchId: returnResult.batchId,
      returnQty,
      returnedCost: returnResult.returnedCost,
      remarks,
      userId,
    });

    return returnResult.invTx;
  }
}
