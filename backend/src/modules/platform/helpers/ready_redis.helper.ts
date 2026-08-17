import { Redis } from 'ioredis';
import { env } from '../../../shared/config/env.js';

let redisUrlOverride: string | undefined;

/** Só para smoke `test:ready` (503 com Redis inacessível). */
export function setReadyRedisUrlForTests(url: string | undefined): void {
  redisUrlOverride = url;
}

export async function pingRedis(): Promise<boolean> {
  const url = redisUrlOverride ?? env.REDIS_URL;
  const redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
    connectTimeout: 1_500,
    retryStrategy: () => null,
  });
  redis.on('error', () => undefined);
  try {
    await redis.connect();
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  } finally {
    redis.disconnect();
  }
}
