import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MaterialIssuesService } from './material-issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';

@Controller('api/v1/production')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GlobalProductionController {
  constructor(
    private readonly issueService: MaterialIssuesService,
  ) {}

  @Get('material-issues')
  async getAllMaterialIssues() {
    const data = await this.issueService.getAllMaterialIssues();
    return {
      status: 'success',
      message: 'All material issue records retrieved successfully.',
      data,
    };
  }

  @Get('inventory-batches')
  async getAvailableBatches() {
    const data = await this.issueService.getAvailableInventoryBatches();
    return {
      status: 'success',
      message: 'Available inventory batches retrieved successfully.',
      data,
    };
  }

  @Post('consumable-issues')
  @Roles('ADMIN', 'PRODUCTION', 'STORES')
  async issueConsumableMaterial(
    @Body() dto: CreateIssueDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.issueService.issueConsumableMaterial(dto, user.userId);
    return {
      status: 'success',
      message: 'Consumable material issued successfully.',
      data,
    };
  }
}
