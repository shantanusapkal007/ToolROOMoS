import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CostEngineModule } from '../cost-engine/cost-engine.module';

@Module({
  imports: [PrismaModule, CostEngineModule],
  providers: [AutomationService]
})
export class AutomationModule {}
