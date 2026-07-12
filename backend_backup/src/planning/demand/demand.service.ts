// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DemandService {
  constructor(private readonly prisma: PrismaService) {}

  async extractDemandForProject(projectId: string): Promise<any[]> {
    // 1. Fetch approved BOMs for the project to establish independent top-level demand
    const boms = await this.prisma.billOfMaterialHeader.findMany({
      where: { 
        projectId, 
        status: { in: ['FROZEN', 'APPROVED'] } 
      },
      select: { id: true, bomNumber: true }
    });

    return boms;
  }
}

