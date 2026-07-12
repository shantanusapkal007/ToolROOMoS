import { Controller, Get, Param } from '@nestjs/common';
import { StockQueryService } from './stock-query.service';

@Controller('api/v1/inventory/stock')
export class StockController {
  constructor(private readonly stockQueryService: StockQueryService) {}

  @Get()
  getGlobalStock() {
    return this.stockQueryService.getGlobalStock();
  }

  @Get('materials/:materialId')
  getStockByMaterial(@Param('materialId') materialId: string) {
    return this.stockQueryService.getStockByMaterial(materialId);
  }

  @Get('materials/:materialId/batches')
  getBatchesByMaterial(@Param('materialId') materialId: string) {
    return this.stockQueryService.getBatchesByMaterial(materialId);
  }
}
