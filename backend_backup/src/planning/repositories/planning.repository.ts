// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, PlanningRun, PlanningRecommendation, PlanningException } from '@prisma/client';

@Injectable()
export class PlanningRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ================= PLANNING RUNS =================
  async createPlanningRun(data: Prisma.PlanningRunCreateInput): Promise<PlanningRun> {
    return this.prisma.planningRun.create({ data });
  }

  async findRunById(id: string, include?: Prisma.PlanningRunInclude): Promise<PlanningRun | null> {
    return this.prisma.planningRun.findUnique({ where: { id }, include });
  }

  async findRuns(params: {
    where?: Prisma.PlanningRunWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.PlanningRunOrderByWithRelationInput;
    include?: Prisma.PlanningRunInclude;
  }): Promise<PlanningRun[]> {
    return this.prisma.planningRun.findMany(params);
  }

  async countRuns(where?: Prisma.PlanningRunWhereInput): Promise<number> {
    return this.prisma.planningRun.count({ where });
  }

  async updateRun(where: Prisma.PlanningRunWhereUniqueInput, data: Prisma.PlanningRunUpdateInput): Promise<PlanningRun> {
    return this.prisma.planningRun.update({ where, data });
  }

  // ================= RECOMMENDATIONS =================
  async createRecommendation(data: Prisma.PlanningRecommendationCreateInput): Promise<PlanningRecommendation> {
    return this.prisma.planningRecommendation.create({ data });
  }

  async updateRecommendation(where: Prisma.PlanningRecommendationWhereUniqueInput, data: Prisma.PlanningRecommendationUpdateInput): Promise<PlanningRecommendation> {
    return this.prisma.planningRecommendation.update({ where, data });
  }

  async findRecommendations(params: {
    where?: Prisma.PlanningRecommendationWhereInput;
    include?: Prisma.PlanningRecommendationInclude;
  }): Promise<PlanningRecommendation[]> {
    return this.prisma.planningRecommendation.findMany(params);
  }

  // ================= EXCEPTIONS =================
  async createException(data: Prisma.PlanningExceptionCreateInput): Promise<PlanningException> {
    return this.prisma.planningException.create({ data });
  }

  async createExceptionsBulk(data: Prisma.PlanningExceptionCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.planningException.createMany({ data });
  }

  async findExceptions(params: {
    where?: Prisma.PlanningExceptionWhereInput;
    include?: Prisma.PlanningExceptionInclude;
  }): Promise<PlanningException[]> {
    return this.prisma.planningException.findMany(params);
  }

  // ================= TRANSACTIONS =================
  async executeInTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation);
  }
}

