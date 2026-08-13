export class ObjectStorageError extends Error {
  constructor(message = 'Object storage indisponível.') {
    super(message);
    this.name = 'ObjectStorageError';
  }
}

export type PresignPutResult = {
  url: string;
  headers: Record<string, string>;
};

export type PresignGetResult = {
  url: string;
};

export type ObjectHead = {
  sizeBytes: number;
  contentType?: string;
};

/** Port de object storage (ADR-0008) — presign PUT/GET + leitura para thumbnail. */
export type ObjectStoragePort = {
  presignPut(key: string, mimeType: string, expiresSeconds: number): Promise<PresignPutResult>;
  presignGet(key: string, expiresSeconds: number): Promise<PresignGetResult>;
  headObject(key: string): Promise<ObjectHead | null>;
  getObject(key: string): Promise<Buffer | null>;
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
};
