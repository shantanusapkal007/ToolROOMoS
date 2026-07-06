import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WipService } from '../production/wip.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private prisma: PrismaService,
    private wipService: WipService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkApproachingDeliveryTargets() {
    this.logger.log('Running daily check for approaching delivery targets...');

    // Find projects with delivery within 3 days
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);

    // Start of today (midnight) for deduplication window
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    try {
      const projects = await this.prisma.project.findMany({
        where: {
          currentStage: {
            notIn: ['DISPATCHED', 'INVOICED', 'PAYMENT_PENDING', 'CLOSED', 'CANCELLED'],
          },
          targetDeliveryDate: {
            lte: targetDate,
            not: null,
          },
        },
      });

      for (const project of projects) {
        if (!project.targetDeliveryDate) continue;

        // Deduplication: check if we already fired a DELIVERY_ALERT for this project today
        const existingAlert = await this.prisma.projectActivity.findFirst({
          where: {
            projectId: project.id,
            action: 'DELIVERY_ALERT',
            createdAt: { gte: todayStart },
          },
        });

        if (existingAlert) {
          // Already alerted today — skip to prevent duplicate rows
          continue;
        }

        await this.prisma.projectActivity.create({
          data: {
            projectId: project.id,
            action: 'DELIVERY_ALERT',
            description: `System Alert: Target delivery date (${project.targetDeliveryDate.toDateString()}) is approaching. Current Stage: ${project.currentStage}.`,
            performedBy: 'SYSTEM',
          },
        });
        this.logger.warn(`Delivery alert generated for Project ${project.projectNumber}`);
      }
    } catch (err) {
      this.logger.error('Failed to run delivery target cron', err);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyWipValuation() {
    this.logger.log('Running daily WIP valuation snapshot cron...');
    try {
      await this.wipService.snapshotWipValuation();
    } catch (err) {
      this.logger.error('Failed to run WIP valuation cron', err);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyOeeValuation() {
    this.logger.log('Running daily OEE valuation cron...');
    try {
      // 1. Get all machines
      const machines = await this.prisma.machine.findMany();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1); // Start of tomorrow
      
      for (const machine of machines) {
        // 2. Fetch today's MSDRs for this machine
        const msdrs = await this.prisma.machineShopDailyReport.findMany({
          where: {
            machineId: machine.id,
            reportDate: {
              gte: today,
              lt: tomorrow
            }
          }
        });

        if (msdrs.length === 0) continue; // No activity today

        let operatingTime = 0;
        let totalParts = 0;
        let goodParts = 0;

        for (const msdr of msdrs) {
          const cutTime = msdr.cuttingTime ? Number(msdr.cuttingTime) : 0;
          const setupTime = msdr.setupTime ? Number(msdr.setupTime) : 0;
          
          operatingTime += cutTime + setupTime;
          totalParts += (Number(msdr.producedQty) + Number(msdr.scrapQty));
          goodParts += Number(msdr.producedQty);
        }

        const plannedTime = 8; // Standard 8-hour shift fallback. A more robust implementation would fetch the machine calendar.
        
        // 3. Compute OEE Metrics
        const availability = operatingTime / plannedTime;
        // In a real factory, Ideal Cycle Time is needed for Performance. We estimate performance = operatingTime / plannedTime if ideal cycle time is not in MSDR. 
        // For simplicity, we just use a baseline.
        const performance = 0.85; // Static placeholder until Ideal Cycle Time is added to RoutingOperation
        const quality = totalParts > 0 ? goodParts / totalParts : 0;
        
        const oeeScore = availability * performance * quality;

        // 4. Create Log
        await this.prisma.oeeDailyLog.create({
          data: {
            machineId: machine.id,
            logDate: today,
            availabilityScore: availability,
            performanceScore: performance,
            qualityScore: quality,
            oeeScore: oeeScore,
            plannedTime: plannedTime,
            operatingTime: operatingTime,
            totalParts: totalParts,
            goodParts: goodParts
          }
        });
      }
      this.logger.log('OEE valuation completed.');
    } catch (err) {
      this.logger.error('Failed to run OEE valuation cron', err);
    }
  }
}
