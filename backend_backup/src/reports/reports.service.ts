import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    // 1. Total Revenue
    const costSummaries = await this.prisma.projectCostSummary.findMany({
      select: { revenue: true },
    });
    const totalRevenue = costSummaries.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);

    // 2. Active Projects
    const activeProjectsCount = await this.prisma.project.count({
      where: {
        currentStage: {
          notIn: ['CLOSED', 'CANCELLED', 'PAYMENT_PENDING'],
        },
      },
    });

    // 3. Inventory Value
    const inventoryBatches = await this.prisma.inventoryBatch.findMany({
      where: { status: 'AVAILABLE', currentQty: { gt: 0 } },
      select: { currentQty: true, unitCost: true },
    });
    const inventoryValue = inventoryBatches.reduce((sum, item) => {
      return sum + (Number(item.currentQty) || 0) * (Number(item.unitCost) || 0);
    }, 0);

    // 4. Production Yield
    const inspections = await this.prisma.inspectionHeader.findMany({
      select: { inspectedQty: true, passedQty: true },
    });
    let totalInspected = 0;
    let totalPassed = 0;
    for (const ins of inspections) {
      totalInspected += (Number(ins.inspectedQty) || 0);
      totalPassed += (Number(ins.passedQty) || 0);
    }
    const productionYield = totalInspected > 0 ? ((totalPassed / totalInspected) * 100).toFixed(1) : 0;

    // 5. Production vs Procurement Costs (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const costEvents = await this.prisma.projectCostEvent.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
        costType: { in: ['MATERIAL_CONSUMPTION', 'MACHINE_COST', 'LABOUR_COST', 'OUTSIDE_PROCESS'] }
      },
      select: {
        costType: true,
        amount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const monthlyCosts: Record<string, any> = {};
    for (const event of costEvents) {
      const date = new Date(event.createdAt);
      const monthYear = date.toLocaleString('default', { month: 'short' });
      if (!monthlyCosts[monthYear]) {
        monthlyCosts[monthYear] = { month: monthYear, procurement: 0, production: 0 };
      }
      
      const amt = Number(event.amount) || 0;
      if (event.costType === 'MATERIAL_CONSUMPTION') {
        monthlyCosts[monthYear].procurement += amt;
      } else {
        monthlyCosts[monthYear].production += amt;
      }
    }

    const costTrends = Object.values(monthlyCosts);

    // 6. Machine Utilization
    const msdrs = await this.prisma.msdrOperation.findMany({
      select: {
        msdrHeader: { select: { machine: { select: { machineType: true } } } },
        runningHours: true
      }
    });

    const utilizationMap: Record<string, any> = {};
    for (const report of msdrs) {
      const type = report.msdrHeader?.machine?.machineType || 'OTHER';
      if (!utilizationMap[type]) {
        utilizationMap[type] = { type, hours: 0 };
      }
      utilizationMap[type].hours += Number(report.runningHours) || 0;
    }
    
    // Assume 160 hours standard per machine per month
    const machineUtilization = Object.values(utilizationMap).map((m: any) => ({
      name: m.type,
      percent: Math.min(Math.round((m.hours / 160) * 100), 100), // Cap at 100%
    }));

    if (machineUtilization.length === 0) {
      machineUtilization.push({ name: 'CNC Milling', percent: 0 });
      machineUtilization.push({ name: 'Laser Cutter', percent: 0 });
    }

    return {
      totalRevenue,
      activeProjectsCount,
      inventoryValue,
      productionYield,
      costTrends,
      machineUtilization
    };
  }

  // ─── On-Time Delivery KPI ─────────────────────────────────────────

  async getOnTimeDeliveryKpi() {
    const deliveredProjects = await this.prisma.project.findMany({
      where: {
        currentStage: { in: ['DISPATCHED', 'CLOSED'] },
        targetDeliveryDate: { not: null },
        actualDeliveryDate: { not: null },
      },
      select: { id: true, projectNumber: true, partName: true, targetDeliveryDate: true, actualDeliveryDate: true },
    });

    let onTime = 0;
    let delayed = 0;
    const details: any[] = [];

    for (const p of deliveredProjects) {
      const target = new Date(p.targetDeliveryDate!);
      const actual = new Date(p.actualDeliveryDate!);
      const isOnTime = actual <= target;
      if (isOnTime) onTime++; else delayed++;
      details.push({
        projectNumber: p.projectNumber,
        partName: p.partName,
        target: p.targetDeliveryDate,
        actual: p.actualDeliveryDate,
        isOnTime,
        delayDays: isOnTime ? 0 : Math.ceil((actual.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)),
      });
    }

    const total = onTime + delayed;
    return {
      total,
      onTime,
      delayed,
      onTimePercent: total > 0 ? Number(((onTime / total) * 100).toFixed(1)) : 100,
      details,
    };
  }

  // ─── WIP Aging Analysis ───────────────────────────────────────────

  async getWipAgingAnalysis() {
    const wipEntries = await this.prisma.wipLedger.findMany({
      where: { status: 'IN_PROCESS' },
      include: {
        project: { select: { projectNumber: true, partName: true } },
        material: { select: { materialCode: true } },
      },
    });

    const now = new Date();
    const aging = wipEntries.map(entry => {
      const ageDays = Math.ceil((now.getTime() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const totalCost = Number(entry.accruedMaterialCost) + Number(entry.accruedMachineCost) + Number(entry.accruedLabourCost);
      return {
        projectNumber: entry.project?.projectNumber,
        partName: entry.project?.partName,
        materialCode: entry.material?.materialCode,
        qtyInWip: Number(entry.qtyInWip),
        totalCost,
        ageDays,
        bucket: ageDays <= 7 ? '0-7 days' : ageDays <= 30 ? '8-30 days' : ageDays <= 60 ? '31-60 days' : '60+ days',
      };
    });

    return { totalWipItems: aging.length, aging };
  }

  // ─── Receivables Aging ────────────────────────────────────────────

  async getReceivablesAging() {
    const unpaid = await this.prisma.invoiceHeader.findMany({
      where: { paymentStatus: { not: 'PAID' } },
      include: {
        dispatchNote: { include: { customer: true } },
      },
    });

    const now = new Date();
    const aging = unpaid.map(inv => {
      const ageDays = Math.ceil((now.getTime() - inv.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const outstanding = Number(inv.totalAmount) - Number(inv.amountPaid);
      return {
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.dispatchNote?.customer?.companyName || 'Unknown',
        totalAmount: Number(inv.totalAmount),
        amountPaid: Number(inv.amountPaid),
        outstanding,
        ageDays,
        bucket: ageDays <= 30 ? '0-30 days' : ageDays <= 60 ? '31-60 days' : ageDays <= 90 ? '61-90 days' : '90+ days',
      };
    });

    const totalOutstanding = aging.reduce((acc, a) => acc + a.outstanding, 0);
    return { totalOutstanding, count: aging.length, aging };
  }
}
