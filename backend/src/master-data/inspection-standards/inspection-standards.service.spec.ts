import { Test, TestingModule } from '@nestjs/testing';
import { InspectionStandardsService } from './inspection-standards.service';

describe('InspectionStandardsService', () => {
  let service: InspectionStandardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InspectionStandardsService],
    }).compile();

    service = module.get<InspectionStandardsService>(InspectionStandardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
