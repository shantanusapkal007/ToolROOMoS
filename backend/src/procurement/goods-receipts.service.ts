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
      // Phase validation removed to allow independent progression

      // 2. Business Rule: Cannot create GRN without a valid, issued PO
      const po = await tx.purchaseOrderHeader.findUnique({ where: { id: dto.poHeaderId } });
      if (!po || (po.status !== 'ISSUED' && po.status !== 'PARTIAL_RECEIPT')) {
        throw new BadRequestException('Business Rule Violation: Cannot create GRN without a valid, issued Purchase Order.');
      }

      // 3. Resolve warehouse — use provided warehouseId or fall back to DEFAULT-WH
      const warehouse = dto.warehouseId
        ? await tx.warehouse.findUniqueOrThrow({ where: { id: dto.warehouseId } })
        : await tx.warehouse.findFirst({ where: { warehouseCode: 'DEFAULT-WH' } });

      if (!warehouse) {
        throw new BadRequestException('Warehouse not found. Please ensure a default warehouse (DEFAULT-WH) is configured, or provide a warehouseId.');
      }

      // 4. Create GRN Header
      const grnHeader = await tx.goodsReceiptHeader.create({
        data: {
          projectId,
          poHeaderId: dto.poHeaderId,
          grnNumber: dto.grnNumber,
          supplierChallan: dto.supplierChallan || null,
          documentNumber: dto.grnNumber,
          status: 'COMPLETED',
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      let totalGrnValue = 0;

      // 5. Process each GRN Item
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
            toolNo: item.toolNo,
            detNo: item.detNo,
            length: item.length,
            width: item.width,
            height: item.height,
            apWeight: item.apWeight,
            totalWeight: item.totalWeight,
            basicCost: item.basicCost,
            gst: item.gst,
            total: item.total,
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

        // Update Current Stock (upsert)
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

        // Generate Inventory Batch — unique batch number uses timestamp to prevent collision
        const timestamp = Date.now();
        const batchNumber = `BAT-${dto.grnNumber}-${poItem.materialId.slice(0, 8)}-${timestamp}`;
        const batch = await tx.inventoryBatch.create({
          data: {
            materialId: poItem.materialId,
            grnItemId: grnItem.id,
            batchNumber,
            heatNumber: item.heatNumber,
            receivedQty: item.acceptedQty,
            currentQty: item.acceptedQty,
            availableQty: item.acceptedQty,
            reservedQty: 0,
            issuedQty: 0,
            unitCost: item.actualRate,
            status: 'AVAILABLE',
            createdBy: userId,
          },
        });

        // Record Inventory Transaction
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

      // 6. Costing Integration: Rollup actual material cost to ProjectCostSummary (actual column ONLY)
      // NOTE: totalCost is NOT incremented here — it is computed from actual consumption in material issues.
      // Using upsert to protect against legacy projects without a cost summary record.
      await tx.projectCostSummary.upsert({
        where: { projectId },
        create: {
          projectId,
          actualMaterialCost: totalGrnValue,
          estimatedMaterialCost: 0,
          materialConsumptionCost: 0,
          machineCost: 0,
          labourCost: 0,
          outsideProcessCost: 0,
          inspectionCost: 0,
          packingCost: 0,
          dispatchCost: 0,
          totalCost: 0,
          revenue: 0,
          profitability: 0,
        },
        update: {
          actualMaterialCost: { increment: totalGrnValue },
          // NOTE: totalCost is NOT incremented here — it is computed from actual consumption in material issues
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

      // 7. Log project activity (INR symbol)
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'MATERIAL_RECEIVED',
          description: `GRN ${dto.grnNumber} completed. Actual Material Cost booked: ₹${totalGrnValue.toFixed(2)}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 8. FIX: Transition to MATERIAL_AVAILABLE (not PRODUCTION)
      // The production stage is triggered separately when material is issued to the shop floor.
      await tx.project.update({
        where: { id: projectId },
        data: { currentStage: ProjectStatus.MATERIAL_AVAILABLE, updatedBy: userId },
      });

      await tx.projectTimeline.create({
        data: {
          projectId,
          fromStage: ProjectStatus.PROCUREMENT,
          toStage: ProjectStatus.MATERIAL_AVAILABLE,
          transitionedBy: userId || 'SYSTEM',
          remarks: `GRN ${dto.grnNumber} completed. Materials are in warehouse and available for issue.`,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'STAGE_CHANGED',
          description: 'Materials received. Project advanced to MATERIAL_AVAILABLE.',
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
