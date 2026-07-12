import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectTimelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService
  ) {}

  async logTransition(projectId: string, fromStage: string, toStage: string, remarks: string) {
    const transitionedBy = this.cls.get('userId') || 'SYSTEM';

    await this.prisma.projectTimeline.create({
      data: {
        projectId,
        fromStage: fromStage as ProjectStatus,
        toStage: toStage as ProjectStatus,
        remarks,
        transitionedBy,
      },
    });

    await this.prisma.projectActivity.create({
      data: {
        projectId,
        action: 'STAGE_CHANGED',
        description: `Advanced from ${fromStage} to ${toStage}`,
        performedBy: transitionedBy,
      },
    });
  }

  async logActivity(projectId: string, action: string, description: string) {
    const performedBy = this.cls.get('userId') || 'SYSTEM';

    await this.prisma.projectActivity.create({
      data: {
        projectId,
        action,
        description,
        performedBy,
      },
    });
  }

  async getTimeline(projectId: string) {
    return this.prisma.projectTimeline.findMany({
      where: { projectId },
      orderBy: { transitionedAt: 'asc' },
    });
  }

  async getActivities(projectId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.projectActivity.findMany({
        where: { projectId },
        orderBy: { performedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.projectActivity.count({
        where: { projectId },
      })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
