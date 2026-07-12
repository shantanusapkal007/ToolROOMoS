import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StockQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalStock() {
    return this.prisma.inventoryStock.findMany({
      include: {
        material: true,
        warehouse: true,
      },
    });
  }

  async getStockByMaterial(materialId: string) {
    return this.prisma.inventoryStock.findMany({
      where: { materialId },
      include: { warehouse: true },
    });
  }

  async getBatchesByMaterial(materialId: string) {
    return this.prisma.inventoryBatch.findMany({
      where: { materialId },
      orderBy: { createdAt: 'asc' }
    });
  }
}
