process.env.STORAGE_FAKE = '1';

import { createHmac } from 'node:crypto';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { getPrismaClient } from '../src/shared/database/tenant_prisma.js';
import { getObjectStorage } from '../src/shared/storage/index.js';
import { InMemoryJobQueue } from '../src/shared/queue/in_memory_job_queue.js';
import { setJobQueue } from '../src/shared/queue/job_queue_singleton.js';
import { JOB, QUEUE } from '../src/shared/queue/queue_names.js';

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  process.env.NODE_ENV = 'test';
}

type Json = { status: number; body: Record<string, unknown> | null };

async function main() {
  const queue = new InMemoryJobQueue();
  setJobQueue(queue);

  const { createApp } = await import('../src/app.js');
  const { processWhatsappWebhookJob } = await import('../src/modules/messaging/jobs/process_whatsapp_webhook.job.js');
  const { wahaHmacKey } = await import('../src/shared/config/env.js');

  queue.register(QUEUE.messaging, JOB.processWhatsappWebhook, processWhatsappWebhookJob);

  const app = createApp();
  const server = app.listen(0) as Server;
  await once(server, 'listening');
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('no port');
  const origin = `http://127.0.0.1:${addr.port}`;
  const stamp = Date.now();
  let failed = false;

  const jar = new Map<string, string>();

  async function request(path: string, init: RequestInit = {}): Promise<Json> {
    const headers = new Headers(init.headers);
    if (jar.size > 0) {
      headers.set('cookie', [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; '));
    }
    const res = await fetch(`${origin}${path}`, { ...init, headers });
    const setCookies = res.headers.getSetCookie?.() ?? [];
    for (const raw of setCookies) {
      const [pair] = raw.split(';');
      const eq = pair.indexOf('=');
      if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
    const text = await res.text();
    if (text && (text.startsWith('<') || text.startsWith('<!'))) {
      throw new Error(`HTML instead of JSON ${res.status} ${path}: ${text.slice(0, 120)}`);
    }
    return { status: res.status, body: text ? (JSON.parse(text) as Record<string, unknown>) : null };
  }

  function dataOf(json: Json): Record<string, unknown> {
    return (json.body?.data ?? {}) as Record<string, unknown>;
  }

  function itemsOf(json: Json): Array<Record<string, unknown>> {
    return Array.isArray(json.body?.data) ? (json.body?.data as Array<Record<string, unknown>>) : [];
  }

  function authHeaders(token: string, tenantId: string, extra?: HeadersInit): HeadersInit {
    return {
      authorization: `Bearer ${token}`,
      'x-tenant-id': tenantId,
      ...(extra as Record<string, string> | undefined),
    };
  }

  const signup = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s7-inbox-b2-${stamp}@example.com`,
      password: 'SenhaForte!99',
      clinicName: 'Clinica Inbox B2',
      ownerName: 'Owner Inbox B2',
    }),
  });
  console.log('signup', signup.status);
  if (signup.status !== 201) failed = true;
  const accessToken = dataOf(signup).accessToken as string;
  const tenantId = (dataOf(signup).tenant as { id: string }).id;

  await request('/api/v1/messaging/account', {
    method: 'POST',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ riskAccepted: true }),
  });
  await request('/api/v1/messaging/account/test', {
    method: 'POST',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
  });

  const patientPhone = `62982${String(stamp).slice(-6)}`;
  const patient = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Maria Polish', phonePrimary: patientPhone }),
  });
  if (patient.status !== 201) failed = true;
  const patientId = (dataOf(patient).patient as { id: string }).id;
  const patientE164 = `55${patientPhone}`;

  const sessionName = `t${tenantId.replace(/-/g, '')}`;
  const wamid = `wamid.polish.${stamp}`;
  const webhookRaw = JSON.stringify({
    event: 'message',
    session: sessionName,
    payload: {
      id: wamid,
      timestamp: 1755701234,
      from: `${patientE164}@c.us`,
      fromMe: false,
      type: 'text',
      body: 'Preciso de um exame',
    },
  });
  const hmac = createHmac('sha512', wahaHmacKey()).update(webhookRaw).digest('hex');
  await fetch(`${origin}/api/v1/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-webhook-hmac': hmac },
    body: webhookRaw,
  });
  await queue.drain();

  const listed = await request('/api/v1/messaging/conversations?patientId=' + patientId, {
    headers: authHeaders(accessToken, tenantId),
  });
  const conversationId = itemsOf(listed)[0]?.id as string | undefined;
  console.log('list_by_patient', listed.status, conversationId);
  if (listed.status !== 200 || !conversationId) failed = true;

  const detail = await request(`/api/v1/messaging/conversations/${conversationId}`, {
    headers: authHeaders(accessToken, tenantId),
  });
  const actions = Array.isArray(dataOf(detail).contextActions)
    ? (dataOf(detail).contextActions as Array<{ key: string }>)
    : [];
  console.log('context_actions', detail.status, actions.map((a) => a.key).join(','));
  if (detail.status !== 200 || !actions.some((a) => a.key === 'SCHEDULE')) failed = true;

  const streamRes = await fetch(`${origin}/api/v1/stream`, {
    headers: authHeaders(accessToken, tenantId),
  });
  const streamType = streamRes.headers.get('content-type') ?? '';
  const reader = streamRes.body?.getReader();
  const first = reader ? await reader.read() : { value: undefined };
  const streamChunk = new TextDecoder().decode(first.value ?? new Uint8Array());
  if (reader) await reader.cancel().catch(() => undefined);
  console.log('stream', streamRes.status, streamType.includes('text/event-stream'), streamChunk.includes('connected'));
  if (streamRes.status !== 200 || !streamType.includes('text/event-stream') || !streamChunk.includes('connected')) {
    failed = true;
  }

  const presign = await request(`/api/v1/messaging/conversations/${conversationId}/media/presign`, {
    method: 'POST',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      fileName: 'rx.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2048,
    }),
  });
  console.log('presign', presign.status, dataOf(presign).storageKey);
  if (presign.status !== 200 || !dataOf(presign).storageKey) failed = true;
  const storageKey = dataOf(presign).storageKey as string;
  await getObjectStorage().putObject(storageKey, Buffer.from('fake-image-bytes'), 'image/jpeg');

  const mediaSend = await request(`/api/v1/messaging/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      ...authHeaders(accessToken, tenantId),
      'content-type': 'application/json',
      'Idempotency-Key': `media-${stamp}`,
    },
    body: JSON.stringify({ mediaStorageKey: storageKey, text: 'Segue o exame.' }),
  });
  console.log('send_media', mediaSend.status, dataOf(mediaSend).type, dataOf(mediaSend).mediaKey);
  if (mediaSend.status !== 201 || dataOf(mediaSend).type !== 'IMAGE' || dataOf(mediaSend).mediaKey !== storageKey) {
    failed = true;
  }

  const patientMessages = await request(`/api/v1/messaging/messages?patientId=${patientId}`, {
    headers: authHeaders(accessToken, tenantId),
  });
  const hasMedia = itemsOf(patientMessages).some((item) => item.mediaKey === storageKey);
  console.log('patient_messages', patientMessages.status, itemsOf(patientMessages).length, hasMedia);
  if (patientMessages.status !== 200 || !hasMedia) failed = true;

  const timeline = await request(`/api/v1/patients/${patientId}/timeline`, {
    headers: authHeaders(accessToken, tenantId),
  });
  const timelineItems = Array.isArray(dataOf(timeline).items)
    ? (dataOf(timeline).items as Array<Record<string, unknown>>)
    : [];
  const messageItems = timelineItems.filter((item) => item.source === 'MESSAGE');
  console.log('timeline_messages', timeline.status, messageItems.length);
  if (timeline.status !== 200 || messageItems.length < 1) failed = true;

  server.close();
  await getPrismaClient().$disconnect();

  if (failed) process.exit(1);
  console.log('OK: messaging inbox polish smoke passed');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
