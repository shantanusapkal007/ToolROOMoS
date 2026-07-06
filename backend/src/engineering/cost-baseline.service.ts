import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CostBaselineService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateAndFreezeCostBaseline(projectId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });

      // 1. Calculate Estimated Material Cost from Approved BOM
      const activeBom = await tx.billOfMaterialHeader.findFirst({
        where: { projectId, status: 'APPROVED' },
        include: {
          items: {
            include: { material: true }
          }
        },
        orderBy: { revision: 'desc' }
      });

      let estimatedMaterialCost = 0;
      if (activeBom) {
        for (const item of activeBom.items) {
          // Fallback to standardCost
          const rate = item.material.standardCost?.toNumber() || 0;
          estimatedMaterialCost += item.requiredQty.toNumber() * rate;
        }
      }

      // 2. Calculate Estimated Machine and Labour Cost from Approved Routing
      const activeRouting = await tx.routingHeader.findFirst({
        where: { projectId, status: 'APPROVED' },
        include: {
          operations: {
            include: { plannedMachine: true }
          }
        },
        orderBy: { revision: 'desc' }
      });

      let estimatedMachineCost = 0;
      let estimatedLabourCost = 0;
      let estimatedOutsideProcessCost = 0; // TODO: Fetch from subcontracting if applicable in future

      if (activeRouting) {
        // Assume standard shop labour rate of 250/hr if employee rate isn't mapped per operation
        const standardLabourRate = 250; 
        
        for (const op of activeRouting.operations) {
          const hours = op.estimatedHours.toNumber();
          const machineRate = op.plannedMachine?.hourlyRate?.toNumber() || 0;
          
          estimatedMachineCost += hours * machineRate;
          estimatedLabourCost += hours * standardLabourRate;
        }
      }

      const estimatedManufacturingCost = estimatedMaterialCost + estimatedMachineCost + estimatedLabourCost + estimatedOutsideProcessCost;
      const estimatedProjectCost = estimatedManufacturingCost; // Additional overheads can be added here later

      // 3. Freeze into ProjectCostSummary
      const summary = await tx.projectCostSummary.upsert({
        where: { projectId },
        create: {
          projectId,
          estimatedMaterialCost,
          estimatedMachineCost,
          estimatedLabourCost,
          estimatedOutsideProcessCost,
          estimatedManufacturingCost,
          estimatedProjectCost,
        },
        update: {
          estimatedMaterialCost,
          estimatedMachineCost,
          estimatedLabourCost,
          estimatedOutsideProcessCost,
          estimatedManufacturingCost,
          estimatedProjectCost,
        }
      });

      // 4. Record Activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'COST_BASELINE_FROZEN',
          description: `Cost Baseline frozen at ${estimatedManufacturingCost.toFixed(2)}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return summary;
    });
  }
}
