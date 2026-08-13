import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssemblyService {
  constructor(private prisma: PrismaService) {}

  private async resolveProjectId(projectId: string): Promise<string> {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { projectNumber: projectId }
        ]
      }
    });
    return project?.id || projectId;
  }

  // ======================
  // Assembly Work Orders
  // ======================
  async getAssemblyHeaders(projectId: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.assemblyHeader.findMany({
      where: { projectId: targetProjectId },
      include: {
        components: {
          include: { material: true }
        },
        subAssemblies: true,
        parentAssembly: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createAssemblyHeader(projectId: string, data: any) {
    const targetProjectId = await this.resolveProjectId(projectId);
    const count = await this.prisma.assemblyHeader.count({ where: { projectId: targetProjectId } });
    const seqStr = (count + 1).toString().padStart(3, '0');
    const assemblyNumber = `ASM-${targetProjectId.substring(0, 4).toUpperCase()}-${seqStr}`;
    
    return this.prisma.assemblyHeader.create({
      data: {
        projectId: targetProjectId,
        assemblyNumber,
        assemblyName: data.assemblyName || 'Final Assembly',
        status: 'DRAFT',
        parentAssemblyId: data.parentAssemblyId || null,
      }
    });
  }

  async updateAssemblyStatus(id: string, status: string) {
    return this.prisma.assemblyHeader.update({
      where: { id },
      data: { status }
    });
  }

  async addAssemblyComponent(headerId: string, data: any) {
    return this.prisma.assemblyComponent.create({
      data: {
        assemblyHeaderId: headerId,
        materialId: data.materialId,
        quantity: data.quantity
      }
    });
  }

  async linkSubAssembly(parentId: string, childId: string) {
    return this.prisma.assemblyHeader.update({
      where: { id: childId },
      data: { parentAssemblyId: parentId }
    });
  }

  // ======================
  // Project Trials
  // ======================
  async getProjectTrials(projectId: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.projectTrial.findMany({
      where: { projectId: targetProjectId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createProjectTrial(projectId: string, data: any) {
    const targetProjectId = await this.resolveProjectId(projectId);
    const trialCount = await this.prisma.projectTrial.count({ where: { projectId: targetProjectId } });
    const trialNumber = `TRIAL-${targetProjectId.substring(0, 4).toUpperCase()}-0${trialCount + 1}`;
    
    return this.prisma.projectTrial.create({
      data: {
        projectId: targetProjectId,
        trialNumber,
        trialDate: data.trialDate ? new Date(data.trialDate) : new Date(),
        status: data.status || 'PENDING',
        remarks: data.remarks || '',
      }
    });
  }

  async updateTrialStatus(id: string, status: string, remarks: string) {
    return this.prisma.projectTrial.update({
      where: { id },
      data: { status, remarks }
    });
  }

  async signOffTrial(id: string, signoffBy: string) {
    return this.prisma.projectTrial.update({
      where: { id },
      data: {
        customerSignoff: true,
        signoffDate: new Date(),
        signoffBy,
        status: 'PASSED'
      }
    });
  }
}
