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
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Controller('api/v1/master-data/materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  async create(@Body() dto: CreateMaterialDto) {
    const data = await this.materialsService.create(dto);
    return {
      status: 'success',
      message: 'Material created successfully.',
      data,
    };
  }

  @Get()
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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.materialsService.findOne(id);
    return {
      status: 'success',
      message: 'Material retrieved successfully.',
      data,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    const data = await this.materialsService.update(id, dto);
    return {
      status: 'success',
      message: 'Material updated successfully.',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.materialsService.softDelete(id);
    return {
      status: 'success',
      message: 'Material deactivated successfully.',
      data,
    };
  }
}
