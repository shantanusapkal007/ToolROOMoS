import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private prisma: PrismaService) {}

  // Run every day at midnight (or every minute for demo: CronExpression.EVERY_MINUTE)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkApproachingDeliveryTargets() {
    this.logger.log('Running daily check for approaching delivery targets...');

    // Find 3 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);

    try {
      // Find all projects that are not CLOSED or DISPATCHED and are within 3 days of delivery
      const projects = await this.prisma.project.findMany({
        where: {
          currentStage: {
            notIn: ['DISPATCHED', 'CLOSED']
          },
          targetDeliveryDate: {
            lte: targetDate,
            not: null
          }
        }
      });

      for (const project of projects) {
        if (!project.targetDeliveryDate) continue;

        // Log a system activity as an alert
        await this.prisma.projectActivity.create({
          data: {
            projectId: project.id,
            action: 'DELIVERY_ALERT',
            description: `System Alert: Target delivery date (${project.targetDeliveryDate.toDateString()}) is approaching rapidly. Current Stage: ${project.currentStage}.`,
            performedBy: 'SYSTEM',
          }
        });
        this.logger.warn(`Alert generated for Project ${project.projectNumber}`);
      }

    } catch (err) {
      this.logger.error('Failed to run delivery target cron', err);
    }
  }
}
