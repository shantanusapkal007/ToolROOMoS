import { Test, TestingModule } from '@nestjs/testing';
import { MachineRatesService } from './machine-rates.service';

describe('MachineRatesService', () => {
  let service: MachineRatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MachineRatesService],
    }).compile();

    service = module.get<MachineRatesService>(MachineRatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
