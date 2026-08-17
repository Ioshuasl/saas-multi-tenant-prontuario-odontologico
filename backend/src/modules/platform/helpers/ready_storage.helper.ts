import { getObjectStorage, ObjectStorageError } from '../../../shared/storage/index.js';

const READY_PROBE_KEY = '__ready__/probe';

export async function pingObjectStorage(): Promise<boolean> {
  try {
    await getObjectStorage().headObject(READY_PROBE_KEY);
    return true;
  } catch (err) {
    if (err instanceof ObjectStorageError) return false;
    return false;
  }
}
