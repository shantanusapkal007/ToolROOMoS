export const FILE_PROVIDER = 'FILE_PROVIDER';

export interface FileProvider {
  uploadFile(buffer: Buffer, fileName: string, mimeType: string): Promise<string>;
  getFileUrl(fileId: string): Promise<string>;
  deleteFile(fileId: string): Promise<boolean>;
}
