import { Controller, Get, Post, Param } from '@nestjs/common';
import { PlanningService } from './planning.service';

@Controller('api/v1/planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post('projects/:projectId/mrp/run')
  runMrp(@Param('projectId') projectId: string) {
    return this.planningService.runMrp(projectId);
  }

  @Get('projects/:projectId/mrp/runs')
  getMrpRuns(@Param('projectId') projectId: string) {
    return this.planningService.getMrpRuns(projectId);
  }

  @Get('projects/:projectId/purchase-requests')
  getPurchaseRequests(@Param('projectId') projectId: string) {
    return this.planningService.getPurchaseRequests(projectId);
  }
}
