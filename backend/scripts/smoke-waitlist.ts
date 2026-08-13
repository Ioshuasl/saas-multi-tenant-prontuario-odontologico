import { once } from 'node:events';
import type { Server } from 'node:http';
import { getPrismaClient, getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { InMemoryJobQueue } from '../src/shared/queue/in_memory_job_queue.js';
import { JOB, QUEUE } from '../src/shared/queue/queue_names.js';

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

function nextWeekdayAfter(ymd: string): string {
  const [year, month, day] = ymd.split('-').map(Number);
  for (let add = 1; add <= 14; add++) {
    const next = new Date(Date.UTC(year, (month ?? 1) - 1, (day ?? 1) + add))
      .toISOString()
      .slice(0, 10);
    if (isWeekdayYmd(next)) return next;
  }
  return ymd;
}

async function main() {
  const { createApp } = await import('../src/app.js');
  const { OutboxDispatcher } = await import('../src/shared/database/outbox_dispatcher.js');
  const { offerWaitlistSlotJob } = await import('../src/modules/scheduling/jobs/offer_waitlist_slot.job.js');
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

  function errorCode(json: Json): string {
    return String((json.body?.error as { code?: string } | undefined)?.code ?? '');
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
      email: `s3-wl-${stamp}@example.com`,
      password: 'SenhaForte!99',
      clinicName: 'Clinica Fila',
      ownerName: 'Owner Fila',
    }),
  });
  console.log('signup', signup.status);
  if (signup.status !== 201) failed = true;

  const accessToken = dataOf(signup).accessToken as string;
  const tenantId = (dataOf(signup).tenant as { id: string }).id;
  const membershipId = (dataOf(signup).membership as { id: string }).id;

  const professional = await request('/api/v1/clinic/professionals', {
    method: 'POST',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ membershipId, croNumber: '22222', croState: 'GO' }),
  });
  console.log('professional', professional.status);
  if (professional.status !== 201) failed = true;
  const professionalId = dataOf(professional).id as string;

  const clinic = await request('/api/v1/clinic', {
    headers: authHeaders(accessToken, tenantId),
  });
  const unitId = (dataOf(clinic).defaultUnit as { id: string } | undefined)?.id;

  const proceduresRes = await request('/api/v1/procedures', {
    headers: authHeaders(accessToken, tenantId),
  });
  const procedures = Array.isArray(proceduresRes.body?.data)
    ? (proceduresRes.body?.data as Array<{ id: string; defaultMinutes?: number }>)
    : [];
  const procedureId = procedures[0]?.id;
  const duration = procedures[0]?.defaultMinutes ?? 30;
  if (!procedureId || !unitId) failed = true;

  async function createPatient(name: string, phone: string) {
    const created = await request('/api/v1/patients', {
      method: 'POST',
      headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
      body: JSON.stringify({ name, phonePrimary: phone }),
    });
    return created;
  }

  const patientA = await createPatient('Paciente Agenda', `62988${String(stamp).slice(-6)}`);
  const patientB = await createPatient('Paciente Fila 1', `62987${String(stamp).slice(-6)}`);
  const patientC = await createPatient('Paciente Fila 2', `62986${String(stamp).slice(-6)}`);
  const patientD = await createPatient('Paciente Fila 3', `62985${String(stamp).slice(-6)}`);
  console.log('patients', patientA.status, patientB.status, patientC.status, patientD.status);
  if ([patientA, patientB, patientC, patientD].some((p) => p.status !== 201)) failed = true;
  const patientAId = (dataOf(patientA).patient as { id: string }).id;
  const patientBId = (dataOf(patientB).patient as { id: string }).id;
  const patientCId = (dataOf(patientC).patient as { id: string }).id;
  const patientDId = (dataOf(patientD).patient as { id: string }).id;

  const day = spYmdWeekday(2);
  const startsAt = `${day}T10:00:00-03:00`;
  const endsAt = new Date(new Date(startsAt).getTime() + duration * 60_000).toISOString();

  const appointment = await request('/api/v1/appointments', {
    method: 'POST',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      unitId,
      patientId: patientAId,
      professionalId,
      procedureId,
      startsAt,
      endsAt,
    }),
  });
  console.log('appointment', appointment.status);
  if (appointment.status !== 201) failed = true;
  const appointmentId = dataOf(appointment).id as string;

  async function createWaitlist(patientId: string, priority = 0) {
    return request('/api/v1/waitlist', {
      method: 'POST',
      headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
      body: JSON.stringify({
        patientId,
        professionalId,
        procedureId,
        preferredPeriods: [],
        priority,
      }),
    });
  }

  const wl1 = await createWaitlist(patientBId, 1);
  const wl2 = await createWaitlist(patientCId, 0);
  console.log('waitlist_create', wl1.status, wl2.status);
  if (wl1.status !== 201 || wl2.status !== 201) failed = true;
  const waitlistId1 = dataOf(wl1).id as string;
  const waitlistId2 = dataOf(wl2).id as string;

  const listed = await request('/api/v1/waitlist?status=WAITING', {
    headers: authHeaders(accessToken, tenantId),
  });
  console.log('waitlist_list', listed.status, Array.isArray(listed.body?.data) ? (listed.body?.data as unknown[]).length : 0);
  if (listed.status !== 200) failed = true;

  const cancel = await request(`/api/v1/appointments/${appointmentId}`, {
    method: 'DELETE',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ reason: 'Paciente desmarcou' }),
  });
  console.log('cancel', cancel.status);
  if (cancel.status !== 200) failed = true;

  const offer1 = await request(`/api/v1/waitlist/${waitlistId1}/offer`, {
    method: 'POST',
    headers: {
      ...authHeaders(accessToken, tenantId),
      'content-type': 'application/json',
      'Idempotency-Key': `offer-${stamp}-1`,
    },
    body: JSON.stringify({ appointmentId }),
  });
  const offer2 = await request(`/api/v1/waitlist/${waitlistId2}/offer`, {
    method: 'POST',
    headers: {
      ...authHeaders(accessToken, tenantId),
      'content-type': 'application/json',
      'Idempotency-Key': `offer-${stamp}-2`,
    },
    body: JSON.stringify({ appointmentId }),
  });
  console.log(
    'offer',
    offer1.status,
    dataOf(offer1).buttonPayload,
    offer2.status,
    dataOf(offer2).buttonPayload,
  );
  if (offer1.status !== 200 || offer2.status !== 200) failed = true;
  if (dataOf(offer1).buttonPayload !== `WAITLIST_${waitlistId1}`) failed = true;
  if (dataOf(offer1).template !== 'waitlist_offer') failed = true;

  const token1 = dataOf(offer1).acceptToken as string;
  const token2 = dataOf(offer2).acceptToken as string;
  if (!token1 || !token2) {
    console.error('FAIL: acceptToken ausente (NODE_ENV=test)');
    failed = true;
  }

  const [accept1, accept2] = await Promise.all([
    request(`/api/v1/public/waitlist/${token1}/accept`, { method: 'POST' }),
    request(`/api/v1/public/waitlist/${token2}/accept`, { method: 'POST' }),
  ]);
  console.log('concurrent_accept', accept1.status, accept2.status, errorCode(accept1), errorCode(accept2));
  const ok = [accept1, accept2].filter((r) => r.status === 200);
  const conflict = [accept1, accept2].filter((r) => r.status === 409);
  if (ok.length !== 1 || conflict.length !== 1) {
    console.error('FAIL: first-accept-wins deveria ser 1x200 e 1x409');
    failed = true;
  }
  const winner = accept1.status === 200 ? accept1 : accept2;
  const winnerToken = accept1.status === 200 ? token1 : token2;
  const loserWaitlistId = accept1.status === 200 ? waitlistId2 : waitlistId1;
  if (winner.status === 200) {
    const appointmentResult = dataOf(winner).appointment as { origin?: string; status?: string };
    console.log('winner', appointmentResult?.origin, appointmentResult?.status);
    if (appointmentResult?.origin !== 'WAITLIST' || appointmentResult?.status !== 'SCHEDULED') {
      failed = true;
    }
    const replay = await request(`/api/v1/public/waitlist/${winnerToken}/accept`, { method: 'POST' });
    console.log('replay_winner', replay.status);
    if (replay.status !== 200) failed = true;
  }

  const removed = await request(`/api/v1/waitlist/${loserWaitlistId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken, tenantId),
  });
  console.log('waitlist_delete', removed.status, (dataOf(removed) as { status?: string }).status);

  const startsAt2 = `${nextWeekdayAfter(day)}T10:00:00-03:00`;
  const endsAt2 = new Date(new Date(startsAt2).getTime() + duration * 60_000).toISOString();
  const appointment2 = await request('/api/v1/appointments', {
    method: 'POST',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      unitId,
      patientId: patientAId,
      professionalId,
      procedureId,
      startsAt: startsAt2,
      endsAt: endsAt2,
    }),
  });
  const appointment2Id = dataOf(appointment2).id as string;
  const wl3 = await createWaitlist(patientDId, 1);
  const waitlistId3 = dataOf(wl3).id as string;
  const cancel2 = await request(`/api/v1/appointments/${appointment2Id}`, {
    method: 'DELETE',
    headers: { ...authHeaders(accessToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ reason: 'Horário liberado para fila' }),
  });
  console.log('cancel2', cancel2.status, 'waitlist3', wl3.status);

  const queue = new InMemoryJobQueue();
  queue.register(QUEUE.scheduling, JOB.offerWaitlistSlot, (payload) => offerWaitlistSlotJob(payload));
  queue.register(QUEUE.scheduling, JOB.scheduleAppointmentNotifications, async () => {});
  queue.register(QUEUE.messaging, JOB.sendWhatsappMessage, async () => {});
  const dispatcher = new OutboxDispatcher(queue, getTenantPrisma());
  const dispatched = await dispatcher.dispatchOnce(100);
  await queue.drain();
  console.log('job_dispatch', dispatched, queue.processed.filter((j) => j.jobName === JOB.offerWaitlistSlot).length);

  const afterJob = await request(`/api/v1/waitlist?status=OFFERED`, {
    headers: authHeaders(accessToken, tenantId),
  });
  const offeredItems = Array.isArray(afterJob.body?.data)
    ? (afterJob.body?.data as Array<{ id: string }>)
    : [];
  console.log('offered_after_job', afterJob.status, offeredItems.some((e) => e.id === waitlistId3));
  if (!offeredItems.some((e) => e.id === waitlistId3)) {
    console.error('FAIL: job offer-waitlist-slot deveria marcar a entrada como OFFERED');
    failed = true;
  }

  server.close();
  await getPrismaClient().$disconnect();

  if (failed) process.exit(1);
  console.log('OK: waitlist smoke passed');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
