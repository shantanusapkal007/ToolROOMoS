// @ts-nocheck
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';
import { FILE_PROVIDER, type FileProvider } from '../providers/file.provider.interface';

@Injectable()
export class AttachmentEngine {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    @Inject(FILE_PROVIDER) private readonly fileProvider: FileProvider
  ) {}

  async attachFile(entityType: string, entityId: string, file: Express.Multer.File, remarks?: string) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    // Save physical file via LocalFileProvider
    const savedPath = await this.fileProvider.uploadFile(file.buffer, file.originalname, file.mimetype);

    // Save metadata in DB
    return this.prisma.attachment.create({
      data: {
        entityType,
        entityId,
        fileName: file.originalname,
        fileType: file.mimetype,
        filePath: savedPath,
        fileSize: file.size,
        uploadedBy: userId,
        remarks
      }
    });
  }

  async getAttachments(entityType: string, entityId: string) {
    return this.prisma.attachment.findMany({
      where: { entityType, entityId },
      orderBy: { uploadedAt: 'desc' }
    });
  }

  async getFileUrl(attachmentId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) throw new Error("Attachment not found");
    return this.fileProvider.getFileUrl(attachment.filePath);
  }
}

