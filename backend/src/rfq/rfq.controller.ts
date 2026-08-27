import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RfqService } from './rfq.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { CreateRfqItemDto } from './dto/create-rfq-item.dto';
import { RfqCostEstimateDto } from './dto/rfq-cost-estimate.dto';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateRfqStatusDto } from './dto/update-rfq-status.dto';

@Controller('api/v1/rfq')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  // ─── RFQ CRUD ────────────────────────────────────────────────
  @Post()
  async createRfq(
    @Body() dto: CreateRfqDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.rfqService.createRfq(dto, user?.userId);
    return {
      status: 'success',
      message: 'RFQ created successfully.',
      data,
    };
  }

  @Get()
  async listRfqs(
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('projectId') projectId?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.rfqService.listRfqs({ status, customerId, projectId, search });
    return {
      status: 'success',
      message: 'RFQs retrieved successfully.',
      data,
    };
  }

  @Get('pipeline')
  async getPipelineSummary() {
    const data = await this.rfqService.getPipelineSummary();
    return {
      status: 'success',
      message: 'Pipeline summary retrieved successfully.',
      data,
    };
  }

  @Get('quotations')
  async listQuotations() {
    const data = await this.rfqService.listQuotations();
    return {
      status: 'success',
      message: 'Quotations retrieved successfully.',
      data,
    };
  }

  @Get('quotations/:id')
  async getQuotationById(@Param('id') id: string) {
    const data = await this.rfqService.getQuotationById(id);
    return {
      status: 'success',
      message: 'Quotation retrieved successfully.',
      data,
    };
  }

  @Get(':id')
  async getRfqById(@Param('id') id: string) {
    const data = await this.rfqService.getRfqById(id);
    return {
      status: 'success',
      message: 'RFQ retrieved successfully.',
      data,
    };
  }

  @Put(':id')
  async updateRfq(
    @Param('id') id: string,
    @Body() dto: CreateRfqDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.rfqService.updateRfq(id, dto, user?.userId);
    return {
      status: 'success',
      message: 'RFQ updated successfully.',
      data,
    };
  }

  // ─── LINK / UNLINK PROJECT ───────────────────────────────────
  @Post(':id/link-project')
  async linkToProject(
    @Param('id') id: string,
    @Body() body: { projectId: string },
    @CurrentUser() user: any,
  ) {
    const data = await this.rfqService.linkToProject(id, body.projectId, user?.userId);
    return {
      status: 'success',
      message: 'RFQ linked to project successfully.',
      data,
    };
  }

  @Post(':id/unlink-project')
  async unlinkFromProject(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.rfqService.unlinkFromProject(id, user?.userId);
    return {
      status: 'success',
      message: 'RFQ unlinked from project successfully.',
      data,
    };
  }

  // ─── LINE ITEMS ──────────────────────────────────────────────
  @Post(':id/items')
  async upsertItems(
    @Param('id') id: string,
    @Body() items: CreateRfqItemDto[],
    @CurrentUser() user: any,
  ) {
    const data = await this.rfqService.upsertItems(id, items, user?.userId);
    return {
      status: 'success',
      message: 'RFQ items updated successfully.',
      data,
    };
  }

  // ─── COST ESTIMATION ────────────────────────────────────────
  @Post(':id/estimate')
  async saveCostEstimates(
    @Param('id') id: string,
    @Body() estimates: RfqCostEstimateDto[],
    @CurrentUser() user: any,
  ) {
    const data = await this.rfqService.saveCostEstimates(id, estimates, user?.userId);
    return {
      status: 'success',
      message: 'Cost estimates saved successfully.',
      data,
    };
  }

  // ─── QUOTATION GENERATION ───────────────────────────────────
  @Post(':id/quote')
  async generateQuotation(
    @Param('id') id: string,
    @Body() dto: CreateQuotationDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.rfqService.generateQuotation(id, dto, user?.userId);
    return {
      status: 'success',
      message: 'Quotation generated successfully.',
      data,
    };
  }

  // ─── STATUS UPDATE ──────────────────────────────────────────
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRfqStatusDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.rfqService.updateStatus(id, dto, user?.userId);
    return {
      status: 'success',
      message: `RFQ status updated to ${dto.status}.`,
      data,
    };
  }

  // ─── CONVERT TO PROJECT ─────────────────────────────────────
  @Post(':id/convert')
  @Roles('ADMIN', 'SALES', 'ENGINEERING')
  async convertToProject(
    @Param('id') id: string,
    @Body() body: { plantId?: string },
    @CurrentUser() user: any,
  ) {
    const data = await this.rfqService.convertToProject(id, body?.plantId, user?.userId);
    return {
      status: 'success',
      message: 'RFQ converted to Project successfully.',
      data,
    };
  }
}
