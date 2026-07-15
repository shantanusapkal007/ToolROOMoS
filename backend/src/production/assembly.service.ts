import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssemblyService {
  constructor(private prisma: PrismaService) {}

  // ======================
  // Assembly Work Orders
  // ======================
  async getAssemblyHeaders(projectId: string) {
    return this.prisma.assemblyHeader.findMany({
      where: { projectId },
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
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const assemblyNumber = `ASM-${projectId.substring(0, 4).toUpperCase()}-${randomNum}`;
    
    return this.prisma.assemblyHeader.create({
      data: {
        projectId,
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
    return this.prisma.projectTrial.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createProjectTrial(projectId: string, data: any) {
    const trialCount = await this.prisma.projectTrial.count({ where: { projectId } });
    const trialNumber = `TRIAL-${projectId.substring(0, 4).toUpperCase()}-0${trialCount + 1}`;
    
    return this.prisma.projectTrial.create({
      data: {
        projectId,
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
