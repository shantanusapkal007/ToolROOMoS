import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ProjectDocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService
  ) {}

  async getDocuments(projectId: string) {
    return this.prisma.projectDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadDocument(projectId: string, data: any) {
    const uploadedBy = this.cls.get('userId') || 'SYSTEM';
    
    return this.prisma.projectDocument.create({
      data: {
        ...data,
        projectId,
        uploadedBy,
      },
    });
  }

  async deleteDocument(documentId: string) {
    return this.prisma.projectDocument.delete({
      where: { id: documentId },
    });
  }
}
