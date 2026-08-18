import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Global finance dashboard — P&L overview, cost aggregates, project count metrics
   */
  async getFinanceDashboard() {
    // 1. Revenue from all project cost summaries
    const costSummaries = await this.prisma.projectCostSummary.findMany();

    let totalRevenue = 0;
    let totalMaterialCost = 0;
    let totalLabourCost = 0;
    let totalMachineCost = 0;
    let totalOutsideProcessCost = 0;
    let totalInspectionCost = 0;
    let totalPackingCost = 0;
    let totalDispatchCost = 0;
    let totalCost = 0;

    for (const cs of costSummaries) {
      totalRevenue += Number(cs.revenue || 0);
      const matCost = Number(cs.materialConsumptionCost || 0) > 0 
        ? Number(cs.materialConsumptionCost) 
        : Number(cs.actualMaterialCost || 0);
      totalMaterialCost += matCost;
      totalLabourCost += Number(cs.labourCost || 0);
      totalMachineCost += Number(cs.machineCost || 0);
      totalOutsideProcessCost += Number(cs.outsideProcessCost || 0);
      totalInspectionCost += Number(cs.inspectionCost || 0);
      totalPackingCost += Number(cs.packingCost || 0);
      totalDispatchCost += Number(cs.dispatchCost || 0);
      totalCost += Number(cs.totalCost || 0);
    }

    const grossProfit = totalRevenue - totalCost;
    const netMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // 2. Project counts
    const activeProjectsCount = await this.prisma.project.count({
      where: { currentStage: { notIn: ['CLOSED', 'CANCELLED'] } },
    });
    const totalProjectsCount = await this.prisma.project.count();
    const completedProjectsCount = await this.prisma.project.count({
      where: { currentStage: 'CLOSED' },
    });

    // 3. Outstanding invoices
    const outstandingInvoices = await this.prisma.invoiceHeader.findMany({
      where: { paymentStatus: { in: ['PENDING', 'PARTIAL'] } },
      select: { totalAmount: true, amountPaid: true },
    });
    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => 
      sum + Number(inv.totalAmount) - Number(inv.amountPaid), 0);

    // 4. Total employee count
    const totalEmployees = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      netMargin: Math.round(netMargin * 10) / 10,
      totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
      totalLabourCost: Math.round(totalLabourCost * 100) / 100,
      totalMachineCost: Math.round(totalMachineCost * 100) / 100,
      totalOutsideProcessCost: Math.round(totalOutsideProcessCost * 100) / 100,
      totalInspectionCost: Math.round(totalInspectionCost * 100) / 100,
      totalPackingCost: Math.round(totalPackingCost * 100) / 100,
      totalDispatchCost: Math.round(totalDispatchCost * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      activeProjectsCount,
      totalProjectsCount,
      completedProjectsCount,
      totalEmployees,
    };
  }

  /**
   * Labour cost analytics — breakdown by department, time period
   */
  async getLabourCostAnalytics(monthYear?: string) {
    const targetMonth = monthYear || new Date().toISOString().substring(0, 7);
    const [year, month] = targetMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    // Labour cost events in the period
    const labourEvents = await this.prisma.projectCostEvent.findMany({
      where: {
        costType: 'LABOUR_COST',
        createdAt: { gte: start, lte: end },
      },
      select: {
        amount: true,
        description: true,
        createdAt: true,
        project: {
          select: { id: true, projectNumber: true, partName: true },
        },
      },
    });

    // Machine cost events
    const machineEvents = await this.prisma.projectCostEvent.findMany({
      where: {
        costType: 'MACHINE_COST',
        createdAt: { gte: start, lte: end },
      },
      select: {
        amount: true,
        createdAt: true,
        project: {
          select: { id: true, projectNumber: true, partName: true },
        },
      },
    });

    // Aggregate by department from MSDR reports
    const employees = await this.prisma.employee.findMany({
      include: { department: true },
    });
    const deptLabourMap = new Map<string, { name: string; labourCost: number; machineHours: number }>();
    for (const emp of employees) {
      const deptName = emp.department?.departmentName || 'Shopfloor';
      if (!deptLabourMap.has(deptName)) {
        deptLabourMap.set(deptName, { name: deptName, labourCost: 0, machineHours: 0 });
      }
    }

    const msdrHeaders = await this.prisma.msdrHeader.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      include: {
        employee: {
          include: { department: true },
        },
        operations: true,
      },
    });

    for (const header of msdrHeaders) {
      const deptName = header.employee?.department?.departmentName || 'Shopfloor';
      if (!deptLabourMap.has(deptName)) {
        deptLabourMap.set(deptName, { name: deptName, labourCost: 0, machineHours: 0 });
      }
      const dept = deptLabourMap.get(deptName)!;
      const empRate = Number((header.employee as any)?.hourlyRate || 0);
      for (const op of header.operations) {
        const hrs = Number(op.runningHours || 0);
        dept.machineHours += hrs;
        dept.labourCost += hrs * empRate;
      }
    }

    // Aggregate by day for trend
    const dailyTrend = new Map<string, { date: string; labourCost: number; machineCost: number }>();
    for (const evt of labourEvents) {
      const day = new Date(evt.createdAt).toISOString().split('T')[0];
      if (!dailyTrend.has(day)) {
        dailyTrend.set(day, { date: day, labourCost: 0, machineCost: 0 });
      }
      dailyTrend.get(day)!.labourCost += Number(evt.amount);
    }

    for (const evt of machineEvents) {
      const day = new Date(evt.createdAt).toISOString().split('T')[0];
      if (!dailyTrend.has(day)) {
        dailyTrend.set(day, { date: day, labourCost: 0, machineCost: 0 });
      }
      dailyTrend.get(day)!.machineCost += Number(evt.amount);
    }

    const totalLabour = labourEvents.reduce((s, e) => s + Number(e.amount), 0);
    const totalMachine = machineEvents.reduce((s, e) => s + Number(e.amount), 0);

    return {
      monthYear: targetMonth,
      totalLabourCost: Math.round(totalLabour * 100) / 100,
      totalMachineCost: Math.round(totalMachine * 100) / 100,
      labourEventCount: labourEvents.length,
      machineEventCount: machineEvents.length,
      dailyTrend: Array.from(dailyTrend.values()).sort((a, b) => a.date.localeCompare(b.date)),
      departmentBreakdown: Array.from(deptLabourMap.values()).map(d => ({
        name: d.name,
        labourCost: Math.round(d.labourCost * 100) / 100,
        machineHours: Math.round(d.machineHours * 100) / 100,
      })),
    };
  }

  /**
   * Project profitability — All projects with revenue, cost, profit, margin
   */
  async getProjectProfitability() {
    const projects = await this.prisma.project.findMany({
      select: {
        id: true,
        projectNumber: true,
        partName: true,
        currentStage: true,
        customer: { select: { companyName: true } },
        projectCostSummary: true,
        invoiceHeaders: {
          select: { totalAmount: true, paymentStatus: true, amountPaid: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return projects.map(p => {
      const cs = p.projectCostSummary;
      const revenue = cs ? Number(cs.revenue || 0) : 0;
      const totalCost = cs ? Number(cs.totalCost || 0) : 0;
      const materialCost = cs 
        ? (Number(cs.materialConsumptionCost || 0) > 0 
            ? Number(cs.materialConsumptionCost) 
            : Number(cs.actualMaterialCost || 0)) 
        : 0;
      const labourCost = cs ? Number(cs.labourCost || 0) : 0;
      const machineCost = cs ? Number(cs.machineCost || 0) : 0;
      const outsideProcessCost = cs ? Number(cs.outsideProcessCost || 0) : 0;
      const profit = revenue - totalCost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      const totalInvoiced = p.invoiceHeaders.reduce((s, inv) => s + Number(inv.totalAmount), 0);
      const totalPaid = p.invoiceHeaders.reduce((s, inv) => s + Number(inv.amountPaid), 0);

      return {
        id: p.id,
        projectNumber: p.projectNumber,
        partName: p.partName,
        customerName: p.customer?.companyName || 'N/A',
        currentStage: p.currentStage,
        revenue: Math.round(revenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        materialCost: Math.round(materialCost * 100) / 100,
        labourCost: Math.round(labourCost * 100) / 100,
        machineCost: Math.round(machineCost * 100) / 100,
        outsideProcessCost: Math.round(outsideProcessCost * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        margin: Math.round(margin * 10) / 10,
        totalInvoiced: Math.round(totalInvoiced * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        outstanding: Math.round((totalInvoiced - totalPaid) * 100) / 100,
      };
    });
  }

  /**
   * Monthly payroll vs revenue trend for the last N months
   */
  async getPayrollVsRevenue(months: number = 6) {
    const result: { month: string; payroll: number; revenue: number; labourCost: number; machineCost: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });

      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month, 0, 23, 59, 59, 999);

      // Payroll: sum of actual salaries
      const salaries = await (this.prisma as any).employeeMonthlySalary.findMany({
        where: { monthYear: monthStr },
      });
      const payrollTotal = salaries.reduce((sum: number, s: any) => sum + Number(s.actualSalary || 0), 0);

      // If no saved salaries, estimate from employee hourly rates × 160 hrs
      let payroll = payrollTotal;
      if (payroll === 0) {
        const activeEmployees = await this.prisma.employee.findMany({
          where: { status: 'ACTIVE' },
          select: { hourlyRate: true },
        });
        payroll = activeEmployees.reduce((s, e) => s + Number(e.hourlyRate || 0) * 160, 0);
      }

      // Revenue: invoices created in this period
      const invoices = await this.prisma.invoiceHeader.findMany({
        where: { invoiceDate: { gte: start, lte: end } },
        select: { subtotal: true },
      });
      const revenue = invoices.reduce((s, inv) => s + Number(inv.subtotal || 0), 0);

      // Labour and Machine costs booked
      const costEvents = await this.prisma.projectCostEvent.findMany({
        where: {
          costType: { in: ['LABOUR_COST', 'MACHINE_COST'] },
          createdAt: { gte: start, lte: end },
        },
        select: { costType: true, amount: true },
      });

      const labourCost = costEvents
        .filter(e => e.costType === 'LABOUR_COST')
        .reduce((s, e) => s + Number(e.amount), 0);
      const machineCost = costEvents
        .filter(e => e.costType === 'MACHINE_COST')
        .reduce((s, e) => s + Number(e.amount), 0);

      result.push({
        month: monthLabel,
        payroll: Math.round(payroll * 100) / 100,
        revenue: Math.round(revenue * 100) / 100,
        labourCost: Math.round(labourCost * 100) / 100,
        machineCost: Math.round(machineCost * 100) / 100,
      });
    }

    return result;
  }

  /**
   * Cost breakdown for pie/donut chart
   */
  async getCostBreakdown() {
    const summaries = await this.prisma.projectCostSummary.findMany();

    let material = 0;
    let labour = 0;
    let machine = 0;
    let outsideProcess = 0;
    let inspection = 0;
    let packing = 0;
    let dispatch = 0;

    for (const cs of summaries) {
      const matCost = Number(cs.materialConsumptionCost || 0) > 0 
        ? Number(cs.materialConsumptionCost) 
        : Number(cs.actualMaterialCost || 0);
      material += matCost;
      labour += Number(cs.labourCost || 0);
      machine += Number(cs.machineCost || 0);
      outsideProcess += Number(cs.outsideProcessCost || 0);
      inspection += Number(cs.inspectionCost || 0);
      packing += Number(cs.packingCost || 0);
      dispatch += Number(cs.dispatchCost || 0);
    }

    const categories = [
      { name: 'Material', value: Math.round(material * 100) / 100, color: '#3b82f6' },
      { name: 'Labour', value: Math.round(labour * 100) / 100, color: '#10b981' },
      { name: 'Machine', value: Math.round(machine * 100) / 100, color: '#8b5cf6' },
      { name: 'Outside Process', value: Math.round(outsideProcess * 100) / 100, color: '#f59e0b' },
      { name: 'Inspection', value: Math.round(inspection * 100) / 100, color: '#ef4444' },
      { name: 'Packing', value: Math.round(packing * 100) / 100, color: '#ec4899' },
      { name: 'Dispatch', value: Math.round(dispatch * 100) / 100, color: '#6366f1' },
    ].filter(c => c.value > 0);

    const total = categories.reduce((s, c) => s + c.value, 0);

    return {
      categories,
      total: Math.round(total * 100) / 100,
    };
  }
}
