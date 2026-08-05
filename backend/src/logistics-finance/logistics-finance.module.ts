import { Module } from '@nestjs/common';
import { LogisticsFinanceController } from './logistics-finance.controller';
import { FinanceDashboardController } from './finance-dashboard.controller';
import { InspectionsService } from './inspections.service';
import { DispatchesService } from './dispatches.service';
import { InvoicesService } from './invoices.service';
import { FinanceDashboardService } from './finance-dashboard.service';

@Module({
  controllers: [LogisticsFinanceController, FinanceDashboardController],
  providers: [InspectionsService, DispatchesService, InvoicesService, FinanceDashboardService],
  exports: [InspectionsService, DispatchesService, InvoicesService, FinanceDashboardService],
})
export class LogisticsFinanceModule {}
