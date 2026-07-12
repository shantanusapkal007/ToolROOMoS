// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createRecord(dto: any, userId?: string) {
    return this.prisma.$transaction(async (tx: any) => {
      // Create maintenance record
      const record = await tx.machineMaintenance.create({
        data: {
          machineId: dto.machineId,
          maintenanceType: dto.maintenanceType,
          vendorId: dto.vendorId,
          cost: dto.cost || 0,
          nextServiceDate: dto.nextServiceDate ? new Date(dto.nextServiceDate) : null,
          remarks: dto.remarks,
          customFields: dto.customFields,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // AUTOMATION: Financial Integration
      if (Number(dto.cost || 0) > 0) {
        // Post expense to Accounts
        await tx.accountEntry.create({
          data: {
            entryDate: new Date(),
            entryType: 'DEBIT',
            category: 'MAINTENANCE',
            referenceDocType: 'MACHINE_MAINTENANCE',
            referenceDocId: record.id,
            amount: Number(dto.cost),
            description: `Maintenance expense for machine ${dto.machineId}`,
            createdBy: userId,
          }
        });
      }

      return record;
    });
  }

  async getRecords(machineId?: string) {
    if (machineId) {
      return this.prisma.machineMaintenance.findMany({
        where: { machineId },
        include: { machine: true },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.machineMaintenance.findMany({
      include: { machine: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

