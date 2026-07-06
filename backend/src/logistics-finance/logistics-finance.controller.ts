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
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { InspectionsService } from './inspections.service';
import { DispatchesService } from './dispatches.service';
import { InvoicesService } from './invoices.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('api/v1/projects/:projectId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogisticsFinanceController {
  constructor(
    private readonly inspectionService: InspectionsService,
    private readonly dispatchService: DispatchesService,
    private readonly invoiceService: InvoicesService,
  ) {}

  // Quality Inspection routes
  @Post('inspections')
  @Roles('ADMIN', 'QUALITY')
  async createInspection(
    @Param('projectId') projectId: string,
    @Body() dto: CreateInspectionDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.inspectionService.createInspection(projectId, dto, user.userId);
    return {
      status: 'success',
      message: 'Quality inspection report created successfully.',
      data,
    };
  }

  @Get('inspections')
  async getInspections(@Param('projectId') projectId: string) {
    const data = await this.inspectionService.getInspections(projectId);
    return {
      status: 'success',
      message: 'Quality inspections retrieved successfully.',
      data,
    };
  }

  // Dispatch Note routes
  @Post('dispatches')
  @Roles('ADMIN', 'STORES')
  async createDispatch(
    @Param('projectId') projectId: string,
    @Body() dto: CreateDispatchDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.dispatchService.createDispatch(projectId, dto, user.userId);
    return {
      status: 'success',
      message: 'Dispatch note logged and processed.',
      data,
    };
  }

  @Get('dispatches')
  async getDispatches(@Param('projectId') projectId: string) {
    const data = await this.dispatchService.getDispatches(projectId);
    return {
      status: 'success',
      message: 'Dispatch notes retrieved successfully.',
      data,
    };
  }

  // Invoice routes
  @Post('invoices')
  @Roles('ADMIN', 'FINANCE')
  async createInvoice(
    @Param('projectId') projectId: string,
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.invoiceService.createInvoice(projectId, dto, user.userId);
    return {
      status: 'success',
      message: 'Customer invoice generated successfully.',
      data,
    };
  }

  @Get('invoices')
  async getInvoices(@Param('projectId') projectId: string) {
    const data = await this.invoiceService.getInvoices(projectId);
    return {
      status: 'success',
      message: 'Customer invoices retrieved.',
      data,
    };
  }

  // Payment routes
  @Post('payments')
  @Roles('ADMIN', 'FINANCE')
  async recordPayment(
    @Param('projectId') projectId: string,
    @Body() dto: import('./dto/record-payment.dto').RecordPaymentDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.invoiceService.recordPayment(projectId, dto, user.userId);
    return {
      status: 'success',
      message: 'Payment recorded successfully.',
      data,
    };
  }
}
