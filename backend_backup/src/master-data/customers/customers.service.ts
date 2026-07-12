import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ClsService } from 'nestjs-cls';
import { CacheEngine } from '../../platform/cache.engine';
import { AuditEngine } from '../../platform/audit.engine';
import { EventBus } from '../../platform/event.bus';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly cache: CacheEngine,
    private readonly audit: AuditEngine,
    private readonly eventBus: EventBus
  ) {}

  async create(dto: CreateCustomerDto) {
    const userId = this.cls.get('userId') || 'SYSTEM';
    let { companyId, ...rest } = dto;
    
    if (!companyId) {
      const defaultCompany = await this.prisma.company.findFirst();
      if (!defaultCompany) {
        throw new BadRequestException('System configuration error: No company found to attach customer to.');
      }
      companyId = defaultCompany.id;
    }

    const customer = await this.prisma.customer.create({
      data: {
        ...rest,
        companyId,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.audit.logAction(customer.id, 'CUSTOMER', 'CREATE', customer);
    this.eventBus.emit('Customer.Created', { id: customer.id });

    return customer;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { customerCode: { contains: query.search, mode: 'insensitive' } },
        { contactPerson: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `customers:list:${JSON.stringify(query)}`;

    return this.cache.getOrSet(cacheKey, async () => {
      const [data, total] = await Promise.all([
        this.prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.customer.count({ where }),
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
    return this.cache.getOrSet(`customers:${id}`, async () => {
      return this.prisma.customer.findUniqueOrThrow({
        where: { id },
        include: { projects: true },
      });
    }, 3600);
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });

    await this.audit.logAction(customer.id, 'CUSTOMER', 'UPDATE', customer);
    this.eventBus.emit('Customer.Updated', { id: customer.id });
    await this.cache.del(`customers:${id}`);

    return customer;
  }

  async softDelete(id: string) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedBy: userId,
      },
    });

    await this.audit.logAction(customer.id, 'CUSTOMER', 'DELETE', customer);
    this.eventBus.emit('Customer.Deleted', { id: customer.id });
    await this.cache.del(`customers:${id}`);

    return customer;
  }
}
