import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

/**
 * CustomersController
 * 
 * Application Layer (Layer 2) for Customer Master Data.
 * Handles HTTP routing, request parsing, and response formatting.
 * Contains zero business logic — delegates everything to CustomersService.
 * 
 * Route: /api/v1/master-data/customers
 */
@Controller('api/v1/master-data/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('ADMIN', 'SALES_ENGINEER')
  async create(@Body() dto: CreateCustomerDto) {
    const data = await this.customersService.create(dto);
    return {
      status: 'success',
      message: 'Customer created successfully.',
      data,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.customersService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
    });
    return {
      status: 'success',
      message: 'Customers retrieved successfully.',
      ...result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.customersService.findOne(id);
    return {
      status: 'success',
      message: 'Customer retrieved successfully.',
      data,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'SALES_ENGINEER')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    const data = await this.customersService.update(id, dto);
    return {
      status: 'success',
      message: 'Customer updated successfully.',
      data,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const data = await this.customersService.softDelete(id);
    return {
      status: 'success',
      message: 'Customer deactivated successfully.',
      data,
    };
  }
}
