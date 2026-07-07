import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorType } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVendorDto, userId?: string) {
    let { companyId, ...rest } = dto;
    
    if (!companyId) {
      const defaultCompany = await this.prisma.company.findFirst();
      if (!defaultCompany) {
        throw new BadRequestException('System configuration error: No company found to attach vendor to.');
      }
      companyId = defaultCompany.id;
    }

    return this.prisma.vendor.create({
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
    vendorType?: VendorType;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.vendorType) where.vendorType = query.vendorType;
    if (query.search) {
      where.OR = [
        { vendorName: { contains: query.search, mode: 'insensitive' } },
        { vendorCode: { contains: query.search, mode: 'insensitive' } },
        { contactPerson: { contains: query.search, mode: 'insensitive' } },
      ];
    }

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
  }

  async findOne(id: string) {
    return this.prisma.vendor.findUniqueOrThrow({
      where: { id },
      include: { purchaseOrderHeaders: true },
    });
  }

  async update(id: string, dto: UpdateVendorDto, userId?: string) {
    return this.prisma.vendor.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async softDelete(id: string, userId?: string) {
    return this.prisma.vendor.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedBy: userId,
      },
    });
  }
}
