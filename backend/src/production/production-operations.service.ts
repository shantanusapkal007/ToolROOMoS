import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMsdrDto } from './dto/create-msdr.dto';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class ProductionOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async logMachineShopReport(projectId: string, dto: CreateMsdrDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate project stage
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      if (project.currentStage !== ProjectStatus.PRODUCTION) {
        throw new BadRequestException('Machine Shop Daily Reports can only be logged during the Production stage.');
      }

      // 2. Business Rule: Cannot start operation without issued material
      const issues = await tx.materialIssueHeader.count({ where: { projectId } });
      if (issues === 0) {
        throw new BadRequestException('Business Rule Violation: Cannot log production hours without material issued to the shop floor.');
      }

      // Validate Job Card if provided
      let routingOperation = null;
      if (dto.jobCardId) {
          const jobCard = await tx.jobCard.findUnique({ where: { id: dto.jobCardId }, include: { routingOperation: true } });
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

      // 4. Cost Calculations (Variables already declared above)
      const totalMachineHrsForCost = totalMachineHrs;
      
      const machineCost = totalMachineHrsForCost * machine.hourlyRate.toNumber();
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
        const estLabour = routingOperation.estimatedHours.toNumber() * 250; // standard estimation fallback
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

      // 5. Log project activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'OPERATION_LOGGED',
          description: `MSDR entry processed. Cutting: ${cuttingHrs}h, Setup: ${setupHrs}h. Cost booked: Machine: ₹${machineCost}, Labour: ₹${labourCost}`,
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
