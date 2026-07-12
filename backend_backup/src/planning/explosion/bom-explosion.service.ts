// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BillOfMaterialItem } from '@prisma/client';

export interface GrossRequirement {
  materialId: string;
  requiredQuantity: number;
  sourceBomId: string;
  level: number;
}

@Injectable()
export class BomExplosionService {
  constructor(private readonly prisma: PrismaService) {}

  async explodeBom(bomHeaderId: string): Promise<GrossRequirement[]> {
    const requirements: GrossRequirement[] = [];
    
    // 1. Fetch top-level items (items without a parent)
    const topLevelItems = await this.prisma.billOfMaterialItem.findMany({
      where: { bomHeaderId, parentItemId: null },
      include: { 
        material: true,
        // Include child items up to some reasonable depth, but since it's an adjacency list, 
        // recursive querying is best done through a recursive function fetching children on-demand,
        // or a raw SQL CTE. For simplicity in Prisma without CTE, we'll fetch level by level.
      }
    });

    for (const item of topLevelItems) {
      await this.traverseItem(item, 1, bomHeaderId, 0, requirements);
    }
    
    // Aggregate identical materials into total gross requirements
    const aggregated = new Map<string, GrossRequirement>();
    
    for (const req of requirements) {
      if (aggregated.has(req.materialId)) {
        const existing = aggregated.get(req.materialId)!;
        existing.requiredQuantity += req.requiredQuantity;
      } else {
        aggregated.set(req.materialId, { ...req });
      }
    }

    return Array.from(aggregated.values());
  }

  private async traverseItem(
    item: BillOfMaterialItem, 
    parentMultiplier: number, 
    bomHeaderId: string, 
    level: number,
    requirements: GrossRequirement[]
  ) {
    const grossQty = Number(item.requiredQty) * parentMultiplier;

    // Fetch children
    const children = await this.prisma.billOfMaterialItem.findMany({
      where: { parentItemId: item.id }
    });

    if (children.length > 0) {
      // This is a sub-assembly. We might still need the assembly itself, or maybe just its children.
      // In standard MRP, we explode through the assembly to get the raw materials.
      for (const child of children) {
        await this.traverseItem(child, grossQty, bomHeaderId, level + 1, requirements);
      }
    } else {
      // Leaf node component / Raw Material
      requirements.push({
        materialId: item.materialId,
        requiredQuantity: grossQty,
        sourceBomId: bomHeaderId,
        level
      });
    }
  }
}

