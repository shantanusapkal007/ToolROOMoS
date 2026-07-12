import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ProductionOperationsService } from './production-operations.service';
import { CreateMsdrDto } from './dto/create-msdr.dto';

@Controller('api/v1/projects/:projectId/production-operations')
export class ProductionOperationsController {
  constructor(private readonly productionOpsService: ProductionOperationsService) {}

  @Get()
  getMachineShopReports(@Param('projectId') projectId: string) {
    return this.productionOpsService.getMachineShopReports(projectId);
  }

  @Post()
  logMachineShopReport(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMsdrDto,
  ) {
    dto.projectId = projectId;
    return this.productionOpsService.logMachineShopReport(dto, 'SYSTEM');
  }
}
