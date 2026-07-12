import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { BomApproved } from '../../bom/events/bom.events';
import { EventBus } from '../../../platform/event.bus';

export class CostCalculated {
  constructor(public readonly bomHeaderId: string, public readonly totalCost: number) {}
}

@Injectable()
export class CostRollupEngine {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus
  ) {}

  @OnEvent('BomApproved')
  async handleBomApproved(event: BomApproved) {
    await this.recalculateBomCost(event.bomHeaderId);
  }

  @OnEvent('MaterialCostChanged') // Event from Master Data
  async handleMaterialCostChanged(payload: { materialId: string; newCost: number }) {
    // Find all draft or active BOMs that use this material
    const affectedItems = await this.prisma.billOfMaterialItem.findMany({
      where: { materialId: payload.materialId },
      include: {
        bomHeader: {
          select: { id: true, status: true }
        }
      }
    });

    // Only update non-frozen/non-superseded BOMs or create notifications for Engineers
    const bomsToUpdate = affectedItems
      .filter((item: any) => item.bomHeader.status !== 'FROZEN' && item.bomHeader.status !== 'SUPERSEDED')
      .map((item: any) => item.bomHeader.id);

    // Filter unique
    const uniqueBoms = [...new Set(bomsToUpdate)];

    for (const bomId of uniqueBoms) {
      await this.recalculateBomCost(bomId);
    }
  }

  private async recalculateBomCost(bomHeaderId: string) {
    const items = await this.prisma.billOfMaterialItem.findMany({
      where: { bomHeaderId },
    });

    let totalCost = 0;

    for (const item of items) {
      // Calculate individual item cost based on weight/qty/unit cost
      // For this implementation, we just sum up the existing estimated costs
      const itemCost = Number((item as any).estimatedCost || 0);
      totalCost += itemCost;
    }

    await this.prisma.billOfMaterialHeader.update({
      where: { id: bomHeaderId },
      data: { totalEstimatedCost: totalCost }
    });

    // Emit event that cost was calculated, which could be picked up by ProjectBudgetService
    this.eventBus.emit('CostCalculated', new CostCalculated(bomHeaderId, totalCost));
  }
}
