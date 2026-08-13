import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class DispatchesService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveProjectId(projectId: string, tx?: any): Promise<string> {
    const db = tx || this.prisma;
    const project = await db.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { projectNumber: projectId }
        ]
      }
    });
    return project?.id || projectId;
  }

  async createDispatch(projectId: string, dto: CreateDispatchDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const targetProjectId = await this.resolveProjectId(projectId, tx);

      // 1. Fetch project to get customerId
      const project = await tx.project.findFirst({
        where: {
          OR: [
            { id: projectId },
            { projectNumber: projectId }
          ]
        }
      });
      if (!project) {
        throw new NotFoundException(`Project not found for ID or project number '${projectId}'.`);
      }

      // 2. Create Dispatch Note
      const dispatch = await tx.dispatchNote.create({
        data: {
          projectId: targetProjectId,
          customerId: project.customerId,
          dispatchNumber: dto.dispatchNumber,
          documentNumber: dto.dispatchNumber,
          dispatchQty: dto.dispatchQty,
          transporterName: dto.transporterName,
          vehicleNumber: dto.vehicleNumber,
          driverDetails: dto.driverDetails,
          trackingReference: dto.trackingReference,
          logisticsCost: dto.logisticsCost,
          status: 'COMPLETED',
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 3. Costing Integration: Rollup logistics cost to ProjectCostSummary (Layer 5 - Outcomes)
      const safeLogisticsCost = dto.logisticsCost || 0;
      await tx.projectCostSummary.upsert({
        where: { projectId: targetProjectId },
        create: {
          projectId: targetProjectId,
          materialConsumptionCost: 0,
          totalCost: safeLogisticsCost,
          estimatedMaterialCost: 0,
          actualMaterialCost: 0,
          machineCost: 0,
          labourCost: 0,
          outsideProcessCost: 0,
          inspectionCost: 0,
          packingCost: 0,
          dispatchCost: safeLogisticsCost,
          revenue: 0,
          profitability: -safeLogisticsCost,
        },
        update: {
          totalCost: { increment: safeLogisticsCost },
          dispatchCost: { increment: safeLogisticsCost },
          profitability: { decrement: safeLogisticsCost },
        },
      });

      // 4. Record Project Cost Event
      if (safeLogisticsCost > 0) {
        await tx.projectCostEvent.create({
          data: {
            projectId: targetProjectId,
            costType: 'DISPATCH_COST',
            description: `Logistics Cost for Dispatch ${dto.dispatchNumber}`,
            amount: safeLogisticsCost,
            referenceDocType: 'DISPATCH',
            referenceDocId: dispatch.id,
            createdBy: userId,
          },
        });
      }

      // 5. Workflow Stage Progression
      await tx.project.update({
        where: { id: targetProjectId },
        data: { currentStage: ProjectStatus.DISPATCHED, updatedBy: userId },
      });

      await tx.projectTimeline.create({
        data: {
          projectId: targetProjectId,
          fromStage: project.currentStage,
          toStage: ProjectStatus.DISPATCHED,
          transitionedBy: userId || 'SYSTEM',
          remarks: `Dispatch ${dto.dispatchNumber} logged.`,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'STAGE_CHANGED',
          description: 'Project advanced to DISPATCHED stage',
          performedBy: userId || 'SYSTEM',
        },
      });

      return dispatch;
    });
  }

  async getDispatches(projectId: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.dispatchNote.findMany({
      where: { projectId: targetProjectId },
      include: { items: true },
      orderBy: { dispatchDate: 'desc' },
    });
  }
}
