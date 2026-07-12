// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { BomRepository } from '../repositories/bom.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventBus } from '../../../platform/event.bus';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class BomRevisionService {
  constructor(
    private readonly repository: BomRepository,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly cls: ClsService
  ) {}

  async cloneToNewRevision(bomHeaderId: string) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    return this.repository.executeInTransaction(async (tx) => {
      // 1. Fetch the existing approved BOM
      const existingBom = await tx.billOfMaterialHeader.findUniqueOrThrow({
        where: { id: bomHeaderId },
        include: { items: true },
      });

      if (existingBom.approvalStatus !== 'APPROVED') {
        throw new BadRequestException('Only APPROVED BOMs can be cloned to a new revision.');
      }

      // 2. Mark the existing BOM as SUPERSEDED
      await tx.billOfMaterialHeader.update({
        where: { id: bomHeaderId },
        data: { 
          status: 'SUPERSEDED',
          updatedBy: userId 
        }
      });

      // 3. Create the new Draft Revision
      const newBom = await tx.billOfMaterialHeader.create({
        data: {
          projectId: existingBom.projectId,
          documentNumber: existingBom.documentNumber,
          bomNumber: existingBom.bomNumber ? `${existingBom.bomNumber}-R${existingBom.revision + 1}` : null,
          revision: existingBom.revision + 1,
          customerId: existingBom.customerId,
          status: 'DRAFT',
          approvalStatus: 'PENDING',
          totalEstimatedCost: existingBom.totalEstimatedCost,
          remarks: `Cloned from Revision ${existingBom.revision}`,
          createdBy: userId,
          updatedBy: userId,
        }
      });

      // 4. Clone all items into the new revision
      if (existingBom.items.length > 0) {
        const clonedItems = existingBom.items.map(item => ({
          bomHeaderId: newBom.id,
          materialId: item.materialId,
          partNo: item.partNo,
          partName: item.partName,
          finishSize: item.finishSize,
          rawSize: item.rawSize,
          heatTreatment: item.heatTreatment,
          supplier: item.supplier,
          weight: item.weight,
          calculatedWeight: item.calculatedWeight,
          materialGrade: item.materialGrade,
          unit: item.unit,
          requiredQty: item.requiredQty,
          unitCost: item.unitCost,
          estimatedCost: item.estimatedCost,
          scrapPercent: item.scrapPercent,
          estimatedProcessCost: item.estimatedProcessCost,
          remarks: item.remarks,
        }));

        await tx.billOfMaterialItem.createMany({ data: clonedItems });
      }

      // 5. Emit Events (Superseded & Created)
      // Implementation of EventBus emission will be handled in command service/subscribers
      // this.eventBus.emit('BomSuperseded', new BomSuperseded(existingBom.id));
      // this.eventBus.emit('BomCreated', new BomCreated(newBom.id));

      return newBom;
    });
  }
}

