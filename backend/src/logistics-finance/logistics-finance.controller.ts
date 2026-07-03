import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { DispatchesService } from './dispatches.service';
import { InvoicesService } from './invoices.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('api/v1/projects/:projectId')
export class LogisticsFinanceController {
  constructor(
    private readonly inspectionService: InspectionsService,
    private readonly dispatchService: DispatchesService,
    private readonly invoiceService: InvoicesService,
  ) {}

  // Quality Inspection routes
  @Post('inspections')
  async createInspection(
    @Param('projectId') projectId: string,
    @Body() dto: CreateInspectionDto,
  ) {
    const data = await this.inspectionService.createInspection(projectId, dto);
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
  async createDispatch(
    @Param('projectId') projectId: string,
    @Body() dto: CreateDispatchDto,
  ) {
    const data = await this.dispatchService.createDispatch(projectId, dto);
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
  async createInvoice(
    @Param('projectId') projectId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    const data = await this.invoiceService.createInvoice(projectId, dto);
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
}
