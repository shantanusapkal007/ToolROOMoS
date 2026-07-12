import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { GoodsReceiptsService } from './goods-receipts.service';
import { CreateGrnDto } from './dto/create-grn.dto';

@Controller('api/v1/projects/:projectId/goods-receipts')
export class GoodsReceiptsController {
  constructor(private readonly grnService: GoodsReceiptsService) {}

  @Get()
  async getGoodsReceipts(@Param('projectId') projectId: string) {
    return this.grnService.getGoodsReceipts(projectId);
  }

  @Post()
  async createGrn(
    @Param('projectId') projectId: string,
    @Body() dto: CreateGrnDto,
  ) {
    return this.grnService.createGrn(projectId, dto, 'SYSTEM');
  }
}
