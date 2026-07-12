import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllEmployees() {
    return this.prisma.employee.findMany({
      include: {
        department: true,
        shift: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createEmployee(data: any, userId?: string) {
    return this.prisma.employee.create({
      data: {
        ...data,
        createdBy: userId,
      },
    });
  }

  async updateEmployeeRate(id: string, newRate: number, reason: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findUniqueOrThrow({ where: { id } });
      const oldRate = employee.hourlyRate;

      if (Number(oldRate) === Number(newRate)) {
        throw new BadRequestException('New rate must be different from current rate.');
      }

      const updated = await tx.employee.update({
        where: { id },
        data: {
          hourlyRate: newRate,
          updatedBy: userId,
        },
      });

      await tx.costRateHistory.create({
        data: {
          entityType: 'EMPLOYEE',
          entityId: id,
          oldRate,
          newRate,
          reason,
          recordedBy: userId,
        },
      });

      return updated;
    });
  }

  async getRateHistory(entityType: string, entityId: string) {
    return this.prisma.costRateHistory.findMany({
      where: { entityType, entityId },
      orderBy: { effectiveFrom: 'desc' },
    });
  }
}
