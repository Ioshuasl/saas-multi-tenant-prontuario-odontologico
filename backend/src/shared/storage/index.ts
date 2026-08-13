import { env } from '../config/env.js';
import { FakeObjectStorageAdapter } from './fake_object_storage.adapter.js';
import { S3ObjectStorageAdapter } from './s3_object_storage.adapter.js';
import type { ObjectStoragePort } from './object_storage.port.js';

let singleton: ObjectStoragePort | undefined;

function useFakeStorage(): boolean {
  return env.NODE_ENV === 'test' || process.env.STORAGE_FAKE === '1';
}

export function getObjectStorage(): ObjectStoragePort {
  if (!singleton) {
    singleton = useFakeStorage()
      ? new FakeObjectStorageAdapter()
      : new S3ObjectStorageAdapter({
          endpoint: env.STORAGE_ENDPOINT,
          bucket: env.STORAGE_BUCKET,
          region: env.STORAGE_REGION,
          accessKey: env.STORAGE_ACCESS_KEY,
          secretKey: env.STORAGE_SECRET_KEY,
        });
  }
  return singleton;
}

/** Só para smoke/test — recicla o fake entre requests do mesmo processo. */
export function resetObjectStorageForTests(): void {
  singleton = undefined;
}

export type { ObjectStoragePort, ObjectHead, PresignGetResult, PresignPutResult } from './object_storage.port.js';
export { ObjectStorageError } from './object_storage.port.js';
export { FakeObjectStorageAdapter } from './fake_object_storage.adapter.js';
export { S3ObjectStorageAdapter } from './s3_object_storage.adapter.js';
