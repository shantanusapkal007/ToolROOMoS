import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddLogDto } from './dto/add-log.dto';
import { AddSparePartDto } from './dto/add-spare-part.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModuleScope } from '../auth/decorators/module-scope.decorator';

@Controller('api/v1/maintenance')
@ModuleScope('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll() {
    return this.maintenanceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'PRODUCTION')
  create(@Body() createDto: CreateTicketDto, @Req() req: any) {
    return this.maintenanceService.create(createDto, req.user?.userId || req.user?.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PRODUCTION')
  update(@Param('id') id: string, @Body() updateDto: UpdateTicketDto, @Req() req: any) {
    return this.maintenanceService.update(id, updateDto, req.user?.userId || req.user?.id);
  }

  @Post(':id/logs')
  @Roles('ADMIN', 'PRODUCTION')
  async addLog(
    @Param('id') id: string,
    @Body() logDto: AddLogDto,
    @Req() req: any,
  ) {
    return this.maintenanceService.addLog(id, logDto, req.user?.userId || req.user?.id);
  }

  @Post(':id/spare-parts')
  @Roles('ADMIN', 'PRODUCTION')
  async addSparePart(
    @Param('id') id: string,
    @Body() sparePartDto: AddSparePartDto,
  ) {
    return this.maintenanceService.addSparePart(id, sparePartDto);
  }

  @Get('machines/:machineId/metrics')
  async getMachineMetrics(@Param('machineId') machineId: string) {
    return this.maintenanceService.getMachineMetrics(machineId);
  }
}
