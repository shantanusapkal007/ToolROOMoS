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
import { SubcontractingService } from './subcontracting.service';
import { CreateSubcontractOrderDto } from './dto/create-subcontract-order.dto';
import { CreateSubcontractReceiptDto } from './dto/create-subcontract-receipt.dto';

@Controller('api/v1/projects/:projectId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubcontractingController {
  constructor(private readonly subcontractingService: SubcontractingService) {}

  @Post('subcontract-orders')
  @Roles('ADMIN', 'PRODUCTION', 'PURCHASE')
  async createOrder(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSubcontractOrderDto,
  ) {
    const data = await this.subcontractingService.createOrder(projectId, dto);
    return {
      status: 'success',
      message: 'Subcontract Order / Challan generated successfully.',
      data,
    };
  }

  @Get('subcontract-orders')
  async getOrders(@Param('projectId') projectId: string) {
    const data = await this.subcontractingService.getOrders(projectId);
    return {
      status: 'success',
      message: 'Subcontract Orders retrieved.',
      data,
    };
  }

  @Post('subcontract-receipts')
  @Roles('ADMIN', 'PRODUCTION', 'PURCHASE')
  async createReceipt(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSubcontractReceiptDto,
  ) {
    const data = await this.subcontractingService.createReceipt(projectId, dto);
    return {
      status: 'success',
      message: 'Subcontract Receipt generated successfully.',
      data,
    };
  }

  @Get('subcontract-receipts')
  async getReceipts(@Param('projectId') projectId: string) {
    const data = await this.subcontractingService.getReceipts(projectId);
    return {
      status: 'success',
      message: 'Subcontract Receipts retrieved.',
      data,
    };
  }
}
