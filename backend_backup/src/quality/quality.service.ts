import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEngine } from '../platform/audit.engine';

@Injectable()
export class QualityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditEngine,
  ) {}

  async getPendingInspections(projectId?: string) {
    const where = projectId ? { projectId, status: 'PENDING' } : { status: 'PENDING' };
    return this.prisma.inspectionHeader.findMany({
      where,
      include: {
        project: true,
        routingOperation: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCompletedInspections(projectId?: string) {
    const where = projectId ? { projectId, status: 'COMPLETED' } : { status: 'COMPLETED' };
    return this.prisma.inspectionHeader.findMany({
      where,
      include: {
        project: true,
        routingOperation: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInspection(data: {
    projectId: string;
    routingOperationId?: string;
    inspectedQty: number;
    inspectionType?: 'FIRST_PIECE' | 'IN_PROCESS' | 'FINAL' | 'PDI' | 'FINAL_PDI';
    userId?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const inspectionNumber = `QA-${Date.now()}`;
      
      const inspection = await tx.inspectionHeader.create({
        data: {
          projectId: data.projectId,
          routingOperationId: data.routingOperationId,
          inspectionNumber,
          inspectedQty: data.inspectedQty,
          status: 'PENDING',
          result: 'PASS', // Default before evaluation
          inspectionType: data.inspectionType || 'IN_PROCESS',
          createdBy: data.userId || 'SYSTEM',
        },
      });

      await this.audit.logAction(inspection.id, 'INSPECTION', 'CREATE', data.userId || 'SYSTEM', inspection);
      return inspection;
    });
  }

  async completeInspection(
    inspectionId: string, 
    data: { passedQty: number; reworkQty: number; scrapQty: number; result: 'PASS' | 'REWORK' | 'SCRAP'; userId?: string }
  ) {
    return this.prisma.$transaction(async (tx) => {
      const inspection = await tx.inspectionHeader.findUnique({ where: { id: inspectionId } });
      if (!inspection) throw new NotFoundException('Inspection not found');

      const updated = await tx.inspectionHeader.update({
        where: { id: inspectionId },
        data: {
          passedQty: data.passedQty,
          reworkQty: data.reworkQty,
          scrapQty: data.scrapQty,
          result: data.result,
          status: 'COMPLETED',
          updatedBy: data.userId || 'SYSTEM',
        }
      });

      // Rework and NCR Automations
      if (data.result === 'REWORK') {
        if (inspection.routingOperationId) {
          try {
            const routingOp = await tx.routingOperation.findUnique({ where: { id: inspection.routingOperationId } });
            if (routingOp && routingOp.plannedMachineId) {
              await tx.jobCard.create({
                data: {
                  projectId: inspection.projectId,
                  routingOperationId: routingOp.id,
                  machineId: routingOp.plannedMachineId,
                  status: 'READY',
                  createdBy: data.userId,
                  updatedBy: data.userId,
                }
              });
              await tx.projectActivity.create({
                data: { projectId: inspection.projectId, action: 'JOB_CARD_GENERATED', description: `Rework Job Card generated for operation.`, performedBy: data.userId || 'SYSTEM' }
              });
            }
          } catch (err) {
            console.error('Auto rework job card generation failed (non-critical):', err);
          }
        }
      } else if (data.result === 'SCRAP') {
        try {
          const project = await tx.project.findUnique({ where: { id: inspection.projectId } });
          await tx.ncrReport.create({
            data: {
              projectId: inspection.projectId,
              ncrNumber: `NCR-${project?.projectNumber || 'UNK'}-${Date.now().toString().slice(-4)}`,
              defectDescription: `Dimensional scrap logged during QC. Qty scrapped: ${data.scrapQty}.`,
              status: 'OPEN',
              remarks: 'Auto-generated via QC Scrap result',
              createdBy: data.userId,
              updatedBy: data.userId,
            },
          });

          await tx.projectActivity.create({
            data: {
              projectId: inspection.projectId,
              action: 'NCR_GENERATED',
              description: `Non-Conformance Report (NCR) generated due to QC Scrap result`,
              performedBy: data.userId || 'SYSTEM',
            },
          });
        } catch (err) {
          console.error('Auto NCR generation failed (non-critical):', err);
        }
      }

      await this.audit.logAction(inspectionId, 'INSPECTION', 'COMPLETE', data.userId || 'SYSTEM', updated);
      return updated;
    });
  }
}
