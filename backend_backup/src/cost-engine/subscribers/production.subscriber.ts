import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { WipService } from '../wip/wip.service';

@Injectable()
export class ProductionSubscriber {
  private readonly logger = new Logger(ProductionSubscriber.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wipService: WipService
  ) {}

  @OnEvent('MaterialIssued')
  async handleMaterialIssued(payload: any) {
    this.logger.log(`CostEngine handling MaterialIssued for project ${payload.projectId}`);
    
    try {
      await this.prisma.$transaction(async (tx) => {
        // Update WIP Ledger
        for (const processedItem of payload.items) {
          await this.wipService.initializeWipEntry({
            projectId: payload.projectId,
            materialId: processedItem.batch.materialId,
            batchId: processedItem.batch.id,
            qtyInWip: Number(processedItem.issueItem.issuedQty),
            initialMaterialCost: processedItem.itemCost
          }, tx);
        }

        // Update Project Cost Summary
        await tx.projectCostSummary.upsert({
          where: { projectId: payload.projectId },
          update: {
            actualMaterialCost: { increment: payload.totalIssueValue },
            materialConsumptionCost: { increment: payload.totalIssueValue },
            totalCost: { increment: payload.totalIssueValue }
          },
          create: {
            projectId: payload.projectId,
            actualMaterialCost: payload.totalIssueValue,
            materialConsumptionCost: payload.totalIssueValue,
            totalCost: payload.totalIssueValue,
          }
        });

        // Record Cost Event
        await tx.projectCostEvent.create({
          data: {
            projectId: payload.projectId,
            costType: 'ACTUAL_MATERIAL',
            description: `Material issued via ${payload.issueNumber}`,
            amount: payload.totalIssueValue,
            referenceDocType: 'ISSUE',
            referenceDocId: payload.issueHeaderId,
            createdBy: payload.userId,
          }
        });
      });
    } catch (error) {
      this.logger.error(`Failed to handle MaterialIssued event: ${error.message}`);
    }
  }

  @OnEvent('MaterialReturned')
  async handleMaterialReturned(payload: any) {
    this.logger.log(`CostEngine handling MaterialReturned for project ${payload.projectId}`);
    
    try {
      await this.prisma.$transaction(async (tx) => {
        // Reverse WIP Ledger Material Costs (simplification: decrementing cost)
        const activeWip = await tx.wipLedger.findFirst({
          where: { 
            projectId: payload.projectId, 
            batchId: payload.batchId,
            status: 'IN_PROCESS'
          }
        });

        if (activeWip) {
          await tx.wipLedger.update({
            where: { id: activeWip.id },
            data: {
              qtyInWip: { decrement: payload.returnQty },
              accruedMaterialCost: { decrement: payload.returnedCost }
            }
          });
        }

        // Reverse Project Cost Summary
        await tx.projectCostSummary.update({
          where: { projectId: payload.projectId },
          data: {
            actualMaterialCost: { decrement: payload.returnedCost },
            materialConsumptionCost: { decrement: payload.returnedCost },
            totalCost: { decrement: payload.returnedCost }
          }
        });

        // Record Cost Event (negative)
        await tx.projectCostEvent.create({
          data: {
            projectId: payload.projectId,
            costType: 'ACTUAL_MATERIAL',
            description: `Material returned for issue ${payload.issueId}`,
            amount: -Math.abs(payload.returnedCost),
            referenceDocType: 'ISSUE',
            referenceDocId: payload.issueId,
            createdBy: payload.userId,
          }
        });
      });
    } catch (error) {
      this.logger.error(`Failed to handle MaterialReturned event: ${error.message}`);
    }
  }

  @OnEvent('ProductionOperationLogged')
  async handleProductionOperationLogged(payload: any) {
    this.logger.log(`CostEngine handling ProductionOperationLogged for project ${payload.projectId}`);
    
    try {
      await this.prisma.$transaction(async (tx) => {
        let totalMachineCost = 0;
        let totalLabourCost = 0;

        for (const op of payload.operations) {
          const opMachineCost = op.totalHrs * op.machineRate;
          const opLabourCost = op.totalHrs * op.employeeRate;
          const opTotalCost = opMachineCost + opLabourCost;

          totalMachineCost += opMachineCost;
          totalLabourCost += opLabourCost;

          // Accrue WIP costs
          if (op.inventoryBatchId && op.routingOperationId) {
            await this.wipService.updateWipProgress({
              projectId: payload.projectId,
              routingOperationId: op.routingOperationId,
              machineId: op.machineId,
              batchId: op.inventoryBatchId,
              accruedMachineCost: opMachineCost,
              accruedLabourCost: opLabourCost
            }, tx);
          }
        }

        const totalCostAccrued = totalMachineCost + totalLabourCost;

        // Update Project Cost Summary
        if (totalCostAccrued > 0) {
          await tx.projectCostSummary.upsert({
            where: { projectId: payload.projectId },
            update: {
              machineCost: { increment: totalMachineCost },
              labourCost: { increment: totalLabourCost },
              totalCost: { increment: totalCostAccrued }
            },
            create: {
              projectId: payload.projectId,
              machineCost: totalMachineCost,
              labourCost: totalLabourCost,
              totalCost: totalCostAccrued
            }
          });

          // Record Machine cost event
          if (totalMachineCost > 0) {
            await tx.projectCostEvent.create({
              data: {
                projectId: payload.projectId,
                costType: 'MACHINE_COST',
                description: `Machine cost logged for MSDR ${payload.msdrHeaderId}`,
                amount: totalMachineCost,
                referenceDocType: 'MSDR',
                referenceDocId: payload.msdrHeaderId,
                createdBy: payload.userId,
              },
            });
          }

          // Record Labour cost event
          if (totalLabourCost > 0) {
            await tx.projectCostEvent.create({
              data: {
                projectId: payload.projectId,
                costType: 'LABOUR_COST',
                description: `Labour cost logged for MSDR ${payload.msdrHeaderId}`,
                amount: totalLabourCost,
                referenceDocType: 'MSDR',
                referenceDocId: payload.msdrHeaderId,
                createdBy: payload.userId,
              },
            });
          }
        }
      });
    } catch (error) {
      this.logger.error(`Failed to handle ProductionOperationLogged event: ${error.message}`);
    }
  }
}
