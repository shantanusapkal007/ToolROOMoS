import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PurchaseOrdersService } from './purchase-orders.service';
import { GoodsReceiptsService } from './goods-receipts.service';
import { CreateMultiPoDto } from './dto/create-multi-po.dto';

@Controller('api/v1/procurement')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GlobalProcurementController {
  constructor(
    private readonly poService: PurchaseOrdersService,
    private readonly grnService: GoodsReceiptsService,
  ) {}

  @Get('goods-receipts')
  async getAllGoodsReceipts() {
    const data = await this.grnService.getAllGoodsReceipts();
    return {
      status: 'success',
      message: 'All Goods Receipt Notes retrieved successfully.',
      data,
    };
  }

  @Get('bom-items')
  async getAllProjectBomItems() {
    const data = await this.poService.getAllProjectBomItems();
    return {
      status: 'success',
      message: 'Cross-project BOM items retrieved successfully.',
      data,
    };
  }

  @Get('purchase-orders')
  async getAllGlobalPurchaseOrders() {
    const data = await this.poService.getAllGlobalPurchaseOrders();
    return {
      status: 'success',
      message: 'Global Purchase Orders retrieved successfully.',
      data,
    };
  }

  @Get('purchase-orders/:id')
  async getPoById(@Param('id') id: string) {
    const data = await this.poService.getPoById(id);
    return {
      status: 'success',
      message: 'Purchase Order retrieved successfully.',
      data,
    };
  }

  @Get('dead-materials')
  async getDeadMaterials() {
    const data = await this.poService.getDeadMaterials();
    return {
      status: 'success',
      message: 'Dead materials (GRN processed >6 months unused) retrieved successfully.',
      data,
    };
  }

  @Post('purchase-orders')
  async createMultiProjectPo(
    @Body() dto: CreateMultiPoDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.poService.createMultiProjectPo(dto, user?.userId);
    return {
      status: 'success',
      message: 'Multi-Project Purchase Order generated successfully.',
      data,
    };
  }

  @Delete('purchase-orders/:id')
  async deleteGlobalPo(@Param('id') id: string) {
    await this.poService.deleteGlobalPo(id);
    return {
      status: 'success',
      message: 'Purchase Order deleted successfully.',
    };
  }
}
