// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { BomRepository } from '../repositories/bom.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { BomTreeProjection } from '../projections/bom.projections';

@Injectable()
export class BomTreeService {
  constructor(
    private readonly repository: BomRepository,
    private readonly prisma: PrismaService
  ) {}

  async buildTree(bomHeaderId: string): Promise<BomTreeProjection> {
    const bomHeader = await this.repository.findHeaderByIdOrThrow(bomHeaderId, {
      items: true
    });

    // Example logic for recursive expansion. In a real system, you'd check if an item
    // refers to a material that is itself an assembly (has its own BOM), and recursively fetch it.
    
    // For this demonstration, we'll build a simplified tree structure
    const tree = {
      root: {
        bomId: bomHeader.id,
        revision: bomHeader.revision,
        totalCost: bomHeader.totalEstimatedCost,
        children: (bomHeader as any).items.map((item: any) => ({
          itemId: item.id,
          materialId: item.materialId,
          partNo: item.partNo,
          requiredQty: item.requiredQty,
          estimatedCost: item.estimatedCost,
          // If this was an assembly, `children` would be recursively populated here
          children: [] 
        }))
      }
    };

    return {
      id: bomHeader.id,
      projectId: bomHeader.projectId,
      bomNumber: bomHeader.bomNumber,
      documentNumber: bomHeader.documentNumber,
      revision: bomHeader.revision,
      revisionDate: bomHeader.revisionDate,
      status: bomHeader.status,
      approvalStatus: bomHeader.approvalStatus,
      totalEstimatedCost: Number(bomHeader.totalEstimatedCost),
      updatedAt: bomHeader.updatedAt,
      tree
    };
  }
}

