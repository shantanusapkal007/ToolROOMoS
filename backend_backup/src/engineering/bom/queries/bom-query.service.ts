// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { BomRepository } from '../repositories/bom.repository';
import { CacheEngine } from '../../../platform/cache.engine';
import { BomSummaryProjection, BomDetailsProjection } from '../projections/bom.projections';

@Injectable()
export class BomQueryService {
  constructor(
    private readonly repository: BomRepository,
    private readonly cache: CacheEngine
  ) {}

  async findAll(query: any): Promise<{ data: BomSummaryProjection[]; total: number }> {
    const cacheKey = `engineering:boms:list:${JSON.stringify(query)}`;

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
          include: { project: true }
        }),
        this.repository.countHeaders(where)
      ]);

      const data = headers.map(h => ({
        id: h.id,
        projectId: h.projectId,
        projectNumber: (h as any).project?.projectNumber,
        bomNumber: h.bomNumber,
        documentNumber: h.documentNumber,
        revision: h.revision,
        revisionDate: h.revisionDate,
        status: h.status,
        approvalStatus: h.approvalStatus,
        totalEstimatedCost: Number(h.totalEstimatedCost),
        updatedAt: h.updatedAt,
      }));

      return { data, total };
    }, 300); // 5 minutes TTL
  }

  async findOne(id: string): Promise<BomDetailsProjection> {
    const cacheKey = `engineering:boms:${id}:details`;

    return this.cache.getOrSet(cacheKey, async () => {
      const header = await this.repository.findHeaderById(id, {
        project: true,
        items: {
          orderBy: { createdAt: 'asc' }
        }
      });

      if (!header) throw new NotFoundException('BOM not found');

      return {
        id: header.id,
        projectId: header.projectId,
        projectNumber: (header as any).project?.projectNumber,
        bomNumber: header.bomNumber,
        documentNumber: header.documentNumber,
        revision: header.revision,
        revisionDate: header.revisionDate,
        status: header.status,
        approvalStatus: header.approvalStatus,
        totalEstimatedCost: Number(header.totalEstimatedCost),
        updatedAt: header.updatedAt,
        items: (header as any).items.map((item: any) => ({
          id: item.id,
          materialId: item.materialId,
          partNo: item.partNo,
          partName: item.partName,
          finishSize: item.finishSize,
          rawSize: item.rawSize,
          requiredQty: Number(item.requiredQty),
          unitCost: Number(item.unitCost),
          estimatedCost: Number(item.estimatedCost),
          remarks: item.remarks
        }))
      };
    }, 60); // 1 minute TTL
  }
}

