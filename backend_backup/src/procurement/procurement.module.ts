import { Module } from '@nestjs/common';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';
import { PurchaseRequestsModule } from './purchase-requests/purchase-requests.module';
import { PurchaseOrdersService } from './purchase-orders.service';
import { GoodsReceiptsService } from './goods-receipts.service';
import { VendorBillsService } from './vendor-bills.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { GoodsReceiptsController } from './goods-receipts.controller';
import { VendorBillsController } from './vendor-bills.controller';

@Module({
  imports: [PurchaseRequestsModule],
  controllers: [
    ProcurementController, // Deprecated
    PurchaseOrdersController,
    GoodsReceiptsController,
    VendorBillsController
  ],
  providers: [
    ProcurementService, // Deprecated
    PurchaseOrdersService,
    GoodsReceiptsService,
    VendorBillsService
  ]
})
export class ProcurementModule {}
