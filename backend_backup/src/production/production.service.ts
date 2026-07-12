// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../platform/event.bus';
import { AuditEngine } from '../platform/audit.engine';

/**
 * @deprecated Use specific domain services (JobCardsService, ProductionOperationsService, SchedulingService)
 */
@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
  ) {}

  // ================= PLANNING: GENERATE JOB CARDS =================
  async generateJobCards(projectId: string, routingHeaderId: string, userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      const routing = await tx.routingHeader.findUnique({
        where: { id: routingHeaderId },
        include: { operations: true },
      });

      if (!routing) throw new NotFoundException('Routing not found');

      const jobCards = [];

      for (const op of routing.operations) {
        // Find default machine for this operation
        const machine = await tx.machine.findFirst({
          where: { isActive: true },
        });

        // Create a JobCard for the operation
        const jobCard = await tx.jobCard.create({
          data: {
            projectId,
            routingOperationId: op.id,
            machineId: machine ? machine.id : 'UNASSIGNED', // Fallback needed
            status: 'READY',
            priority: 'NORMAL',
            createdBy: userId,
          },
        });
        jobCards.push(jobCard);
        await this.audit.logAction(jobCard.id, 'JOB_CARD', 'CREATE', userId, jobCard);
      }

      return jobCards;
    });
  }

  // ================= SHOP FLOOR EXECUTION =================
  async getActiveJobCards(machineId?: string) {
    const where = machineId ? { machineId } : {};
    return this.prisma.jobCard.findMany({
      where,
      include: {
        project: true,
        routingOperation: true,
        machine: true,
        operator: true,
        timeLogs: {
          orderBy: { startTime: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async startOperation(jobCardId: string, operatorId: string, userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      const jobCard = await tx.jobCard.findUnique({ where: { id: jobCardId } });
      if (!jobCard) throw new NotFoundException('JobCard not found');
      if (jobCard.status === 'COMPLETED') throw new BadRequestException('JobCard is already completed');

      // Create Time Log
      const timeLog = await tx.jobCardTimeLog.create({
        data: {
          jobCardId,
          operatorId,
          status: 'IN_PROGRESS',
        },
      });

      // Update Job Card Status
      const updatedJobCard = await tx.jobCard.update({
        where: { id: jobCardId },
        data: { status: 'IN_PROGRESS', operatorId },
      });

      await this.audit.logAction(jobCardId, 'JOB_CARD', 'START', userId, { timeLogId: timeLog.id });
      return updatedJobCard;
    });
  }

  async completeOperation(jobCardId: string, userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      const jobCard = await tx.jobCard.findUnique({ 
        where: { id: jobCardId },
        include: { 
          machine: true,
          operator: true,
          routingOperation: true,
          timeLogs: { where: { status: 'IN_PROGRESS' } }
        }
      });
      
      if (!jobCard) throw new NotFoundException('JobCard not found');
      
      const activeLog = jobCard.timeLogs[0];
      if (!activeLog) throw new BadRequestException('No active time log found for this JobCard');

      // Calculate Duration
      const endTime = new Date();
      const durationHours = (endTime.getTime() - activeLog.startTime.getTime()) / (1000 * 60 * 60);

      // Update Time Log
      await tx.jobCardTimeLog.update({
        where: { id: activeLog.id },
        data: {
          endTime,
          duration: durationHours,
          status: 'COMPLETED',
        },
      });

      // Update Job Card Status
      const updatedJobCard = await tx.jobCard.update({
        where: { id: jobCardId },
        data: { status: 'COMPLETED' },
      });

      // ================= WIP LEDGER (FINANCIAL INTEGRATION) =================
      const machineCost = Number(jobCard.machine?.hourlyRate || 0) * durationHours;
      const labourCost = Number(jobCard.operator?.hourlyRate || 0) * durationHours;

      // Find active WIP Ledger for this project/operation
      const wip = await tx.wipLedger.findFirst({
        where: { projectId: jobCard.projectId, routingOperationId: jobCard.routingOperationId },
      });

      if (wip) {
        await tx.wipLedger.update({
          where: { id: wip.id },
          data: {
            accruedMachineCost: { increment: machineCost },
            accruedLabourCost: { increment: labourCost },
          },
        });
      } else {
        await tx.wipLedger.create({
          data: {
            projectId: jobCard.projectId,
            routingOperationId: jobCard.routingOperationId,
            machineId: jobCard.machineId,
            materialId: 'PENDING_MTRL', // Will map properly in actual BOM logic
            qtyInWip: 1, // Assumption: 1 unit batch
            accruedMachineCost: machineCost,
            accruedLabourCost: labourCost,
            status: 'IN_PROCESS',
          },
        });
      }

      await this.audit.logAction(jobCardId, 'JOB_CARD', 'COMPLETE', userId, { durationHours, machineCost, labourCost });
      return updatedJobCard;
    });
  }
}

