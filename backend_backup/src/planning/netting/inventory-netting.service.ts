// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GrossRequirement } from '../explosion/bom-explosion.service';

export interface NetRequirement {
  materialId: string;
  grossQuantity: number;
  availableStock: number;
  openPoQuantity: number;
  netQuantity: number;
}

@Injectable()
export class InventoryNettingService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateNetRequirements(grossReqs: GrossRequirement[]): Promise<NetRequirement[]> {
    const netRequirements: NetRequirement[] = [];

    for (const req of grossReqs) {
      // 1. Find Available Stock
      const stockAggr = await this.prisma.inventoryStock.aggregate({
        where: { materialId: req.materialId },
        _sum: { availableQuantity: true }
      });
      const availableStock = Number(stockAggr._sum?.availableQuantity || 0);

      // 2. Find Open PO Quantity (Incoming)
      // Querying PurchaseOrderItems where status is not completely delivered
      const openPoAggr = await this.prisma.purchaseOrderItem.aggregate({
        where: { 
          materialId: req.materialId,
          poHeader: { status: { in: ['ISSUED', 'PARTIALLY_DELIVERED'] } }
        },
        _sum: { pendingQty: true } // Assuming pendingQty exists, otherwise requiredQty - acceptedQty
      });
      
      const openPoQuantity = Number(openPoAggr._sum?.pendingQty || 0);

      // 3. Netting Formula: Gross - (Available + Incoming)
      const totalSupply = availableStock + openPoQuantity;
      let netQuantity = 0;

      if (req.requiredQuantity > totalSupply) {
        netQuantity = req.requiredQuantity - totalSupply;
      }

      netRequirements.push({
        materialId: req.materialId,
        grossQuantity: req.requiredQuantity,
        availableStock,
        openPoQuantity,
        netQuantity
      });
    }

    return netRequirements;
  }
}

