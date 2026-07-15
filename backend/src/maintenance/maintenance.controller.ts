import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddLogDto } from './dto/add-log.dto';
import { AddSparePartDto } from './dto/add-spare-part.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/maintenance')
@UseGuards(JwtAuthGuard)
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
  create(@Body() createDto: CreateTicketDto, @Req() req: any) {
    return this.maintenanceService.create(createDto, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateTicketDto, @Req() req: any) {
    return this.maintenanceService.update(id, updateDto, req.user.userId);
  }

  @Post(':id/logs')
  async addLog(
    @Param('id') id: string,
    @Body() logDto: AddLogDto,
    @Req() req: any,
  ) {
    return this.maintenanceService.addLog(id, logDto, req.user.userId);
  }

  @Post(':id/spare-parts')
  async addSparePart(
    @Param('id') id: string,
    @Body() sparePartDto: AddSparePartDto,
  ) {
    return this.maintenanceService.addSparePart(id, sparePartDto);
  }
}
