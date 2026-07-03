import { Module } from '@nestjs/common';
import { LogisticsFinanceController } from './logistics-finance.controller';
import { InspectionsService } from './inspections.service';
import { DispatchesService } from './dispatches.service';
import { InvoicesService } from './invoices.service';

@Module({
  controllers: [LogisticsFinanceController],
  providers: [InspectionsService, DispatchesService, InvoicesService],
  exports: [InspectionsService, DispatchesService, InvoicesService],
})
export class LogisticsFinanceModule {}
