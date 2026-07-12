import { Module } from '@nestjs/common';
import { MachineRatesController } from './machine-rates.controller';
import { MachineRatesService } from './machine-rates.service';

@Module({
  controllers: [MachineRatesController],
  providers: [MachineRatesService]
})
export class MachineRatesModule {}
