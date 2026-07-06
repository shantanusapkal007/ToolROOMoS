import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Controller('api/v1/production/scheduling')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get()
  @Roles('ADMIN', 'PRODUCTION')
  async getSchedules(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const data = await this.schedulingService.getSchedules(start, end);
    return {
      status: 'success',
      data
    };
  }

  @Post()
  @Roles('ADMIN', 'PRODUCTION')
  async scheduleJobCard(
    @Body() dto: CreateScheduleDto,
    @CurrentUser() user: any
  ) {
    const data = await this.schedulingService.scheduleJobCard(dto, user.userId);
    return {
      status: 'success',
      message: 'Job Card scheduled successfully',
      data
    };
  }
}
