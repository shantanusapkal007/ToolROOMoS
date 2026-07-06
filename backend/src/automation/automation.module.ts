import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductionModule } from '../production/production.module';

@Module({
  imports: [PrismaModule, ProductionModule],
  providers: [AutomationService]
})
export class AutomationModule {}
