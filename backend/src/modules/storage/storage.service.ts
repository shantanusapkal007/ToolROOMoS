import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadResult {
  bucket: string;
  key: string;
  url?: string;
  contentType?: string;
  sizeBytes?: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucket: string;
  private isConfigured: boolean = false;

  constructor() {
    this.initClient();
  }

  private initClient() {
    const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const customEndpoint = process.env.AWS_ENDPOINT;
    
    this.bucket = process.env.AWS_S3_BUCKET || 'toolroomos-storage';

    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: awsRegion,
        endpoint: customEndpoint || undefined,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isConfigured = true;
      this.logger.log(`Initialized Object Storage with S3 Driver [Region: ${awsRegion}, Bucket: ${this.bucket}]`);
    } else {
      // Default / IAM Role / Fallback Configuration
      this.s3Client = new S3Client({
        region: awsRegion,
        endpoint: customEndpoint || undefined,
      });
      this.isConfigured = !!process.env.AWS_S3_BUCKET;
      this.logger.log(`Initialized Object Storage S3 Driver [Region: ${awsRegion}, Bucket: ${this.bucket}]`);
    }
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  /**
   * Check if bucket exists, if not attempt to create it (for development environments)
   */
  async ensureBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        try {
          this.logger.log(`Bucket ${this.bucket} does not exist. Creating bucket...`);
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          this.logger.log(`Bucket ${this.bucket} successfully created.`);
        } catch (createErr: any) {
          this.logger.warn(`Failed to auto-create bucket ${this.bucket}: ${createErr.message}`);
        }
      } else {
        this.logger.warn(`Object storage connection check for bucket ${this.bucket}: ${err.message}`);
      }
    }
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string = 'application/octet-stream',
    metadata?: Record<string, string>,
  ): Promise<UploadResult> {
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
      }),
    );

    return {
      bucket: this.bucket,
      key: cleanKey,
      contentType,
      sizeBytes: typeof body === 'string' ? Buffer.byteLength(body) : body.length,
    };
  }

  /**
   * Generate Presigned Download URL (valid for specified duration, default 15 minutes)
   */
  async getPresignedDownloadUrl(key: string, expiresInSeconds: number = 900): Promise<string> {
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Generate Presigned Upload URL (client-direct upload, default 15 minutes)
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string = 'application/octet-stream',
    expiresInSeconds: number = 900,
  ): Promise<{ uploadUrl: string; key: string; bucket: string }> {
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    return {
      uploadUrl,
      key: cleanKey,
      bucket: this.bucket,
    };
  }

  /**
   * Delete object from storage
   */
  async deleteFile(key: string): Promise<boolean> {
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: cleanKey,
        }),
      );
      return true;
    } catch (err: any) {
      this.logger.error(`Error deleting object ${cleanKey}: ${err.message}`);
      return false;
    }
  }

  /**
   * Check if file exists in storage
   */
  async fileExists(key: string): Promise<boolean> {
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: cleanKey,
        }),
      );
      return true;
    } catch (err: any) {
      return false;
    }
  }

  /**
   * Health check method for storage
   */
  async checkHealth(): Promise<{ status: 'healthy' | 'degraded'; driver: 's3'; bucket: string; message?: string }> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return {
        status: 'healthy',
        driver: 's3',
        bucket: this.bucket,
      };
    } catch (err: any) {
      return {
        status: 'degraded',
        driver: 's3',
        bucket: this.bucket,
        message: err.message,
      };
    }
  }
}
