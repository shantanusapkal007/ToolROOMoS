import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMsdrDto } from './dto/create-msdr.dto';
import { ProjectStatus } from '@prisma/client';
import { WipService } from './wip.service';

@Injectable()
export class ProductionOperationsService {
  private readonly logger = new Logger(ProductionOperationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wipService: WipService
  ) {}

  async logMachineShopReport(projectId: string, dto: CreateMsdrDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate project stage - Removed

      // 2. Business Rule: Cannot start operation without issued material - Removed

      // Validate Job Card if provided
      let routingOperation = null;
      if (dto.jobCardId) {
          const jobCard = await tx.jobCard.findUnique({ where: { id: dto.jobCardId }, include: { routingOperation: { include: { operation: true } } } });
          if (!jobCard) throw new BadRequestException('Job Card not found.');
          routingOperation = jobCard.routingOperation;
          
          if (!dto.routingOperationId) {
             dto.routingOperationId = routingOperation.id;
          }
      }

      // Fetch machine and employee rate details
      const machine = await tx.machine.findUniqueOrThrow({ where: { id: dto.machineId } });
      const employee = await tx.employee.findUniqueOrThrow({ where: { id: dto.employeeId } });

      const cuttingHrs = dto.cuttingTime || 0;
      const setupHrs = dto.setupTime || 0;
      const totalMachineHrs = cuttingHrs + setupHrs;
      const totalLabourHrs = totalMachineHrs; // Assuming operator is present for both
      
      let variance = 0;
      if (routingOperation) {
          variance = totalMachineHrs - routingOperation.estimatedHours.toNumber();
      }

      // 3. Create the MSDR record
      const msdr = await tx.machineShopDailyReport.create({
        data: {
          projectId,
          machineId: dto.machineId,
          employeeId: dto.employeeId,
          routingOperationId: dto.routingOperationId,
          materialIssueId: dto.materialIssueId,
          inventoryBatchId: dto.inventoryBatchId,
          reportDate: new Date(dto.reportDate),
          startTime: new Date(dto.startTime),
          endTime: new Date(dto.endTime),
          setupTime: setupHrs,
          cuttingTime: cuttingHrs,
          idleTime: dto.idleTime || 0,
          producedQty: dto.producedQty || 0,
          scrapQty: dto.scrapQty || 0,
          reworkQty: dto.reworkQty || 0,
          actualMachineHours: totalMachineHrs,
          actualLabourHours: totalLabourHrs,
          variance: variance,
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Update RoutingOperation Progress if applicable
      if (routingOperation) {
          const produced = dto.producedQty || 0;
          const completedQty = routingOperation.completedQuantity.toNumber() + produced;
          const currentRemaining = routingOperation.remainingQuantity.toNumber();
          const newRemaining = currentRemaining >= produced ? currentRemaining - produced : 0;
          
          await tx.routingOperation.update({
              where: { id: routingOperation.id },
              data: {
                  completedQuantity: completedQty,
                  remainingQuantity: newRemaining,
                  status: newRemaining === 0 ? 'COMPLETED' : 'IN_PROGRESS'
              }
          });

          // Mark job card as completed if requested
          if (dto.jobCardId) {
              await tx.jobCard.update({
                  where: { id: dto.jobCardId },
                  data: { status: 'COMPLETED' } // Simplified
              });
          }
      }

      // 4. Cost Calculations
      const machineCost = totalMachineHrs * machine.hourlyRate.toNumber();
      const labourCost = totalMachineHrs * employee.hourlyRate.toNumber();
      const totalOperationCost = machineCost + labourCost;

      // 4. Costing Integration: Rollup machine & labour costs to ProjectCostSummary (Layer 5 - Outcomes)
      await tx.projectCostSummary.update({
        where: { projectId },
        data: {
          machineCost: { increment: machineCost },
          labourCost: { increment: labourCost },
          totalCost: { increment: totalOperationCost },
        },
      });

      // Automation C: Cost Overrun Warning logs
      if (routingOperation) {
        const estMachine = routingOperation.estimatedHours.toNumber() * machine.hourlyRate.toNumber();
        const estLabour = routingOperation.estimatedHours.toNumber() * employee.hourlyRate.toNumber();
        const estTotal = estMachine + estLabour;

        if (totalOperationCost > estTotal) {
          const overrun = totalOperationCost - estTotal;
          
          let opName = 'Machining';
          if (routingOperation.operationId) {
            const opDetails = await tx.operation.findUnique({
              where: { id: routingOperation.operationId }
            });
            if (opDetails) {
              opName = opDetails.operationName;
            }
          }

          await tx.projectActivity.create({
            data: {
              projectId,
              action: 'COST_OVERRUN_WARNING',
              description: `[ALERT] Operation "${opName}" logged cost exceeded estimate by ₹${overrun.toFixed(2)} (Actual: ₹${totalOperationCost.toFixed(2)}, Est: ₹${estTotal.toFixed(2)})`,
              performedBy: userId || 'SYSTEM',
            }
          });
        }
      }

      // Record Machine cost event
      await tx.projectCostEvent.create({
        data: {
          projectId,
          costType: 'MACHINE_COST',
          description: `Machine cost logged on ${machine.machineCode} for ${totalMachineHrs} hrs`,
          amount: machineCost,
          referenceDocType: 'MSDR',
          referenceDocId: msdr.id,
          createdBy: userId,
        },
      });

      // Record Labour cost event
      await tx.projectCostEvent.create({
        data: {
          projectId,
          costType: 'LABOUR_COST',
          description: `Labour cost logged for operator ${employee.employeeCode} for ${totalMachineHrs} hrs`,
          amount: labourCost,
          referenceDocType: 'MSDR',
          referenceDocId: msdr.id,
          createdBy: userId,
        },
      });

      // 5. Update WIP Ledger state and accrue operation costs
      if (routingOperation && msdr.inventoryBatchId) {
        await this.wipService.updateWipProgress({
          projectId,
          routingOperationId: routingOperation.id,
          machineId: machine.id,
          batchId: msdr.inventoryBatchId,
          accruedMachineCost: machineCost,
          accruedLabourCost: labourCost
        }, tx);
      }

      // 6. Workflow Automation: Potentially advance project stage to INSPECTION
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'PRODUCTION_LOGGED',
          description: `MSDR recorded for operation ${routingOperation?.operation?.operationName || 'N/A'}. Produced: ${msdr.producedQty}, Scrap: ${msdr.scrapQty}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return msdr;
    });
  }

  async getMachineShopReports(projectId: string) {
    return this.prisma.machineShopDailyReport.findMany({
      where: { projectId },
      include: { machine: true, employee: true },
      orderBy: { reportDate: 'desc' },
    });
  }
}
