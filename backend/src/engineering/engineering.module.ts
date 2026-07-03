import { Module } from '@nestjs/common';
import { EngineeringController } from './engineering.controller';
import { DrawingsService } from './drawings.service';
import { BomsService } from './boms.service';

@Module({
  controllers: [EngineeringController],
  providers: [DrawingsService, BomsService],
  exports: [DrawingsService, BomsService],
})
export class EngineeringModule {}
