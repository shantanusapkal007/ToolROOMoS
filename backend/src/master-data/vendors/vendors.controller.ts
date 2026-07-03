import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorType } from '@prisma/client';

@Controller('api/v1/master-data/vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
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
  async findOne(@Param('id') id: string) {
    const data = await this.vendorsService.findOne(id);
    return {
      status: 'success',
      message: 'Vendor retrieved successfully.',
      data,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    const data = await this.vendorsService.update(id, dto);
    return {
      status: 'success',
      message: 'Vendor updated successfully.',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.vendorsService.softDelete(id);
    return {
      status: 'success',
      message: 'Vendor deactivated successfully.',
      data,
    };
  }
}
