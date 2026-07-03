import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller';
import { MaterialIssuesService } from './material-issues.service';
import { ProductionOperationsService } from './production-operations.service';

@Module({
  controllers: [ProductionController],
  providers: [MaterialIssuesService, ProductionOperationsService],
  exports: [MaterialIssuesService, ProductionOperationsService],
})
export class ProductionModule {}
