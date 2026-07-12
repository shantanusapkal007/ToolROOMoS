import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';

/**
 * @deprecated Use domain specific controllers (MaterialIssuesController, StockController)
 */
@Controller('api/v1/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('grn')
  getGoodsReceipts() {
    return this.inventoryService.getGoodsReceipts();
  }

  @Post('grn')
  createGoodsReceipt(@Body() data: any) {
    return this.inventoryService.createGoodsReceipt(data.poHeaderId, data.vendorId, data.items);
  }

  @Get('issues')
  getMaterialIssues(@Query('projectId') projectId?: string) {
    return this.inventoryService.getMaterialIssues(projectId);
  }

  @Post('issues')
  createMaterialIssue(@Body() data: any) {
    return this.inventoryService.createMaterialIssue(data.projectId, data.departmentId, data.items);
  }

  @Get('stock')
  getGlobalStock() {
    return this.inventoryService.getGlobalStock();
  }
}
