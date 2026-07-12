import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { MaterialIssuesController } from './material-issues/material-issues.controller';
import { MaterialIssuesService } from './material-issues/material-issues.service';
import { MaterialReturnsController } from './material-returns/material-returns.controller';
import { MaterialReturnsService } from './material-returns/material-returns.service';
import { StockController } from './stock/stock.controller';
import { StockQueryService } from './stock/stock-query.service';
import { GoodsReceiptSubscriber } from './subscribers/goods-receipt.subscriber';

@Module({
  controllers: [
    InventoryController, // Deprecated
    MaterialIssuesController,
    MaterialReturnsController,
    StockController
  ],
  providers: [
    InventoryService, // Deprecated
    MaterialIssuesService,
    MaterialReturnsService,
    StockQueryService,
    GoodsReceiptSubscriber
  ]
})
export class InventoryModule {}
