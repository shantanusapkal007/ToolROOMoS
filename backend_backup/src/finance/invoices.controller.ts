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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';

@Controller('api/v1/projects/:projectId/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoiceService: InvoicesService) {}

  @Post()
  @Roles('ADMIN', 'FINANCE')
  async createInvoice(
    @Param('projectId') projectId: string,
    @Body() dto: any, // Using any here to bypass DTO dependency for now
    @CurrentUser() user: any,
  ) {
    const data = await this.invoiceService.createInvoice(projectId, dto, user.userId);
    return {
      status: 'success',
      message: 'Customer invoice generated successfully.',
      data,
    };
  }

  @Get()
  async getInvoices(@Param('projectId') projectId: string) {
    const data = await this.invoiceService.getInvoicesByProject(projectId);
    return {
      status: 'success',
      message: 'Customer invoices retrieved.',
      data,
    };
  }

  @Post(':invoiceId/payments')
  @Roles('ADMIN', 'FINANCE')
  async recordPayment(
    @Param('projectId') projectId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    const data = await this.invoiceService.recordPayment(projectId, invoiceId, dto, user.userId);
    return {
      status: 'success',
      message: 'Payment recorded successfully.',
      data,
    };
  }
}
