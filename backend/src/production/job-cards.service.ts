import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobCardsService {
  constructor(private prisma: PrismaService) {}

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

  async getJobCardsForProject(projectId: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.jobCard.findMany({
      where: { projectId: targetProjectId },
      include: {
        routingOperation: {
          include: { operation: true }
        },
        machine: true,
        operator: true
      },
      orderBy: {
        routingOperation: { sequenceOrder: 'asc' }
      }
    });
  }

  async generateJobCardsFromRouting(projectId: string) {
    return this.prisma.$transaction(async (tx) => {
      const targetProjectId = await this.resolveProjectId(projectId, tx);

      // Find the approved routing for this project
      const routing = await tx.routingHeader.findFirst({
        where: { projectId: targetProjectId },
        orderBy: { createdAt: 'desc' },
        include: { operations: true }
      });

      if (!routing) {
        throw new BadRequestException('Cannot generate Job Cards: No Routing exists for this project yet.');
      }

      // Check if job cards already exist for THIS routing version
      const existing = await tx.jobCard.count({ 
        where: { routingOperation: { routingHeaderId: routing.id } } 
      });
      if (existing > 0) {
        throw new BadRequestException('Job Cards already exist for this routing version.');
      }

      const jobCardsToCreate = routing.operations.map(op => {
        if (!op.plannedMachineId) {
            throw new BadRequestException(`Routing Operation ${op.sequenceOrder} is missing a planned machine.`);
        }
        return {
          projectId: targetProjectId,
          routingOperationId: op.id,
          machineId: op.plannedMachineId,
          status: 'READY',
          priority: 'NORMAL'
        };
      });

      if (jobCardsToCreate.length === 0) {
          throw new BadRequestException('Cannot generate Job Cards: Routing has no operations.');
      }

      await tx.jobCard.createMany({
        data: jobCardsToCreate
      });

      return this.getJobCardsForProject(targetProjectId);
    });
  }

  async updateJobCardStatus(id: string, status: string, operatorId?: string) {
    return this.prisma.jobCard.update({
      where: { id },
      data: { status, operatorId },
      include: {
        routingOperation: {
          include: { operation: true }
        },
        machine: true,
        operator: true
      }
    });
  }

  async deleteJobCard(id: string) {
    return this.prisma.jobCard.delete({
      where: { id }
    });
  }
}
