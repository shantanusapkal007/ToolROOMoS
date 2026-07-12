// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBus } from '../../platform/event.bus';
import { AuditEngine } from '../../platform/audit.engine';

@Injectable()
export class CommercialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
  ) {}

  // ================= TAX MASTER =================
  async getTaxes() {
    return this.prisma.taxMaster.findMany();
  }

  async createTax(data: any, userId: string = 'SYSTEM') {
    const tax = await this.prisma.taxMaster.create({ data });
    await this.audit.logAction(tax.id, 'TAX_MASTER', 'CREATE', userId, tax);
    return tax;
  }

  async updateTax(id: string, data: any, userId: string = 'SYSTEM') {
    const tax = await this.prisma.taxMaster.update({ where: { id }, data });
    await this.audit.logAction(tax.id, 'TAX_MASTER', 'UPDATE', userId, tax);
    return tax;
  }

  // ================= CURRENCY =================
  async getCurrencies() {
    return this.prisma.currencyMaster.findMany();
  }

  async createCurrency(data: any, userId: string = 'SYSTEM') {
    const currency = await this.prisma.currencyMaster.create({ data });
    await this.audit.logAction(currency.id, 'CURRENCY_MASTER', 'CREATE', userId, currency);
    return currency;
  }

  async updateCurrency(id: string, data: any, userId: string = 'SYSTEM') {
    const currency = await this.prisma.currencyMaster.update({ where: { id }, data });
    await this.audit.logAction(currency.id, 'CURRENCY_MASTER', 'UPDATE', userId, currency);
    return currency;
  }

  // ================= UOM =================
  async getUoms() {
    return this.prisma.uom.findMany();
  }

  async createUom(data: any, userId: string = 'SYSTEM') {
    const uom = await this.prisma.uom.create({ data });
    await this.audit.logAction(uom.id, 'UOM', 'CREATE', userId, uom);
    return uom;
  }

  async updateUom(id: string, data: any, userId: string = 'SYSTEM') {
    const uom = await this.prisma.uom.update({ where: { id }, data });
    await this.audit.logAction(uom.id, 'UOM', 'UPDATE', userId, uom);
    return uom;
  }

  // ================= PAYMENT TERMS =================
  async getPaymentTerms() {
    return this.prisma.paymentTerm.findMany();
  }

  async createPaymentTerm(data: any, userId: string = 'SYSTEM') {
    const pt = await this.prisma.paymentTerm.create({ data });
    await this.audit.logAction(pt.id, 'PAYMENT_TERM', 'CREATE', userId, pt);
    return pt;
  }

  async updatePaymentTerm(id: string, data: any, userId: string = 'SYSTEM') {
    const pt = await this.prisma.paymentTerm.update({ where: { id }, data });
    await this.audit.logAction(pt.id, 'PAYMENT_TERM', 'UPDATE', userId, pt);
    return pt;
  }
}

