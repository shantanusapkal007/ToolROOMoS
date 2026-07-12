import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { ClsService } from 'nestjs-cls';
import { CacheEngine } from '../../platform/cache.engine';
import { AuditEngine } from '../../platform/audit.engine';
import { EventBus } from '../../platform/event.bus';

@Injectable()
export class MachinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly cache: CacheEngine,
    private readonly audit: AuditEngine,
    private readonly eventBus: EventBus
  ) {}

  async create(dto: CreateMachineDto) {
    const userId = this.cls.get('userId') || 'SYSTEM';
    const data: any = { ...dto };
    if (data.installationDate) {
      data.installationDate = new Date(data.installationDate);
    }
    
    const machine = await this.prisma.machine.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.audit.logAction(machine.id, 'MACHINE', 'CREATE', machine);
    this.eventBus.emit('Machine.Created', { id: machine.id });

    return machine;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    machineType?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.machineType) where.machineType = query.machineType;
    if (query.search) {
      where.OR = [
        { machineName: { contains: query.search, mode: 'insensitive' } },
        { machineCode: { contains: query.search, mode: 'insensitive' } },
        { machineType: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `machines:list:${JSON.stringify(query)}`;

    return this.cache.getOrSet(cacheKey, async () => {
      const [data, total] = await Promise.all([
        this.prisma.machine.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { department: true, plant: true },
        }),
        this.prisma.machine.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }, 600); // 10 minutes
  }

  async findOne(id: string) {
    return this.cache.getOrSet(`machines:${id}`, async () => {
      return this.prisma.machine.findUniqueOrThrow({
        where: { id },
        include: { department: true, plant: true },
      });
    }, 3600);
  }

  async update(id: string, dto: UpdateMachineDto) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const machine = await this.prisma.$transaction(async (tx) => {
      const machineRecord = await tx.machine.findUniqueOrThrow({ where: { id } });
      const oldRate = machineRecord.hourlyRate;
      const newRate = dto.hourlyRate !== undefined ? Number(dto.hourlyRate) : undefined;

      const data: any = { ...dto };
      if (data.installationDate) {
        data.installationDate = new Date(data.installationDate);
      }

      const updated = await tx.machine.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
      });

      if (newRate !== undefined && Number(oldRate) !== Number(newRate)) {
        await tx.costRateHistory.create({
          data: {
            entityType: 'MACHINE',
            entityId: id,
            oldRate,
            newRate,
            reason: 'Machine hourly rate updated',
            recordedBy: userId,
          },
        });
      }

      return updated;
    });

    await this.audit.logAction(machine.id, 'MACHINE', 'UPDATE', machine);
    this.eventBus.emit('Machine.Updated', { id: machine.id });
    await this.cache.del(`machines:${id}`);

    return machine;
  }

  async softDelete(id: string) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const machine = await this.prisma.machine.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedBy: userId,
      },
    });

    await this.audit.logAction(machine.id, 'MACHINE', 'DELETE', machine);
    this.eventBus.emit('Machine.Deleted', { id: machine.id });
    await this.cache.del(`machines:${id}`);

    return machine;
  }
}
