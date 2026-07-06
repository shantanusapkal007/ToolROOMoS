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
    const msdrs = await this.prisma.machineShopDailyReport.findMany({
      select: {
        machine: { select: { machineType: true } },
        actualMachineHours: true
      }
    });

    const utilizationMap: Record<string, any> = {};
    for (const report of msdrs) {
      const type = report.machine?.machineType || 'OTHER';
      if (!utilizationMap[type]) {
        utilizationMap[type] = { type, hours: 0 };
      }
      utilizationMap[type].hours += Number(report.actualMachineHours) || 0;
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
}
