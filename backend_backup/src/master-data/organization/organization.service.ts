// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBus } from '../../platform/event.bus';
import { AuditEngine } from '../../platform/audit.engine';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
  ) {}

  // ================= COMPANY =================

  async getCompanies() {
    return this.prisma.company.findMany();
  }

  async getCompanyById(id: string) {
    return this.prisma.company.findUnique({ where: { id } });
  }

  async createCompany(data: any, userId: string = 'SYSTEM') {
    const company = await this.prisma.company.create({ data });
    await this.audit.logAction(company.id, 'COMPANY', 'CREATE', userId, company);
    this.eventBus.emit('company.created', company);
    return company;
  }

  async updateCompany(id: string, data: any, userId: string = 'SYSTEM') {
    const company = await this.prisma.company.update({ where: { id }, data });
    await this.audit.logAction(company.id, 'COMPANY', 'UPDATE', userId, company);
    return company;
  }

  // ================= PLANT =================

  async getPlants() {
    return this.prisma.plant.findMany({ include: { company: true } });
  }

  async createPlant(data: any, userId: string = 'SYSTEM') {
    const plant = await this.prisma.plant.create({ data });
    await this.audit.logAction(plant.id, 'PLANT', 'CREATE', userId, plant);
    return plant;
  }

  async updatePlant(id: string, data: any, userId: string = 'SYSTEM') {
    const plant = await this.prisma.plant.update({ where: { id }, data });
    await this.audit.logAction(plant.id, 'PLANT', 'UPDATE', userId, plant);
    return plant;
  }

  // ================= DEPARTMENT =================

  async getDepartments() {
    return this.prisma.department.findMany({ include: { plant: true } });
  }

  async createDepartment(data: any, userId: string = 'SYSTEM') {
    const dept = await this.prisma.department.create({ data });
    await this.audit.logAction(dept.id, 'DEPARTMENT', 'CREATE', userId, dept);
    return dept;
  }

  async updateDepartment(id: string, data: any, userId: string = 'SYSTEM') {
    const dept = await this.prisma.department.update({ where: { id }, data });
    await this.audit.logAction(dept.id, 'DEPARTMENT', 'UPDATE', userId, dept);
    return dept;
  }

  // ================= SHIFT =================

  async getShifts() {
    return this.prisma.shift.findMany();
  }

  async createShift(data: any, userId: string = 'SYSTEM') {
    const shift = await this.prisma.shift.create({ data });
    await this.audit.logAction(shift.id, 'SHIFT', 'CREATE', userId, shift);
    return shift;
  }

  async updateShift(id: string, data: any, userId: string = 'SYSTEM') {
    const shift = await this.prisma.shift.update({ where: { id }, data });
    await this.audit.logAction(shift.id, 'SHIFT', 'UPDATE', userId, shift);
    return shift;
  }

  // ================= COST CENTER =================

  async getCostCenters() {
    return this.prisma.costCenter.findMany();
  }

  async createCostCenter(data: any, userId: string = 'SYSTEM') {
    const cc = await this.prisma.costCenter.create({ data });
    await this.audit.logAction(cc.id, 'COST_CENTER', 'CREATE', userId, cc);
    return cc;
  }

  async updateCostCenter(id: string, data: any, userId: string = 'SYSTEM') {
    const cc = await this.prisma.costCenter.update({ where: { id }, data });
    await this.audit.logAction(cc.id, 'COST_CENTER', 'UPDATE', userId, cc);
    return cc;
  }

  // ================= FINANCIAL YEAR =================

  async getFinancialYears() {
    return this.prisma.financialYear.findMany();
  }

  async createFinancialYear(data: any, userId: string = 'SYSTEM') {
    const fy = await this.prisma.financialYear.create({ data });
    await this.audit.logAction(fy.id, 'FINANCIAL_YEAR', 'CREATE', userId, fy);
    return fy;
  }

  async updateFinancialYear(id: string, data: any, userId: string = 'SYSTEM') {
    const fy = await this.prisma.financialYear.update({ where: { id }, data });
    await this.audit.logAction(fy.id, 'FINANCIAL_YEAR', 'UPDATE', userId, fy);
    return fy;
  }
}

