import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheEngine } from '../../platform/cache.engine';

@Injectable()
export class ProjectDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheEngine
  ) {}

  async getDashboardMetrics() {
    const [
      revenueData,
      machineData,
      productionData,
      inventoryData,
      summaryCards,
      projectSummary
    ] = await Promise.all([
      this.getRevenueMetrics(),
      this.getMachineUtilization(),
      this.getProductionStatus(),
      this.getInventoryStatus(),
      this.getDashboardCards(),
      this.getProjectSummary()
    ]);

    return {
      ...revenueData,
      ...machineData,
      ...productionData,
      ...inventoryData,
      ...summaryCards,
      ...projectSummary,
    };
  }

  // 1. Revenue (TTL: 15 min = 900s)
  private async getRevenueMetrics() {
    return this.cache.getOrSet('dashboard:metrics:revenue', async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const mtdInvoices = await this.prisma.invoiceHeader.findMany({
        where: { createdAt: { gte: firstDayOfMonth } }
      });
      const mtdRevenue = mtdInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
      
      const openInvoicesList = await this.prisma.invoiceHeader.findMany({
        where: { paymentStatus: { not: 'PAID' } }
      });
      const openInvoices = openInvoicesList.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

      // Revenue History - group by month for the last 11 months
      const allInvoices = await this.prisma.invoiceHeader.findMany({
        select: { invoiceDate: true, totalAmount: true }
      });
      const revenueHistory = new Array(11).fill(0);
      allInvoices.forEach(inv => {
        if (inv.invoiceDate) {
          const monthDiff = (new Date().getFullYear() - inv.invoiceDate.getFullYear()) * 12 + (new Date().getMonth() - inv.invoiceDate.getMonth());
          if (monthDiff >= 0 && monthDiff < 11) {
             revenueHistory[10 - monthDiff] += Number(inv.totalAmount || 0) / 1000;
          }
        }
      });
      
      const totalProjects = await this.prisma.project.count();
      if (totalProjects > 0 && Math.max(...revenueHistory) === 0) {
         revenueHistory[10] = mtdRevenue / 1000;
      }

      return { mtdRevenue, openInvoices, revenueHistory };
    }, 900);
  }

  // 2. Machine Utilization (TTL: 30 sec = 30s)
  private async getMachineUtilization() {
    return this.cache.getOrSet('dashboard:metrics:machines', async () => {
      const activeJobs = await this.prisma.jobCard.findMany({
        where: { status: 'IN_PROGRESS' },
        select: { machineId: true },
        distinct: ['machineId']
      });
      const activeMachines = activeJobs.filter(j => j.machineId).length;
      const totalMachines = await this.prisma.machine.count();
      const machineLoad = totalMachines > 0 ? Math.round((activeMachines / totalMachines) * 100) : 0;

      return { machineLoad, activeMachines, totalMachines };
    }, 30);
  }

  // 3. Production Status (TTL: 30 sec = 30s)
  private async getProductionStatus() {
    return this.cache.getOrSet('dashboard:metrics:production', async () => {
      const totalProjects = await this.prisma.project.count();
      const delayedProjectsCount = await this.prisma.project.count({
        where: { targetDeliveryDate: { lt: new Date() }, currentStage: { not: 'CLOSED' } }
      });
      const overallYield = totalProjects > 0 ? Math.max(0, 100 - Math.round((delayedProjectsCount / totalProjects) * 100)) : 0;
      
      return { overallYield };
    }, 30);
  }

  // 4. Inventory (TTL: 1 min = 60s)
  private async getInventoryStatus() {
    return this.cache.getOrSet('dashboard:metrics:inventory', async () => {
      // Placeholder for actual inventory aggregates
      const lowStockAlerts = 0; 
      return { lowStockAlerts };
    }, 60);
  }

  // 5. Dashboard Cards (TTL: 5 min = 300s)
  private async getDashboardCards() {
    return this.cache.getOrSet('dashboard:metrics:cards', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentProjects = await this.prisma.project.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
      const olderProjects = await this.prisma.project.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } });
      
      const yieldTrend = olderProjects > 0 ? Number((((recentProjects - olderProjects) / olderProjects) * 10).toFixed(1)) : 0;
      const revenueTrend = olderProjects > 0 ? Number((((recentProjects - olderProjects) / olderProjects) * 100).toFixed(1)) : 0;

      return { yieldTrend, revenueTrend };
    }, 300);
  }

  // 6. Project Summary (TTL: 2 min = 120s)
  private async getProjectSummary() {
    return this.cache.getOrSet('dashboard:metrics:projects', async () => {
      const totalProjects = await this.prisma.project.count();
      return { totalProjects };
    }, 120);
  }
}
