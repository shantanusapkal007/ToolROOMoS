// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { RoutingRepository } from '../repositories/routing.repository';
import { CacheEngine } from '../../../platform/cache.engine';
import { RoutingSummaryProjection, RoutingDetailsProjection } from '../projections/routing.projections';

@Injectable()
export class RoutingQueryService {
  constructor(
    private readonly repository: RoutingRepository,
    private readonly cache: CacheEngine
  ) {}

  async findAll(query: any): Promise<{ data: RoutingSummaryProjection[]; total: number }> {
    const cacheKey = `engineering:routings:list:${JSON.stringify(query)}`;

    return this.cache.getOrSet(cacheKey, async () => {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (query.projectId) where.projectId = query.projectId;
      if (query.status) where.status = query.status;

      const [headers, total] = await Promise.all([
        this.repository.findHeaders({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.repository.countHeaders(where)
      ]);

      const data = headers.map(h => ({
        id: h.id,
        projectId: h.projectId,
        routingNo: h.routingNo,
        documentNumber: h.documentNumber,
        revision: h.revision,
        status: h.status,
        approvalStatus: h.approvalStatus,
        updatedAt: h.updatedAt,
      }));

      return { data, total };
    }, 300);
  }

  async findOne(id: string): Promise<RoutingDetailsProjection> {
    const cacheKey = `engineering:routings:${id}:details`;

    return this.cache.getOrSet(cacheKey, async () => {
      const header = await this.repository.findHeaderById(id, {
        operations: {
          orderBy: { sequenceOrder: 'asc' }
        }
      });

      if (!header) throw new NotFoundException('Routing not found');

      return {
        id: header.id,
        projectId: header.projectId,
        routingNo: header.routingNo,
        documentNumber: header.documentNumber,
        revision: header.revision,
        status: header.status,
        approvalStatus: header.approvalStatus,
        updatedAt: header.updatedAt,
        operations: (header as any).operations.map((op: any) => ({
          id: op.id,
          sequenceOrder: op.sequenceOrder,
          operationId: op.operationId,
          operationName: op.operationName,
          machineType: op.machineType,
          estimatedHours: Number(op.estimatedHours),
          cycleTime: op.cycleTime ? Number(op.cycleTime) : null,
          inspectionRequired: op.inspectionRequired,
          outsource: op.outsource,
          setupNotes: op.setupNotes,
          machiningNotes: op.machiningNotes
        }))
      };
    }, 60);
  }
}

