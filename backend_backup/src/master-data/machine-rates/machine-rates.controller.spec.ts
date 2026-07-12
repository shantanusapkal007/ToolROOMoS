import { Test, TestingModule } from '@nestjs/testing';
import { MachineRatesController } from './machine-rates.controller';

describe('MachineRatesController', () => {
  let controller: MachineRatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MachineRatesController],
    }).compile();

    controller = module.get<MachineRatesController>(MachineRatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
