import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ProcurementService } from './procurement.service';

/**
 * @deprecated Use specific domain controllers (PurchaseOrdersController, GoodsReceiptsController, VendorBillsController)
 */
@Controller('api/v1/procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('purchase-orders')
  getPurchaseOrders(@Query() query: any) {
    return this.procurementService.getPurchaseOrders(query);
  }

  @Post('projects/:projectId/purchase-requests/:prId/convert')
  convertPrToPo(
    @Param('projectId') projectId: string,
    @Param('prId') prId: string,
    @Body('vendorId') vendorId: string,
  ) {
    return this.procurementService.createPurchaseOrderFromRequest(projectId, prId, vendorId);
  }

  @Get('purchase-orders/:poId/bills')
  getVendorBills(@Param('poId') poId: string) {
    return this.procurementService.getVendorBills(poId);
  }

  @Post('purchase-orders/:poId/bills')
  createVendorBill(@Param('poId') poId: string, @Body() data: any) {
    return this.procurementService.createVendorBill(poId, data);
  }

  @Get('returns/vendors/:vendorId')
  getPurchaseReturns(@Param('vendorId') vendorId: string) {
    return this.procurementService.getPurchaseReturns(vendorId);
  }

  @Post('purchase-orders/:poId/returns')
  createPurchaseReturn(@Param('poId') poId: string, @Body() data: any) {
    return this.procurementService.createPurchaseReturn(data.vendorId, poId, data);
  }
}
