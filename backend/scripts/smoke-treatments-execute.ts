import { once } from 'node:events';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';
import { getPrismaClient, getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { hashToken } from '../src/shared/helpers/token_hash.js';
import { addDays } from '../src/modules/identity/helpers/slug.helper.js';
import { Role } from '../src/modules/identity/enum/role/role.enum.js';

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

  function authHeaders(token: string, tenantId?: string): HeadersInit {
    const headers: Record<string, string> = {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    };
    if (tenantId) headers['x-tenant-id'] = tenantId;
    return headers;
  }

  const password = 'SenhaForte!99';
  const signup = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s5-execute-${stamp}@example.com`,
      password,
      clinicName: 'Clinica Execute',
      ownerName: 'Owner Execute',
    }),
  });
  console.log('signup', signup.status);
  if (signup.status !== 201) failed = true;
  const token = dataOf(signup).accessToken as string;
  const tenantId = (dataOf(signup).tenant as { id: string }).id;
  const ownerUserId = (dataOf(signup).user as { id: string }).id;
  const membershipId = (dataOf(signup).membership as { id: string }).id;
  const smokeCtx = { tenantId, userId: ownerUserId, requestId: 'smoke-treatments-execute' };

  const professional = await request('/api/v1/clinic/professionals', {
    method: 'POST',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify({ membershipId, croNumber: '12345', croState: 'GO' }),
  });
  if (professional.status !== 201) failed = true;
  const professionalId = dataOf(professional).id as string;

  const patient = await request('/api/v1/patients', {
    method: 'POST',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify({ name: 'Maria Execute', phonePrimary: '62966662001', birthDate: '1990-01-15' }),
  });
  if (patient.status !== 201) failed = true;
  const patientId = (dataOf(patient).patient as { id: string }).id;

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

  const created = await request('/api/v1/quotes', {
    method: 'POST',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify({
      patientId,
      professionalId,
      items: [
        { procedureId: res01?.id, toothCode: '26' },
        { procedureId: res01?.id, toothCode: '27' },
      ],
    }),
  });
  if (created.status !== 201) failed = true;
  const quoteId = dataOf(created).id as string;

  const sent = await request(`/api/v1/quotes/${quoteId}/send`, {
    method: 'POST',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify({ channel: 'COPY' }),
  });
  if (sent.status !== 200) failed = true;

  const decided = await request(`/api/v1/quotes/${quoteId}/decision`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'idempotency-key': `exec-${stamp}` },
    body: JSON.stringify({
      decision: 'APPROVED',
      payment: { installments: 1, firstDueDate: '2026-09-05' },
    }),
  });
  console.log('decision', decided.status, dataOf(decided).treatmentPlanId);
  if (decided.status !== 200) failed = true;
  const planId = dataOf(decided).treatmentPlanId as string;

  const plan = await request(`/api/v1/treatment-plans/${planId}`, { headers: authHeaders(token, tenantId) });
  console.log('plan-get', plan.status, dataOf(plan).progressPercent, dataOf(plan).pendingCents);
  if (plan.status !== 200) failed = true;
  if (dataOf(plan).status !== 'ACTIVE') failed = true;
  const planItems = (dataOf(plan).items as Array<{ id: string; toothCode: string | null }>) ?? [];
  const item26 = planItems.find((item) => item.toothCode === '26');
  const item27 = planItems.find((item) => item.toothCode === '27');
  if (!item26 || !item27) failed = true;

  const listPlans = await request(`/api/v1/treatment-plans?patientId=${patientId}`, {
    headers: authHeaders(token, tenantId),
  });
  if (listPlans.status !== 200) failed = true;

  const noteHint = await request(`/api/v1/patients/${patientId}/record/notes`, {
    method: 'POST',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify({
      content: 'Tentativa de executar pelo POST notes.',
      treatmentItemIds: [item26?.id],
    }),
  });
  console.log('notes-hint', noteHint.status, errorCode(noteHint));
  if (noteHint.status !== 422) failed = true;

  const execute = await request(`/api/v1/treatment-items/${item26?.id}/execute`, {
    method: 'POST',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify({
      note: 'Realizada restauração em resina no dente 26.',
    }),
  });
  console.log('execute', execute.status, dataOf(execute).noteId);
  if (execute.status !== 200) failed = true;
  const noteId = dataOf(execute).noteId as string;

  const again = await request(`/api/v1/treatment-items/${item26?.id}/execute`, {
    method: 'POST',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify({ note: 'Segunda tentativa de execução no mesmo item.' }),
  });
  console.log('execute-again', again.status, errorCode(again));
  if (again.status !== 409 || errorCode(again) !== 'ITEM_ALREADY_EXECUTED') failed = true;

  const patchNote = await request(`/api/v1/patients/${patientId}/record/notes/${noteId}`, {
    method: 'PATCH',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify({ content: 'não deve gravar' }),
  });
  console.log('note-immutable', patchNote.status, errorCode(patchNote));
  if (patchNote.status !== 423) failed = true;

  const odonto = await request(
    `/api/v1/patients/${patientId}/record/odontogram?dentition=PERMANENT`,
    { headers: authHeaders(token, tenantId) },
  );
  const teeth = ((dataOf(odonto).teeth as Array<{ toothCode: string; condition: string }>) ?? []);
  const tooth26 = teeth.find((row) => row.toothCode === '26');
  console.log('odontogram-26', odonto.status, tooth26?.condition);
  if (tooth26?.condition !== 'RESTORED') failed = true;

  const productions = await tenantDb.runInTenantContext(smokeCtx, (tx) =>
    tx.productionEntry.count({ where: { treatmentItemId: item26?.id } }),
  );
  console.log('production', productions);
  if (productions !== 1) failed = true;

  const history = await tenantDb.runInTenantContext(smokeCtx, (tx) =>
    tx.toothStateHistory.findFirst({
      where: { source: 'PROCEDURE_EXECUTION' },
      orderBy: { createdAt: 'desc' },
    }),
  );
  if (!history) failed = true;

  const cancelExecuted = await request(`/api/v1/treatment-items/${item26?.id}/cancel`, {
    method: 'POST',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify({ reason: 'Tentativa indevida de cancelar executado.' }),
  });
  console.log('cancel-executed', cancelExecuted.status, errorCode(cancelExecuted));
  if (cancelExecuted.status !== 422 || errorCode(cancelExecuted) !== 'ITEM_ALREADY_EXECUTED') {
    failed = true;
  }

  const cancelPlanned = await request(`/api/v1/treatment-items/${item27?.id}/cancel`, {
    method: 'POST',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify({ reason: 'Paciente desistiu deste dente restante.' }),
  });
  console.log('cancel-planned', cancelPlanned.status, dataOf(cancelPlanned).planStatus);
  if (cancelPlanned.status !== 200) failed = true;
  if (dataOf(cancelPlanned).planStatus !== 'COMPLETED') failed = true;

  const timeline = await request(`/api/v1/patients/${patientId}/timeline`, {
    headers: authHeaders(token, tenantId),
  });
  const timelineItems = (dataOf(timeline).items as Array<{ source: string; refId: string }>) ?? [];
  const included = (dataOf(timeline).includedSources as string[]) ?? [];
  console.log('timeline', timeline.status, included.includes('QUOTE'), timelineItems.some((i) => i.refId === quoteId));
  if (!included.includes('QUOTE') || !timelineItems.some((item) => item.refId === quoteId)) failed = true;

  const invite = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify({ email: `s5-exec-rec-${stamp}@example.com`, role: Role.RECEPTION }),
  });
  if (invite.status !== 201) failed = true;
  const inviteId = dataOf(invite).id as string;
  const inviteToken = `exec-rec-${stamp}`;
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
  const recExecute = await request(`/api/v1/treatment-items/${item26?.id}/execute`, {
    method: 'POST',
    headers: authHeaders(recToken, tenantId),
    body: JSON.stringify({ note: 'Recepção não pode executar item clínico.' }),
  });
  console.log('reception-execute', recExecute.status);
  if (recExecute.status !== 403) failed = true;

  server.close();
  await prisma.$disconnect();

  if (failed) {
    console.error('FAIL: treatments execute smoke');
    process.exit(1);
  }
  console.log('OK: treatments execute smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
