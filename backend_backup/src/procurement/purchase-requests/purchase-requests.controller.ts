import { Controller, Post, Param, Body, Get, UseGuards, Request } from '@nestjs/common';
import { PurchaseRequestsService } from './purchase-requests.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('procurement/purchase-requests')
@UseGuards(JwtAuthGuard)
export class PurchaseRequestsController {
  constructor(private readonly prService: PurchaseRequestsService) {}

  @Post('generate-from-recommendation/:recommendationId')
  async generateFromRecommendation(
    @Param('recommendationId') recommendationId: string,
    @Request() req: any,
  ) {
    return this.prService.generateFromPlanningRecommendation(recommendationId, req.user.id);
  }

  @Get(':id')
  async getPr(@Param('id') id: string) {
    return this.prService.getPrById(id);
  }

  @Post(':id/submit')
  async submitForApproval(@Param('id') id: string, @Request() req: any) {
    return this.prService.submitForApproval(id, req.user.id);
  }

  @Post(':id/approve')
  async approvePr(@Param('id') id: string, @Body('remarks') remarks: string, @Request() req: any) {
    return this.prService.approvePr(id, req.user.id, remarks);
  }
}
