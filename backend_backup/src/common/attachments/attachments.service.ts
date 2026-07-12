// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * AttachmentsService — Universal File Attachments
 * 
 * Every document supports: PDF, Excel, Images, Word, Videos, Notes.
 * Files are stored locally (offline-first architecture).
 */
@Injectable()
export class AttachmentsService {
  private readonly uploadDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(params: {
    entityType: string;
    entityId: string;
    fileName: string;
    fileType: string;
    buffer: Buffer;
    uploadedBy?: string;
    remarks?: string;
  }) {
    // Create entity-specific directory
    const entityDir = path.join(this.uploadDir, params.entityType, params.entityId);
    if (!fs.existsSync(entityDir)) {
      fs.mkdirSync(entityDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeFileName = `${timestamp}-${params.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(entityDir, safeFileName);

    // Write file to disk
    fs.writeFileSync(filePath, params.buffer);

    // Record in database
    return this.prisma.attachment.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        fileName: params.fileName,
        fileType: params.fileType,
        filePath: filePath,
        fileSize: params.buffer.length,
        uploadedBy: params.uploadedBy,
        remarks: params.remarks,
      },
    });
  }

  async list(entityType: string, entityId: string) {
    return this.prisma.attachment.findMany({
      where: { entityType, entityId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async delete(attachmentId: string) {
    const attachment = await this.prisma.attachment.findUniqueOrThrow({
      where: { id: attachmentId },
    });

    // Remove file from disk if it exists
    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }

    return this.prisma.attachment.delete({ where: { id: attachmentId } });
  }

  async getFile(attachmentId: string) {
    const attachment = await this.prisma.attachment.findUniqueOrThrow({
      where: { id: attachmentId },
    });

    if (!fs.existsSync(attachment.filePath)) {
      throw new BadRequestException('File not found on disk.');
    }

    return {
      buffer: fs.readFileSync(attachment.filePath),
      fileName: attachment.fileName,
      fileType: attachment.fileType,
    };
  }
}

