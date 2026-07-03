import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';

@Injectable()
export class MachinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMachineDto, userId?: string) {
    return this.prisma.machine.create({
      data: {
        ...dto,
        createdBy: userId,
        updatedBy: userId,
      },
    });
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
  }

  async findOne(id: string) {
    return this.prisma.machine.findUniqueOrThrow({
      where: { id },
      include: { department: true, plant: true },
    });
  }

  async update(id: string, dto: UpdateMachineDto, userId?: string) {
    return this.prisma.machine.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async softDelete(id: string, userId?: string) {
    return this.prisma.machine.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedBy: userId,
      },
    });
  }
}
