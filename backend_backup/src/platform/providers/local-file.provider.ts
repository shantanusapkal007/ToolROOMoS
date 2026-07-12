import { Injectable } from '@nestjs/common';
import { FileProvider } from './file.provider.interface';

@Injectable()
export class LocalFileProvider implements FileProvider {
  async uploadFile(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    // Phase 1: Mock implementation. Will be replaced by MinIO in Shared Services phase.
    return `local://mock/${fileName}`;
  }

  async getFileUrl(fileId: string): Promise<string> {
    return `http://localhost/mock/${fileId}`;
  }

  async deleteFile(fileId: string): Promise<boolean> {
    return true;
  }
}
