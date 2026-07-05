import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { ProjectStatus, InspectionResult, InspectionType } from '@prisma/client';

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createInspection(projectId: string, dto: CreateInspectionDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate project stage
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      const currentStage = project.currentStage;

      if (currentStage !== ProjectStatus.PRODUCTION && currentStage !== ProjectStatus.INSPECTION) {
        throw new BadRequestException('Inspections can only be registered during Production or Inspection stages.');
      }

      // 2. Strict Rule: Operation must be completed before In-Process inspection
      if (dto.inspectionType === 'IN_PROCESS') {
        if (!dto.routingOperationId) {
          throw new BadRequestException('In-Process inspection requires a routing operation ID.');
        }
        const routingOp = await tx.routingOperation.findUnique({ where: { id: dto.routingOperationId } });
        if (!routingOp || routingOp.completedQuantity.toNumber() === 0) {
          throw new BadRequestException('Inspection cannot begin unless Production is logged and MSDR exists for this operation.');
        }
      }

      // 3. Create Inspection Header
      const inspection = await tx.inspectionHeader.create({
        data: {
          projectId,
          routingOperationId: dto.routingOperationId || null,
          inspectionType: dto.inspectionType as InspectionType,
          inspectionNumber: `INS-${project.projectNumber}-${Date.now().toString().slice(-4)}`,
          inspectedQty: dto.inspectedQty,
          passedQty: dto.passedQty,
          reworkQty: dto.reworkQty || 0,
          scrapQty: dto.scrapQty || 0,
          result: dto.result,
          status: 'COMPLETED',
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 3. Log project activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'INSPECTION_COMPLETED',
          description: `Inspection completed. Result: ${dto.result}. Passed: ${dto.passedQty}, Rework: ${dto.reworkQty || 0}, Scrap: ${dto.scrapQty || 0}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 4. Workflow Automations based on inspection result
      if (dto.result === InspectionResult.PASS) {
        if (dto.inspectionType === 'FINAL_PDI') {
          // Transition Project to DISPATCH_READY
          await tx.project.update({
            where: { id: projectId },
            data: { currentStage: ProjectStatus.DISPATCH_READY, updatedBy: userId },
          });

          await tx.projectTimeline.create({
            data: {
              projectId,
              fromStage: currentStage,
              toStage: ProjectStatus.DISPATCH_READY,
              transitionedBy: userId || 'SYSTEM',
              remarks: 'Final PDI PASS. Project ready for dispatch.',
            },
          });

          await tx.projectActivity.create({
            data: {
              projectId,
              action: 'STAGE_CHANGED',
              description: 'Project advanced to DISPATCH_READY stage',
              performedBy: userId || 'SYSTEM',
            },
          });
        }
      } else if (dto.result === InspectionResult.REWORK) {
        // Auto-generate Rework Job Card if In-Process
        if (dto.routingOperationId) {
          const routingOp = await tx.routingOperation.findUnique({ where: { id: dto.routingOperationId } });
          if (routingOp) {
            await tx.jobCard.create({
              data: {
                projectId,
                routingOperationId: routingOp.id,
                machineId: routingOp.plannedMachineId || '',
                status: 'READY',
                createdBy: userId,
                updatedBy: userId,
              }
            });
            await tx.projectActivity.create({
              data: { projectId, action: 'JOB_CARD_GENERATED', description: `Rework Job Card generated for operation.`, performedBy: userId || 'SYSTEM' }
            });
          }
        }
        
        // Force project stage back to PRODUCTION if not already there
        if (currentStage !== ProjectStatus.PRODUCTION) {
          await tx.project.update({
            where: { id: projectId },
            data: { currentStage: ProjectStatus.PRODUCTION, updatedBy: userId },
          });

          await tx.projectTimeline.create({
            data: {
              projectId,
              fromStage: currentStage,
              toStage: ProjectStatus.PRODUCTION,
              transitionedBy: userId || 'SYSTEM',
              remarks: 'Inspection FAILED (Rework required). Project returned to PRODUCTION stage.',
            },
          });
        }
      } else if (dto.result === InspectionResult.SCRAP) {
        // Create an NCR Report automatically
        await tx.ncrReport.create({
          data: {
            projectId,
            ncrNumber: `NCR-${project.projectNumber}-${Date.now().toString().slice(-4)}`,
            defectDescription: `Dimensional scrap logged during QC. Qty scrapped: ${dto.scrapQty}. Remarks: ${dto.remarks}`,
            status: 'OPEN',
            remarks: 'Auto-generated via QC Scrap result',
            createdBy: userId,
            updatedBy: userId,
          },
        });

        await tx.projectActivity.create({
          data: {
            projectId,
            action: 'NCR_GENERATED',
            description: `Non-Conformance Report (NCR) generated due to QC Scrap result`,
            performedBy: userId || 'SYSTEM',
          },
        });
      }

      return inspection;
    });
  }

  async getInspections(projectId: string) {
    return this.prisma.inspectionHeader.findMany({
      where: { projectId },
      include: { measurements: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
