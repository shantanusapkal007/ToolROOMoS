import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { ClsService } from 'nestjs-cls';
import { CacheEngine } from '../../platform/cache.engine';
import { AuditEngine } from '../../platform/audit.engine';
import { EventBus } from '../../platform/event.bus';

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly cache: CacheEngine,
    private readonly audit: AuditEngine,
    private readonly eventBus: EventBus
  ) {}

  async create(dto: CreateVendorDto) {
    const userId = this.cls.get('userId') || 'SYSTEM';
    let { companyId, ...rest } = dto;
    
    if (!companyId) {
      const defaultCompany = await this.prisma.company.findFirst();
      if (!defaultCompany) {
        throw new BadRequestException('System configuration error: No company found to attach vendor to.');
      }
      companyId = defaultCompany.id;
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        ...rest,
        companyId,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.audit.logAction(vendor.id, 'VENDOR', 'CREATE', vendor);
    this.eventBus.emit('Vendor.Created', { id: vendor.id });

    return vendor;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vendorType?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.vendorType) where.vendorType = query.vendorType as any;
    if (query.search) {
      where.OR = [
        { vendorName: { contains: query.search, mode: 'insensitive' } },
        { vendorCode: { contains: query.search, mode: 'insensitive' } },
        { contactPerson: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `vendors:list:${JSON.stringify(query)}`;

    return this.cache.getOrSet(cacheKey, async () => {
      const [data, total] = await Promise.all([
        this.prisma.vendor.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.vendor.count({ where }),
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
    }, 600);
  }

  async findOne(id: string) {
    return this.cache.getOrSet(`vendors:${id}`, async () => {
      return this.prisma.vendor.findUniqueOrThrow({
        where: { id },
      });
    }, 3600);
  }

  async update(id: string, dto: UpdateVendorDto) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });

    await this.audit.logAction(vendor.id, 'VENDOR', 'UPDATE', vendor);
    this.eventBus.emit('Vendor.Updated', { id: vendor.id });
    await this.cache.del(`vendors:${id}`);

    return vendor;
  }

  async softDelete(id: string) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedBy: userId,
      },
    });

    await this.audit.logAction(vendor.id, 'VENDOR', 'DELETE', vendor);
    this.eventBus.emit('Vendor.Deleted', { id: vendor.id });
    await this.cache.del(`vendors:${id}`);

    return vendor;
  }
}
