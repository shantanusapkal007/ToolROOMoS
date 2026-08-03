import { Test, TestingModule } from '@nestjs/testing';
import { InspectionStandardsController } from './inspection-standards.controller';
import { InspectionStandardsService } from './inspection-standards.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InspectionStandardsController>(InspectionStandardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

