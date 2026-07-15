import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AssemblyService } from './assembly.service';

@Controller('projects/:projectId/assembly')
export class AssemblyController {
  constructor(private readonly assemblyService: AssemblyService) {}

  @Get('orders')
  async getOrders(@Param('projectId') projectId: string) {
    return this.assemblyService.getAssemblyHeaders(projectId);
  }

  @Post('orders')
  async createOrder(@Param('projectId') projectId: string, @Body() data: any) {
    return this.assemblyService.createAssemblyHeader(projectId, data);
  }

  @Put('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.assemblyService.updateAssemblyStatus(id, status);
  }

  @Post('orders/:id/components')
  async addComponent(@Param('id') id: string, @Body() data: any) {
    return this.assemblyService.addAssemblyComponent(id, data);
  }

  @Post('orders/:id/link-subassembly')
  async linkSubAssembly(@Param('id') id: string, @Body('childId') childId: string) {
    return this.assemblyService.linkSubAssembly(id, childId);
  }

  @Get('trials')
  async getTrials(@Param('projectId') projectId: string) {
    return this.assemblyService.getProjectTrials(projectId);
  }

  @Post('trials')
  async createTrial(@Param('projectId') projectId: string, @Body() data: any) {
    return this.assemblyService.createProjectTrial(projectId, data);
  }

  @Put('trials/:id/status')
  async updateTrialStatus(
    @Param('id') id: string, 
    @Body('status') status: string,
    @Body('remarks') remarks: string
  ) {
    return this.assemblyService.updateTrialStatus(id, status, remarks);
  }

  @Put('trials/:id/signoff')
  async signOffTrial(@Param('id') id: string, @Req() req: any) {
    // Assuming req.user is populated by AuthGuard. If not, fallback to 'SYSTEM'
    const user = req.user?.name || 'Authorized Signatory';
    return this.assemblyService.signOffTrial(id, user);
  }
}
