import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventBus } from '../../../platform/event.bus';
import { BomApproved, BomSuperseded } from '../../bom/events/bom.events';
import { RoutingApproved, RoutingSuperseded } from '../../routing/events/routing.events';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class EngineeringLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly cls: ClsService
  ) {}

  async submitBomForReview(bomHeaderId: string) {
    const bom = await this.prisma.billOfMaterialHeader.findUniqueOrThrow({ where: { id: bomHeaderId } });
    if (bom.status !== 'DRAFT') throw new BadRequestException('Only DRAFT BOMs can be submitted for review.');

    return this.prisma.billOfMaterialHeader.update({
      where: { id: bomHeaderId },
      data: { status: 'UNDER_REVIEW', updatedBy: this.getUserId() }
    });
  }

  async approveBom(bomHeaderId: string) {
    const bom = await this.prisma.billOfMaterialHeader.findUniqueOrThrow({ where: { id: bomHeaderId } });
    if (bom.status !== 'UNDER_REVIEW' && bom.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT or UNDER_REVIEW BOMs can be approved.');
    }

    const updatedBom = await this.prisma.billOfMaterialHeader.update({
      where: { id: bomHeaderId },
      data: { 
        status: 'FROZEN',
        approvalStatus: 'APPROVED',
        updatedBy: this.getUserId() 
      }
    });

    this.eventBus.emit('BomApproved', new BomApproved(bomHeaderId, bom.projectId));
    return updatedBom;
  }

  async releaseBom(bomHeaderId: string) {
    const bom = await this.prisma.billOfMaterialHeader.findUniqueOrThrow({ where: { id: bomHeaderId } });
    if (bom.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED BOMs can be released to production/procurement.');
    }

    return this.prisma.billOfMaterialHeader.update({
      where: { id: bomHeaderId },
      data: { status: 'RELEASED', updatedBy: this.getUserId() }
    });
  }

  async archiveBom(bomHeaderId: string) {
    const bom = await this.prisma.billOfMaterialHeader.findUniqueOrThrow({ where: { id: bomHeaderId } });
    
    // Only superseding or already frozen/draft BOMs can be archived
    return this.prisma.billOfMaterialHeader.update({
      where: { id: bomHeaderId },
      data: { status: 'ARCHIVED', updatedBy: this.getUserId() }
    });
  }

  private getUserId(): string {
    return this.cls.get('userId') || 'SYSTEM';
  }
}
