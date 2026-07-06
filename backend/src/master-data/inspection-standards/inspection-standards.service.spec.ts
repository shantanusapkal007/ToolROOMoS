import { Test, TestingModule } from '@nestjs/testing';
import { InspectionStandardsService } from './inspection-standards.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('InspectionStandardsService', () => {
  let service: InspectionStandardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionStandardsService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<InspectionStandardsService>(InspectionStandardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
