import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { SubcontractingService } from './subcontracting.service';

@Controller('api/v1/subcontracting')
export class SubcontractingController {
  constructor(private readonly subcontractingService: SubcontractingService) {}

  @Get('orders')
  getSubcontractOrders(@Query('projectId') projectId?: string) {
    return this.subcontractingService.getSubcontractOrders(projectId);
  }

  @Post('orders')
  createSubcontractOrder(@Body() data: any) {
    return this.subcontractingService.createSubcontractOrder(data.projectId, data.vendorId, data.items, data.userId);
  }

  @Post('orders/:id/receive')
  receiveSubcontract(@Param('id') orderId: string, @Body() data: any) {
    return this.subcontractingService.receiveSubcontract(orderId, data.items, data.userId);
  }
}
