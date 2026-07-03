import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMaterialDto, userId?: string) {
    return this.prisma.material.create({
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
    materialCategory?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.materialCategory) where.materialCategory = query.materialCategory;
    if (query.search) {
      where.OR = [
        { materialGrade: { contains: query.search, mode: 'insensitive' } },
        { materialCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { shape: true },
      }),
      this.prisma.material.count({ where }),
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
    return this.prisma.material.findUniqueOrThrow({
      where: { id },
      include: { shape: true },
    });
  }

  async update(id: string, dto: UpdateMaterialDto, userId?: string) {
    return this.prisma.material.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async softDelete(id: string, userId?: string) {
    return this.prisma.material.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedBy: userId,
      },
    });
  }
}
