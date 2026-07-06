import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { InspectionStandardsService } from './inspection-standards.service';
import { CreateInspectionStandardDto, UpdateInspectionStandardDto } from './dto/inspection-standard.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('api/v1/master-data/inspection-standards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InspectionStandardsController {
  constructor(private readonly service: InspectionStandardsService) {}

  @Post()
  @Roles('ADMIN', 'QUALITY')
  async create(@Body() dto: CreateInspectionStandardDto) {
    const data = await this.service.create(dto);
    return { status: 'success', message: 'Inspection Standard created successfully', data };
  }

  @Get()
  async findAll() {
    const data = await this.service.findAll();
    return { status: 'success', data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.findOne(id);
    return { status: 'success', data };
  }

  @Put(':id')
  @Roles('ADMIN', 'QUALITY')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInspectionStandardDto,
  ) {
    const data = await this.service.update(id, dto);
    return { status: 'success', message: 'Inspection Standard updated successfully', data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return { status: 'success', message: 'Inspection Standard deleted successfully' };
  }
}
