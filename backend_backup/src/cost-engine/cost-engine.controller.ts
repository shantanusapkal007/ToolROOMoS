import { Controller, Get, Query } from '@nestjs/common';
import { CostEngineService } from './cost-engine.service';

@Controller('api/v1/cost-engine')
export class CostEngineController {
  constructor(private readonly costEngine: CostEngineService) {}

  @Get('estimated')
  getEstimatedCost(@Query('projectId') projectId: string) {
    return this.costEngine.getEstimatedCost(projectId);
  }

  @Get('actual')
  getActualCost(@Query('projectId') projectId: string) {
    return this.costEngine.getActualCost(projectId);
  }

  @Get('variance')
  getVarianceAnalysis(@Query('projectId') projectId: string) {
    return this.costEngine.getVarianceAnalysis(projectId);
  }

  @Get('summary')
  getAllProjectsCostSummary() {
    return this.costEngine.getAllProjectsCostSummary();
  }

  @Get('project-summary')
  getProjectCostSummary(@Query('projectId') projectId: string) {
    return this.costEngine.getProjectCostSummary(projectId);
  }

  @Get('project-history')
  getProjectCostHistory(@Query('projectId') projectId: string) {
    return this.costEngine.getProjectCostHistory(projectId);
  }

  @Get('project-material-costs')
  getProjectMaterialCosts(@Query('projectId') projectId: string) {
    return this.costEngine.getProjectMaterialCosts(projectId);
  }
}
