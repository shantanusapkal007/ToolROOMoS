import { Module } from '@nestjs/common';
import { SubcontractingController } from './subcontracting.controller';
import { SubcontractingService } from './subcontracting.service';

@Module({
  controllers: [SubcontractingController],
  providers: [SubcontractingService]
})
export class SubcontractingModule {}
