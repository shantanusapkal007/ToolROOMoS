import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubcontractingService } from './subcontracting.service';
import { CreateMultiSubcontractOrderDto } from './dto/create-multi-subcontract-order.dto';

@Controller('api/v1/subcontracting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GlobalSubcontractingController {
  constructor(private readonly subcontractingService: SubcontractingService) {}

  @Get('orders')
  async getAllOrders() {
    const data = await this.subcontractingService.getAllGlobalOrders();
    return {
      status: 'success',
      message: 'All Subcontract Orders retrieved successfully.',
      data,
    };
  }

  @Get('inventory-batches')
  async getAvailableBatches() {
    const data = await this.subcontractingService.getAvailableBatches();
    return {
      status: 'success',
      message: 'Available inventory batches retrieved successfully.',
      data,
    };
  }

  @Post('multi-orders')
  @Roles('ADMIN', 'PRODUCTION', 'PURCHASE')
  async createMultiProjectOrders(
    @Body() dto: CreateMultiSubcontractOrderDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.subcontractingService.createMultiProjectOrders(
      dto,
      user?.id || user?.userId || user?.sub,
    );
    return {
      status: 'success',
      message: 'Multi-Project Subcontract Challan generated successfully.',
      data,
    };
  }
}
