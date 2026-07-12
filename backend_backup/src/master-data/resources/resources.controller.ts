import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ResourcesService } from './resources.service';

@Controller('api/v1/resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  // ================= TOOL =================
  @Get('tools')
  getTools() {
    return this.resourcesService.getTools();
  }

  @Post('tools')
  createTool(@Body() data: any) {
    return this.resourcesService.createTool(data);
  }

  @Put('tools/:id')
  updateTool(@Param('id') id: string, @Body() data: any) {
    return this.resourcesService.updateTool(id, data);
  }

  // ================= GAUGE =================
  @Get('gauges')
  getGauges() {
    return this.resourcesService.getGauges();
  }

  @Post('gauges')
  createGauge(@Body() data: any) {
    return this.resourcesService.createGauge(data);
  }

  @Put('gauges/:id')
  updateGauge(@Param('id') id: string, @Body() data: any) {
    return this.resourcesService.updateGauge(id, data);
  }

  // ================= FIXTURE =================
  @Get('fixtures')
  getFixtures() {
    return this.resourcesService.getFixtures();
  }

  @Post('fixtures')
  createFixture(@Body() data: any) {
    return this.resourcesService.createFixture(data);
  }

  @Put('fixtures/:id')
  updateFixture(@Param('id') id: string, @Body() data: any) {
    return this.resourcesService.updateFixture(id, data);
  }
}
