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

      // Fetch machine and employee rate details
      const machine = await tx.machine.findUniqueOrThrow({ where: { id: dto.machineId } });
      const employee = await tx.employee.findUniqueOrThrow({ where: { id: dto.employeeId } });

      // 2. Create the MSDR record
      const msdr = await tx.machineShopDailyReport.create({
        data: {
          projectId,
          machineId: dto.machineId,
          employeeId: dto.employeeId,
          reportDate: new Date(dto.reportDate),
          startTime: new Date(dto.startTime),
          endTime: new Date(dto.endTime),
          setupTime: dto.setupTime || 0,
          cuttingTime: dto.cuttingTime || 0,
          idleTime: dto.idleTime || 0,
          producedQty: dto.producedQty || 0,
          scrapQty: dto.scrapQty || 0,
          reworkQty: dto.reworkQty || 0,
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 3. Cost Calculations
      const cuttingHrs = dto.cuttingTime || 0;
      const setupHrs = dto.setupTime || 0;
      const totalMachineHrs = cuttingHrs + setupHrs; // Machine is engaged during setup & cutting
      
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
          description: `MSDR entry processed. Cutting: ${cuttingHrs}h, Setup: ${setupHrs}h. Cost booked: Machine: $${machineCost}, Labour: $${labourCost}`,
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
