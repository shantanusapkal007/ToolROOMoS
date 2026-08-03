import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto, UpdateAssetDto } from './dto/create-asset.dto';
import { IssueAssetDto } from './dto/issue-asset.dto';
import { ReturnAssetDto } from './dto/return-asset.dto';
import { CreateMaintenanceDto, CompleteMaintenanceDto } from './dto/create-maintenance.dto';
import { CreateCategoryDto, CreateLocationDto } from './dto/create-category-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api/v1/assets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.assetsService.getDashboardStats();
  }

  @Get('categories')
  getCategories() {
    return this.assetsService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto, @Request() req: any) {
    return this.assetsService.createCategory(dto, req.user?.id || req.user?.email);
  }

  @Get('locations')
  getLocations() {
    return this.assetsService.getLocations();
  }

  @Post('locations')
  createLocation(@Body() dto: CreateLocationDto, @Request() req: any) {
    return this.assetsService.createLocation(dto, req.user?.id || req.user?.email);
  }

  @Get('issues')
  getIssueTransactions() {
    return this.assetsService.getIssueTransactions();
  }

  @Post('issues')
  issueAsset(@Body() dto: IssueAssetDto, @Request() req: any) {
    return this.assetsService.issueAsset(dto, req.user?.id || req.user?.email);
  }

  @Get('returns')
  getReturnTransactions() {
    return this.assetsService.getReturnTransactions();
  }

  @Post('returns')
  returnAsset(@Body() dto: ReturnAssetDto, @Request() req: any) {
    return this.assetsService.returnAsset(dto, req.user?.id || req.user?.email);
  }

  @Get('maintenance')
  getMaintenanceRequests() {
    return this.assetsService.getMaintenanceRequests();
  }

  @Post('maintenance')
  createMaintenance(@Body() dto: CreateMaintenanceDto, @Request() req: any) {
    return this.assetsService.createMaintenance(dto, req.user?.id || req.user?.email);
  }

  @Put('maintenance/:id/complete')
  completeMaintenance(@Param('id') id: string, @Body() dto: CompleteMaintenanceDto, @Request() req: any) {
    return this.assetsService.completeMaintenance(id, dto, req.user?.id || req.user?.email);
  }

  @Get()
  getAssets(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.assetsService.getAssets({ search, categoryId, status, locationId });
  }

  @Get(':id')
  getAssetById(@Param('id') id: string) {
    return this.assetsService.getAssetById(id);
  }

  @Post()
  createAsset(@Body() dto: CreateAssetDto, @Request() req: any) {
    return this.assetsService.createAsset(dto, req.user?.id || req.user?.email);
  }

  @Put(':id')
  updateAsset(@Param('id') id: string, @Body() dto: UpdateAssetDto, @Request() req: any) {
    return this.assetsService.updateAsset(id, dto, req.user?.id || req.user?.email);
  }
}
