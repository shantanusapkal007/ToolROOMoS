import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { AssemblyService } from './assembly.service';

@Controller('api/v1/assembly')
export class AssemblyController {
  constructor(private readonly assemblyService: AssemblyService) {}

  @Get('pending')
  getPendingAssemblies(@Query('projectId') projectId?: string) {
    return this.assemblyService.getPendingAssemblies(projectId);
  }

  @Post(':id/execute')
  executeAssembly(@Param('id') bomItemId: string, @Body() data: { qty: number; userId?: string }) {
    return this.assemblyService.executeAssembly(bomItemId, data.qty, data.userId);
  }
}
