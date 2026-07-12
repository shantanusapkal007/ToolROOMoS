import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectBudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async getBudget(projectId: string) {
    return this.prisma.projectBudget.findFirst({ where: { projectId } });
  }

  async upsertBudget(projectId: string, data: any) {
    const existing = await this.prisma.projectBudget.findFirst({ where: { projectId } });
    if (existing) {
      return this.prisma.projectBudget.update({ where: { id: existing.id }, data });
    }
    return this.prisma.projectBudget.create({ data: { ...data, projectId } });
  }

  async getCostEvents(projectId: string) {
    return this.prisma.projectCostEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
