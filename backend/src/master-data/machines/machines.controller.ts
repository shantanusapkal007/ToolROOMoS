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
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';

@Controller('api/v1/master-data/machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  async create(@Body() dto: CreateMachineDto) {
    const data = await this.machinesService.create(dto);
    return {
      status: 'success',
      message: 'Machine created successfully.',
      data,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('machineType') machineType?: string,
  ) {
    const result = await this.machinesService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
      machineType,
    });
    return {
      status: 'success',
      message: 'Machines retrieved successfully.',
      ...result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.machinesService.findOne(id);
    return {
      status: 'success',
      message: 'Machine retrieved successfully.',
      data,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMachineDto) {
    const data = await this.machinesService.update(id, dto);
    return {
      status: 'success',
      message: 'Machine updated successfully.',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.machinesService.softDelete(id);
    return {
      status: 'success',
      message: 'Machine deactivated successfully.',
      data,
    };
  }
}
