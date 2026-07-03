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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('api/v1/master-data/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  async create(@Body() dto: CreateEmployeeDto) {
    const data = await this.employeesService.create(dto);
    return {
      status: 'success',
      message: 'Employee created successfully.',
      data,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const result = await this.employeesService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
      departmentId,
    });
    return {
      status: 'success',
      message: 'Employees retrieved successfully.',
      ...result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.employeesService.findOne(id);
    return {
      status: 'success',
      message: 'Employee retrieved successfully.',
      data,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    const data = await this.employeesService.update(id, dto);
    return {
      status: 'success',
      message: 'Employee updated successfully.',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.employeesService.softDelete(id);
    return {
      status: 'success',
      message: 'Employee deactivated successfully.',
      data,
    };
  }
}
