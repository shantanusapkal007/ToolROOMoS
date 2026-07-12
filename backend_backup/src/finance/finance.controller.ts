import { Controller, Get } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('api/v1/finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  getDashboardSummary() {
    return this.financeService.getDashboardSummary();
  }
}
