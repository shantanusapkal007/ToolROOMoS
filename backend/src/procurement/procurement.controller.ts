import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { GoodsReceiptsService } from './goods-receipts.service';
import { CreatePoDto } from './dto/create-po.dto';
import { CreateGrnDto } from './dto/create-grn.dto';

@Controller('api/v1/projects/:projectId')
export class ProcurementController {
  constructor(
    private readonly poService: PurchaseOrdersService,
    private readonly grnService: GoodsReceiptsService,
  ) {}

  // Purchase Order routes
  @Post('purchase-orders')
  async createPo(
    @Param('projectId') projectId: string,
    @Body() dto: CreatePoDto,
  ) {
    const data = await this.poService.createPo(projectId, dto);
    return {
      status: 'success',
      message: 'Purchase Order generated successfully.',
      data,
    };
  }

  @Get('purchase-orders')
  async getPurchaseOrders(@Param('projectId') projectId: string) {
    const data = await this.poService.getPurchaseOrders(projectId);
    return {
      status: 'success',
      message: 'Purchase Orders retrieved successfully.',
      data,
    };
  }

  // Goods Receipt (GRN) routes
  @Post('goods-receipts')
  async createGrn(
    @Param('projectId') projectId: string,
    @Body() dto: CreateGrnDto,
  ) {
    const data = await this.grnService.createGrn(projectId, dto);
    return {
      status: 'success',
      message: 'Goods Receipt Note created and processed successfully.',
      data,
    };
  }

  @Get('goods-receipts')
  async getGoodsReceipts(@Param('projectId') projectId: string) {
    const data = await this.grnService.getGoodsReceipts(projectId);
    return {
      status: 'success',
      message: 'Goods Receipt Notes retrieved successfully.',
      data,
    };
  }
}
