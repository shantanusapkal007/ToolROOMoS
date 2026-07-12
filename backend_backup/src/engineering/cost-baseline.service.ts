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
        for (const op of activeRouting.operations) {
          const hours = op.estimatedHours.toNumber();
          const machineRate = op.plannedMachine?.hourlyRate?.toNumber() || 0;
          
          estimatedMachineCost += hours * machineRate;
          
          // Automation A: Dynamic labour rate lookup based on department average or project owner rate
          let opLabourRate = 0;
          if (op.plannedMachine?.departmentId) {
            const deptEmployees = await tx.employee.findMany({
              where: { departmentId: op.plannedMachine.departmentId, status: 'ACTIVE' },
            });
            const validRates = deptEmployees.map(e => e.hourlyRate.toNumber()).filter(r => r > 0);
            if (validRates.length > 0) {
              const sum = validRates.reduce((a, b) => a + b, 0);
              opLabourRate = sum / validRates.length;
            }
          }

          if (opLabourRate === 0 && project.projectOwner) {
            const ownerUser = await tx.user.findFirst({
              where: { name: { contains: project.projectOwner, mode: 'insensitive' } },
            });
            if (ownerUser && ownerUser.hourlyRate) {
              opLabourRate = ownerUser.hourlyRate.toNumber();
            }
          }

          if (opLabourRate === 0) {
            opLabourRate = 250; // Standard fallback
          }

          estimatedLabourCost += hours * opLabourRate;
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
