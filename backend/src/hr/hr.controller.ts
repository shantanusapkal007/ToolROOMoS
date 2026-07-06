import { Controller, Get, Post, Body, Param, Patch , ParseUUIDPipe } from '@nestjs/common';
import { HrService } from './hr.service';

@Controller('api/v1/hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('employees')
  async getEmployees() {
    return this.hrService.findAllEmployees();
  }

  @Post('employees')
  async createEmployee(@Body() data: any) {
    // Hardcoded SYSTEM user for demo
    return this.hrService.createEmployee(data, 'SYSTEM');
  }

  @Patch('employees/:id/rate')
  async updateEmployeeRate(@Param('id', ParseUUIDPipe) id: string, @Body() body: { newRate: number, reason: string }) {
    return this.hrService.updateEmployeeRate(id, body.newRate, body.reason, 'SYSTEM');
  }

  @Get('rates/:entityType/:entityId')
  async getRateHistory(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.hrService.getRateHistory(entityType, entityId);
  }
}
