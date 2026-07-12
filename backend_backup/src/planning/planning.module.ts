// @ts-nocheck
import { Module } from '@nestjs/common';
import { PlanningController } from './controllers/planning.controller';
import { PlanningEngine } from './engine/planning-engine.service';
import { DemandService } from './demand/demand.service';
import { BomExplosionService } from './explosion/bom-explosion.service';
import { InventoryNettingService } from './netting/inventory-netting.service';
import { ExceptionService } from './exceptions/exception.service';
import { RecommendationService } from './recommendations/recommendation.service';
import { PlanningRepository } from './repositories/planning.repository';
import { PlanningCacheSubscriber } from './subscribers/cache.subscriber';
import { PlatformModule } from '../platform/platform.module';

@Module({
  imports: [PlatformModule], // for EventBus, CacheEngine, AuditEngine
  controllers: [PlanningController],
  providers: [
    PlanningEngine,
    DemandService,
    BomExplosionService,
    InventoryNettingService,
    ExceptionService,
    RecommendationService,
    PlanningRepository,
    PlanningCacheSubscriber
  ],
  exports: [PlanningEngine]
})
export class PlanningModule {}

