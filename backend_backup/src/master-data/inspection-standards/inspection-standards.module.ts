import { Module } from '@nestjs/common';
import { InspectionStandardsController } from './inspection-standards.controller';
import { InspectionStandardsService } from './inspection-standards.service';

@Module({
  controllers: [InspectionStandardsController],
  providers: [InspectionStandardsService]
})
export class InspectionStandardsModule {}
