import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PurchaseOrdersService } from './purchase-orders.service';
import { GoodsReceiptsService } from './goods-receipts.service';
import { CreatePoDto } from './dto/create-po.dto';
import { CreateGrnDto } from './dto/create-grn.dto';

@Controller('api/v1/projects/:projectId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcurementController {
  constructor(
    private readonly poService: PurchaseOrdersService,
    private readonly grnService: GoodsReceiptsService,
  ) {}

  // Purchase Order routes
  @Post('purchase-orders')
  @Roles('ADMIN', 'PURCHASE')
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
  @Roles('ADMIN', 'PURCHASE')
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
