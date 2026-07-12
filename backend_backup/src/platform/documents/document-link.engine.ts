// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class DocumentLinkEngine {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService
  ) {}

  async linkDocuments(
    sourceType: string, sourceId: string, 
    targetType: string, targetId: string, 
    relationship: string
  ) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    return this.prisma.documentLink.create({
      data: {
        sourceEntityType: sourceType,
        sourceEntityId: sourceId,
        targetEntityType: targetType,
        targetEntityId: targetId,
        relationshipType: relationship,
        createdBy: userId
      }
    });
  }

  async getDownstreamLinks(sourceType: string, sourceId: string) {
    return this.prisma.documentLink.findMany({
      where: { sourceEntityType: sourceType, sourceEntityId: sourceId }
    });
  }

  async getUpstreamLinks(targetType: string, targetId: string) {
    return this.prisma.documentLink.findMany({
      where: { targetEntityType: targetType, targetEntityId: targetId }
    });
  }
}

