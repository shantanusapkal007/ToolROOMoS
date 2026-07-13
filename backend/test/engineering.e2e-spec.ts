import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';

describe('EngineeringController (e2e)', () => {
  let app: INestApplication;

  const mockPrismaService = {
    project: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'proj-1', projectNumber: 'PROJ-123' }),
    },
    billOfMaterialHeader: {
      create: jest.fn().mockResolvedValue({ id: 'bom-h-1' }),
      count: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    billOfMaterialItem: {
      create: jest.fn().mockResolvedValue({ id: 'bom-i-1' }),
    },
    material: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    projectActivity: {
      create: jest.fn().mockResolvedValue({ id: 'act-1' }),
    },
    $transaction: jest.fn(async (cb) => {
      return cb(mockPrismaService);
    }),
  };

  beforeAll(async () => {
    // Mock the guards at prototype level since they are both globally and locally bound
    jest.spyOn(JwtAuthGuard.prototype, 'canActivate').mockImplementation((context: any) => {
      const req = context.switchToHttp().getRequest();
      req.user = { userId: 'user-1', roles: ['ADMIN', 'ENGINEERING'] };
      return true;
    });
    jest.spyOn(RolesGuard.prototype, 'canActivate').mockImplementation(() => true);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/projects/:projectId/bom (POST)', () => {
    const projectId = 'proj-1';

    it('should save a valid BOM payload successfully', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/bom`)
        .send({
          projectId,
          items: [
            {
              materialId: 'mat-1',
              requiredQty: 10,
              rawSize: '55x55',
              calculatedWeight: 2.5,
              dimensions: '50x50',
              remarks: 'Test payload',
            }
          ]
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.data).toHaveProperty('id');
        });
    });

    it('should fail when given invalid schema (missing items)', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/bom`)
        .send({
          projectId
        })
        .expect(400); // Bad Request (Validation Pipe)
    });
  });
});
