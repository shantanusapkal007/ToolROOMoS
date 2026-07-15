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
      // 1. Fetch machine and employee rate details
      const machine = await tx.machine.findUniqueOrThrow({ where: { id: dto.machineId } });
      const employee = await tx.employee.findUniqueOrThrow({ where: { id: dto.employeeId } });

      // 2. Create the MSDR Header
      const header = await tx.msdrHeader.create({
        data: {
          projectId,
          machineId: dto.machineId,
          employeeId: dto.employeeId,
          reportDate: new Date(dto.reportDate),
          msdrNumber: 'MSDR-' + Date.now(),
          productionSection: (dto.productionSection as any) || 'MACHINE_SHOP',
          createdBy: userId,
        }
      });

      let totalMachineCost = 0;
      let totalLabourCost = 0;

      // 3. Create MSDR Operations
      for (const item of dto.items || []) {
        // Find dummy operation if not provided
        let opId = (await tx.operation.findFirst())?.id;
        if (!opId) throw new BadRequestException('No operations exist in the system.');

        let startTime = item.startTime ? new Date(dto.reportDate + 'T' + item.startTime + ':00Z') : new Date();
        let endTime = item.endTime ? new Date(dto.reportDate + 'T' + item.endTime + ':00Z') : new Date();
        
        // Ensure valid dates
        if (isNaN(startTime.getTime())) startTime = new Date();
        if (isNaN(endTime.getTime())) endTime = new Date();

        let machineHrs = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        if (machineHrs < 0) machineHrs += 24; // Handle overnight shifts
        if (isNaN(machineHrs) || machineHrs < 0) machineHrs = 0;

        const op = await tx.msdrOperation.create({
          data: {
            msdrHeaderId: header.id,
            operationId: opId,
            toolNo: item.toolNo,
            detNo: item.detNo,
            description: item.description,
            rawMatlSize: item.rawMatlSize,
            materialId: item.materialId,
            finishMatlSize: item.finishMatlSize,
            producedQty: item.qty || 0,
            startTime,
            endTime,
            runningHours: machineHrs
          }
        });

        // Calculate costs
        const mCost = machineHrs * machine.hourlyRate.toNumber();
        const lCost = machineHrs * employee.hourlyRate.toNumber();
        totalMachineCost += mCost;
        totalLabourCost += lCost;

        // Cost logging per item
        await tx.projectCostEvent.create({
          data: {
            projectId,
            costType: 'MACHINE_COST',
            description: `Machine cost logged on ${machine.machineCode} for ${machineHrs.toFixed(2)} hrs (Tool: ${item.toolNo || 'N/A'})`,
            amount: mCost,
            referenceDocType: 'MSDR_OP',
            referenceDocId: op.id,
            createdBy: userId,
          },
        });

        await tx.projectCostEvent.create({
          data: {
            projectId,
            costType: 'LABOUR_COST',
            description: `Labour cost logged for operator ${employee.employeeCode} for ${machineHrs.toFixed(2)} hrs (Tool: ${item.toolNo || 'N/A'})`,
            amount: lCost,
            referenceDocType: 'MSDR_OP',
            referenceDocId: op.id,
            createdBy: userId,
          },
        });
      }

      // 4. Rollup costs to ProjectCostSummary
      await tx.projectCostSummary.update({
        where: { projectId },
        data: {
          machineCost: { increment: totalMachineCost },
          labourCost: { increment: totalLabourCost },
          totalCost: { increment: totalMachineCost + totalLabourCost },
        },
      });

      // 5. Activity Log
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'PRODUCTION_LOGGED',
          description: `MSDR ${header.msdrNumber} (${header.productionSection}) recorded with ${(dto.items || []).length} operations. Cost: ₹${(totalMachineCost + totalLabourCost).toFixed(2)}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return header;
    });
  }

  async getMachineShopReports(projectId: string, section?: string) {
    const whereClause: any = { projectId };
    if (section) {
      whereClause.productionSection = section;
    }
    return this.prisma.msdrHeader.findMany({
      where: whereClause,
      include: { 
        machine: true, 
        employee: true,
        operations: true
      },
      orderBy: { reportDate: 'desc' },
    });
  }
}
