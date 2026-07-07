import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

/**
 * CustomersService
 * 
 * Business Layer for Customer Master Data.
 * Contains all database interactions for Customers.
 * No HTTP logic — only pure business operations.
 */
@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, userId?: string) {
    let { companyId, ...rest } = dto;
    
    if (!companyId) {
      const defaultCompany = await this.prisma.company.findFirst();
      if (!defaultCompany) {
        throw new BadRequestException('System configuration error: No company found to attach customer to.');
      }
      companyId = defaultCompany.id;
    }

    return this.prisma.customer.create({
      data: {
        ...rest,
        companyId,
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
  }

  async findOne(id: string) {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id },
      include: { projects: true },
    });
  }

  async update(id: string, dto: UpdateCustomerDto, userId?: string) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async softDelete(id: string, userId?: string) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedBy: userId,
      },
    });
  }
}
