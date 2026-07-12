import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PurchaseRequestsService } from '../purchase-requests/purchase-requests.service';

@Injectable()
export class PlanningRecommendationSubscriber {
  private readonly logger = new Logger(PlanningRecommendationSubscriber.name);

  constructor(
    private readonly prService: PurchaseRequestsService,
  ) {}

  @OnEvent('PlanningRecommendationApproved')
  async handleRecommendationApproved(payload: any) {
    try {
      this.logger.log(`Received PlanningRecommendationApproved for Recommendation: \${payload.recommendationId}`);
      await this.prService.generateFromPlanningRecommendation(payload.recommendationId, payload.approvedBy || 'SYSTEM');
      this.logger.log(`Successfully generated Purchase Request from Recommendation \${payload.recommendationId}`);
    } catch (error) {
      this.logger.error(`Failed to generate PR from Recommendation \${payload.recommendationId}: \${error.message}`);
    }
  }
}
