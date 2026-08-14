import { once } from 'node:events';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';
import { getPrismaClient, getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { hashToken } from '../src/shared/helpers/token_hash.js';
import { addDays } from '../src/modules/identity/helpers/slug.helper.js';
import { Role } from '../src/modules/identity/enum/role/role.enum.js';

type Json = { status: number; body: Record<string, unknown> | null };

type ProcedureRow = {
  id: string;
  code: string;
  priceCents: number;
  requiresTooth: boolean;
  requiresFace: boolean;
};

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
    const headers: Record<string, string> = { authorization: `Bearer ${token}` };
    if (tenantId) headers['x-tenant-id'] = tenantId;
    return headers;
  }

  const password = 'SenhaForte!99';
  const ownerEmail = `s5-quotes-${stamp}@example.com`;
  const receptionEmail = `s5-quotes-rec-${stamp}@example.com`;

  const signup = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: ownerEmail,
      password,
      clinicName: 'Clinica Orcamentos',
      ownerName: 'Owner Orcamentos',
    }),
  });
  console.log('signup', signup.status);
  if (signup.status !== 201) failed = true;

  const token = dataOf(signup).accessToken as string;
  const tenantId = (dataOf(signup).tenant as { id: string }).id;
  const ownerUserId = (dataOf(signup).user as { id: string }).id;
  const membershipId = (dataOf(signup).membership as { id: string }).id;
  const smokeCtx = { tenantId, userId: ownerUserId, requestId: 'smoke-quotes' };

  const professional = await request('/api/v1/clinic/professionals', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      membershipId,
      croNumber: '12345',
      croState: 'GO',
    }),
  });
  console.log('professional', professional.status);
  if (professional.status !== 201) failed = true;
  const professionalId = dataOf(professional).id as string;

  const createPatient = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Paciente Orcamento',
      phonePrimary: '62977770001',
      birthDate: '1988-03-12',
    }),
  });
  console.log('patient', createPatient.status);
  if (createPatient.status !== 201) failed = true;
  const patientId = (dataOf(createPatient).patient as { id: string }).id;

  const procedures = await request('/api/v1/procedures', {
    headers: authHeaders(token, tenantId),
  });
  const procedureList = (procedures.body?.data as ProcedureRow[]) ?? [];
  const res01 = procedureList.find((row) => row.code === 'RES-01');
  const cons01 = procedureList.find((row) => row.code === 'CONS-01');
  console.log('procedures', procedures.status, res01?.code, cons01?.code);
  if (procedures.status !== 200 || !res01 || !cons01) failed = true;

  const pricePatch = await request(`/api/v1/procedures/${res01?.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ priceCents: 35000 }),
  });
  console.log('procedure-price', pricePatch.status);
  if (pricePatch.status !== 200) failed = true;

  const createQuote = await request('/api/v1/quotes', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      patientId,
      professionalId,
      items: [{ procedureId: res01?.id, toothCode: '26', quantity: 1 }],
    }),
  });
  console.log('quote-create', createQuote.status, dataOf(createQuote).number, dataOf(createQuote).totalCents);
  if (createQuote.status !== 201) failed = true;
  if (dataOf(createQuote).status !== 'DRAFT') failed = true;
  if (dataOf(createQuote).number !== '1') failed = true;
  if (dataOf(createQuote).totalCents !== 35000) failed = true;
  if (dataOf(createQuote).validUntil == null) failed = true;
  const quoteId = dataOf(createQuote).id as string;
  const frozenPrice = ((dataOf(createQuote).items as Array<{ unitPriceCents: number }>) ?? [])[0]
    ?.unitPriceCents;
  if (frozenPrice !== 35000) failed = true;

  const list = await request(`/api/v1/quotes?patientId=${patientId}`, {
    headers: authHeaders(token, tenantId),
  });
  const listed = (list.body?.data as Array<{ id: string }>) ?? [];
  console.log('quote-list', list.status, listed.length);
  if (list.status !== 200) failed = true;
  if (!listed.some((row) => row.id === quoteId)) failed = true;

  const patchedNotes = await request(`/api/v1/quotes/${quoteId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ notes: 'Rascunho clínico comercial.' }),
  });
  console.log('quote-patch', patchedNotes.status);
  if (patchedNotes.status !== 200) failed = true;
  if (dataOf(patchedNotes).notes !== 'Rascunho clínico comercial.') failed = true;

  const bumpPrice = await request(`/api/v1/procedures/${res01?.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ priceCents: 99999 }),
  });
  console.log('procedure-price-bump', bumpPrice.status);
  if (bumpPrice.status !== 200) failed = true;

  const getAfterBump = await request(`/api/v1/quotes/${quoteId}`, {
    headers: authHeaders(token, tenantId),
  });
  const itemAfter = ((dataOf(getAfterBump).items as Array<{ unitPriceCents: number }>) ?? [])[0];
  console.log('quote-frozen-price', getAfterBump.status, itemAfter?.unitPriceCents);
  if (getAfterBump.status !== 200) failed = true;
  if (itemAfter?.unitPriceCents !== 35000) failed = true;
  if (dataOf(getAfterBump).totalCents !== 35000) failed = true;

  const missingTooth = await request(`/api/v1/quotes/${quoteId}/items`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ procedureId: res01?.id }),
  });
  console.log('item-requires-tooth', missingTooth.status, errorCode(missingTooth));
  if (missingTooth.status !== 422) failed = true;

  const faceFlag = await request(`/api/v1/procedures/${res01?.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ requiresFace: true }),
  });
  if (faceFlag.status !== 200) failed = true;

  const missingFace = await request(`/api/v1/quotes/${quoteId}/items`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ procedureId: res01?.id, toothCode: '27' }),
  });
  console.log('item-requires-face', missingFace.status, errorCode(missingFace));
  if (missingFace.status !== 422) failed = true;

  const clearFace = await request(`/api/v1/procedures/${res01?.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ requiresFace: false }),
  });
  if (clearFace.status !== 200) failed = true;

  const addConsult = await request(`/api/v1/quotes/${quoteId}/items`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ procedureId: cons01?.id }),
  });
  console.log('item-create', addConsult.status, dataOf(addConsult).totalCents);
  if (addConsult.status !== 201) failed = true;
  const consultItem = ((dataOf(addConsult).items as Array<{ id: string; procedureId: string }>) ?? []).find(
    (item) => item.procedureId === cons01?.id,
  );
  if (!consultItem) failed = true;

  const deleteConsult = await request(`/api/v1/quotes/${quoteId}/items/${consultItem?.id}`, {
    method: 'DELETE',
    headers: authHeaders(token, tenantId),
  });
  console.log('item-delete', deleteConsult.status, dataOf(deleteConsult).totalCents);
  if (deleteConsult.status !== 200) failed = true;
  if (dataOf(deleteConsult).totalCents !== 35000) failed = true;

  const invite = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ email: receptionEmail, role: Role.RECEPTION }),
  });
  if (invite.status !== 201) failed = true;
  const inviteId = dataOf(invite).id as string;
  const inviteToken = `quotes-rec-${stamp}`;
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

  const recProcedures = await request('/api/v1/procedures', {
    headers: authHeaders(recToken, tenantId),
  });
  console.log('reception-procedures', recProcedures.status);
  if (recProcedures.status !== 200) failed = true;

  const recDiscount = await request('/api/v1/quotes', {
    method: 'POST',
    headers: { ...authHeaders(recToken, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      patientId,
      professionalId,
      discountCents: 1,
      items: [{ procedureId: res01?.id, toothCode: '26' }],
    }),
  });
  console.log('reception-discount', recDiscount.status, errorCode(recDiscount));
  if (recDiscount.status !== 422 || errorCode(recDiscount) !== 'DISCOUNT_LIMIT_EXCEEDED') {
    failed = true;
  }

  jar.clear();
  await tenantDb.runInTenantContext(smokeCtx, async (tx) => {
    await tx.quote.update({ where: { id: quoteId }, data: { status: 'SENT' } });
  });
  const patchSent = await request(`/api/v1/quotes/${quoteId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ notes: 'não deve gravar' }),
  });
  console.log('patch-sent', patchSent.status, errorCode(patchSent));
  if (patchSent.status !== 409 || errorCode(patchSent) !== 'INVALID_STATE_TRANSITION') {
    failed = true;
  }

  const outbox = await tenantDb.runInTenantContext(smokeCtx, async (tx) =>
    tx.outboxEvent.findFirst({
      where: { tenantId, name: 'treatments.quote_created' },
      orderBy: { occurredAt: 'desc' },
    }),
  );
  console.log('outbox', Boolean(outbox));
  if (!outbox) failed = true;

  server.close();
  await prisma.$disconnect();

  if (failed) {
    console.error('FAIL: quotes crud smoke');
    process.exit(1);
  }
  console.log('OK: quotes crud smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
