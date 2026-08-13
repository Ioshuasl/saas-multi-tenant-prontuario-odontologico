import { createHmac } from 'node:crypto';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { getPrismaClient, getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { InMemoryJobQueue } from '../src/shared/queue/in_memory_job_queue.js';
import { setJobQueue } from '../src/shared/queue/job_queue_singleton.js';
import { JOB, QUEUE } from '../src/shared/queue/queue_names.js';
import { idGenerator } from '../src/shared/helpers/id_generator.js';

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  process.env.NODE_ENV = 'test';
}

type Json = { status: number; body: Record<string, unknown> | null };

function spYmd(offsetDays: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const d = Number(parts.find((p) => p.type === 'day')?.value);
  const dt = new Date(Date.UTC(y, m - 1, (d ?? 1) + offsetDays));
  return dt.toISOString().slice(0, 10);
}

function isWeekdayYmd(ymd: string): boolean {
  const [year, month, day] = ymd.split('-').map(Number);
  const dow = new Date(Date.UTC(year, (month ?? 1) - 1, day)).getUTCDay();
  return dow >= 1 && dow <= 5;
}

function spYmdWeekday(minOffsetDays: number): string {
  for (let offset = minOffsetDays; offset < minOffsetDays + 14; offset++) {
    const ymd = spYmd(offset);
    if (isWeekdayYmd(ymd)) return ymd;
  }
  return spYmd(minOffsetDays);
}

