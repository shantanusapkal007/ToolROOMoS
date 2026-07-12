import { Controller, Get, Post, Body, Param, Patch, ParseUUIDPipe } from '@nestjs/common';
import { HrService } from './hr.service';
import { CreateEmployeeDto } from '../master-data/employees/dto/create-employee.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/hr')
// Note: JwtAuthGuard and RolesGuard are applied globally via APP_GUARD in AppModule.
// No redundant local @UseGuards needed — it would require PassportModule in HrModule.
export class HrController {

  constructor(private readonly hrService: HrService) {}

  @Get('employees')
  async getEmployees() {
    return this.hrService.findAllEmployees();
  }

  @Post('employees')
  @Roles('ADMIN')
  async createEmployee(@Body() dto: CreateEmployeeDto, @CurrentUser() user: any) {
    return this.hrService.createEmployee(dto, user?.userId || 'SYSTEM');
  }

  @Patch('employees/:id/rate')
  @Roles('ADMIN')
  async updateEmployeeRate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { newRate: number, reason: string },
    @CurrentUser() user: any
  ) {
    return this.hrService.updateEmployeeRate(id, body.newRate, body.reason, user?.userId || 'SYSTEM');
  }

  @Get('rates/:entityType/:entityId')
  async getRateHistory(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.hrService.getRateHistory(entityType, entityId);
  }
}

