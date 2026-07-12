import { Injectable } from '@nestjs/common';
import { NetRequirement } from '../netting/inventory-netting.service';
import { Prisma } from '@prisma/client';

export interface RecommendationDraft {
  materialId: string;
  requiredQuantity: number;
  source: string;
}

@Injectable()
export class RecommendationService {
  generateRecommendations(netReqs: NetRequirement[]): RecommendationDraft[] {
    const recommendations: RecommendationDraft[] = [];

    for (const req of netReqs) {
      if (req.netQuantity > 0) {
        // By default, if there is a net requirement, we recommend a PURCHASE.
        // A full engine would check Material settings to see if it's IN_HOUSE or PURCHASE.
        recommendations.push({
          materialId: req.materialId,
          requiredQuantity: req.netQuantity,
          source: 'PURCHASE'
        });
      }
    }

    return recommendations;
  }
}
