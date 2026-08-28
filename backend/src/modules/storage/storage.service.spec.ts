import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test_access';
    process.env.AWS_SECRET_ACCESS_KEY = 'test_secret';
    process.env.AWS_S3_BUCKET = 'test-bucket';

    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should format keys and generate presigned download URL', async () => {
    const url = await service.getPresignedDownloadUrl('/drawings/cad-part-1.step', 300);
    expect(url).toContain('test-bucket');
    expect(url).toContain('drawings/cad-part-1.step');
  });

  it('should generate presigned upload URL with key and bucket metadata', async () => {
    const res = await service.getPresignedUploadUrl('invoices/inv-001.pdf', 'application/pdf', 600);
    expect(res.bucket).toBe('test-bucket');
    expect(res.key).toBe('invoices/inv-001.pdf');
    expect(res.uploadUrl).toBeDefined();
  });
});
