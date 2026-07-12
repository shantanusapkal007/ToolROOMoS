import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { EngineeringService } from './engineering.service';

@Controller('api/v1/engineering')
export class EngineeringController {
  constructor(private readonly engineeringService: EngineeringService) {}

  // ================= ECR (Engineering Change Request) =================
  @Get('projects/:projectId/ecr')
  getEcr(@Param('projectId') projectId: string) {
    return this.engineeringService.getEcr(projectId);
  }

  @Post('projects/:projectId/ecr')
  createEcr(@Param('projectId') projectId: string, @Body() data: any) {
    return this.engineeringService.createEcr(projectId, data);
  }

  @Put('ecr/:id')
  updateEcr(@Param('id') id: string, @Body() data: any) {
    return this.engineeringService.updateEcr(id, data);
  }

  // ================= ECO (Engineering Change Order) =================
  @Get('ecr/:ecrId/eco')
  getEco(@Param('ecrId') ecrId: string) {
    return this.engineeringService.getEco(ecrId);
  }

  @Post('ecr/:ecrId/eco')
  createEco(@Param('ecrId') ecrId: string, @Body() data: any) {
    return this.engineeringService.createEco(ecrId, data);
  }

  @Put('eco/:id')
  updateEco(@Param('id') id: string, @Body() data: any) {
    return this.engineeringService.updateEco(id, data);
  }
}
