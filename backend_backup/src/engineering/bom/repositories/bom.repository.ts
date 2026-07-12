import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, BillOfMaterialHeader, BillOfMaterialItem } from '@prisma/client';

@Injectable()
export class BomRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createHeader(data: Prisma.BillOfMaterialHeaderCreateInput): Promise<BillOfMaterialHeader> {
    return this.prisma.billOfMaterialHeader.create({ data });
  }

  async findHeaderById(id: string, include?: Prisma.BillOfMaterialHeaderInclude): Promise<BillOfMaterialHeader | null> {
    return this.prisma.billOfMaterialHeader.findUnique({
      where: { id },
      include,
    });
  }

  async findHeaderByIdOrThrow(id: string, include?: Prisma.BillOfMaterialHeaderInclude): Promise<BillOfMaterialHeader> {
    return this.prisma.billOfMaterialHeader.findUniqueOrThrow({
      where: { id },
      include,
    });
  }

  async findHeaders(params: {
    skip?: number;
    take?: number;
    where?: Prisma.BillOfMaterialHeaderWhereInput;
    orderBy?: Prisma.BillOfMaterialHeaderOrderByWithRelationInput;
    include?: Prisma.BillOfMaterialHeaderInclude;
  }): Promise<BillOfMaterialHeader[]> {
    return this.prisma.billOfMaterialHeader.findMany(params);
  }

  async countHeaders(where?: Prisma.BillOfMaterialHeaderWhereInput): Promise<number> {
    return this.prisma.billOfMaterialHeader.count({ where });
  }

  async updateHeader(where: Prisma.BillOfMaterialHeaderWhereUniqueInput, data: Prisma.BillOfMaterialHeaderUpdateInput): Promise<BillOfMaterialHeader> {
    return this.prisma.billOfMaterialHeader.update({ where, data });
  }

  // BOM Items
  async createItem(data: Prisma.BillOfMaterialItemCreateInput): Promise<BillOfMaterialItem> {
    return this.prisma.billOfMaterialItem.create({ data });
  }

  async createItemsBulk(data: Prisma.BillOfMaterialItemCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.billOfMaterialItem.createMany({ data });
  }

  async updateItem(where: Prisma.BillOfMaterialItemWhereUniqueInput, data: Prisma.BillOfMaterialItemUpdateInput): Promise<BillOfMaterialItem> {
    return this.prisma.billOfMaterialItem.update({ where, data });
  }

  async deleteItem(where: Prisma.BillOfMaterialItemWhereUniqueInput): Promise<BillOfMaterialItem> {
    return this.prisma.billOfMaterialItem.delete({ where });
  }

  async deleteItems(where: Prisma.BillOfMaterialItemWhereInput): Promise<Prisma.BatchPayload> {
    return this.prisma.billOfMaterialItem.deleteMany({ where });
  }

  async executeInTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation);
  }
}
