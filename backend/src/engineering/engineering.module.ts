import { Module } from '@nestjs/common';
import { EngineeringController } from './engineering.controller';
import { BomsService } from './boms.service';
import { RoutingService } from './routing.service';
import { CostBaselineService } from './cost-baseline.service';

@Module({
  controllers: [EngineeringController],
  providers: [BomsService, RoutingService, CostBaselineService],
  exports: [BomsService, RoutingService, CostBaselineService],
})
export class EngineeringModule {}
