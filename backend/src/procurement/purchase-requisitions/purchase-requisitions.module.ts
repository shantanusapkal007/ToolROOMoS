import { Module } from '@nestjs/common';
import { PurchaseRequisitionsController } from './purchase-requisitions.controller';
import { PurchaseRequisitionsService } from './purchase-requisitions.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PurchaseRequisitionsController],
  providers: [PurchaseRequisitionsService],
  exports: [PurchaseRequisitionsService],
})
export class PurchaseRequisitionsModule {}
