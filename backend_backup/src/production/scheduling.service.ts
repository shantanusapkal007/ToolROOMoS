import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Schedule a job card by mapping estimated hours against machine capacity
   */
  async scheduleJobCard(data: CreateScheduleDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const jobCard = await tx.jobCard.findUnique({
        where: { id: data.jobCardId },
        include: { routingOperation: true }
      });

      if (!jobCard) throw new Error('Job Card not found');

      // Calculate end time based on estimated hours
      const estHours = Number(jobCard.routingOperation.estimatedHours);
      const startTime = new Date(data.scheduledStartTime);
      const endTime = new Date(startTime.getTime() + estHours * 60 * 60 * 1000);

      const schedule = await tx.productionSchedule.create({
        data: {
          projectId: jobCard.projectId,
          jobCardId: jobCard.id,
          machineId: data.machineId,
          scheduledDate: startTime,
          scheduledStartTime: startTime,
          scheduledEndTime: endTime,
          estimatedHours: estHours,
          status: 'SCHEDULED'
        }
      });

      await tx.jobCard.update({
        where: { id: jobCard.id },
        data: { status: 'SCHEDULED', machineId: data.machineId }
      });

      await tx.projectActivity.create({
        data: {
          projectId: jobCard.projectId,
          action: 'JOB_CARD_SCHEDULED',
          description: `Job Card for Operation ${jobCard.routingOperationId} scheduled on Machine ${data.machineId} for ${startTime.toISOString()}`,
          performedBy: userId
        }
      });

      return schedule;
    });
  }

  /**
   * Fetch all schedules for the Gantt Chart
   */
  async getSchedules(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate && endDate) {
      where.scheduledDate = {
        gte: startDate,
        lte: endDate
      };
    }

    return this.prisma.productionSchedule.findMany({
      where,
      include: {
        project: { select: { projectNumber: true, partName: true } },
        jobCard: { include: { routingOperation: { include: { operation: true } } } },
        machine: { select: { machineName: true } }
      },
      orderBy: { scheduledStartTime: 'asc' }
    });
  }
}
