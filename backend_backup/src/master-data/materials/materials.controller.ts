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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MaterialsService } from './materials.service';
import { InventoryService } from './inventory.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Controller('api/v1/master-data')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialsController {
  constructor(
    private readonly materialsService: MaterialsService,
    private readonly inventoryService: InventoryService,
  ) {}

  @Get('inventory-ledger')
  async getInventoryLedger() {
    const data = await this.inventoryService.getInventoryLedger();
    return {
      status: 'success',
      message: 'Inventory ledger retrieved successfully.',
      data,
    };
  }

  @Post('materials')
  @Roles('ADMIN')
  async create(@Body() dto: CreateMaterialDto) {
    const data = await this.materialsService.create(dto);
    return {
      status: 'success',
      message: 'Material created successfully.',
      data,
    };
  }

  @Get('materials')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('materialCategory') materialCategory?: string,
  ) {
    const result = await this.materialsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
      materialCategory,
    });
    return {
      status: 'success',
      message: 'Materials retrieved successfully.',
      ...result,
    };
  }

  @Get('materials/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.materialsService.findOne(id);
    return {
      status: 'success',
      message: 'Material retrieved successfully.',
      data,
    };
  }

  @Put('materials/:id')
  @Roles('ADMIN')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMaterialDto) {
    const data = await this.materialsService.update(id, dto);
    return {
      status: 'success',
      message: 'Material updated successfully.',
      data,
    };
  }

  @Delete('materials/:id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.materialsService.softDelete(id);
    return {
      status: 'success',
      message: 'Material deactivated successfully.',
      data,
    };
  }
}
