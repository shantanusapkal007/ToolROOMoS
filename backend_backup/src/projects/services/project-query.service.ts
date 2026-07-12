import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../repositories/project.repository';
import { CacheEngine } from '../../platform/cache.engine';
import { ProjectSummaryProjection, ProjectDetailsProjection, ProjectTimelineProjection } from '../dto/project-projections';

@Injectable()
export class ProjectQueryService {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly cache: CacheEngine
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customerId?: string;
  }): Promise<{ data: ProjectSummaryProjection[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { status: { not: 'DELETED' } };
    if (query.status) where.currentStage = query.status;
    if (query.customerId) where.customerId = query.customerId;
    if (query.search) {
      where.OR = [
        { projectNumber: { contains: query.search, mode: 'insensitive' } },
        { partName: { contains: query.search, mode: 'insensitive' } },
        { customerPoNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `projects:list:${JSON.stringify(query)}`;

    return this.cache.getOrSet(cacheKey, async () => {
      const [projects, total] = await Promise.all([
        this.repository.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { customer: true }
        }),
        this.repository.count(where)
      ]);

      const data = projects.map(p => this.mapToSummaryProjection(p));

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }, 300); // 5 min TTL
  }

  async findOne(id: string): Promise<ProjectDetailsProjection> {
    const cacheKey = `projects:${id}:details`;

    return this.cache.getOrSet(cacheKey, async () => {
      const project = await this.repository.findById(id, {
        customer: true,
        plant: true,
        projectCostSummary: true,
        projectTimeline: { orderBy: { transitionedAt: 'desc' }, take: 5 },
        projectActivities: { orderBy: { performedAt: 'desc' }, take: 10 }
      });

      if (!project) throw new NotFoundException('Project not found');

      return this.mapToDetailsProjection(project);
    }, 60); // 1 min TTL
  }

  private mapToSummaryProjection(p: any): ProjectSummaryProjection {
    return {
      id: p.id,
      projectNumber: p.projectNumber,
      partName: p.partName,
      customerPoNumber: p.customerPoNumber,
      customerId: p.customerId,
      customerName: p.customer?.companyName,
      currentStage: p.currentStage,
      targetDeliveryDate: p.targetDeliveryDate,
      priority: p.priority,
      createdAt: p.createdAt,
    };
  }

  private mapToDetailsProjection(p: any): ProjectDetailsProjection {
    const summary = this.mapToSummaryProjection(p);
    return {
      ...summary,
      description: p.description,
      remarks: p.remarks,
      projectOwner: p.projectOwner,
      plantId: p.plantId,
      plantName: p.plant?.plantName,
      progress: p.progress,
      closedAt: p.closedAt,
      totalCost: p.projectCostSummary?.totalCost,
      revenue: p.projectCostSummary?.revenue,
      profitability: p.projectCostSummary?.profitability,
      recentTimeline: p.projectTimeline,
      recentActivities: p.projectActivities,
    };
  }
}
