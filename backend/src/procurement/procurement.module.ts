import { Module } from '@nestjs/common';
import { ProcurementController } from './procurement.controller';
import { GlobalProcurementController } from './global-procurement.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { GoodsReceiptsService } from './goods-receipts.service';

@Module({
  controllers: [ProcurementController, GlobalProcurementController],
  providers: [PurchaseOrdersService, GoodsReceiptsService],
  exports: [PurchaseOrdersService, GoodsReceiptsService],
})
export class ProcurementModule {}
