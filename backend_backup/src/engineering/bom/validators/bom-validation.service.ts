// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BomValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateNewItems(bomHeaderId: string, newItems: any[]) {
    // 1. Missing Material Check
    for (const item of newItems) {
      if (!item.materialId && !item.partNo && !item.partName) {
        throw new BadRequestException('Each BOM item must reference a material or provide a part number/name.');
      }
      if (item.requiredQty === undefined || item.requiredQty <= 0) {
        throw new BadRequestException(`Required quantity must be greater than zero for part ${item.partNo || item.partName}.`);
      }
    }

    // 2. Duplicate Component Detection
    const existingItems = await this.prisma.billOfMaterialItem.findMany({
      where: { bomHeaderId },
      select: { materialId: true, partNo: true }
    });

    for (const item of newItems) {
      const isDuplicate = existingItems.some(
        (existing: any) => 
          (existing.materialId && existing.materialId === item.materialId) ||
          (existing.partNo && existing.partNo === item.partNo)
      );

      if (isDuplicate) {
        throw new BadRequestException(`Duplicate component detected: ${item.partNo || item.materialId}`);
      }
    }

    // 3. Recursive Loop Detection (Mock logic to enforce architecture)
    await this.detectCircularDependency(bomHeaderId, newItems);
  }

  private async detectCircularDependency(bomHeaderId: string, newItems: any[]) {
    // If an item being added is itself a sub-assembly that eventually contains this BOM, it's a loop.
    // In a flat BOM, this might just mean checking if the material being added is the finished good of this BOM.
    const bomHeader = await this.prisma.billOfMaterialHeader.findUnique({
      where: { id: bomHeaderId },
      include: { project: true }
    });

    if (bomHeader) {
      for (const item of newItems) {
        // If the item partNo exactly matches the parent project partName/number
        if (item.partNo === bomHeader.project.partName || item.partNo === bomHeader.project.projectNumber) {
          throw new BadRequestException('Circular dependency detected: Cannot add the parent assembly as a component of itself.');
        }
      }
    }
  }

  async validateRevision(bomHeaderId: string) {
    const header = await this.prisma.billOfMaterialHeader.findUniqueOrThrow({ where: { id: bomHeaderId } });
    if (header.approvalStatus === 'APPROVED' || header.status === 'FROZEN') {
      throw new BadRequestException('This BOM is Approved/Frozen and cannot be modified. You must create a new Revision.');
    }
  }
}

