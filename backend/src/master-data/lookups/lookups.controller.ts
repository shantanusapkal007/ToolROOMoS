import { Controller, Get, UseGuards } from '@nestjs/common';
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

  @Get('plants')
  async plants() {
    const data = await this.lookupsService.plants();
    return { status: 'success', message: 'Plants retrieved successfully.', data };
  }

  @Get('departments')
  async departments() {
    const data = await this.lookupsService.departments();
    return { status: 'success', message: 'Departments retrieved successfully.', data };
  }

  @Get('shifts')
  async shifts() {
    const data = await this.lookupsService.shifts();
    return { status: 'success', message: 'Shifts retrieved successfully.', data };
  }

  @Get('material-shapes')
  async materialShapes() {
    const data = await this.lookupsService.materialShapes();
    return { status: 'success', message: 'Material shapes retrieved successfully.', data };
  }
}
