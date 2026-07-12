import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { DispatchService } from './dispatch.service';

@Controller('api/v1/dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get('notes')
  getDispatches(@Query('projectId') projectId?: string) {
    return this.dispatchService.getDispatches(projectId);
  }

  @Post('notes')
  createDispatch(@Body() data: any) {
    return this.dispatchService.createDispatch(data);
  }
}
