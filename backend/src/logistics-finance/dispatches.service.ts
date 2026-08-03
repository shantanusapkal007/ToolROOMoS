import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class DispatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async createDispatch(projectId: string, dto: CreateDispatchDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch project to get customerId
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      // 2. Business Rule: Cannot dispatch without Passed PDI - Removed
      // 3. Business Rule: Cannot dispatch with Open NCR - Removed

      // 2. Create Dispatch Note
      const dispatch = await tx.dispatchNote.create({
        data: {
          projectId,
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
      // Guard against null/undefined logisticsCost (free deliveries)
      const safeLogisticsCost = dto.logisticsCost || 0;
      const summary = await tx.projectCostSummary.upsert({
        where: { projectId },
        create: {
          projectId,
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
          dispatchCost: { increment: safeLogisticsCost },
          totalCost: { increment: safeLogisticsCost },
        },
      });

      const currentRevenue = Number(summary.revenue || 0);
      const updatedTotalCost = Number(summary.totalCost || 0);
      await tx.projectCostSummary.update({
        where: { projectId },
        data: {
          profitability: currentRevenue - updatedTotalCost,
        },
      });

      // Record detailed cost audit trail event
      await tx.projectCostEvent.create({
        data: {
          projectId,
          costType: 'DISPATCH_COST',
          description: `Logistics cost logged for Dispatch Note ${dto.dispatchNumber}`,
          amount: safeLogisticsCost,
          referenceDocType: 'DISPATCH',
          referenceDocId: dispatch.id,
          createdBy: userId,
        },
      });

      // 4. Log project activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'PROJECT_DISPATCHED',
          description: `Dispatch Note ${dto.dispatchNumber} logged. Parts sent: ${dto.dispatchQty}. Logistics Cost booked: ₹${safeLogisticsCost}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 5. Workflow Automation: Advance Project to DISPATCHED
      await tx.project.update({
        where: { id: projectId },
        data: { currentStage: ProjectStatus.DISPATCHED, updatedBy: userId },
      });

      await tx.projectTimeline.create({
        data: {
          projectId,
          fromStage: ProjectStatus.DISPATCH_READY,
          toStage: ProjectStatus.DISPATCHED,
          transitionedBy: userId || 'SYSTEM',
          remarks: `Material loaded and dispatched. Shipping value: ₹${dto.logisticsCost}`,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'STAGE_CHANGED',
          description: 'Project advanced to DISPATCHED stage',
          performedBy: userId || 'SYSTEM',
        },
      });

      return dispatch;
    });
  }

  async getDispatches(projectId: string) {
    return this.prisma.dispatchNote.findMany({
      where: { projectId },
      include: { items: true },
      orderBy: { dispatchDate: 'desc' },
    });
  }
}
