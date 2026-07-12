// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a new background import job.
   */
  async registerImportJob(entityType: string, fileUrl: string, startedBy: string) {
    return this.prisma.importExportJob.create({
      data: {
        jobType: 'IMPORT',
        entityType,
        status: 'PENDING',
        fileUrl,
        startedBy,
      },
    });
  }

  /**
   * Registers a new background export job.
   */
  async registerExportJob(entityType: string, startedBy: string) {
    return this.prisma.importExportJob.create({
      data: {
        jobType: 'EXPORT',
        entityType,
        status: 'PENDING',
        startedBy,
      },
    });
  }

  /**
   * Updates the progress of a job.
   */
  async updateProgress(jobId: string, processedRow: number, totalRow: number, status: string = 'PROCESSING') {
    await this.prisma.importExportJob.update({
      where: { id: jobId },
      data: {
        processedRow,
        totalRow,
        status,
      },
    });
  }

  /**
   * Marks a job as completed or failed.
   */
  async finishJob(jobId: string, success: boolean, errors?: any) {
    await this.prisma.importExportJob.update({
      where: { id: jobId },
      data: {
        status: success ? 'COMPLETED' : 'FAILED',
        errors: errors ? errors : null,
      },
    });
  }
}

