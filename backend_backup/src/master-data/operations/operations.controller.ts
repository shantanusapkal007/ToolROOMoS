import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateOperationDto } from './dto/create-operation.dto';
import { UpdateOperationDto } from './dto/update-operation.dto';

@Controller('api/v1/master-data/operations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post()
  @Roles('ADMIN', 'ENGINEERING', 'PRODUCTION')
  async create(@Body() dto: CreateOperationDto) {
    const data = await this.operationsService.create(dto);
    return {
      status: 'success',
      message: 'Operation created successfully.',
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
    const result = await this.operationsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
    });
    return {
      status: 'success',
      message: 'Operations retrieved successfully.',
      ...result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.operationsService.findOne(id);
    return {
      status: 'success',
      message: 'Operation retrieved successfully.',
      data,
    };
  }

  @Put(':id')
  @Roles('ADMIN', 'ENGINEERING', 'PRODUCTION')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOperationDto) {
    const data = await this.operationsService.update(id, dto);
    return {
      status: 'success',
      message: 'Operation updated successfully.',
      data,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.operationsService.softDelete(id);
    return {
      status: 'success',
      message: 'Operation deactivated successfully.',
      data,
    };
  }
}
