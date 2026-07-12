import { Module } from '@nestjs/common';
import { PurchaseRequestsService } from './purchase-requests.service';
import { PurchaseRequestsController } from './purchase-requests.controller';
import { PlatformModule } from '../../platform/platform.module';
import { PlanningRecommendationSubscriber } from '../subscribers/planning-recommendation.subscriber';

@Module({
  imports: [PlatformModule],
  providers: [PurchaseRequestsService, PlanningRecommendationSubscriber],
  controllers: [PurchaseRequestsController],
  exports: [PurchaseRequestsService],
})
export class PurchaseRequestsModule {}
