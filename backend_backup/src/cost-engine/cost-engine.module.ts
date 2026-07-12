import { Module } from '@nestjs/common';
import { CostEngineController } from './cost-engine.controller';
import { CostEngineService } from './cost-engine.service';
import { WipService } from './wip/wip.service';
import { WipController } from './wip/wip.controller';
import { ProductionSubscriber } from './subscribers/production.subscriber';
import { LogisticsSubscriber } from './subscribers/logistics.subscriber';

@Module({
  controllers: [
    CostEngineController,
    WipController
  ],
  providers: [
    CostEngineService,
    WipService,
    ProductionSubscriber,
    LogisticsSubscriber
  ],
  exports: [WipService]
})
export class CostEngineModule {}
