import { once } from 'node:events';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';
import { getPrismaClient, getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { setCreateReceivableFailureForTests } from '../src/modules/billing/billing_public.js';
import { Role } from '../src/modules/identity/enum/role/role.enum.js';
import { hashToken } from '../src/shared/helpers/token_hash.js';
import { addDays } from '../src/modules/identity/helpers/slug.helper.js';

type Json = { status: number; body: Record<string, unknown> | null };

type ProcedureRow = { id: string; code: string };

async function main() {
  const app = createApp();
  const server = app.listen(0) as Server;
  await once(server, 'listening');
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('no port');
  const origin = `http://127.0.0.1:${addr.port}`;
  const stamp = Date.now();
  let failed = false;

  const jar = new Map<string, string>();
  const prisma = getPrismaClient();
  const tenantDb = getTenantPrisma();

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

  function errorCode(json: Json): string | undefined {
    const err = json.body?.error as { code?: string } | undefined;
    return err?.code;
  }

  function authHeaders(token: string, tenantId?: string, extra?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = { authorization: `Bearer ${token}`, ...extra };
    if (tenantId) headers['x-tenant-id'] = tenantId;
    return headers;
  }

  function tokenFromPublicUrl(url: string): string {
    const parts = url.split('/orcamento/');
    return parts[1] ?? '';
  }

  const password = 'SenhaForte!99';
  const signup = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s5-quotes-decision-${stamp}@example.com`,
      password,
      clinicName: 'Clinica Decisao',
      ownerName: 'Owner Decisao',
    }),
  });
  console.log('signup', signup.status);
  if (signup.status !== 201) failed = true;
  const token = dataOf(signup).accessToken as string;
  const tenantId = (dataOf(signup).tenant as { id: string }).id;
  const ownerUserId = (dataOf(signup).user as { id: string }).id;
  const membershipId = (dataOf(signup).membership as { id: string }).id;
  const smokeCtx = { tenantId, userId: ownerUserId, requestId: 'smoke-quotes-decision' };

  const professional = await request('/api/v1/clinic/professionals', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ membershipId, croNumber: '12345', croState: 'GO' }),
  });
  if (professional.status !== 201) failed = true;
  const professionalId = dataOf(professional).id as string;

  const adult = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Maria Orcamento', phonePrimary: '62966661001', birthDate: '1990-01-15' }),
  });
  if (adult.status !== 201) failed = true;
  const adultId = (dataOf(adult).patient as { id: string }).id;

  const minor = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Joao Pedro', phonePrimary: '62966661002', birthDate: '2014-06-01' }),
  });
  if (minor.status !== 201) failed = true;
  const minorId = (dataOf(minor).patient as { id: string }).id;

  const procedures = await request('/api/v1/procedures', { headers: authHeaders(token, tenantId) });
  const procedureList = (procedures.body?.data as ProcedureRow[]) ?? [];
  const res01 = procedureList.find((row) => row.code === 'RES-01');
  if (!res01) failed = true;
  const priced = await request(`/api/v1/procedures/${res01?.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ priceCents: 35000 }),
  });
  if (priced.status !== 200) failed = true;

  async function createAndSend(patientId: string, items: unknown[]): Promise<{ quoteId: string; publicUrl: string }> {
    const created = await request('/api/v1/quotes', {
      method: 'POST',
      headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
      body: JSON.stringify({ patientId, professionalId, items }),
    });
    if (created.status !== 201) failed = true;
    const quoteId = dataOf(created).id as string;
    const sent = await request(`/api/v1/quotes/${quoteId}/send`, {
      method: 'POST',
      headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
      body: JSON.stringify({ channel: 'COPY' }),
    });
    if (sent.status !== 200) failed = true;
    const publicUrl = dataOf(sent).publicUrl as string;
    return { quoteId, publicUrl };
  }

  const failQuote = await createAndSend(adultId, [{ procedureId: res01?.id, toothCode: '11' }]);
  const missingKey = await request(`/api/v1/quotes/${failQuote.quoteId}/decision`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      decision: 'APPROVED',
      payment: { installments: 1, firstDueDate: '2026-09-05' },
    }),
  });
  console.log('missing-idempotency', missingKey.status, errorCode(missingKey));
  if (missingKey.status !== 400) failed = true;

  setCreateReceivableFailureForTests(failQuote.quoteId);
  const billingFail = await request(`/api/v1/quotes/${failQuote.quoteId}/decision`, {
    method: 'POST',
    headers: {
      ...authHeaders(token, tenantId, { 'idempotency-key': `fail-${stamp}`, 'content-type': 'application/json' }),
    },
    body: JSON.stringify({
      decision: 'APPROVED',
      payment: { installments: 1, firstDueDate: '2026-09-05' },
    }),
  });
  setCreateReceivableFailureForTests(null);
  console.log('billing-fail', billingFail.status);
  if (billingFail.status < 500) failed = true;
  const failGet = await request(`/api/v1/quotes/${failQuote.quoteId}`, {
    headers: authHeaders(token, tenantId),
  });
  if (dataOf(failGet).status !== 'SENT') failed = true;
  const failPlans = await tenantDb.runInTenantContext(smokeCtx, (tx) =>
    tx.treatmentPlan.count({ where: { quoteId: failQuote.quoteId } }),
  );
  console.log('billing-fail-plans', failPlans);
  if (failPlans !== 0) failed = true;

  const partial = await createAndSend(adultId, [
    { procedureId: res01?.id, toothCode: '26' },
    { procedureId: res01?.id, toothCode: '27' },
    { procedureId: res01?.id, toothCode: '16' },
  ]);
  const getPartial = await request(`/api/v1/quotes/${partial.quoteId}`, {
    headers: authHeaders(token, tenantId),
  });
  const itemIds = ((dataOf(getPartial).items as Array<{ id: string }>) ?? []).map((item) => item.id);
  const approvedTwo = itemIds.slice(0, 2);
  const idemKey = `approve-${stamp}`;
  const payment = {
    installments: 3,
    firstDueDate: '2026-09-05',
    method: 'PIX',
    downPaymentCents: 100,
  };
  const approveBody = {
    decision: 'APPROVED',
    approvedItemIds: approvedTwo,
    payment,
  };
  const firstApprove = await request(`/api/v1/quotes/${partial.quoteId}/decision`, {
    method: 'POST',
    headers: {
      ...authHeaders(token, tenantId, { 'idempotency-key': idemKey, 'content-type': 'application/json' }),
    },
    body: JSON.stringify(approveBody),
  });
  console.log('approve-partial', firstApprove.status, dataOf(firstApprove).status);
  if (firstApprove.status !== 200) failed = true;
  if (dataOf(firstApprove).status !== 'PARTIALLY_APPROVED') failed = true;
  if (dataOf(firstApprove).treatmentItems !== 2) failed = true;
  const rec = dataOf(firstApprove).receivable as {
    id: string;
    totalCents: number;
    downPaymentCents: number;
    installments: Array<{ amountCents: number }>;
  };
  const sumLines = rec.installments.reduce((acc, line) => acc + line.amountCents, 0);
  console.log('parcelas', rec.totalCents, rec.downPaymentCents, sumLines);
  if (sumLines + rec.downPaymentCents !== rec.totalCents) failed = true;
  if (dataOf(firstApprove).treatmentPlanId == null) failed = true;

  const replay = await request(`/api/v1/quotes/${partial.quoteId}/decision`, {
    method: 'POST',
    headers: {
      ...authHeaders(token, tenantId, { 'idempotency-key': idemKey, 'content-type': 'application/json' }),
    },
    body: JSON.stringify(approveBody),
  });
  console.log('idempotent-replay', replay.status, dataOf(replay).treatmentPlanId);
  if (replay.status !== 200) failed = true;
  if (dataOf(replay).treatmentPlanId !== dataOf(firstApprove).treatmentPlanId) failed = true;
  const recReplay = dataOf(replay).receivable as { id: string };
  if (recReplay.id !== rec.id) failed = true;

  const reused = await request(`/api/v1/quotes/${partial.quoteId}/decision`, {
    method: 'POST',
    headers: {
      ...authHeaders(token, tenantId, { 'idempotency-key': idemKey, 'content-type': 'application/json' }),
    },
    body: JSON.stringify({
      decision: 'REJECTED',
      reason: 'Mudou de ideia depois do primeiro envio.',
    }),
  });
  console.log('key-reused', reused.status, errorCode(reused));
  if (reused.status !== 409 || errorCode(reused) !== 'IDEMPOTENCY_KEY_REUSED') failed = true;

  const plansAfter = await tenantDb.runInTenantContext(smokeCtx, (tx) =>
    tx.treatmentPlan.count({ where: { quoteId: partial.quoteId } }),
  );
  const titlesAfter = await tenantDb.runInTenantContext(smokeCtx, (tx) =>
    tx.receivable.count({ where: { quoteId: partial.quoteId } }),
  );
  if (plansAfter !== 1 || titlesAfter !== 1) failed = true;

  const getApproved = await request(`/api/v1/quotes/${partial.quoteId}`, {
    headers: authHeaders(token, tenantId),
  });
  console.log('get-receivable', getApproved.status, Boolean(dataOf(getApproved).receivable));
  if (getApproved.status !== 200) failed = true;
  if (!dataOf(getApproved).receivable) failed = true;

  const rejectQuote = await createAndSend(adultId, [{ procedureId: res01?.id, toothCode: '21' }]);
  const reject = await request(`/api/v1/quotes/${rejectQuote.quoteId}/decision`, {
    method: 'POST',
    headers: {
      ...authHeaders(token, tenantId, { 'idempotency-key': `rej-${stamp}`, 'content-type': 'application/json' }),
    },
    body: JSON.stringify({ decision: 'REJECTED', reason: 'Paciente recusou o valor proposto.' }),
  });
  console.log('reject', reject.status, dataOf(reject).status);
  if (reject.status !== 200 || dataOf(reject).status !== 'REJECTED') failed = true;
  if (dataOf(reject).treatmentPlanId != null) failed = true;
  const rejectPlans = await tenantDb.runInTenantContext(smokeCtx, (tx) =>
    tx.treatmentPlan.count({ where: { quoteId: rejectQuote.quoteId } }),
  );
  if (rejectPlans !== 0) failed = true;

  const expiredQuote = await createAndSend(adultId, [{ procedureId: res01?.id, toothCode: '22' }]);
  await tenantDb.runInTenantContext(smokeCtx, async (tx) => {
    await tx.quote.update({
      where: { id: expiredQuote.quoteId },
      data: { validUntil: new Date('2020-01-01T00:00:00.000Z') },
    });
  });
  const expiredDecision = await request(`/api/v1/quotes/${expiredQuote.quoteId}/decision`, {
    method: 'POST',
    headers: {
      ...authHeaders(token, tenantId, { 'idempotency-key': `exp-${stamp}`, 'content-type': 'application/json' }),
    },
    body: JSON.stringify({
      decision: 'APPROVED',
      payment: { installments: 1, firstDueDate: '2026-09-05' },
    }),
  });
  console.log('expired', expiredDecision.status, errorCode(expiredDecision));
  if (expiredDecision.status !== 409) failed = true;

  const invite = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ email: `s5-dec-rec-${stamp}@example.com`, role: Role.RECEPTION }),
  });
  if (invite.status !== 201) failed = true;
  const inviteId = dataOf(invite).id as string;
  const inviteToken = `dec-rec-${stamp}`;
  await tenantDb.runInTenantContext(smokeCtx, async (tx) => {
    await tx.invitation.update({
      where: { id: inviteId },
      data: { tokenHash: hashToken(inviteToken), expiresAt: addDays(new Date(), 7) },
    });
  });
  jar.clear();
  const accept = await request('/api/v1/users/invitations/accept', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: inviteToken, name: 'Recepcionista', password }),
  });
  if (accept.status !== 200) failed = true;
  const recToken = dataOf(accept).accessToken as string;
  const recQuote = await createAndSend(adultId, [{ procedureId: res01?.id, toothCode: '23' }]);
  const recDecide = await request(`/api/v1/quotes/${recQuote.quoteId}/decision`, {
    method: 'POST',
    headers: {
      ...authHeaders(recToken, tenantId, { 'idempotency-key': `rec-${stamp}`, 'content-type': 'application/json' }),
    },
    body: JSON.stringify({
      decision: 'APPROVED',
      payment: { installments: 1, firstDueDate: '2026-09-05' },
    }),
  });
  console.log('reception-decide', recDecide.status, dataOf(recDecide).status);
  if (recDecide.status !== 200 || dataOf(recDecide).status !== 'APPROVED') failed = true;

  const publicQuote = await createAndSend(minorId, [{ procedureId: res01?.id, toothCode: '36' }]);
  const rawToken = tokenFromPublicUrl(publicQuote.publicUrl);
  const publicGet = await request(`/api/v1/public/quotes/${rawToken}`);
  console.log('public-get', publicGet.status, dataOf(publicGet).requiresGuardian, dataOf(publicGet).patientFirstName);
  if (publicGet.status !== 200) failed = true;
  if (dataOf(publicGet).requiresGuardian !== true) failed = true;
  if (dataOf(publicGet).patientFirstName !== 'Joao') failed = true;
  if ('notes' in dataOf(publicGet) || 'patientId' in dataOf(publicGet)) failed = true;

  const noGuardian = await request(`/api/v1/public/quotes/${rawToken}/decision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': `pub-ng-${stamp}` },
    body: JSON.stringify({
      decision: 'APPROVED',
      payment: { installments: 1, firstDueDate: '2026-09-05' },
    }),
  });
  console.log('guardian-required', noGuardian.status, errorCode(noGuardian));
  if (noGuardian.status !== 422 || errorCode(noGuardian) !== 'GUARDIAN_REQUIRED') failed = true;

  jar.clear();
  const guardian = await request(`/api/v1/patients/${minorId}/guardians`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Ana Responsavel', cpf: '529.982.247-25', relationship: 'mae' }),
  });
  console.log('guardian-create', guardian.status);
  if (guardian.status !== 201 && guardian.status !== 200) failed = true;

  const mismatch = await request(`/api/v1/public/quotes/${rawToken}/decision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': `pub-mm-${stamp}` },
    body: JSON.stringify({
      decision: 'APPROVED',
      guardianCpf: '00000000000',
      payment: { installments: 1, firstDueDate: '2026-09-05' },
    }),
  });
  console.log('guardian-mismatch', mismatch.status);
  if (mismatch.status !== 422) failed = true;

  const pubKey = `pub-${stamp}`;
  const pubApprove = await request(`/api/v1/public/quotes/${rawToken}/decision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': pubKey },
    body: JSON.stringify({
      decision: 'APPROVED',
      guardianCpf: '52998224725',
      payment: { installments: 2, firstDueDate: '2026-09-05', downPaymentCents: 0 },
    }),
  });
  console.log('public-approve', pubApprove.status, dataOf(pubApprove).status);
  if (pubApprove.status !== 200 || dataOf(pubApprove).status !== 'APPROVED') failed = true;

  const pubReplay = await request(`/api/v1/public/quotes/${rawToken}/decision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': pubKey },
    body: JSON.stringify({
      decision: 'APPROVED',
      guardianCpf: '52998224725',
      payment: { installments: 2, firstDueDate: '2026-09-05', downPaymentCents: 0 },
    }),
  });
  console.log('public-replay', pubReplay.status, dataOf(pubReplay).treatmentPlanId);
  if (pubReplay.status !== 200) failed = true;
  if (dataOf(pubReplay).treatmentPlanId !== dataOf(pubApprove).treatmentPlanId) failed = true;

  const publicGone = await request(`/api/v1/public/quotes/${rawToken}`);
  console.log('public-used', publicGone.status);
  if (publicGone.status !== 404) failed = true;

  server.close();
  await prisma.$disconnect();

  if (failed) {
    console.error('FAIL: quotes decision smoke');
    process.exit(1);
  }
  console.log('OK: quotes decision smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
