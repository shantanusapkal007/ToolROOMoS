import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ProductionService } from './production.service';

/**
 * @deprecated Use specific domain controllers (JobCardsController, ProductionOperationsController, SchedulingController)
 */
@Controller('api/v1/production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('job-cards/generate')
  generateJobCards(@Body() data: { projectId: string; routingHeaderId: string; userId?: string }) {
    return this.productionService.generateJobCards(data.projectId, data.routingHeaderId, data.userId);
  }

  @Get('job-cards/active')
  getActiveJobCards(@Query('machineId') machineId?: string) {
    return this.productionService.getActiveJobCards(machineId);
  }

  @Post('job-cards/:id/start')
  startOperation(@Param('id') jobCardId: string, @Body() data: { operatorId: string; userId?: string }) {
    return this.productionService.startOperation(jobCardId, data.operatorId, data.userId);
  }

  @Post('job-cards/:id/complete')
  completeOperation(@Param('id') jobCardId: string, @Body() data: { userId?: string }) {
    return this.productionService.completeOperation(jobCardId, data.userId);
  }
}
