import { Module } from '@nestjs/common';
import { SubcontractingController } from './subcontracting.controller';
import { GlobalSubcontractingController } from './global-subcontracting.controller';
import { SubcontractingService } from './subcontracting.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubcontractingController, GlobalSubcontractingController],
  providers: [SubcontractingService],
  exports: [SubcontractingService],
})
export class SubcontractingModule {}
