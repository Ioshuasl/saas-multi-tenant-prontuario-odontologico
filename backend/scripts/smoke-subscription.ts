import { once } from 'node:events';
import type { Server } from 'node:http';
import { InMemoryJobQueue } from '../src/shared/queue/in_memory_job_queue.js';
import { setJobQueue } from '../src/shared/queue/job_queue_singleton.js';
import { Role } from '../src/modules/identity/enum/role/role.enum.js';
import { hashToken } from '../src/shared/helpers/token_hash.js';
import { addDays } from '../src/modules/identity/helpers/slug.helper.js';
import { getPrismaClient, getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { ExpireService, UpdateService } from '../src/modules/subscription/services/subscription/subscription_ops.service.js';
import { SubscriptionStatus } from '../src/modules/subscription/enum/subscription/subscription_status.enum.js';

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  process.env.NODE_ENV = 'test';
}

type Json = { status: number; body: Record<string, unknown> | null };

async function main() {
  setJobQueue(new InMemoryJobQueue());
  const { createApp } = await import('../src/app.js');
  const app = createApp();
  const server = app.listen(0) as Server;
  await once(server, 'listening');
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('no port');
  const origin = `http://127.0.0.1:${addr.port}`;
  const stamp = Date.now();
  let failed = false;

  const jar = new Map<string, string>();
  const tenantDb = getTenantPrisma();
  const prisma = getPrismaClient();

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
    let body: Record<string, unknown> | null = null;
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text) as Record<string, unknown>;
      } catch {
        body = { raw: text };
      }
    }
    return { status: res.status, body };
  }

  function dataOf(json: Json): Record<string, unknown> {
    return (json.body?.data as Record<string, unknown>) ?? {};
  }

  function errorCode(json: Json): string | undefined {
    const err = json.body?.error as { code?: string } | undefined;
    return err?.code;
  }

  function authHeaders(token: string, tenantId: string): HeadersInit {
    return { authorization: `Bearer ${token}`, 'x-tenant-id': tenantId };
  }

  const password = 'SenhaForte!99';
  const signup = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s7-sub-${stamp}@example.com`,
      password,
      clinicName: 'Clinica Assinatura',
      ownerName: 'Owner Assinatura',
    }),
  });
  console.log('signup', signup.status);
  if (signup.status !== 201) failed = true;
  const token = dataOf(signup).accessToken as string;
  const tenantId = (dataOf(signup).tenant as { id: string }).id;
  const ownerUserId = (dataOf(signup).user as { id: string }).id;
  const membershipId = (dataOf(signup).membership as { id: string }).id;
  const smokeCtx = { tenantId, userId: ownerUserId, requestId: 'smoke-subscription' };

  const sub = await request('/api/v1/subscription', { headers: authHeaders(token, tenantId) });
  console.log('get-subscription', sub.status, dataOf(sub).status, dataOf(sub).writable);
  if (sub.status !== 200) failed = true;
  if (dataOf(sub).status !== 'TRIAL') failed = true;
  if (dataOf(sub).writable !== true) failed = true;
  const plan = dataOf(sub).plan as { code?: string } | undefined;
  if (plan?.code !== 'ESSENCIAL') failed = true;

  const plans = await request('/api/v1/subscription/plans', { headers: authHeaders(token, tenantId) });
  const planList = (plans.body?.data as Array<{ code: string }>) ?? [];
  console.log('plans', plans.status, planList.map((p) => p.code).join(','));
  if (plans.status !== 200) failed = true;
  if (!planList.some((p) => p.code === 'ESSENCIAL')) failed = true;
  if (!planList.some((p) => p.code === 'CLINICA')) failed = true;
  if (!planList.some((p) => p.code === 'REDE')) failed = true;

  const usage = await request('/api/v1/subscription/usage', { headers: authHeaders(token, tenantId) });
  const usageData = dataOf(usage);
  console.log('usage', usage.status, usageData);
  if (usage.status !== 200) failed = true;
  const users = usageData.users as { current?: number; limit?: number } | undefined;
  if (users?.current !== 1 || users.limit !== 2) failed = true;

  const checkout = await request('/api/v1/subscription/checkout', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  console.log('checkout', checkout.status, errorCode(checkout));
  if (checkout.status !== 501 || errorCode(checkout) !== 'NOT_IMPLEMENTED') failed = true;

  const professional = await request('/api/v1/clinic/professionals', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ membershipId, croNumber: '33333', croState: 'GO' }),
  });
  console.log('professional-1', professional.status);
  if (professional.status !== 201) failed = true;

  const dentistEmail = `s7-sub-den-${stamp}@example.com`;
  const inviteDen = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ email: dentistEmail, role: Role.DENTIST }),
  });
  console.log('invite-dentist', inviteDen.status);
  if (inviteDen.status !== 201) failed = true;
  const denInviteId = dataOf(inviteDen).id as string;
  const denToken = `sub-den-${stamp}`;
  await tenantDb.runInTenantContext(smokeCtx, async (tx) => {
    await tx.invitation.update({
      where: { id: denInviteId },
      data: { tokenHash: hashToken(denToken), expiresAt: addDays(new Date(), 7) },
    });
  });
  jar.clear();
  const acceptDen = await request('/api/v1/users/invitations/accept', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: denToken, name: 'Dra Sub', password }),
  });
  if (acceptDen.status !== 200) failed = true;
  const dentistToken = dataOf(acceptDen).accessToken as string;
  const dentistMembershipId = (dataOf(acceptDen).membership as { id: string } | undefined)?.id;

  const dentistSub = await request('/api/v1/subscription', {
    headers: authHeaders(dentistToken, tenantId),
  });
  console.log('dentist-subscription', dentistSub.status);
  if (dentistSub.status !== 403) failed = true;

  jar.clear();
  const secondProf = await request('/api/v1/clinic/professionals', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      membershipId: dentistMembershipId,
      croNumber: '44444',
      croState: 'GO',
    }),
  });
  console.log('professional-2', secondProf.status, errorCode(secondProf));
  if (secondProf.status !== 402 || errorCode(secondProf) !== 'PLAN_LIMIT_EXCEEDED') failed = true;

  const recEmail = `s7-sub-rec-${stamp}@example.com`;
  const inviteRec = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ email: recEmail, role: Role.RECEPTION }),
  });
  console.log('invite-reception', inviteRec.status);
  if (inviteRec.status !== 201) failed = true;

  const finEmail = `s7-sub-fin-${stamp}@example.com`;
  const inviteFin = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ email: finEmail, role: Role.FINANCE }),
  });
  console.log('invite-finance', inviteFin.status, errorCode(inviteFin));
  if (inviteFin.status !== 402 || errorCode(inviteFin) !== 'PLAN_LIMIT_EXCEEDED') failed = true;

  await tenantDb.runInTenantContext(smokeCtx, async (tx) => {
    await tx.subscription.update({
      where: { tenantId },
      data: { currentPeriodEnd: new Date(Date.now() - 60_000) },
    });
  });

  const writeExpired = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Paciente Bloqueado', phonePrimary: '62970001111' }),
  });
  console.log('write-expired', writeExpired.status, errorCode(writeExpired));
  if (writeExpired.status !== 402 || errorCode(writeExpired) !== 'SUBSCRIPTION_REQUIRED') failed = true;

  const readExpired = await request('/api/v1/patients', { headers: authHeaders(token, tenantId) });
  console.log('read-expired', readExpired.status);
  if (readExpired.status !== 200) failed = true;

  const exportExpired = await request('/api/v1/reports/procedures/export', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ format: 'CSV' }),
  });
  console.log('export-expired', exportExpired.status);
  if (exportExpired.status !== 202) failed = true;

  await new ExpireService().execute(smokeCtx);
  const afterJob = await request('/api/v1/subscription', { headers: authHeaders(token, tenantId) });
  console.log('after-expire-job', afterJob.status, dataOf(afterJob).status);
  if (dataOf(afterJob).status !== 'EXPIRED') failed = true;
  if (dataOf(afterJob).writable !== false) failed = true;

  await new UpdateService().execute(smokeCtx, { status: SubscriptionStatus.ACTIVE });
  const writeActive = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Paciente Ativo',
      phonePrimary: '62970002222',
      birthDate: '1990-01-15',
    }),
  });
  console.log('write-active', writeActive.status);
  if (writeActive.status !== 201) failed = true;

  await new UpdateService().execute(smokeCtx, { status: SubscriptionStatus.SUSPENDED });
  const writeSuspended = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Paciente Suspenso', phonePrimary: '62970003333' }),
  });
  console.log('write-suspended', writeSuspended.status, errorCode(writeSuspended));
  if (writeSuspended.status !== 402 || errorCode(writeSuspended) !== 'SUBSCRIPTION_REQUIRED') {
    failed = true;
  }

  const readSuspended = await request('/api/v1/patients', { headers: authHeaders(token, tenantId) });
  console.log('read-suspended', readSuspended.status);
  if (readSuspended.status !== 200) failed = true;

  await prisma.$disconnect();
  server.close();
  await once(server, 'close');

  if (failed) {
    console.error('SMOKE FAILED');
    process.exit(1);
  }
  console.log('SMOKE OK');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
