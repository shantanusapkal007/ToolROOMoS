import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role || 'PRODUCTION',
        primaryPlantId: data.primaryPlantId,
        hourlyRate: data.hourlyRate !== undefined ? Number(data.hourlyRate) : 0,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        primaryPlantId: true,
        status: true,
        hourlyRate: true,
      }
    });
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, search, status, primaryPlantId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (primaryPlantId) where.primaryPlantId = primaryPlantId;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          primaryPlantId: true,
          status: true,
          hourlyRate: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUniqueOrThrow({ where: { id } });
      const oldRate = existingUser.hourlyRate;
      const newRate = data.hourlyRate !== undefined ? Number(data.hourlyRate) : undefined;

      const updateData: any = { ...data };
      if (data.password) {
        updateData.passwordHash = await bcrypt.hash(data.password, 10);
        delete updateData.password;
      }

      const updated = await tx.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          primaryPlantId: true,
          status: true,
          hourlyRate: true,
        }
      });

      if (newRate !== undefined && Number(oldRate) !== Number(newRate)) {
        await tx.costRateHistory.create({
          data: {
            entityType: 'USER',
            entityId: id,
            oldRate,
            newRate,
            reason: 'User hourly rate updated',
            recordedBy: 'SYSTEM',
          },
        });
      }

      return updated;
    });
  }
}
