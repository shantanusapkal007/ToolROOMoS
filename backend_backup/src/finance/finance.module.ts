import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  controllers: [FinanceController, InvoicesController],
  providers: [FinanceService, InvoicesService],
})
export class FinanceModule {}
