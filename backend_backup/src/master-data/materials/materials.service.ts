import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { ClsService } from 'nestjs-cls';
import { CacheEngine } from '../../platform/cache.engine';
import { AuditEngine } from '../../platform/audit.engine';
import { EventBus } from '../../platform/event.bus';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly cache: CacheEngine,
    private readonly audit: AuditEngine,
    private readonly eventBus: EventBus
  ) {}

  async create(dto: CreateMaterialDto) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const material = await this.prisma.material.create({
      data: {
        ...dto,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.audit.logAction(material.id, 'MATERIAL', 'CREATE', material);
    this.eventBus.emit('Material.Created', { id: material.id });
    
    return material;
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

    // Cache the specific query
    const cacheKey = `materials:list:${JSON.stringify(query)}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
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
    }, 600); // 10 minutes
  }

  async findOne(id: string) {
    return this.cache.getOrSet(`materials:${id}`, async () => {
      return this.prisma.material.findUniqueOrThrow({
        where: { id },
        include: { shape: true },
      });
    }, 3600);
  }

  async update(id: string, dto: UpdateMaterialDto) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const material = await this.prisma.material.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });

    await this.audit.logAction(material.id, 'MATERIAL', 'UPDATE', material);
    this.eventBus.emit('Material.Updated', { id: material.id });
    await this.cache.del(`materials:${id}`);

    return material;
  }

  async softDelete(id: string) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const material = await this.prisma.material.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedBy: userId,
      },
    });

    await this.audit.logAction(material.id, 'MATERIAL', 'DELETE', material);
    this.eventBus.emit('Material.Deleted', { id: material.id });
    await this.cache.del(`materials:${id}`);

    return material;
  }
}
