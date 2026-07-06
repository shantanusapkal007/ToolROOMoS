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
  ParseUUIDPipe
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorType } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('api/v1/master-data/vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: CreateVendorDto) {
    const data = await this.vendorsService.create(dto);
    return {
      status: 'success',
      message: 'Vendor created successfully.',
      data,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('vendorType') vendorType?: VendorType,
  ) {
    const result = await this.vendorsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
      vendorType,
    });
    return {
      status: 'success',
      message: 'Vendors retrieved successfully.',
      ...result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.vendorsService.findOne(id);
    return {
      status: 'success',
      message: 'Vendor retrieved successfully.',
      data,
    };
  }

  @Put(':id')
  @Roles('ADMIN')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVendorDto) {
    const data = await this.vendorsService.update(id, dto);
    return {
      status: 'success',
      message: 'Vendor updated successfully.',
      data,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.vendorsService.softDelete(id);
    return {
      status: 'success',
      message: 'Vendor deactivated successfully.',
      data,
    };
  }
}
