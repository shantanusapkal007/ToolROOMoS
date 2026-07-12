import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { CommercialService } from './commercial.service';

@Controller('api/v1/commercial')
export class CommercialController {
  constructor(private readonly commercialService: CommercialService) {}

  // ================= TAX MASTER =================
  @Get('taxes')
  getTaxes() {
    return this.commercialService.getTaxes();
  }

  @Post('taxes')
  createTax(@Body() data: any) {
    return this.commercialService.createTax(data);
  }

  @Put('taxes/:id')
  updateTax(@Param('id') id: string, @Body() data: any) {
    return this.commercialService.updateTax(id, data);
  }

  // ================= CURRENCY =================
  @Get('currencies')
  getCurrencies() {
    return this.commercialService.getCurrencies();
  }

  @Post('currencies')
  createCurrency(@Body() data: any) {
    return this.commercialService.createCurrency(data);
  }

  @Put('currencies/:id')
  updateCurrency(@Param('id') id: string, @Body() data: any) {
    return this.commercialService.updateCurrency(id, data);
  }

  // ================= UOM =================
  @Get('uoms')
  getUoms() {
    return this.commercialService.getUoms();
  }

  @Post('uoms')
  createUom(@Body() data: any) {
    return this.commercialService.createUom(data);
  }

  @Put('uoms/:id')
  updateUom(@Param('id') id: string, @Body() data: any) {
    return this.commercialService.updateUom(id, data);
  }

  // ================= PAYMENT TERMS =================
  @Get('payment-terms')
  getPaymentTerms() {
    return this.commercialService.getPaymentTerms();
  }

  @Post('payment-terms')
  createPaymentTerm(@Body() data: any) {
    return this.commercialService.createPaymentTerm(data);
  }

  @Put('payment-terms/:id')
  updatePaymentTerm(@Param('id') id: string, @Body() data: any) {
    return this.commercialService.updatePaymentTerm(id, data);
  }
}
