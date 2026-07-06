import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { ProjectStatus, InventoryMovementType } from '@prisma/client';
import { WipService } from './wip.service';

@Injectable()
export class MaterialIssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wipService: WipService,
  ) {}

  async issueMaterial(projectId: string, dto: CreateIssueDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate project stage
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      const currentStage = project.currentStage;
      
      if (currentStage !== ProjectStatus.MATERIAL_AVAILABLE && currentStage !== ProjectStatus.PRODUCTION) {
        throw new BadRequestException('Materials can only be issued during Material Available or Production stages.');
      }

      // 2. Create Material Issue Header
      const issueHeader = await tx.materialIssueHeader.create({
        data: {
          projectId,
          issueNumber: dto.issueNumber,
          documentNumber: dto.issueNumber,
          status: 'COMPLETED',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 3. BOM Validation Gate (Precompute)
      const activeBom = await tx.billOfMaterialHeader.findFirst({
        where: { projectId, status: 'APPROVED' },
        include: { items: true },
        orderBy: { revision: 'desc' }
      });
      
      if (!activeBom) {
        throw new BadRequestException('Material Issue Gate Failed: Project has no approved Engineering BOM.');
      }
      
      const bomMaterials = new Set(activeBom.items.map(i => i.materialId));

      let totalConsumptionCost = 0;

      // 4. Retrieve warehouse (prevent N+1 queries)
      const warehouse = dto.warehouseId
        ? await tx.warehouse.findUniqueOrThrow({ where: { id: dto.warehouseId } })
        : await tx.warehouse.findFirst({ where: { warehouseCode: 'DEFAULT-WH' } });

      if (!warehouse) {
        throw new BadRequestException('Warehouse not found. Please ensure a default warehouse (DEFAULT-WH) is configured, or provide a warehouseId.');
      }

      // 5. Process each Issued Item
      for (const item of dto.items) {
        // Fetch batch to get unit cost and current qty
        const batch = await tx.inventoryBatch.findUniqueOrThrow({
          where: { id: item.inventoryBatchId },
        });

        if (!bomMaterials.has(batch.materialId)) {
          throw new BadRequestException(`Material Issue Gate Failed: Material ID ${batch.materialId} (Batch ${batch.batchNumber}) is not in the approved BOM for this project.`);
        }

        if (batch.availableQty.toNumber() < item.issuedQty) {
          throw new BadRequestException(`Insufficient available stock in Batch ${batch.batchNumber}. Available: ${batch.availableQty}, Requested: ${item.issuedQty}`);
        }

        const consumptionValue = item.issuedQty * batch.unitCost.toNumber();
        totalConsumptionCost += consumptionValue;

        // Create Issue Item
        await tx.materialIssueItem.create({
          data: {
            issueHeaderId: issueHeader.id,
            inventoryBatchId: item.inventoryBatchId,
            issuedQty: item.issuedQty,
            materialValue: consumptionValue,
            remarks: item.remarks,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        // 5. Update Inventory Batch Quantity with atomic concurrency check
        const updateBatchCount = await tx.inventoryBatch.updateMany({
          where: {
            id: item.inventoryBatchId,
            availableQty: { gte: item.issuedQty },
          },
          data: {
            currentQty: { decrement: item.issuedQty },
            availableQty: { decrement: item.issuedQty },
            issuedQty: { increment: item.issuedQty },
            status: batch.availableQty.toNumber() === item.issuedQty ? 'CONSUMED' : 'AVAILABLE',
          },
        });

        if (updateBatchCount.count === 0) {
          throw new BadRequestException(`Insufficient stock or concurrent modification in Batch ${batch.batchNumber}. Available: ${batch.availableQty}, Requested: ${item.issuedQty}`);
        }


        // 6. Update Inventory Stock (Layer 4 - Events) with atomic concurrency check
        const currentStock = await tx.inventoryStock.findUnique({
          where: {
            materialId_warehouseId: {
              materialId: batch.materialId,
              warehouseId: warehouse.id,
            },
          },
        });

        if (!currentStock || currentStock.availableQuantity.toNumber() < item.issuedQty) {
          throw new BadRequestException(`Insufficient stock in warehouse ${warehouse.warehouseCode} for material ${batch.materialId}. Available: ${currentStock?.availableQuantity || 0}, Requested: ${item.issuedQty}`);
        }

        const updateStockCount = await tx.inventoryStock.updateMany({
          where: {
            materialId: batch.materialId,
            warehouseId: warehouse.id,
            availableQuantity: { gte: item.issuedQty },
          },
          data: {
            currentQuantity: { decrement: item.issuedQty },
            availableQuantity: { decrement: item.issuedQty },
          },
        });

        if (updateStockCount.count === 0) {
          throw new BadRequestException(`Insufficient stock in warehouse ${warehouse.warehouseCode} for material ${batch.materialId}. Requested: ${item.issuedQty}`);
        }

        // 7. Record Inventory Transaction
        await tx.inventoryTransaction.create({
          data: {
            projectId,
            inventoryBatchId: batch.id,
            movementType: InventoryMovementType.MATERIAL_ISSUE,
            quantity: item.issuedQty,
            referenceDocType: 'MATERIAL_ISSUE',
            referenceDocId: issueHeader.id,
            remarks: item.remarks,
            createdBy: userId,
          },
        });

        // 7.1 Initialize WIP Entry
        await this.wipService.initializeWipEntry({
          projectId,
          materialId: batch.materialId,
          batchId: item.inventoryBatchId,
          qtyInWip: item.issuedQty,
          initialMaterialCost: consumptionValue
        }, tx);
      }

      // 7. Costing Integration: Rollup consumption to ProjectCostSummary (Layer 5 - Outcomes)
      // Using upsert to protect against legacy projects without a cost summary record
      await tx.projectCostSummary.upsert({
        where: { projectId },
        create: {
          projectId,
          materialConsumptionCost: totalConsumptionCost,
          totalCost: totalConsumptionCost,
          estimatedMaterialCost: 0,
          actualMaterialCost: 0,
          machineCost: 0,
          labourCost: 0,
          outsideProcessCost: 0,
          inspectionCost: 0,
          packingCost: 0,
          dispatchCost: 0,
          revenue: 0,
          profitability: 0,
        },
        update: {
          materialConsumptionCost: { increment: totalConsumptionCost },
          totalCost: { increment: totalConsumptionCost },
        },
      });


      // Record detailed cost audit trail event
      await tx.projectCostEvent.create({
        data: {
          projectId,
          costType: 'MATERIAL_CONSUMPTION',
          description: `Material consumed from inventory under Issue Slip ${dto.issueNumber}`,
          amount: totalConsumptionCost,
          referenceDocType: 'MATERIAL_ISSUE',
          referenceDocId: issueHeader.id,
          createdBy: userId,
        },
      });

      // 8. Log project activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'MATERIAL_CONSUMED',
          description: `Material Issue ${dto.issueNumber} completed. Consumption Value booked: ₹${totalConsumptionCost}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 9. Automations: If stage was MATERIAL_AVAILABLE, transition to PRODUCTION automatically
      if (currentStage === ProjectStatus.MATERIAL_AVAILABLE) {
        await tx.project.update({
          where: { id: projectId },
          data: { currentStage: ProjectStatus.PRODUCTION, updatedBy: userId },
        });

        await tx.projectTimeline.create({
          data: {
            projectId,
            fromStage: ProjectStatus.MATERIAL_AVAILABLE,
            toStage: ProjectStatus.PRODUCTION,
            transitionedBy: userId || 'SYSTEM',
            remarks: 'First material issue recorded. Advanced project to PRODUCTION stage.',
          },
        });

        await tx.projectActivity.create({
          data: {
            projectId,
            action: 'STAGE_CHANGED',
            description: 'Project advanced to PRODUCTION stage',
            performedBy: userId || 'SYSTEM',
          },
        });
      }

      return issueHeader;
    });
  }

  async getMaterialIssues(projectId: string) {
    return this.prisma.materialIssueHeader.findMany({
      where: { projectId },
      include: { items: { include: { inventoryBatch: { include: { material: true } } } } },
    });
  }

  async getAvailableInventoryBatches() {
    return this.prisma.inventoryBatch.findMany({
      where: { currentQty: { gt: 0 }, status: 'AVAILABLE' },
      include: { material: true },
    });
  }
}
