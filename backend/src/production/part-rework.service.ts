import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartReworkDto } from './dto/create-part-rework.dto';
import { UpdatePartReworkDto } from './dto/update-part-rework.dto';

@Injectable()
export class PartReworkService {
  constructor(private prisma: PrismaService) {}

  private async resolveProjectId(projectId: string): Promise<string> {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [{ id: projectId }, { projectNumber: projectId }],
      },
    });
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`);
    }
    return project.id;
  }

  async getReworkOrders(projectId: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.partReworkOrder.findMany({
      where: { projectId: targetProjectId },
      include: {
        trial: {
          select: {
            id: true,
            trialNumber: true,
            trialStage: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReworkOrderById(projectId: string, id: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    const order = await this.prisma.partReworkOrder.findFirst({
      where: { id, projectId: targetProjectId },
      include: {
        trial: true,
      },
    });
    if (!order) {
      throw new NotFoundException(`Part rework order not found: ${id}`);
    }
    return order;
  }

  async createReworkOrder(projectId: string, dto: CreatePartReworkDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const targetProjectId = await this.resolveProjectId(projectId);

      const project = await tx.project.findUnique({
        where: { id: targetProjectId },
        select: { projectNumber: true },
      });

      const count = await tx.partReworkOrder.count({
        where: { projectId: targetProjectId },
      });

      const prefix = project?.projectNumber || 'PRJ';
      const reworkNumber = `RWK-${prefix}-${(count + 1).toString().padStart(3, '0')}`;

      const reworkOrder = await tx.partReworkOrder.create({
        data: {
          projectId: targetProjectId,
          reworkNumber,
          partName: dto.partName,
          partNumber: dto.partNumber || null,
          bomItemId: dto.bomItemId || null,
          sourceStage: dto.sourceStage || 'MACHINING',
          reworkType: dto.reworkType || 'CORRECTIVE_MACHINING',
          defectReason: dto.defectReason || 'DIMENSION_DEVIATION',
          description: dto.description,
          quantity: dto.quantity || 1,
          severity: dto.severity || 'NORMAL',
          status: 'REQUESTED',
          targetDepartment: dto.targetDepartment || 'MACHINE_SHOP',
          assignedTo: dto.assignedTo || null,
          machineId: dto.machineId || null,
          estimatedHours: dto.estimatedHours || 0,
          trialId: dto.trialId || null,
          ncrId: dto.ncrId || null,
          requestedBy: dto.requestedBy || userId || 'ENGINEER',
        },
      });

      // Log project activity
      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'PART_REWORK_REQUESTED',
          description: `Part Rework ${reworkNumber} created for "${dto.partName}" (${dto.reworkType}) - ${dto.description}`,
          performedBy: dto.requestedBy || userId || 'SYSTEM',
        },
      });

      return reworkOrder;
    });
  }

  async updateReworkStatus(projectId: string, id: string, dto: UpdatePartReworkDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const targetProjectId = await this.resolveProjectId(projectId);

      const existing = await tx.partReworkOrder.findFirst({
        where: { id, projectId: targetProjectId },
      });

      if (!existing) {
        throw new NotFoundException(`Part rework order not found: ${id}`);
      }

      const isCompleting = dto.status === 'COMPLETED' || dto.status === 'REJECTED_SCRAPPED';

      const updated = await tx.partReworkOrder.update({
        where: { id },
        data: {
          ...(dto.status ? { status: dto.status } : {}),
          ...(dto.assignedTo !== undefined ? { assignedTo: dto.assignedTo } : {}),
          ...(dto.machineId !== undefined ? { machineId: dto.machineId } : {}),
          ...(dto.actualHours !== undefined ? { actualHours: dto.actualHours } : {}),
          ...(dto.costImpact !== undefined ? { costImpact: dto.costImpact } : {}),
          ...(dto.inspectionResult !== undefined ? { inspectionResult: dto.inspectionResult } : {}),
          ...(dto.resolutionNotes !== undefined ? { resolutionNotes: dto.resolutionNotes } : {}),
          ...(isCompleting ? { completedAt: new Date() } : {}),
        },
      });

      // Log project activity if status changed
      if (dto.status && dto.status !== existing.status) {
        await tx.projectActivity.create({
          data: {
            projectId: targetProjectId,
            action: 'PART_REWORK_UPDATED',
            description: `Part Rework ${existing.reworkNumber} for "${existing.partName}" transitioned from ${existing.status} to ${dto.status}`,
            performedBy: userId || 'SYSTEM',
          },
        });
      }

      return updated;
    });
  }

  async deleteReworkOrder(projectId: string, id: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.partReworkOrder.delete({
      where: { id, projectId: targetProjectId },
    });
  }
}
