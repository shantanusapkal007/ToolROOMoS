import { Test, TestingModule } from '@nestjs/testing';
import { InspectionStandardsController } from './inspection-standards.controller';

describe('InspectionStandardsController', () => {
  let controller: InspectionStandardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionStandardsController],
    }).compile();

    controller = module.get<InspectionStandardsController>(InspectionStandardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
