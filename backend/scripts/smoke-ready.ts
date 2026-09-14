process.env.STORAGE_FAKE = '1';

import { once } from 'node:events';
import type { Server } from 'node:http';
import { setReadyRedisUrlForTests } from '../src/modules/platform/helpers/ready_redis.helper.js';
import { getPrismaClient } from '../src/shared/database/tenant_prisma.js';

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  process.env.NODE_ENV = 'test';
}

type Json = { status: number; body: Record<string, unknown> | null };

async function main() {
  const { createApp } = await import('../src/app.js');
  const app = createApp();
  const server = app.listen(0) as Server;
  await once(server, 'listening');
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('no port');
  const origin = `http://127.0.0.1:${addr.port}`;
  let failed = false;

  async function request(path: string): Promise<Json> {
    const res = await fetch(`${origin}${path}`);
    const text = await res.text();
    return { status: res.status, body: text ? (JSON.parse(text) as Record<string, unknown>) : null };
  }

  const apiReady = await request('/api/v1/ready');
  const rootReady = await request('/ready');
  const health = await request('/health');
  const apiHealth = await request('/api/v1/health');
  console.log('ready-up', apiReady.status, apiReady.body?.data);
  console.log('ready-root', rootReady.status);
  console.log('health', health.status, apiHealth.status);

  const checks = (apiReady.body?.data ?? {}) as Record<string, unknown>;
  if (apiReady.status !== 200 || checks.db !== true || checks.redis !== true || checks.storage !== true) {
    failed = true;
  }
  if (rootReady.status !== 200) failed = true;
  if (health.status !== 200 || apiHealth.status !== 200) failed = true;

  const dump = JSON.stringify(apiReady.body);
  if (dump.includes('postgresql://') || dump.includes('redis://') || dump.includes('STORAGE_')) {
    failed = true;
  }

  setReadyRedisUrlForTests('redis://127.0.0.1:1');
  const down = await request('/api/v1/ready');
  const healthDown = await request('/health');
  const downChecks = (down.body?.data ?? {}) as Record<string, unknown>;
  console.log('ready-redis-down', down.status, down.body?.data, 'health', healthDown.status);
  if (down.status !== 503 || downChecks.redis !== false) failed = true;
  if (healthDown.status !== 200) failed = true;
  setReadyRedisUrlForTests(undefined);

  const dumpDown = JSON.stringify(down.body);
  if (dumpDown.includes('postgresql://') || dumpDown.includes('redis://') || dumpDown.includes('STORAGE_')) {
    failed = true;
  }

  server.close();
  await getPrismaClient().$disconnect();
  if (failed) {
    console.error('FAIL: ready smoke');
    process.exit(1);
  }
  console.log('OK: ready smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
