import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AssemblyService } from './assembly.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModuleScope } from '../auth/decorators/module-scope.decorator';
import { CreateAssemblyOrderDto, AssemblyComponentDto } from './dto/create-assembly-order.dto';
import { CreateProjectTrialDto } from './dto/create-project-trial.dto';

@Controller('api/v1/projects/:projectId/assembly')
@ModuleScope('production')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssemblyController {
  constructor(private readonly assemblyService: AssemblyService) {}

  @Get('orders')
  async getOrders(@Param('projectId') projectId: string) {
    return this.assemblyService.getAssemblyHeaders(projectId);
  }

  @Post('orders')
  @Roles('ADMIN', 'PRODUCTION')
  async createOrder(@Param('projectId') projectId: string, @Body() data: CreateAssemblyOrderDto) {
    return this.assemblyService.createAssemblyHeader(projectId, data);
  }

  @Put('orders/:id/status')
  @Roles('ADMIN', 'PRODUCTION', 'QUALITY')
  async updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.assemblyService.updateAssemblyStatus(id, status);
  }

  @Post('orders/:id/components')
  @Roles('ADMIN', 'PRODUCTION')
  async addComponent(@Param('id') id: string, @Body() data: AssemblyComponentDto) {
    return this.assemblyService.addAssemblyComponent(id, data);
  }

  @Post('orders/:id/link-subassembly')
  @Roles('ADMIN', 'PRODUCTION')
  async linkSubAssembly(@Param('id') id: string, @Body('childId') childId: string) {
    return this.assemblyService.linkSubAssembly(id, childId);
  }

  @Get('trials')
  async getTrials(@Param('projectId') projectId: string) {
    return this.assemblyService.getProjectTrials(projectId);
  }

  @Post('trials')
  @Roles('ADMIN', 'PRODUCTION', 'QUALITY')
  async createTrial(@Param('projectId') projectId: string, @Body() data: CreateProjectTrialDto) {
    return this.assemblyService.createProjectTrial(projectId, data);
  }

  @Put('trials/:id/status')
  @Roles('ADMIN', 'PRODUCTION', 'QUALITY')
  async updateTrialStatus(
    @Param('id') id: string, 
    @Body('status') status: string,
    @Body('remarks') remarks: string
  ) {
    return this.assemblyService.updateTrialStatus(id, status, remarks);
  }

  @Put('trials/:id/signoff')
  @Roles('ADMIN', 'QUALITY')
  async signOffTrial(@Param('id') id: string, @Req() req: any) {
    const user = req.user?.name || 'Authorized Signatory';
    return this.assemblyService.signOffTrial(id, user);
  }
}
