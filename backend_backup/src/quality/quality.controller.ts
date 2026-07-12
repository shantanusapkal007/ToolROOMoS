import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { QualityService } from './quality.service';

@Controller('api/v1/quality')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Get('inspections/pending')
  getPendingInspections(@Query('projectId') projectId?: string) {
    return this.qualityService.getPendingInspections(projectId);
  }

  @Get('inspections/completed')
  getCompletedInspections(@Query('projectId') projectId?: string) {
    return this.qualityService.getCompletedInspections(projectId);
  }

  @Post('inspections')
  createInspection(@Body() data: any) {
    return this.qualityService.createInspection(data);
  }

  @Post('inspections/:id/complete')
  completeInspection(@Param('id') id: string, @Body() data: any) {
    return this.qualityService.completeInspection(id, data);
  }
}
