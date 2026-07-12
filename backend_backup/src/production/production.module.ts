import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { JobCardsController } from './job-cards.controller';
import { JobCardsService } from './job-cards.service';
import { ProductionOperationsController } from './production-operations.controller';
import { ProductionOperationsService } from './production-operations.service';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  controllers: [
    ProductionController, // Deprecated
    JobCardsController,
    ProductionOperationsController,
    SchedulingController
  ],
  providers: [
    ProductionService, // Deprecated
    JobCardsService,
    ProductionOperationsService,
    SchedulingService
  ]
})
export class ProductionModule {}
