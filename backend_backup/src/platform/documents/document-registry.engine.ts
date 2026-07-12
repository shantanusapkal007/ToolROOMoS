// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class DocumentRegistryEngine {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService
  ) {}

  async registerDocument(data: {
    documentNumber: string;
    documentType: string;
    entityId: string;
    projectId?: string;
    plantId: string;
    status?: string;
    revision?: string;
  }) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    return this.prisma.documentRegistry.create({
      data: {
        ...data,
        createdBy: userId
      }
    });
  }

  async updateDocumentState(documentType: string, entityId: string, status: string) {
    return this.prisma.documentRegistry.updateMany({
      where: { documentType, entityId },
      data: { status }
    });
  }

  async getDocumentInfo(documentType: string, entityId: string) {
    const doc = await this.prisma.documentRegistry.findFirst({
      where: { documentType, entityId }
    });
    if (!doc) throw new NotFoundException(`Document not found in registry`);
    return doc;
  }
}