async function main() {
  const queue = new InMemoryJobQueue();
  setJobQueue(queue);

  const { createApp } = await import('../src/app.js');
  const { OutboxDispatcher } = await import('../src/shared/database/outbox_dispatcher.js');
  const { scheduleAppointmentNotificationsJob } = await import(
    '../src/modules/scheduling/jobs/schedule_appointment_notifications.job.js'
  );
  const { sendWhatsappMessageJob } = await import('../src/modules/messaging/jobs/send_whatsapp_message.job.js');
  const { processWhatsappWebhookJob } = await import('../src/modules/messaging/jobs/process_whatsapp_webhook.job.js');

  queue.register(QUEUE.scheduling, JOB.scheduleAppointmentNotifications, scheduleAppointmentNotificationsJob);
  queue.register(QUEUE.messaging, JOB.sendWhatsappMessage, sendWhatsappMessageJob);
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
    return { status: res.status, body: text ? (JSON.parse(text) as Record<string, unknown>) : null };
  }

  function dataOf(json: Json): Record<string, unknown> {
    return (json.body?.data ?? {}) as Record<string, unknown>;
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
      email: `s3-msg-${stamp}@example.com`,
      password: 'SenhaForte!99',
      clinicName: 'Clinica WhatsApp',
      ownerName: 'Owner WA',
    }),
  });
  console.log('signup', signup.status);
  if (signup.status !== 201) failed = true;
  const accessToken = dataOf(signup).accessToken as string;
  const tenantId = (dataOf(signup).tenant as { id: string }).id;
  const membershipId = (dataOf(signup).membership as { id: string }).id;

  const missing = await request('/api/v1/messaging/account', {
    headers: authHeaders(accessToken, tenantId),
  });
  console.log('account_missing', missing.status);
  if (missing.status !== 404) failed = true;

  const phoneNumberId = `pnid-${stamp}`;
  const displayPhone = `5562999${String(stamp).slice(-6)}`;
  const connect = await request('/api/v1/messaging/account', {
    method: 'POST',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      wabaId: `waba-${stamp}`,
      phoneNumberId,
      displayPhone,
      accessToken: `fake-token-${stamp}`,
    }),
  });
  console.log('account_connect', connect.status, dataOf(connect).status);
  if (connect.status !== 201 || dataOf(connect).status !== 'PENDING') failed = true;

  const test = await request('/api/v1/messaging/account/test', {
    method: 'POST',
    headers: {
      ...authHeaders(accessToken, tenantId),
      'content-type': 'application/json',
      'Idempotency-Key': `test-${stamp}`,
    },
  });
  console.log('account_test', test.status, dataOf(test).status);
  if (test.status !== 200 || dataOf(test).status !== 'CONNECTED') failed = true;

  const templates = await request('/api/v1/messaging/templates', {
    headers: authHeaders(accessToken, tenantId),
  });
  const templateKeys = Array.isArray(templates.body?.data)
    ? (templates.body?.data as Array<{ key: string }>).map((t) => t.key)
    : [];
  console.log('templates', templates.status, templateKeys.length);
  if (
    templates.status !== 200 ||
    !['appointment_created', 'appointment_confirmation', 'appointment_reminder', 'appointment_cancelled', 'waitlist_offer'].every(
      (key) => templateKeys.includes(key),
    )
  ) {
    failed = true;
  }

  const automations = await request('/api/v1/messaging/automations', {
    headers: authHeaders(accessToken, tenantId),
  });
  const automationKeys = Array.isArray(automations.body?.data)
    ? (automations.body?.data as Array<{ key: string; enabled: boolean }>).map((a) => a.key)
    : [];
  console.log('automations', automations.status, automationKeys);
  if (
    automations.status !== 200 ||
    !['CONFIRMATION_D1', 'REMINDER_H3', 'WAITLIST_OFFER'].every((key) => automationKeys.includes(key))
  ) {
    failed = true;
  }

  const patchAuto = await request('/api/v1/messaging/automations/CONFIRMATION_D1', {
    method: 'PATCH',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ enabled: true, config: { sendAtLocalTime: '12:00' } }),
  });
  console.log('automation_patch', patchAuto.status);
  if (patchAuto.status !== 200) failed = true;

  const usage = await request('/api/v1/messaging/usage', {
    headers: authHeaders(accessToken, tenantId),
  });
  console.log('usage', usage.status, dataOf(usage).balance);
  if (usage.status !== 200 || Number(dataOf(usage).balance) < 1) failed = true;

  const professional = await request('/api/v1/clinic/professionals', {
    method: 'POST',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ membershipId, croNumber: '33333', croState: 'GO' }),
  });
  if (professional.status !== 201) failed = true;
  const professionalId = dataOf(professional).id as string;

  const clinic = await request('/api/v1/clinic', { headers: authHeaders(accessToken, tenantId) });
  const unitId = (dataOf(clinic).defaultUnit as { id: string } | undefined)?.id;
  const proceduresRes = await request('/api/v1/procedures', { headers: authHeaders(accessToken, tenantId) });
  const procedures = Array.isArray(proceduresRes.body?.data)
    ? (proceduresRes.body?.data as Array<{ id: string; defaultMinutes?: number }>)
    : [];
  const procedureId = procedures[0]?.id;
  const duration = procedures[0]?.defaultMinutes ?? 30;
  if (!unitId || !procedureId) failed = true;

  const patientPhone = `62981${String(stamp).slice(-6)}`;
  const patient = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Paciente WhatsApp', phonePrimary: patientPhone }),
  });
  console.log('patient', patient.status);
  if (patient.status !== 201) failed = true;
  const patientId = (dataOf(patient).patient as { id: string }).id;
  const patientE164 = `55${patientPhone}`;

  const day = spYmdWeekday(3);
  const startsAt = `${day}T10:00:00-03:00`;
  const endsAt = new Date(new Date(startsAt).getTime() + duration * 60_000).toISOString();
  const appointment = await request('/api/v1/appointments', {
    method: 'POST',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ unitId, patientId, professionalId, procedureId, startsAt, endsAt }),
  });
  console.log('appointment', appointment.status);
  if (appointment.status !== 201) failed = true;
  const appointmentId = dataOf(appointment).id as string;

  const dispatcher = new OutboxDispatcher(queue, getTenantPrisma());
  await dispatcher.dispatchOnce(100);
  await queue.drain();
  queue.releaseDelayed();
  await queue.drain();
  const sentCreated = queue.processed.filter((j) => j.jobName === JOB.sendWhatsappMessage);
  console.log('send_jobs', sentCreated.length);
  if (sentCreated.length < 1) failed = true;

  const handshake = await fetch(
    `${origin}/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${process.env.WHATSAPP_VERIFY_TOKEN}&hub.challenge=ok-challenge`,
  );
  const handshakeText = await handshake.text();
  console.log('webhook_handshake', handshake.status, handshakeText);
  if (handshake.status !== 200 || handshakeText !== 'ok-challenge') failed = true;

  const invalidSig = await request('/api/v1/webhooks/whatsapp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': 'sha256=deadbeef' },
    body: JSON.stringify({ object: 'whatsapp_business_account' }),
  });
  console.log('webhook_invalid_sig', invalidSig.status);
  if (invalidSig.status !== 401) failed = true;

  const wamid = `wamid.confirm.${stamp}`;
  const webhookRaw = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        id: `waba-${stamp}`,
        changes: [
          {
            field: 'messages',
            value: {
              metadata: { phone_number_id: phoneNumberId },
              messages: [
                {
                  from: patientE164,
                  id: wamid,
                  timestamp: '1755701234',
                  type: 'button',
                  button: { payload: `CONFIRM_${appointmentId}`, text: 'Confirmar' },
                },
              ],
            },
          },
        ],
      },
    ],
  });
  const signature = `sha256=${createHmac('sha256', process.env.WHATSAPP_APP_SECRET ?? '').update(webhookRaw).digest('hex')}`;

  const webhook1 = await fetch(`${origin}/api/v1/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature },
    body: webhookRaw,
  });
  const webhook2 = await fetch(`${origin}/api/v1/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature },
    body: webhookRaw,
  });
  console.log('webhook_confirm', webhook1.status, webhook2.status);
  if (webhook1.status !== 200 || webhook2.status !== 200) failed = true;

  await queue.drain();

  const afterConfirm = await request(`/api/v1/appointments/${appointmentId}`, {
    headers: authHeaders(accessToken, tenantId),
  });
  console.log('appointment_after_confirm', afterConfirm.status, dataOf(afterConfirm).status);
  if (afterConfirm.status !== 200 || dataOf(afterConfirm).status !== 'CONFIRMED') failed = true;

  const logs = await request('/api/v1/messaging/logs', {
    headers: authHeaders(accessToken, tenantId),
  });
  const logItems = Array.isArray(logs.body?.data) ? (logs.body?.data as Array<{ providerMessageId?: string; direction?: string }>) : [];
  const inboundCount = logItems.filter((item) => item.direction === 'INBOUND').length;
  console.log('logs', logs.status, logItems.length, 'inbound', inboundCount);
  if (logs.status !== 200 || inboundCount !== 1) {
    console.error('FAIL: wamid duplicado deveria persistir 1 inbound');
    failed = true;
  }

  const prisma = getPrismaClient();
  await getTenantPrisma().runInTenantContext(
    { tenantId, userId: '', requestId: idGenerator.next() },
    async (tx) => {
      await tx.messageTemplate.create({
        data: {
          id: idGenerator.next(),
          tenantId,
          key: 'marketing_sample',
          category: 'MARKETING',
          language: 'pt_BR',
          providerName: 'marketing_sample',
          body: 'Oi {{nome}} da {{clinica}} em {{data}} {{hora}}',
          variables: ['nome', 'clinica', 'data', 'hora'],
          status: 'APPROVED',
        },
      });
    },
  );

  await queue.add(
    QUEUE.messaging,
    JOB.sendWhatsappMessage,
    {
      tenantId,
      requestId: idGenerator.next(),
      templateKey: 'marketing_sample',
      patientId,
      relatedType: 'MARKETING',
    },
    { jobId: `mkt-${stamp}` },
  );
  await queue.drain();

  const blocked = await getTenantPrisma().runInTenantContext(
    { tenantId, userId: '', requestId: idGenerator.next() },
    (tx) =>
      tx.message.findFirst({
        where: { tenantId, errorCode: 'BLOCKED_NO_CONSENT' },
        select: { id: true, errorCode: true },
      }),
  );
  console.log('marketing_gate', blocked?.errorCode);
  if (blocked?.errorCode !== 'BLOCKED_NO_CONSENT') failed = true;

  const kill = await request('/api/v1/messaging/account', {
    method: 'PATCH',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ killSwitch: true }),
  });
  console.log('kill_switch', kill.status, dataOf(kill).killSwitch);
  if (kill.status !== 200 || dataOf(kill).killSwitch !== true) failed = true;

  const testKilled = await request('/api/v1/messaging/account/test', {
    method: 'POST',
    headers: authHeaders(accessToken, tenantId),
  });
  console.log('test_killed', testKilled.status);
  if (testKilled.status !== 422) failed = true;

  void prisma;

  server.close();
  await getPrismaClient().$disconnect();

  if (failed) process.exit(1);
  console.log('OK: messaging smoke passed');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
