import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller';
import { MaterialIssuesService } from './material-issues.service';
import { ProductionOperationsService } from './production-operations.service';
import { JobCardsService } from './job-cards.service';
import { JobCardsController } from './job-cards.controller';

@Module({
  controllers: [ProductionController, JobCardsController],
  providers: [MaterialIssuesService, ProductionOperationsService, JobCardsService],
  exports: [MaterialIssuesService, ProductionOperationsService, JobCardsService],
})
export class ProductionModule {}
