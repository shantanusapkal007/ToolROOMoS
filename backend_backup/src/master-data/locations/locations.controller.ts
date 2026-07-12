import { Controller, Get, Post, Body, Patch, Put, Param, Delete, UseGuards , ParseUUIDPipe } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('api/v1/master-data/locations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @Roles('ADMIN', 'STORES', 'PURCHASE')
  async create(@Body() createLocationDto: CreateLocationDto) {
    const data = await this.locationsService.create(createLocationDto);
    return { status: 'success', data };
  }

  @Get()
  async findAll() {
    const data = await this.locationsService.findAll();
    return { status: 'success', data, pagination: { total: data.length, page: 1, limit: 100, totalPages: 1 } };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.locationsService.findOne(id);
    return { status: 'success', data };
  }

  @Patch(':id')
  @Roles('ADMIN', 'STORES', 'PURCHASE')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateLocationDto: UpdateLocationDto) {
    const data = await this.locationsService.update(id, updateLocationDto);
    return { status: 'success', data };
  }

  @Put(':id')
  @Roles('ADMIN', 'STORES', 'PURCHASE')
  async replace(@Param('id', ParseUUIDPipe) id: string, @Body() updateLocationDto: UpdateLocationDto) {
    const data = await this.locationsService.update(id, updateLocationDto);
    return { status: 'success', data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.locationsService.softDelete(id);
    return { status: 'success', data };
  }
}
