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
      include: {
        reworkOrders: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createProjectTrial(projectId: string, data: any, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const targetProjectId = await this.resolveProjectId(projectId);
      const project = await tx.project.findUnique({
        where: { id: targetProjectId },
        select: { projectNumber: true },
      });

      const trialCount = await tx.projectTrial.count({ where: { projectId: targetProjectId } });
      const seqStr = (trialCount + 1).toString().padStart(2, '0');
      const stageCode = data.trialStage || `T${trialCount}`;
      const trialNumber = data.trialNumber || `TRL-${project?.projectNumber || 'PRJ'}-${stageCode}-${seqStr}`;
      
      const trial = await tx.projectTrial.create({
        data: {
          projectId: targetProjectId,
          trialNumber,
          trialStage: data.trialStage || 'T0',
          trialDate: data.trialDate ? new Date(data.trialDate) : new Date(),
          machineName: data.machineName || null,
          pressTonnage: data.pressTonnage || null,
          spmRate: data.spmRate || null,
          bolsterHeight: data.bolsterHeight || null,
          cushionPressure: data.cushionPressure || null,
          sampleQty: data.sampleQty ? Number(data.sampleQty) : 10,
          result: data.result || 'PASS',
          status: data.status || (data.result === 'PASS' ? 'PASSED' : data.result === 'REWORK_REQUIRED' ? 'FAILED' : 'PENDING'),
          remarks: data.remarks || '',
          defectLog: data.defectLog || null,
          inspectorName: data.inspectorName || userId || null,
          reportUrl: data.reportUrl || null,
        },
        include: {
          reworkOrders: true,
        },
      });

      // Log project activity
      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'TRIAL_CONDUCTED',
          description: `Press Trial ${trialNumber} (${trial.trialStage}) conducted on ${trial.machineName || 'Press Shop'}. Result: ${trial.result}`,
          performedBy: userId || data.inspectorName || 'SYSTEM',
        },
      });

      return trial;
    });
  }

  async updateTrialStatus(id: string, status: string, remarks: string, data?: any) {
    return this.prisma.projectTrial.update({
      where: { id },
      data: {
        status,
        remarks,
        ...(data?.result ? { result: data.result } : {}),
        ...(data?.defectLog !== undefined ? { defectLog: data.defectLog } : {}),
        ...(data?.inspectorName ? { inspectorName: data.inspectorName } : {}),
      },
      include: {
        reworkOrders: true,
      },
    });
  }

  async signOffTrial(id: string, signoffBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const trial = await tx.projectTrial.update({
        where: { id },
        data: {
          customerSignoff: true,
          signoffDate: new Date(),
          signoffBy,
          status: 'PASSED',
          result: 'PASS',
        },
        include: {
          project: true,
        },
      });

      // Log activity
      await tx.projectActivity.create({
        data: {
          projectId: trial.projectId,
          action: 'TRIAL_CUSTOMER_SIGNOFF',
          description: `Customer sign-off completed for Trial ${trial.trialNumber} by ${signoffBy}`,
          performedBy: signoffBy,
        },
      });

      return trial;
    });
  }
}
