import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  ObjectStorageError,
  type ObjectHead,
  type ObjectStoragePort,
  type PresignGetResult,
  type PresignPutResult,
} from './object_storage.port.js';

export type S3ObjectStorageConfig = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
};

export class S3ObjectStorageAdapter implements ObjectStoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3ObjectStorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: !config.endpoint.includes('amazonaws.com'),
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
    });
  }

  async presignPut(key: string, mimeType: string, expiresSeconds: number): Promise<PresignPutResult> {
    try {
      const url = await getSignedUrl(
        this.client,
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: mimeType,
        }),
        { expiresIn: expiresSeconds },
      );
      return { url, headers: { 'Content-Type': mimeType } };
    } catch {
      throw new ObjectStorageError();
    }
  }

  async presignGet(key: string, expiresSeconds: number): Promise<PresignGetResult> {
    try {
      const url = await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: expiresSeconds },
      );
      return { url };
    } catch {
      throw new ObjectStorageError();
    }
  }

  async headObject(key: string): Promise<ObjectHead | null> {
    try {
      const out = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        sizeBytes: out.ContentLength ?? 0,
        contentType: out.ContentType,
      };
    } catch (err) {
      if (isNotFound(err)) return null;
      throw new ObjectStorageError();
    }
  }

  async getObject(key: string): Promise<Buffer | null> {
    try {
      const out = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (!out.Body) return null;
      const bytes = await out.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (err) {
      if (isNotFound(err)) return null;
      throw new ObjectStorageError();
    }
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    } catch {
      throw new ObjectStorageError();
    }
  }
}

function isNotFound(err: unknown): boolean {
  const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : '';
  const status =
    err && typeof err === 'object' && '$metadata' in err
      ? (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
      : undefined;
  return name === 'NotFound' || name === 'NoSuchKey' || status === 404;
}
