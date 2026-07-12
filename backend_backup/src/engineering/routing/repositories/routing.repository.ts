import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, RoutingHeader, RoutingOperation } from '@prisma/client';

@Injectable()
export class RoutingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createHeader(data: Prisma.RoutingHeaderCreateInput): Promise<RoutingHeader> {
    return this.prisma.routingHeader.create({ data });
  }

  async findHeaderById(id: string, include?: Prisma.RoutingHeaderInclude): Promise<RoutingHeader | null> {
    return this.prisma.routingHeader.findUnique({
      where: { id },
      include,
    });
  }

  async findHeaderByIdOrThrow(id: string, include?: Prisma.RoutingHeaderInclude): Promise<RoutingHeader> {
    return this.prisma.routingHeader.findUniqueOrThrow({
      where: { id },
      include,
    });
  }

  async findHeaders(params: {
    skip?: number;
    take?: number;
    where?: Prisma.RoutingHeaderWhereInput;
    orderBy?: Prisma.RoutingHeaderOrderByWithRelationInput;
    include?: Prisma.RoutingHeaderInclude;
  }): Promise<RoutingHeader[]> {
    return this.prisma.routingHeader.findMany(params);
  }

  async countHeaders(where?: Prisma.RoutingHeaderWhereInput): Promise<number> {
    return this.prisma.routingHeader.count({ where });
  }

  async updateHeader(where: Prisma.RoutingHeaderWhereUniqueInput, data: Prisma.RoutingHeaderUpdateInput): Promise<RoutingHeader> {
    return this.prisma.routingHeader.update({ where, data });
  }

  // Routing Operations
  async createOperation(data: Prisma.RoutingOperationCreateInput): Promise<RoutingOperation> {
    return this.prisma.routingOperation.create({ data });
  }

  async createOperationsBulk(data: Prisma.RoutingOperationCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.routingOperation.createMany({ data });
  }

  async updateOperation(where: Prisma.RoutingOperationWhereUniqueInput, data: Prisma.RoutingOperationUpdateInput): Promise<RoutingOperation> {
    return this.prisma.routingOperation.update({ where, data });
  }

  async deleteOperation(where: Prisma.RoutingOperationWhereUniqueInput): Promise<RoutingOperation> {
    return this.prisma.routingOperation.delete({ where });
  }

  async deleteOperations(where: Prisma.RoutingOperationWhereInput): Promise<Prisma.BatchPayload> {
    return this.prisma.routingOperation.deleteMany({ where });
  }

  async executeInTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation);
  }
}
