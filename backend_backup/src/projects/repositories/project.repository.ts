import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Project } from '@prisma/client';

@Injectable()
export class ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({ data });
  }

  async findById(id: string, include?: Prisma.ProjectInclude): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include,
    });
  }

  async findByIdOrThrow(id: string, include?: Prisma.ProjectInclude): Promise<Project> {
    return this.prisma.project.findUniqueOrThrow({
      where: { id },
      include,
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ProjectWhereUniqueInput;
    where?: Prisma.ProjectWhereInput;
    orderBy?: Prisma.ProjectOrderByWithRelationInput;
    include?: Prisma.ProjectInclude;
  }): Promise<Project[]> {
    const { skip, take, cursor, where, orderBy, include } = params;
    return this.prisma.project.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include,
    });
  }

  async count(where?: Prisma.ProjectWhereInput): Promise<number> {
    return this.prisma.project.count({ where });
  }

  async update(params: {
    where: Prisma.ProjectWhereUniqueInput;
    data: Prisma.ProjectUpdateInput;
  }): Promise<Project> {
    const { where, data } = params;
    return this.prisma.project.update({
      data,
      where,
    });
  }

  async delete(where: Prisma.ProjectWhereUniqueInput): Promise<Project> {
    return this.prisma.project.delete({
      where,
    });
  }

  // Transactions support
  async executeInTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(operation);
  }
}
