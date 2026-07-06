import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaterialReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async returnMaterial(projectId: string, issueId: string, returnQty: number, remarks: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
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
          movementType: 'MATERIAL_RETURN',
          referenceDocId: issueId,
        },
      });
      const previouslyReturned = previousReturns.reduce((sum, txItem) => sum + Number(txItem.quantity), 0);

      if (returnQty > (issuedQty - previouslyReturned)) {
        throw new BadRequestException(`Cannot return ${returnQty}. Only ${issuedQty - previouslyReturned} left to return.`);
      }

      // 2. Calculate the cost to reverse
      const unitCost = Number(issueItem.inventoryBatch.unitCost);
      const returnCost = returnQty * unitCost;

      // 3. Return the quantity back to Inventory Batch
      await tx.inventoryBatch.update({
        where: { id: issueItem.inventoryBatchId },
        data: {
          currentQty: { increment: returnQty },
          availableQty: { increment: returnQty },
          issuedQty: { decrement: returnQty },
          status: 'AVAILABLE', // Reactivate the batch
        },
      });

      // 4. Update Inventory Stock in Warehouse
      const warehouse = await tx.warehouse.findFirst({
        where: { warehouseCode: 'DEFAULT-WH' },
      });
      if (warehouse) {
        await tx.inventoryStock.upsert({
          where: {
            materialId_warehouseId: {
              materialId: issueItem.inventoryBatch.materialId,
              warehouseId: warehouse.id,
            },
          },
          update: {
            currentQuantity: { increment: returnQty },
            availableQuantity: { increment: returnQty },
          },
          create: {
            materialId: issueItem.inventoryBatch.materialId,
            warehouseId: warehouse.id,
            currentQuantity: returnQty,
            availableQuantity: returnQty,
          },
        });
      }

      // 5. Reverse the costs in ProjectCostSummary
      const summary = await tx.projectCostSummary.findUnique({ where: { projectId } });
      if (summary) {
        const currentConsumptionCost = Number(summary.materialConsumptionCost || 0);
        const newConsumptionCost = Math.max(0, currentConsumptionCost - returnCost);

        const currentTotalCost = Number(summary.totalCost || 0);
        const newTotalCost = Math.max(0, currentTotalCost - returnCost);

        // Recalculate profitability consistently: revenue - totalCost
        // This matches the formula in invoices.service.ts and prevents divergence
        const currentRevenue = Number(summary.revenue || 0);
        const newProfit = currentRevenue - newTotalCost;

        await tx.projectCostSummary.update({
          where: { projectId },
          data: {
            materialConsumptionCost: newConsumptionCost,
            totalCost: newTotalCost,
            profitability: newProfit,
          },
        });
      }


      // 6. Log negative cost event to maintain the ledger
      await tx.projectCostEvent.create({
        data: {
          projectId,
          costType: 'MATERIAL_CONSUMPTION',
          description: `Material Return: ${returnQty} x ${issueItem.inventoryBatch.material.materialGrade}`,
          amount: -returnCost,
          referenceDocType: 'MATERIAL_RETURN',
          referenceDocId: issueId,
          createdBy: userId,
        },
      });

      // 7. Record Inventory Transaction
      await tx.inventoryTransaction.create({
        data: {
          projectId,
          inventoryBatchId: issueItem.inventoryBatchId,
          movementType: 'MATERIAL_RETURN',
          quantity: returnQty,
          referenceDocType: 'MATERIAL_RETURN',
          referenceDocId: issueId,
          remarks: remarks,
          createdBy: userId,
        },
      });

      // 8. Log Project Activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'MATERIAL_RETURN',
          description: `Returned ${returnQty} of ${issueItem.inventoryBatch.material.materialGrade}. Cost credit: ₹${returnCost.toFixed(2)}. Remarks: ${remarks || 'None'}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return { success: true, message: 'Material returned successfully', returnCost };
    });
  }
}
