import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getInventoryLedger() {
    const batches = await this.prisma.inventoryBatch.findMany({
      where: {
        status: { in: ['AVAILABLE', 'RESERVED'] }, // Ignore depleted or quarantined for main ledger, or maybe show all? Let's show all for a full ledger but ordered.
      },
      include: {
        material: true,
        warehouse: true,
        grnItem: {
          include: {
            grnHeader: {
              include: {
                supplier: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return batches;
  }
}
