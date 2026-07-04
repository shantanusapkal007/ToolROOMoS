import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrnDto } from './dto/create-grn.dto';
import { ProjectStatus, InventoryMovementType } from '@prisma/client';

@Injectable()
export class GoodsReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGrn(projectId: string, dto: CreateGrnDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate project stage
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      if (project.currentStage !== ProjectStatus.PROCUREMENT) {
        throw new BadRequestException('GRNs can only be processed during the Procurement stage.');
      }

      // 2. Create GRN Header
      const grnHeader = await tx.goodsReceiptHeader.create({
        data: {
          projectId,
          poHeaderId: dto.poHeaderId,
          grnNumber: dto.grnNumber,
          documentNumber: dto.grnNumber,
          status: 'COMPLETED',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      let totalGrnValue = 0;

      // 3. Process each GRN Item
      for (const item of dto.items) {
        const itemCost = item.acceptedQty * item.actualRate;
        totalGrnValue += itemCost;

        // Create GRN Item record
        const grnItem = await tx.goodsReceiptItem.create({
          data: {
            grnHeaderId: grnHeader.id,
            poItemId: item.poItemId,
            receivedQty: item.receivedQty,
            acceptedQty: item.acceptedQty,
            rejectedQty: item.rejectedQty || 0,
            heatNumber: item.heatNumber,
            actualRate: item.actualRate,
            actualMaterialCost: itemCost,
            remarks: item.remarks,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        // Fetch PO Item to know the Material ID
        const poItem = await tx.purchaseOrderItem.findUniqueOrThrow({
          where: { id: item.poItemId },
        });

        // Retrieve the default warehouse UUID
        const warehouse = await tx.warehouse.findUniqueOrThrow({
          where: { warehouseCode: 'DEFAULT-WH' },
        });

        // 4. Update Current Stock (Layer 4 - Events)
        await tx.inventoryStock.upsert({
          where: {
            materialId_warehouseId: {
              materialId: poItem.materialId,
              warehouseId: warehouse.id,
            },
          },
          update: {
            currentQuantity: { increment: item.acceptedQty },
            availableQuantity: { increment: item.acceptedQty },
          },
          create: {
            materialId: poItem.materialId,
            warehouseId: warehouse.id,
            currentQuantity: item.acceptedQty,
            availableQuantity: item.acceptedQty,
            reservedQuantity: 0,
          },
        });

        // 5. Generate Inventory Batch for traceability
        const batch = await tx.inventoryBatch.create({
          data: {
            materialId: poItem.materialId,
            grnItemId: grnItem.id,
            batchNumber: `BAT-${dto.grnNumber}-${poItem.materialId.slice(0, 4)}`,
            heatNumber: item.heatNumber,
            receivedQty: item.acceptedQty,
            currentQty: item.acceptedQty,
            unitCost: item.actualRate,
            status: 'AVAILABLE',
            createdBy: userId,
          },
        });

        // 6. Record Inventory Transaction
        await tx.inventoryTransaction.create({
          data: {
            projectId,
            inventoryBatchId: batch.id,
            movementType: InventoryMovementType.GRN_RECEIPT,
            quantity: item.acceptedQty,
            referenceDocType: 'GRN',
            referenceDocId: grnHeader.id,
            remarks: item.remarks,
            createdBy: userId,
          },
        });
      }

      // 7. Costing Integration: Rollup actual cost to ProjectCostSummary (Layer 5 - Outcomes)
      await tx.projectCostSummary.update({
        where: { projectId },
        data: {
          actualMaterialCost: { increment: totalGrnValue },
          totalCost: { increment: totalGrnValue },
        },
      });

      // Record detailed cost audit trail event
      await tx.projectCostEvent.create({
        data: {
          projectId,
          costType: 'ACTUAL_MATERIAL',
          description: `Material received under GRN ${dto.grnNumber}`,
          amount: totalGrnValue,
          referenceDocType: 'GRN',
          referenceDocId: grnHeader.id,
          createdBy: userId,
        },
      });

      // 8. Log project activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'MATERIAL_RECEIVED',
          description: `GRN ${dto.grnNumber} completed. Actual Material Cost booked: $${totalGrnValue}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 9. Automations: Transition to PRODUCTION
      // In a real flow we check if outstanding material remains. For this lifecycle demo, we auto-advance
      await tx.project.update({
        where: { id: projectId },
        data: { currentStage: ProjectStatus.PRODUCTION, updatedBy: userId },
      });

      await tx.projectTimeline.create({
        data: {
          projectId,
          fromStage: ProjectStatus.PROCUREMENT,
          toStage: ProjectStatus.PRODUCTION,
          transitionedBy: userId || 'SYSTEM',
          remarks: `All materials received. Project transitioned to PRODUCTION.`,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'STAGE_CHANGED',
          description: 'Project advanced to PRODUCTION phase',
          performedBy: userId || 'SYSTEM',
        },
      });

      return grnHeader;
    });
  }

  async getGoodsReceipts(projectId: string) {
    return this.prisma.goodsReceiptHeader.findMany({
      where: { projectId },
      include: { items: { include: { poItem: { include: { material: true } } } } },
    });
  }
}
