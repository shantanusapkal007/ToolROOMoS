import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

  private async resolveProjectId(projectId: string, tx?: any): Promise<string> {
    const db = tx || this.prisma;
    const project = await db.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { projectNumber: projectId }
        ]
      }
    });
    return project?.id || projectId;
  }

  async issueMaterial(projectId: string, dto: CreateIssueDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const targetProjectId = await this.resolveProjectId(projectId, tx);

      // 1. Fetch project stage for automations
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
      const currentStage = project.currentStage;

      // Determine if header level is marked partial or if items are partials
      let hasPartialItem = dto.isPartial || false;
      for (const item of dto.items) {
        const batch = await tx.inventoryBatch.findUniqueOrThrow({
          where: { id: item.inventoryBatchId },
        });
        if (item.issuedQty < batch.availableQty.toNumber()) {
          hasPartialItem = true;
        }
      }

      // 2. Create Material Issue Header
      const issueHeader = await tx.materialIssueHeader.create({
        data: {
          projectId: targetProjectId,
          issueNumber: dto.issueNumber,
          documentNumber: dto.issueNumber,
          status: hasPartialItem ? 'PARTIAL' : 'COMPLETED',
          isPartial: hasPartialItem,
          productionSection: dto.productionSection || 'MACHINE_SHOP',
          expectedManufactureQty: dto.expectedManufactureQty || null,
          jobCardId: dto.jobCardId || null,
          remarks: dto.remarks || null,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      let totalConsumptionCost = 0;

      // 4. Fallback warehouse (dynamically resolved)
      const defaultWarehouse = dto.warehouseId
        ? await tx.warehouse.findUnique({ where: { id: dto.warehouseId } })
        : (await tx.warehouse.findFirst({ where: { warehouseCode: 'DEFAULT-WH' } })) ||
          (await tx.warehouse.findFirst({ where: { status: 'ACTIVE' } })) ||
          (await tx.warehouse.findFirst());

      // 5. Process each Issued Item
      for (const item of dto.items) {
        // Fetch batch to get unit cost and current qty
        const batch = await tx.inventoryBatch.findUniqueOrThrow({
          where: { id: item.inventoryBatchId },
        });

        if (batch.availableQty.toNumber() < item.issuedQty) {
          throw new BadRequestException(`Insufficient available stock in Batch ${batch.batchNumber}. Available: ${batch.availableQty}, Requested: ${item.issuedQty}`);
        }

        const consumptionValue = item.issuedQty * batch.unitCost.toNumber();
        totalConsumptionCost += consumptionValue;

        const remainingBatchQty = batch.availableQty.toNumber() - item.issuedQty;
        const isItemPartial = item.issuedQty < batch.availableQty.toNumber();

        // Create Issue Item
        await tx.materialIssueItem.create({
          data: {
            issueHeaderId: issueHeader.id,
            inventoryBatchId: item.inventoryBatchId,
            issuedQty: item.issuedQty,
            materialValue: consumptionValue,
            remainingBatchQty: remainingBatchQty,
            isPartial: isItemPartial,
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
            status: remainingBatchQty === 0 ? 'CONSUMED' : 'AVAILABLE',
          },
        });

        if (updateBatchCount.count === 0) {
          throw new BadRequestException(`Insufficient stock or concurrent modification in Batch ${batch.batchNumber}. Available: ${batch.availableQty}, Requested: ${item.issuedQty}`);
        }

        // 6. Update Inventory Stock (Layer 4 - Events) with atomic concurrency check
        let currentStock;
        if (dto.warehouseId) {
          currentStock = await tx.inventoryStock.findUnique({
            where: {
              materialId_warehouseId: {
                materialId: batch.materialId,
                warehouseId: dto.warehouseId,
              },
            },
          });
        } else {
          currentStock = await tx.inventoryStock.findFirst({
            where: {
              materialId: batch.materialId,
              availableQuantity: { gte: item.issuedQty }
            }
          });
        }

        if (!currentStock || currentStock.availableQuantity.toNumber() < item.issuedQty) {
          throw new BadRequestException(`Insufficient stock for material ${batch.materialId}. Available: ${currentStock?.availableQuantity || 0}, Requested: ${item.issuedQty}`);
        }
        
        const activeWarehouseId = currentStock.warehouseId;

        const updateStockCount = await tx.inventoryStock.updateMany({
          where: {
            materialId: batch.materialId,
            warehouseId: activeWarehouseId,
            availableQuantity: { gte: item.issuedQty },
          },
          data: {
            currentQuantity: { decrement: item.issuedQty },
            availableQuantity: { decrement: item.issuedQty },
          },
        });

        if (updateStockCount.count === 0) {
          throw new BadRequestException(`Insufficient stock in resolved warehouse for material ${batch.materialId}. Requested: ${item.issuedQty}`);
        }

        // 7. Record Inventory Transaction
        await tx.inventoryTransaction.create({
          data: {
            projectId: targetProjectId,
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
          projectId: targetProjectId,
          materialId: batch.materialId,
          batchId: item.inventoryBatchId,
          qtyInWip: item.issuedQty,
          initialMaterialCost: consumptionValue
        }, tx);
      }

      const summary = await tx.projectCostSummary.upsert({
        where: { projectId: targetProjectId },
        create: {
          projectId: targetProjectId,
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
          profitability: -totalConsumptionCost,
        },
        update: {
          materialConsumptionCost: { increment: totalConsumptionCost },
          totalCost: { increment: totalConsumptionCost },
        },
      });

      // Synchronize live profitability (revenue - totalCost)
      const currentRevenue = Number(summary.revenue || 0);
      const updatedTotalCost = Number(summary.totalCost || 0);
      await tx.projectCostSummary.update({
        where: { projectId: targetProjectId },
        data: {
          profitability: currentRevenue - updatedTotalCost,
        },
      });

      // Record detailed cost audit trail event
      await tx.projectCostEvent.create({
        data: {
          projectId: targetProjectId,
          costType: 'MATERIAL_CONSUMPTION',
          description: `Material consumed under Issue Slip ${dto.issueNumber} (${hasPartialItem ? 'Partial' : 'Full'} Issue)`,
          amount: totalConsumptionCost,
          referenceDocType: 'MATERIAL_ISSUE',
          referenceDocId: issueHeader.id,
          createdBy: userId,
        },
      });

      // 8. Log project activity
      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'MATERIAL_CONSUMED',
          description: `Material Issue ${dto.issueNumber} (${hasPartialItem ? 'Partial' : 'Full'}) recorded. Value: ₹${totalConsumptionCost}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 9. Automations: If stage was MATERIAL_AVAILABLE, transition to PRODUCTION automatically
      if (currentStage === ProjectStatus.MATERIAL_AVAILABLE) {
        await tx.project.update({
          where: { id: targetProjectId },
          data: { currentStage: ProjectStatus.PRODUCTION, updatedBy: userId },
        });

        await tx.projectTimeline.create({
          data: {
            projectId: targetProjectId,
            fromStage: ProjectStatus.MATERIAL_AVAILABLE,
            toStage: ProjectStatus.PRODUCTION,
            transitionedBy: userId || 'SYSTEM',
            remarks: 'First material issue recorded. Advanced project to PRODUCTION stage.',
          },
        });

        await tx.projectActivity.create({
          data: {
            projectId: targetProjectId,
            action: 'STAGE_CHANGED',
            description: 'Project advanced to PRODUCTION stage',
            performedBy: userId || 'SYSTEM',
          },
        });
      }

      return tx.materialIssueHeader.findUnique({
        where: { id: issueHeader.id },
        include: {
          jobCard: {
            include: {
              routingOperation: { include: { operation: true } },
              machine: true,
            },
          },
          items: {
            include: {
              inventoryBatch: { include: { material: true } },
            },
          },
        },
      });
    });
  }

  async getMaterialIssues(projectId: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.materialIssueHeader.findMany({
      where: { projectId: targetProjectId },
      include: {
        jobCard: {
          include: {
            routingOperation: { include: { operation: true } },
            machine: true,
          },
        },
        items: {
          include: {
            inventoryBatch: { include: { material: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAvailableInventoryBatches() {
    return this.prisma.inventoryBatch.findMany({
      where: { currentQty: { gt: 0 }, status: 'AVAILABLE' },
      include: { material: true },
    });
  }
}
