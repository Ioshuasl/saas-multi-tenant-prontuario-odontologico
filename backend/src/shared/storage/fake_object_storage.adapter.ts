import type {
  ObjectHead,
  ObjectStoragePort,
  PresignGetResult,
  PresignPutResult,
} from './object_storage.port.js';

type StoredObject = {
  body: Buffer;
  contentType: string;
};

/** In-memory — `NODE_ENV=test` / `STORAGE_FAKE=1` (CI sem MinIO). */
export class FakeObjectStorageAdapter implements ObjectStoragePort {
  private readonly objects = new Map<string, StoredObject>();

  async presignPut(key: string, mimeType: string, _expiresSeconds: number): Promise<PresignPutResult> {
    return {
      url: `memory://put/${encodeURIComponent(key)}`,
      headers: { 'Content-Type': mimeType },
    };
  }

  async presignGet(key: string, _expiresSeconds: number): Promise<PresignGetResult> {
    return { url: `memory://get/${encodeURIComponent(key)}` };
  }

  async headObject(key: string): Promise<ObjectHead | null> {
    const stored = this.objects.get(key);
    if (!stored) return null;
    return { sizeBytes: stored.body.length, contentType: stored.contentType };
  }

  async getObject(key: string): Promise<Buffer | null> {
    return this.objects.get(key)?.body ?? null;
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    this.objects.set(key, { body: Buffer.from(body), contentType });
  }
}
