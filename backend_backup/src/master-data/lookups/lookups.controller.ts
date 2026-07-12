import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { LookupsService } from './lookups.service';

@Controller('api/v1/master-data')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  @Get('companies')
  async companies() {
    const data = await this.lookupsService.companies();
    return { status: 'success', message: 'Companies retrieved successfully.', data };
  }

  @Post('companies')
  async createCompany(@Body() dto: any) {
    const data = await this.lookupsService.createCompany(dto);
    return { status: 'success', message: 'Company created successfully.', data };
  }

  @Get('plants')
  async plants() {
    const data = await this.lookupsService.plants();
    return { status: 'success', message: 'Plants retrieved successfully.', data };
  }

  @Post('plants')
  async createPlant(@Body() dto: any) {
    const data = await this.lookupsService.createPlant(dto);
    return { status: 'success', message: 'Plant created successfully.', data };
  }

  @Get('departments')
  async departments() {
    const data = await this.lookupsService.departments();
    return { status: 'success', message: 'Departments retrieved successfully.', data };
  }

  @Post('departments')
  async createDepartment(@Body() dto: any) {
    const data = await this.lookupsService.createDepartment(dto);
    return { status: 'success', message: 'Department created successfully.', data };
  }

  @Get('shifts')
  async shifts() {
    const data = await this.lookupsService.shifts();
    return { status: 'success', message: 'Shifts retrieved successfully.', data };
  }

  @Post('shifts')
  async createShift(@Body() dto: any) {
    const data = await this.lookupsService.createShift(dto);
    return { status: 'success', message: 'Shift created successfully.', data };
  }

  @Get('material-shapes')
  async materialShapes() {
    const data = await this.lookupsService.materialShapes();
    return { status: 'success', message: 'Material shapes retrieved successfully.', data };
  }

  @Post('material-shapes')
  async createMaterialShape(@Body() dto: any) {
    const data = await this.lookupsService.createMaterialShape(dto);
    return { status: 'success', message: 'Material shape created successfully.', data };
  }
}
