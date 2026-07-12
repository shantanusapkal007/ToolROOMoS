import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { OrganizationService } from './organization.service';

@Controller('api/v1/organization')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  // ================= COMPANY =================
  @Get('companies')
  getCompanies() {
    return this.orgService.getCompanies();
  }

  @Post('companies')
  createCompany(@Body() data: any) {
    return this.orgService.createCompany(data);
  }

  @Put('companies/:id')
  updateCompany(@Param('id') id: string, @Body() data: any) {
    return this.orgService.updateCompany(id, data);
  }

  // ================= PLANT =================
  @Get('plants')
  getPlants() {
    return this.orgService.getPlants();
  }

  @Post('plants')
  createPlant(@Body() data: any) {
    return this.orgService.createPlant(data);
  }

  @Put('plants/:id')
  updatePlant(@Param('id') id: string, @Body() data: any) {
    return this.orgService.updatePlant(id, data);
  }

  // ================= DEPARTMENT =================
  @Get('departments')
  getDepartments() {
    return this.orgService.getDepartments();
  }

  @Post('departments')
  createDepartment(@Body() data: any) {
    return this.orgService.createDepartment(data);
  }

  @Put('departments/:id')
  updateDepartment(@Param('id') id: string, @Body() data: any) {
    return this.orgService.updateDepartment(id, data);
  }

  // ================= SHIFT =================
  @Get('shifts')
  getShifts() {
    return this.orgService.getShifts();
  }

  @Post('shifts')
  createShift(@Body() data: any) {
    return this.orgService.createShift(data);
  }

  @Put('shifts/:id')
  updateShift(@Param('id') id: string, @Body() data: any) {
    return this.orgService.updateShift(id, data);
  }

  // ================= COST CENTER =================
  @Get('cost-centers')
  getCostCenters() {
    return this.orgService.getCostCenters();
  }

  @Post('cost-centers')
  createCostCenter(@Body() data: any) {
    return this.orgService.createCostCenter(data);
  }

  @Put('cost-centers/:id')
  updateCostCenter(@Param('id') id: string, @Body() data: any) {
    return this.orgService.updateCostCenter(id, data);
  }

  // ================= FINANCIAL YEAR =================
  @Get('financial-years')
  getFinancialYears() {
    return this.orgService.getFinancialYears();
  }

  @Post('financial-years')
  createFinancialYear(@Body() data: any) {
    return this.orgService.createFinancialYear(data);
  }

  @Put('financial-years/:id')
  updateFinancialYear(@Param('id') id: string, @Body() data: any) {
    return this.orgService.updateFinancialYear(id, data);
  }
}
