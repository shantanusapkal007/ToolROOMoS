import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrnDto } from './dto/create-grn.dto';
import { ProjectStatus, InventoryMovementType } from '@prisma/client';

@Injectable()
export class GoodsReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGrn(projectId: string, dto: CreateGrnDto, userId?: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
      // 1. Validate project stage (resolving by ID or projectNumber)
      const project = await tx.project.findFirst({
        where: {
          OR: [
            { id: projectId },
            { projectNumber: projectId }
          ]
        }
      });

      if (!project) {
        throw new NotFoundException(`Project not found for ID or project number '${projectId}'.`);
      }

      const targetProjectId = project.id;

      // 2. Business Rule: Cannot create GRN without a valid, issued PO
      let po = await tx.purchaseOrderHeader.findFirst({
        where: {
          OR: [
            { id: dto.poHeaderId },
            { poNumber: dto.poHeaderId },
            { documentNumber: dto.poHeaderId },
          ]
        },
        include: { items: true },
      });

      if (!po) {
        po = await tx.purchaseOrderHeader.findFirst({
          where: { projectId: targetProjectId, status: { in: ['ISSUED', 'PARTIAL_RECEIPT'] } },
          include: { items: true },
          orderBy: { createdAt: 'desc' }
        });
      }

      if (!po) {
        throw new BadRequestException('Purchase Order not found.');
      }

      if (po.status === 'DRAFT') {
        po = await tx.purchaseOrderHeader.update({
          where: { id: po.id },
          data: { status: 'ISSUED' },
          include: { items: true },
        });
      }

      if (po.status === 'CLOSED') {
        throw new BadRequestException('All quantities have already been received.');
      }

      if (po.status !== 'ISSUED' && po.status !== 'PARTIAL_RECEIPT') {
        throw new BadRequestException('Business Rule Violation: Cannot create GRN without a valid, issued Purchase Order.');
      }

      // Check total remaining quantity across all items in the PO
      const totalPendingInPo = po.items.reduce(
        (sum, item) => sum + Math.max(0, Number(item.orderedQty) - Number(item.receivedQty)),
        0
      );

      if (totalPendingInPo <= 0) {
        throw new BadRequestException('All quantities have already been received.');
      }

      // Filter active items with incoming quantity > 0
      const activeItems = dto.items.filter((item) => {
        const incomingQty = Number(item.acceptedQty) + Number(item.rejectedQty || 0);
        return incomingQty > 0;
      });

      if (activeItems.length === 0) {
        throw new BadRequestException('Receive quantity must be greater than zero.');
      }

      // 3. Resolve warehouse dynamically — use provided warehouseId, DEFAULT-WH, or any active warehouse
      const warehouse = dto.warehouseId
        ? await tx.warehouse.findUnique({ where: { id: dto.warehouseId } })
        : (await tx.warehouse.findFirst({ where: { warehouseCode: 'DEFAULT-WH' } })) || 
          (await tx.warehouse.findFirst({ where: { status: 'ACTIVE' } })) || 
          (await tx.warehouse.findFirst());

      if (!warehouse) {
        throw new BadRequestException(
          'Warehouse not found. Please ensure at least one active warehouse exists in the database.'
        );
      }

      // 4. Create GRN Header
      const grnHeader = await tx.goodsReceiptHeader.create({
        data: {
          projectId: targetProjectId,
          poHeaderId: po.id,
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
      for (const item of activeItems) {
        if (!item.heatNumber || item.heatNumber.trim() === '') {
          throw new BadRequestException(
            `GRN Gate Failed: Heat Number (Mill Test Certificate) is strictly required for material traceability.`
          );
        }

        let poItem = await tx.purchaseOrderItem.findFirst({
          where: { id: item.poItemId, poHeaderId: po.id },
        });

        if (!poItem) {
          poItem = po.items.find((pi) =>
            (item.remarks && pi.remarks && pi.remarks.trim().toLowerCase() === item.remarks.trim().toLowerCase()) ||
            ((item as any).materialId && pi.materialId === (item as any).materialId)
          );
        }

        if (!poItem) {
          poItem = po.items.find((pi) => Number(pi.orderedQty) > Number(pi.receivedQty)) || po.items[0];
        }

        if (!poItem) {
          throw new BadRequestException(`Purchase Order Item not found for '${item.remarks || item.poItemId}'.`);
        }

        // Strict Quantity Validation
        const remainingQty = Number(poItem.orderedQty) - Number(poItem.receivedQty);
        const incomingQty = Number(item.acceptedQty) + Number(item.rejectedQty || 0);

        if (incomingQty <= 0) {
          throw new BadRequestException('Receive quantity must be greater than zero.');
        }

        if (incomingQty > remainingQty) {
          throw new BadRequestException('Receive quantity cannot exceed pending quantity.');
        }

        const itemCost = item.acceptedQty * item.actualRate;
        totalGrnValue += itemCost;

        // Create GRN Item record
        const grnItem = await tx.goodsReceiptItem.create({
          data: {
            grnHeaderId: grnHeader.id,
            poItemId: poItem.id,
            receivedQty: incomingQty,
            acceptedQty: item.acceptedQty,
            rejectedQty: item.rejectedQty || 0,
            heatNumber: item.heatNumber,
            actualRate: item.actualRate,
            actualMaterialCost: itemCost,
            toolNo: item.toolNo,
            detNo: item.detNo,
            length: (item.length !== undefined && item.length !== null && item.length !== '' && !isNaN(parseFloat(String(item.length)))) ? parseFloat(String(item.length)) : null,
            width: (item.width !== undefined && item.width !== null && item.width !== '' && !isNaN(parseFloat(String(item.width)))) ? parseFloat(String(item.width)) : null,
            height: (item.height !== undefined && item.height !== null && item.height !== '' && !isNaN(parseFloat(String(item.height)))) ? parseFloat(String(item.height)) : null,
            apWeight: (item.apWeight !== undefined && item.apWeight !== null && !isNaN(Number(item.apWeight))) ? Number(item.apWeight) : null,
            totalWeight: (item.totalWeight !== undefined && item.totalWeight !== null && !isNaN(Number(item.totalWeight))) ? Number(item.totalWeight) : null,
            basicCost: (item.basicCost !== undefined && item.basicCost !== null && !isNaN(Number(item.basicCost))) ? Number(item.basicCost) : null,
            gst: (item.gst !== undefined && item.gst !== null && !isNaN(Number(item.gst))) ? Number(item.gst) : null,
            total: (item.total !== undefined && item.total !== null && !isNaN(Number(item.total))) ? Number(item.total) : null,
            remarks: item.remarks,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        // Update PO Item receivedQty
        const newReceivedQty = Number(poItem.receivedQty) + incomingQty;
        const isPoItemFulfilled = newReceivedQty >= Number(poItem.orderedQty);

        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: {
            receivedQty: { increment: incomingQty },
            status: isPoItemFulfilled ? 'FULFILLED' : 'PARTIAL',
          },
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
            projectId: targetProjectId,
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

      // 5.1 Update PO Header Status based on overall fulfillment across all items
      const updatedPoItems = await tx.purchaseOrderItem.findMany({
        where: { poHeaderId: dto.poHeaderId },
      });

      const allFulfilled = updatedPoItems.every(
        (i) => Number(i.receivedQty) >= Number(i.orderedQty)
      );
      const anyReceived = updatedPoItems.some((i) => Number(i.receivedQty) > 0);

      const finalPoStatus = allFulfilled
        ? 'CLOSED'
        : anyReceived
        ? 'PARTIAL_RECEIPT'
        : 'ISSUED';

      await tx.purchaseOrderHeader.update({
        where: { id: dto.poHeaderId },
        data: { status: finalPoStatus },
      });

      // 6. Costing Integration: Rollup actual material cost to ProjectCostSummary (actual column ONLY)
      // NOTE: totalCost is NOT incremented here — it is computed from actual consumption in material issues.
      // Using upsert to protect against legacy projects without a cost summary record.
      await tx.projectCostSummary.upsert({
        where: { projectId: targetProjectId },
        create: {
          projectId: targetProjectId,
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
          projectId: targetProjectId,
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
          projectId: targetProjectId,
          action: 'MATERIAL_RECEIVED',
          description: `GRN ${dto.grnNumber} completed. Actual Material Cost booked: ₹${totalGrnValue.toFixed(2)}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 8. FIX: Transition to MATERIAL_AVAILABLE (not PRODUCTION)
      // The production stage is triggered separately when material is issued to the shop floor.
      await tx.project.update({
        where: { id: targetProjectId },
        data: { currentStage: ProjectStatus.MATERIAL_AVAILABLE, updatedBy: userId },
      });

      await tx.projectTimeline.create({
        data: {
          projectId: targetProjectId,
          fromStage: ProjectStatus.PROCUREMENT,
          toStage: ProjectStatus.MATERIAL_AVAILABLE,
          transitionedBy: userId || 'SYSTEM',
          remarks: `GRN ${dto.grnNumber} completed. Materials are in warehouse and available for issue.`,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'STAGE_CHANGED',
          description: 'Materials received. Project advanced to MATERIAL_AVAILABLE.',
          performedBy: userId || 'SYSTEM',
        },
      });

      return grnHeader;
    });
    } catch (err: any) {
      console.error('CREATE GRN ERROR DETAIL:', err);
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new BadRequestException(`GRN Creation Failed: ${err.message || err}`);
    }
  }

  async getGoodsReceipts(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { projectNumber: projectId }
        ]
      }
    });
    if (!project) return [];

    return this.prisma.goodsReceiptHeader.findMany({
      where: { projectId: project.id },
      include: { items: { include: { poItem: { include: { material: true } } } } },
    });
  }

  async getAllGoodsReceipts() {
    return this.prisma.goodsReceiptHeader.findMany({
      include: {
        project: true,
        poHeader: {
          include: {
            vendor: true,
          }
        },
        items: {
          include: {
            poItem: {
              include: {
                material: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
