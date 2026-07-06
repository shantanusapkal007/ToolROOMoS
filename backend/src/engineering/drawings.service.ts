import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDrawingDto } from './dto/create-drawing.dto';
import { DocumentStatus, ProjectStatus } from '@prisma/client';

@Injectable()
export class DrawingsService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadDrawing(projectId: string, dto: CreateDrawingDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Check current project state
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });

      // 2. Fetch existing drawings to determine revision count
      const existingCount = await tx.drawing.count({
        where: { projectId, drawingNumber: dto.drawingNumber },
      });
      const revision = existingCount + 1;

      // Mark past revisions as OBSOLETE if applicable
      if (existingCount > 0) {
        await tx.drawing.updateMany({
          where: { projectId, drawingNumber: dto.drawingNumber },
          data: { status: DocumentStatus.OBSOLETE },
        });
      }

      // 3. Register the drawing
      const drawing = await tx.drawing.create({
        data: {
          projectId,
          drawingNumber: dto.drawingNumber,
          revision,
          fileUrl: dto.fileUrl,
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
          status: DocumentStatus.DRAFT,
        },
      });

      // 4. Record drawing upload activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'DRAWING_UPLOADED',
          description: `Drawing ${dto.drawingNumber} Rev ${revision} uploaded by Engineering`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 5. Automatic Workflow Transition: Move project to ENGINEERING if it is currently CREATED
      if (project.currentStage === ProjectStatus.CREATED) {
        await tx.project.update({
          where: { id: projectId },
          data: { currentStage: ProjectStatus.ENGINEERING, updatedBy: userId },
        });

        await tx.projectTimeline.create({
          data: {
            projectId,
            fromStage: ProjectStatus.CREATED,
            toStage: ProjectStatus.ENGINEERING,
            transitionedBy: userId || 'SYSTEM',
            remarks: 'Advanced to ENGINEERING automatically upon initial drawing upload',
          },
        });

        await tx.projectActivity.create({
          data: {
            projectId,
            action: 'STAGE_CHANGED',
            description: 'Project advanced to ENGINEERING phase',
            performedBy: userId || 'SYSTEM',
          },
        });
      }

      return drawing;
    });
  }

  async getDrawings(projectId: string) {
    return this.prisma.drawing.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveDrawing(projectId: string, drawingId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const drawing = await tx.drawing.findFirstOrThrow({ where: { id: drawingId, projectId } });

      const approved = await tx.drawing.update({
        where: { id: drawingId },
        data: {
          status: DocumentStatus.APPROVED,
          approvalStatus: 'APPROVED',
          updatedBy: userId,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'DRAWING_APPROVED',
          description: `Drawing ${drawing.drawingNumber} Rev ${drawing.revision} approved.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return approved;
    });
  }
}

