import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MaterialReturnsService } from './material-returns.service';

@Controller('api/v1/projects/:projectId/material-returns')
export class MaterialReturnsController {
  constructor(private readonly returnsService: MaterialReturnsService) {}

  @Get()
  getMaterialReturns(@Param('projectId') projectId: string) {
    return this.returnsService.getMaterialReturns(projectId);
  }

  @Post()
  returnMaterial(
    @Param('projectId') projectId: string,
    @Body('issueId') issueId: string,
    @Body('returnQty') returnQty: number,
    @Body('remarks') remarks: string,
  ) {
    return this.returnsService.returnMaterial(projectId, issueId, returnQty, remarks, 'SYSTEM');
  }
}
