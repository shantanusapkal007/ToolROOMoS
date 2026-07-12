// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CostEngineService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Estimated Cost (from BOM) ────────────────────────────────────

  async getEstimatedCost(projectId: string) {
    const bomHeaders = await this.prisma.billOfMaterialHeader.findMany({
      where: { projectId },
      include: { items: { include: { material: true } } },
    });

    let totalEstimatedMaterial = 0;
    let totalEstimatedProcess = 0;
    const lineItems: any[] = [];

    for (const bom of bomHeaders) {
      for (const item of bom.items) {
        const materialCost = Number(item.estimatedCost);
        const processCost = Number(item.estimatedProcessCost || 0);
        totalEstimatedMaterial += materialCost;
        totalEstimatedProcess += processCost;
        lineItems.push({
          bomNumber: bom.bomNumber,
          materialCode: item.material?.materialCode,
          materialGrade: item.material?.materialGrade,
          requiredQty: Number(item.requiredQty),
          estimatedMaterialCost: materialCost,
          estimatedProcessCost: processCost,
          totalLineCost: materialCost + processCost,
        });
      }
    }

    return {
      projectId,
      totalEstimatedMaterial,
      totalEstimatedProcess,
      totalEstimatedCost: totalEstimatedMaterial + totalEstimatedProcess,
      lineItems,
    };
  }

  // ─── Actual Cost (from WIP Ledger) ────────────────────────────────

  async getActualCost(projectId: string) {
    const wipEntries = await this.prisma.wipLedger.findMany({
      where: { projectId },
      include: {
        material: true,
        machine: true,
        routingOperation: true,
      },
    });

    let totalActualMaterial = 0;
    let totalActualMachine = 0;
    let totalActualLabour = 0;
    const lineItems: any[] = [];

    for (const entry of wipEntries) {
      const materialCost = Number(entry.accruedMaterialCost);
      const machineCost = Number(entry.accruedMachineCost);
      const labourCost = Number(entry.accruedLabourCost);

      totalActualMaterial += materialCost;
      totalActualMachine += machineCost;
      totalActualLabour += labourCost;

      lineItems.push({
        materialCode: entry.material?.materialCode,
        materialGrade: entry.material?.materialGrade,
        machineName: entry.machine?.machineName || null,
        operationName: entry.routingOperation?.operationName || null,
        qtyInWip: Number(entry.qtyInWip),
        accruedMaterialCost: materialCost,
        accruedMachineCost: machineCost,
        accruedLabourCost: labourCost,
        totalLineCost: materialCost + machineCost + labourCost,
        status: entry.status,
      });
    }

    return {
      projectId,
      totalActualMaterial,
      totalActualMachine,
      totalActualLabour,
      totalActualCost: totalActualMaterial + totalActualMachine + totalActualLabour,
      lineItems,
    };
  }

  // ─── Variance Analysis ────────────────────────────────────────────

  async getVarianceAnalysis(projectId: string) {
    const estimated = await this.getEstimatedCost(projectId);
    const actual = await this.getActualCost(projectId);

    const materialVariance = actual.totalActualMaterial - estimated.totalEstimatedMaterial;
    const processVariance = (actual.totalActualMachine + actual.totalActualLabour) - estimated.totalEstimatedProcess;
    const totalVariance = actual.totalActualCost - estimated.totalEstimatedCost;

    return {
      projectId,
      estimated: {
        material: estimated.totalEstimatedMaterial,
        process: estimated.totalEstimatedProcess,
        total: estimated.totalEstimatedCost,
      },
      actual: {
        material: actual.totalActualMaterial,
        machine: actual.totalActualMachine,
        labour: actual.totalActualLabour,
        total: actual.totalActualCost,
      },
      variance: {
        material: materialVariance,
        process: processVariance,
        total: totalVariance,
        percentDeviation: estimated.totalEstimatedCost > 0
          ? Number(((totalVariance / estimated.totalEstimatedCost) * 100).toFixed(2))
          : 0,
      },
    };
  }

  // ─── All Projects Summary ─────────────────────────────────────────

  async getAllProjectsCostSummary() {
    const projects = await this.prisma.project.findMany({
      select: { id: true, projectNumber: true, partName: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const summaries = [];
    for (const project of projects) {
      try {
        const variance = await this.getVarianceAnalysis(project.id);
        const { projectId: _pid, ...varianceData } = variance;
        summaries.push({
          projectId: project.id,
          projectNumber: project.projectNumber,
          partName: project.partName,
          ...varianceData,
        });
      } catch {
        // Skip projects with no BOM/WIP data
      }
    }

    return summaries;
  }
  // ─── Project Cost Summary (From Ledger) ───────────────────────────

  async getProjectCostSummary(projectId: string) {
    const summary = await this.prisma.projectCostSummary.findUnique({
      where: { projectId },
    });
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { projectNumber: true }
    });
    return { project, summary };
  }

  async getProjectCostHistory(projectId: string) {
    return this.prisma.projectCostEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectMaterialCosts(projectId: string) {
    return this.prisma.goodsReceiptHeader.findMany({
      where: { projectId },
      include: {
        items: {
          include: {
            poItem: {
              include: { material: true }
            }
          }
        }
      }
    });
  }
}

