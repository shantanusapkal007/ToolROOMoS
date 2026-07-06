import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards , ParseUUIDPipe } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('api/v1/master-data/warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @Roles('ADMIN', 'STORES', 'PURCHASE')
  async create(@Body() createWarehouseDto: CreateWarehouseDto) {
    const data = await this.warehousesService.create(createWarehouseDto);
    return { status: 'success', data };
  }

  @Get()
  async findAll() {
    const data = await this.warehousesService.findAll();
    return { status: 'success', data, pagination: { total: data.length, page: 1, limit: 100, totalPages: 1 } };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.warehousesService.findOne(id);
    return { status: 'success', data };
  }

  @Patch(':id')
  @Roles('ADMIN', 'STORES', 'PURCHASE')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateWarehouseDto: UpdateWarehouseDto) {
    const data = await this.warehousesService.update(id, updateWarehouseDto);
    return { status: 'success', data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.warehousesService.softDelete(id);
    return { status: 'success', data };
  }
}
