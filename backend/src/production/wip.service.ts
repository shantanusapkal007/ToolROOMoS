import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WipService {
  private readonly logger = new Logger(WipService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initializes a WIP ledger entry when material is issued to a Job Card / Project
   */
  async initializeWipEntry(data: {
    projectId: string;
    materialId: string;
    batchId?: string;
    qtyInWip: number;
    initialMaterialCost: number;
  }, txClient?: any) {
    const tx = txClient || this.prisma;

    return await tx.wipLedger.create({
      data: {
        projectId: data.projectId,
        materialId: data.materialId,
        batchId: data.batchId,
        qtyInWip: data.qtyInWip,
        accruedMaterialCost: data.initialMaterialCost,
        accruedMachineCost: 0,
        accruedLabourCost: 0,
        status: 'IN_PROCESS'
      }
    });
  }

  /**
   * Updates WIP location and accrues machine/labour costs after a production operation (MSDR)
   */
  async updateWipProgress(data: {
    projectId: string;
    routingOperationId: string;
    machineId: string;
    batchId?: string;
    accruedMachineCost: number;
    accruedLabourCost: number;
  }, txClient?: any) {
    const tx = txClient || this.prisma;

    // Find active WIP entry for this project/batch
    const activeWip = await tx.wipLedger.findFirst({
      where: {
        projectId: data.projectId,
        batchId: data.batchId, // if tracked by batch
        status: 'IN_PROCESS'
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!activeWip) {
      this.logger.warn(`No active WIP entry found for Project ${data.projectId} / Batch ${data.batchId}`);
      return null;
    }

    return await tx.wipLedger.update({
      where: { id: activeWip.id },
      data: {
        routingOperationId: data.routingOperationId,
        machineId: data.machineId,
        accruedMachineCost: { increment: data.accruedMachineCost },
        accruedLabourCost: { increment: data.accruedLabourCost }
      }
    });
  }

  /**
   * Nightly cron job to snapshot the total tied-up capital in WIP across the shop floor
   */
  async snapshotWipValuation() {
    this.logger.log('Starting nightly WIP valuation snapshot...');

    const activeWipRecords = await this.prisma.wipLedger.findMany({
      where: { status: 'IN_PROCESS' }
    });

    let totalMaterial = 0;
    let totalMachine = 0;
    let totalLabour = 0;

    for (const record of activeWipRecords) {
      totalMaterial += Number(record.accruedMaterialCost);
      totalMachine += Number(record.accruedMachineCost);
      totalLabour += Number(record.accruedLabourCost);
    }

    const totalWipValue = totalMaterial + totalMachine + totalLabour;

    await this.prisma.wipValuationSnapshot.create({
      data: {
        snapshotDate: new Date(),
        totalWipValue,
        totalMaterialCost: totalMaterial,
        totalMachineCost: totalMachine,
        totalLabourCost: totalLabour
      }
    });

    this.logger.log(`WIP Snapshot completed. Total WIP Value: ₹${totalWipValue}`);
  }
}
