import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { VendorBillsService } from './vendor-bills.service';

@Controller('api/v1/projects/:projectId/vendor-bills')
export class VendorBillsController {
  constructor(private readonly vendorBillsService: VendorBillsService) {}

  @Get()
  async getVendorBills(@Param('projectId') projectId: string) {
    return this.vendorBillsService.getVendorBills(projectId);
  }

  @Post()
  async createVendorBill(
    @Param('projectId') projectId: string,
    @Body() dto: any,
  ) {
    return this.vendorBillsService.createVendorBill(projectId, dto, 'SYSTEM');
  }

  @Post(':billId/approve')
  async approveVendorBill(
    @Param('projectId') projectId: string,
    @Param('billId') billId: string,
  ) {
    return this.vendorBillsService.approveVendorBill(projectId, billId, 'SYSTEM');
  }
}
