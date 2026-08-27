import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PartReworkService } from './part-rework.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModuleScope } from '../auth/decorators/module-scope.decorator';
import { CreatePartReworkDto } from './dto/create-part-rework.dto';
import { UpdatePartReworkDto } from './dto/update-part-rework.dto';

@Controller('api/v1/projects/:projectId/rework-orders')
@ModuleScope('production')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartReworkController {
  constructor(private readonly reworkService: PartReworkService) {}

  @Get()
  async getReworkOrders(@Param('projectId') projectId: string) {
    return this.reworkService.getReworkOrders(projectId);
  }

  @Get(':id')
  async getReworkOrderById(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.reworkService.getReworkOrderById(projectId, id);
  }

  @Post()
  @Roles('ADMIN', 'PRODUCTION', 'QUALITY', 'ENGINEERING')
  async createReworkOrder(
    @Param('projectId') projectId: string,
    @Body() dto: CreatePartReworkDto,
    @Req() req: any,
  ) {
    const userId = req.user?.name || req.user?.username || req.user?.email || 'USER';
    return this.reworkService.createReworkOrder(projectId, dto, userId);
  }

  @Put(':id/status')
  @Roles('ADMIN', 'PRODUCTION', 'QUALITY', 'ENGINEERING')
  async updateReworkStatus(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePartReworkDto,
    @Req() req: any,
  ) {
    const userId = req.user?.name || req.user?.username || req.user?.email || 'USER';
    return this.reworkService.updateReworkStatus(projectId, id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'PRODUCTION')
  async deleteReworkOrder(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.reworkService.deleteReworkOrder(projectId, id);
  }
}
