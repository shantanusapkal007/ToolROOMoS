import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PurchaseRequisitionsService } from './purchase-requisitions.service';
import { CreatePrnDto } from './dto/create-prn.dto';
import { UpdatePrnDto } from './dto/update-prn.dto';
import { ApprovePrnDto } from './dto/approve-prn.dto';
import { RejectPrnDto } from './dto/reject-prn.dto';
import { ConvertPrnToPoDto } from './dto/convert-to-po.dto';

@Controller('api/v1/purchase-requisitions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseRequisitionsController {
  constructor(private readonly prnService: PurchaseRequisitionsService) {}

  @Post()
  async createPrn(
    @Body() dto: CreatePrnDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.prnService.createPrn(dto, user?.userId);
    return {
      status: 'success',
      message: 'Purchase Requisition Note (PRN) created successfully.',
      data,
    };
  }

  @Post('from-bom')
  async createFromBom(
    @Body() body: { projectId: string; bomItemIds?: string[]; department?: string; requestedBy?: string },
    @CurrentUser() user: any,
  ) {
    const data = await this.prnService.createFromBom(
      body.projectId,
      body.bomItemIds,
      body.department,
      body.requestedBy,
      user?.userId,
    );
    return {
      status: 'success',
      message: 'Purchase Requisition generated from BOM successfully.',
      data,
    };
  }

  @Get()
  async listPrns(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('projectId') projectId?: string,
    @Query('department') department?: string,
  ) {
    const data = await this.prnService.listPrns({
      search,
      status,
      priority,
      category,
      projectId,
      department,
    });
    return {
      status: 'success',
      message: 'Purchase Requisition Notes retrieved successfully.',
      data,
    };
  }

  @Get('summary')
  async getSummary(@Query('projectId') projectId?: string) {
    const data = await this.prnService.getSummary(projectId);
    return {
      status: 'success',
      message: 'Purchase Requisitions summary retrieved successfully.',
      data,
    };
  }

  @Get(':id')
  async getPrnById(@Param('id') id: string) {
    const data = await this.prnService.getPrnById(id);
    return {
      status: 'success',
      message: 'Purchase Requisition retrieved successfully.',
      data,
    };
  }

  @Put(':id')
  async updatePrn(
    @Param('id') id: string,
    @Body() dto: UpdatePrnDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.prnService.updatePrn(id, dto, user?.userId);
    return {
      status: 'success',
      message: 'Purchase Requisition updated successfully.',
      data,
    };
  }

  @Post(':id/submit')
  async submitPrn(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.prnService.submitPrn(id, user?.userId);
    return {
      status: 'success',
      message: 'Purchase Requisition submitted for approval.',
      data,
    };
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'PURCHASE', 'ENGINEERING')
  async approvePrn(
    @Param('id') id: string,
    @Body() dto: ApprovePrnDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.prnService.approvePrn(id, dto, user);
    return {
      status: 'success',
      message: 'Purchase Requisition approved successfully.',
      data,
    };
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'PURCHASE', 'ENGINEERING')
  async rejectPrn(
    @Param('id') id: string,
    @Body() dto: RejectPrnDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.prnService.rejectPrn(id, dto, user);
    return {
      status: 'success',
      message: 'Purchase Requisition rejected.',
      data,
    };
  }

  @Post(':id/convert-to-po')
  @Roles('ADMIN', 'PURCHASE')
  async convertToPo(
    @Param('id') id: string,
    @Body() dto: ConvertPrnToPoDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.prnService.convertToPo(id, dto, user?.userId);
    return {
      status: 'success',
      message: 'Purchase Order generated from Purchase Requisition successfully.',
      data,
    };
  }

  @Delete(':id')
  async deletePrn(@Param('id') id: string) {
    const data = await this.prnService.deletePrn(id);
    return {
      status: 'success',
      message: 'Purchase Requisition deleted successfully.',
      data,
    };
  }
}
