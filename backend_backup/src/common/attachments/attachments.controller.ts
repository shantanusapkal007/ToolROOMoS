import { Controller, Get, Post, Delete, Param, Res, UseGuards, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AttachmentsService } from './attachments.service';
import type { Response } from 'express';

@Controller('api/v1/attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post(':entityType/:entityId')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @UploadedFile() file: any,
    @CurrentUser() user: any,
    @Body('remarks') remarks?: string,
  ) {
    const data = await this.attachmentsService.upload({
      entityType,
      entityId,
      fileName: file.originalname,
      fileType: file.mimetype,
      buffer: file.buffer,
      uploadedBy: user?.userId,
      remarks,
    });
    return { status: 'success', message: 'File uploaded.', data };
  }

  @Get(':entityType/:entityId')
  async list(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const data = await this.attachmentsService.list(entityType, entityId);
    return { status: 'success', message: 'Attachments retrieved.', data };
  }

  @Get('download/:id')
  async download(@Param('id') id: string, @Res() res: Response) {
    const file = await this.attachmentsService.getFile(id);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('Content-Type', file.fileType);
    res.send(file.buffer);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const data = await this.attachmentsService.delete(id);
    return { status: 'success', message: 'Attachment deleted.', data };
  }
}
