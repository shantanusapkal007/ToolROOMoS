import { Module } from '@nestjs/common';
import { EngineeringController } from './engineering.controller';
import { DrawingsService } from './drawings.service';
import { BomsService } from './boms.service';
import { RoutingService } from './routing.service';
import { CostBaselineService } from './cost-baseline.service';

@Module({
  controllers: [EngineeringController],
  providers: [DrawingsService, BomsService, RoutingService, CostBaselineService],
  exports: [DrawingsService, BomsService, RoutingService, CostBaselineService],
})
export class EngineeringModule {}
