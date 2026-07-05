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

      // 2. Business Rule: Cannot create GRN without a valid, issued PO
      const po = await tx.purchaseOrderHeader.findUnique({ where: { id: dto.poHeaderId } });
      if (!po || (po.status !== 'ISSUED' && po.status !== 'PARTIAL_RECEIPT')) {
        throw new BadRequestException('Business Rule Violation: Cannot create GRN without a valid, issued Purchase Order.');
      }

      // 3. Create GRN Header
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
        if (!item.heatNumber || item.heatNumber.trim() === '') {
          throw new BadRequestException(`GRN Gate Failed: Heat Number (Mill Test Certificate) is strictly required for material traceability.`);
        }

        const poItem = await tx.purchaseOrderItem.findUniqueOrThrow({
          where: { id: item.poItemId },
        });

        // Strict Quantity Validation
        const remainingQty = Number(poItem.orderedQty) - Number(poItem.receivedQty);
        const incomingQty = Number(item.acceptedQty) + Number(item.rejectedQty || 0);

        if (incomingQty > remainingQty) {
          throw new BadRequestException(`GRN Gate Failed: Incoming quantity (${incomingQty}) exceeds the remaining PO quantity (${remainingQty}) for PO Item ${poItem.id}.`);
        }

        const itemCost = item.acceptedQty * item.actualRate;
        totalGrnValue += itemCost;

        // Create GRN Item record
        const grnItem = await tx.goodsReceiptItem.create({
          data: {
            grnHeaderId: grnHeader.id,
            poItemId: item.poItemId,
            receivedQty: incomingQty,
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

        // Update PO Item receivedQty
        await tx.purchaseOrderItem.update({
          where: { id: item.poItemId },
          data: {
            receivedQty: { increment: incomingQty },
            status: Number(poItem.receivedQty) + incomingQty >= Number(poItem.orderedQty) ? 'FULFILLED' : 'PARTIAL'
          }
        });

        // (poItem was fetched above)

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
            availableQty: item.acceptedQty, // V2.0
            reservedQty: 0,
            issuedQty: 0,
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
