import { Module } from '@nestjs/common';
import { EngineeringController } from './engineering.controller';
import { BomsService } from './boms.service';
import { RoutingService } from './routing.service';

@Module({
  controllers: [EngineeringController],
  providers: [BomsService, RoutingService],
  exports: [BomsService, RoutingService],
})
export class EngineeringModule {}
