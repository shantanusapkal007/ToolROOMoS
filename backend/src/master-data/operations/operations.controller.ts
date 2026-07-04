import { Controller, Get, UseGuards } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller('api/v1/master-data/operations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get()
  async findAll() {
    const data = await this.operationsService.findAll();
    return {
      status: 'success',
      message: 'Operations retrieved successfully.',
      data,
    };
  }
}
