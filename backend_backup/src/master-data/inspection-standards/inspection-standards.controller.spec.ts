import { Test, TestingModule } from '@nestjs/testing';
import { InspectionStandardsController } from './inspection-standards.controller';
import { InspectionStandardsService } from './inspection-standards.service';

describe('InspectionStandardsController', () => {
  let controller: InspectionStandardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionStandardsController],
      providers: [
        {
          provide: InspectionStandardsService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<InspectionStandardsController>(InspectionStandardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
