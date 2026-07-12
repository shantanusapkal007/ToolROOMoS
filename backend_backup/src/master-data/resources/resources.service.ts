// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBus } from '../../platform/event.bus';
import { AuditEngine } from '../../platform/audit.engine';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
  ) {}

  // ================= TOOL =================
  async getTools() {
    return this.prisma.tool.findMany();
  }

  async createTool(data: any, userId: string = 'SYSTEM') {
    const tool = await this.prisma.tool.create({ data });
    await this.audit.logAction(tool.id, 'TOOL', 'CREATE', userId, tool);
    return tool;
  }

  async updateTool(id: string, data: any, userId: string = 'SYSTEM') {
    const tool = await this.prisma.tool.update({ where: { id }, data });
    await this.audit.logAction(tool.id, 'TOOL', 'UPDATE', userId, tool);
    return tool;
  }

  // ================= GAUGE =================
  async getGauges() {
    return this.prisma.gauge.findMany();
  }

  async createGauge(data: any, userId: string = 'SYSTEM') {
    // If dates come in as strings, we should parse them safely or rely on Prisma. Prisma usually requires ISO strings or Date objects.
    if (data.calibrationDate) data.calibrationDate = new Date(data.calibrationDate);
    if (data.nextCalibrationDate) data.nextCalibrationDate = new Date(data.nextCalibrationDate);

    const gauge = await this.prisma.gauge.create({ data });
    await this.audit.logAction(gauge.id, 'GAUGE', 'CREATE', userId, gauge);
    return gauge;
  }

  async updateGauge(id: string, data: any, userId: string = 'SYSTEM') {
    if (data.calibrationDate) data.calibrationDate = new Date(data.calibrationDate);
    if (data.nextCalibrationDate) data.nextCalibrationDate = new Date(data.nextCalibrationDate);

    const gauge = await this.prisma.gauge.update({ where: { id }, data });
    await this.audit.logAction(gauge.id, 'GAUGE', 'UPDATE', userId, gauge);
    return gauge;
  }

  // ================= FIXTURE =================
  async getFixtures() {
    return this.prisma.fixture.findMany();
  }

  async createFixture(data: any, userId: string = 'SYSTEM') {
    const fixture = await this.prisma.fixture.create({ data });
    await this.audit.logAction(fixture.id, 'FIXTURE', 'CREATE', userId, fixture);
    return fixture;
  }

  async updateFixture(id: string, data: any, userId: string = 'SYSTEM') {
    const fixture = await this.prisma.fixture.update({ where: { id }, data });
    await this.audit.logAction(fixture.id, 'FIXTURE', 'UPDATE', userId, fixture);
    return fixture;
  }
}

