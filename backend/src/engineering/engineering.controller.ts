import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DrawingsService } from './drawings.service';
import { BomsService } from './boms.service';
import { CreateDrawingDto } from './dto/create-drawing.dto';
import { CreateBomDto } from './dto/create-bom.dto';

@Controller('api/v1/projects/:projectId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngineeringController {
  constructor(
    private readonly drawingsService: DrawingsService,
    private readonly bomsService: BomsService,
  ) {}

  // Drawings APIs
  @Post('drawings')
  @Roles('ADMIN', 'ENGINEERING')
  async uploadDrawing(
    @Param('projectId') projectId: string,
    @Body() dto: CreateDrawingDto,
  ) {
    const data = await this.drawingsService.uploadDrawing(projectId, dto);
    return {
      status: 'success',
      message: 'Drawing uploaded successfully.',
      data,
    };
  }

  @Get('drawings')
  async getDrawings(@Param('projectId') projectId: string) {
    const data = await this.drawingsService.getDrawings(projectId);
    return {
      status: 'success',
      message: 'Drawings retrieved successfully.',
      data,
    };
  }

  // BOM APIs
  @Post('bom')
  @Roles('ADMIN', 'ENGINEERING')
  async createBom(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBomDto,
  ) {
    const data = await this.bomsService.createBom(projectId, dto);
    return {
      status: 'success',
      message: 'BOM submitted successfully.',
      data,
    };
  }

  @Put('bom/:bomId/approve')
  @Roles('ADMIN', 'ENGINEERING')
  async approveBom(
    @Param('projectId') projectId: string,
    @Param('bomId') bomId: string,
  ) {
    const data = await this.bomsService.approveBom(projectId, bomId);
    return {
      status: 'success',
      message: 'BOM approved. Project transitioned to Procurement stage.',
      data,
    };
  }

  @Get('bom')
  async getBom(@Param('projectId') projectId: string) {
    const data = await this.bomsService.getBom(projectId);
    return {
      status: 'success',
      message: 'Active BOM retrieved successfully.',
      data,
    };
  }
}
