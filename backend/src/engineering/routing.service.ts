import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutingDto } from './dto/create-routing.dto';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class RoutingService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async submitEngineeringPlan(projectId: string, dto: CreateRoutingDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validation Engine (resolving by ID or projectNumber like KTD-433)
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
      const targetProjectId = project.id;

      // 2. Validate sequence uniqueness & machine assignment
      const sequences = new Set();
      for (const op of dto.operations) {
        if (sequences.has(op.sequenceOrder)) {
          throw new BadRequestException(`Validation Failed: Duplicate sequence order ${op.sequenceOrder} found.`);
        }
        sequences.add(op.sequenceOrder);

        if (!op.machineId) {
          throw new BadRequestException(`Validation Failed: Operation ${op.sequenceOrder} has no machine assigned.`);
        }

        if (op.estimatedHours <= 0) {
          throw new BadRequestException(`Validation Failed: Operation ${op.sequenceOrder} must have estimated hours > 0.`);
        }
      }

      // 3. Mark previous active routing as obsolete (Revision Engine)
      await tx.routingHeader.updateMany({
        where: { projectId: targetProjectId, status: { in: ['DRAFT', 'APPROVED'] } },
        data: { status: 'OBSOLETE' },
      });

      // 4. Create new Routing Plan
      const routing = await tx.routingHeader.create({
        data: {
          projectId: targetProjectId,
          documentNumber: dto.documentNumber || `RTG-${project.projectNumber}`,
          status: 'DRAFT',
          approvalStatus: 'PENDING',
          createdBy: userId,
          updatedBy: userId,
          operations: {
            create: dto.operations.map(op => ({
              sequenceOrder: op.sequenceOrder,
              operationId: op.operationId,
              plannedMachineId: op.machineId,
              estimatedHours: op.estimatedHours,
              estimatedSetupTime: op.estimatedSetupTime || 0,
              remarks: op.remarks,
              createdBy: userId,
              updatedBy: userId,
            }))
          }
        },
        include: { operations: true }
      });

      // 5. Record Activity
      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'MANUFACTURING_PLAN_SUBMITTED',
          description: `Manufacturing Routing Plan ${routing.documentNumber} submitted for approval.`,
          performedBy: userId || 'SYSTEM',
        }
      });

      return routing;
    });
  }

  async validateManufacturingPlan(projectId: string, routingId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { projectNumber: projectId }
        ]
      },
      include: {
        billOfMaterialHeaders: { where: { status: 'APPROVED' } },
        routingHeaders: { where: { id: routingId } }
      }
    });

    const isBomComplete = (project?.billOfMaterialHeaders?.length ?? 0) > 0;
    const routing = project?.routingHeaders[0];

    const isRoutingValid = !!routing && routing.status !== 'OBSOLETE';

    return {
      isValid: isBomComplete && isRoutingValid,
      gates: {
        bomComplete: isBomComplete,
        routingComplete: isRoutingValid
      }
    };
  }

  async approveManufacturingPlan(projectId: string, routingId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
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

      const targetProjectId = project.id;

      // 1. Approve Routing
      const routing = await tx.routingHeader.update({
        where: { id: routingId },
        data: {
          status: 'APPROVED',
          approvalStatus: 'APPROVED',
          updatedBy: userId
        }
      });

      // 3. Advance Workflow (Ready for Procurement)
      await tx.project.update({
        where: { id: targetProjectId },
        data: { currentStage: 'PROCUREMENT', updatedBy: userId }
      });

      await tx.projectTimeline.create({
        data: {
          projectId: targetProjectId,
          fromStage: 'ENGINEERING',
          toStage: 'PROCUREMENT',
          transitionedBy: userId || 'SYSTEM',
          remarks: 'Engineering Plan Approved. Cost Baseline Frozen.',
        }
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'MANUFACTURING_PLAN_APPROVED',
          description: `Routing ${routing.documentNumber} approved. Project advanced to PROCUREMENT.`,
          performedBy: userId || 'SYSTEM',
        }
      });

      return routing;
    });
  }

  async rejectManufacturingPlan(projectId: string, routingId: string, remarks: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
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

      const targetProjectId = project.id;

      const routing = await tx.routingHeader.findFirstOrThrow({ where: { id: routingId, projectId: targetProjectId } });
      if (routing.approvalStatus !== 'PENDING') {
        throw new BadRequestException('Only a PENDING Routing can be rejected.');
      }

      const rejected = await tx.routingHeader.update({
        where: { id: routingId },
        data: {
          approvalStatus: 'REJECTED',
          status: 'REJECTED',
          remarks,
          updatedBy: userId,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'ROUTING_REJECTED',
          description: `Manufacturing Plan Rev ${routing.revision} rejected. Reason: ${remarks}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return rejected;
    });
  }

  async getActiveRouting(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { projectNumber: projectId }
        ]
      }
    });
    if (!project) return null;

    return this.prisma.routingHeader.findFirst({
      where: { projectId: project.id, status: { in: ['DRAFT', 'APPROVED'] } },
      include: {
        operations: {
          include: { operation: true, plannedMachine: true },
          orderBy: { sequenceOrder: 'asc' }
        }
      },
      orderBy: { revision: 'desc' }
    });
  }
}

