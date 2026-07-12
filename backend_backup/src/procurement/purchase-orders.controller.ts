import { Controller, Post, Body, Param, Get, Delete, Put } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePoDto } from './dto/create-po.dto';

@Controller('api/v1/projects/:projectId/purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  async createPo(
    @Param('projectId') projectId: string,
    @Body() dto: CreatePoDto,
  ) {
    return this.poService.createPo(projectId, dto, 'SYSTEM');
  }

  @Post(':poId/approve')
  async approvePo(
    @Param('projectId') projectId: string,
    @Param('poId') poId: string,
  ) {
    return this.poService.approvePo(poId, 'SYSTEM');
  }

  @Put(':poId')
  async updatePo(
    @Param('projectId') projectId: string,
    @Param('poId') poId: string,
    @Body() dto: any,
  ) {
    return this.poService.updatePo(projectId, poId, dto, 'SYSTEM');
  }

  @Delete(':poId')
  async deletePo(
    @Param('projectId') projectId: string,
    @Param('poId') poId: string,
  ) {
    return this.poService.deletePo(projectId, poId, 'SYSTEM');
  }
}
