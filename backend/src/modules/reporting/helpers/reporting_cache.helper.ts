import { Redis } from 'ioredis';
import { env } from '../../../shared/config/env.js';
import { logger } from '../../../shared/config/logger.js';

const TTL_SECONDS = 60;
const DISABLE_MS = 30_000;

let client: Redis | null = null;
let disabledUntil = 0;

async function getClient(): Promise<Redis | null> {
  if (process.env.NODE_ENV === 'test') return null;
  if (Date.now() < disabledUntil) return null;
  if (client?.status === 'ready') return client;
  try {
    const redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 500,
      retryStrategy: () => null,
    });
    await redis.connect();
    await redis.ping();
    client = redis;
    return redis;
  } catch (err) {
    logger.warn({ err }, 'reporting_cache_unavailable');
    disabledUntil = Date.now() + DISABLE_MS;
    if (client) {
      client.disconnect();
      client = null;
    }
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.warn({ err, key }, 'reporting_cache_get_failed');
    return null;
  }
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  const redis = await getClient();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', TTL_SECONDS);
  } catch (err) {
    logger.warn({ err, key }, 'reporting_cache_set_failed');
  }
}

export function dashboardCacheKey(input: {
  tenantId: string;
  date: string;
  unitId?: string;
  professionalId?: string;
  includeFinancial: boolean;
}): string {
  return [
    'reporting',
    'dashboard',
    input.tenantId,
    input.date,
    input.unitId ?? '-',
    input.professionalId ?? '-',
    input.includeFinancial ? 'fin' : 'ops',
  ].join(':');
}
