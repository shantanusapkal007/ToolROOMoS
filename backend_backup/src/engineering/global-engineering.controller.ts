import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { BomQueryService } from './bom/queries/bom-query.service';
import { BomCommandService } from './bom/commands/bom-command.service';
import { BomRevisionService } from './bom/revision/bom-revision.service';
import { RoutingQueryService } from './routing/queries/routing-query.service';
import { RoutingCommandService } from './routing/commands/routing-command.service';
import { EngineeringLifecycleService } from './workflow/engine/engineering-lifecycle.service';

@Controller('api/v1/engineering')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GlobalEngineeringController {
  constructor(
    private readonly bomQueryService: BomQueryService,
    private readonly bomCommandService: BomCommandService,
    private readonly bomRevisionService: BomRevisionService,
    private readonly routingQueryService: RoutingQueryService,
    private readonly routingCommandService: RoutingCommandService,
    private readonly lifecycleService: EngineeringLifecycleService,
  ) {}

  // ================= BOM =================

  @Get('bom')
  async getGlobalBoms(@Query('projectId') projectId?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const data = await this.bomQueryService.findAll({ projectId, page: parseInt(page || '1'), limit: parseInt(limit || '20') });
    return { status: 'success', ...data };
  }

  @Get('bom/:id')
  async getBomDetails(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.bomQueryService.findOne(id);
    return { status: 'success', data };
  }

  @Post('bom/project/:projectId')
  @Roles('ADMIN', 'ENGINEERING')
  async createBom(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() dto: any) {
    const data = await this.bomCommandService.createBom(projectId, dto);
    return { status: 'success', data };
  }

  @Post('bom/:id/items')
  @Roles('ADMIN', 'ENGINEERING')
  async addBomItems(@Param('id', ParseUUIDPipe) id: string, @Body('items') items: any[]) {
    const data = await this.bomCommandService.addItems(id, items);
    return { status: 'success', data };
  }

  @Post('bom/:id/clone')
  @Roles('ADMIN', 'ENGINEERING')
  async cloneBomRevision(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.bomRevisionService.cloneToNewRevision(id);
    return { status: 'success', message: 'Revision cloned successfully', data };
  }

  // ================= ROUTING =================

  @Get('routing')
  async getGlobalRoutings(@Query('projectId') projectId?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const data = await this.routingQueryService.findAll({ projectId, page: parseInt(page || '1'), limit: parseInt(limit || '20') });
    return { status: 'success', ...data };
  }

  @Get('routing/:id')
  async getRoutingDetails(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.routingQueryService.findOne(id);
    return { status: 'success', data };
  }

  @Post('routing/project/:projectId')
  @Roles('ADMIN', 'ENGINEERING')
  async createRouting(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() dto: any) {
    const data = await this.routingCommandService.createRouting(projectId, dto);
    return { status: 'success', data };
  }

  @Post('routing/:id/operations')
  @Roles('ADMIN', 'ENGINEERING')
  async addRoutingOperations(@Param('id', ParseUUIDPipe) id: string, @Body('operations') operations: any[]) {
    const data = await this.routingCommandService.addOperations(id, operations);
    return { status: 'success', data };
  }

  // ================= WORKFLOW LIFECYCLE =================

  @Patch('bom/:id/submit')
  @Roles('ADMIN', 'ENGINEERING')
  async submitBom(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.lifecycleService.submitBomForReview(id);
    return { status: 'success', message: 'BOM submitted for review.', data };
  }

  @Patch('bom/:id/approve')
  @Roles('ADMIN', 'ENGINEERING')
  async approveBom(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.lifecycleService.approveBom(id);
    // Also call CommandService approval if needed for other logic, but lifecycle handles state
    await this.bomCommandService.approveBom(id);
    return { status: 'success', message: 'BOM approved and frozen.', data };
  }
}
