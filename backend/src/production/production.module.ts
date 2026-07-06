import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller';
import { MaterialIssuesService } from './material-issues.service';
import { MaterialReturnsService } from './material-returns.service';
import { ProductionOperationsService } from './production-operations.service';
import { JobCardsService } from './job-cards.service';
import { JobCardsController } from './job-cards.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WipService } from './wip.service';
import { WipController } from './wip.controller';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProductionController, 
    JobCardsController, 
    WipController, 
    SchedulingController
  ],
  providers: [
    MaterialIssuesService,
    MaterialReturnsService,
    ProductionOperationsService,
    JobCardsService,
    WipService,
    SchedulingService
  ],
  exports: [
    MaterialIssuesService,
    MaterialReturnsService,
    ProductionOperationsService,
    JobCardsService,
    WipService,
    SchedulingService
  ],
})
export class ProductionModule {}
