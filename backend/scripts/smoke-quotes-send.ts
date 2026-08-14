import { once } from 'node:events';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';
import { getPrismaClient, getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { generateQuotePdfJob } from '../src/modules/treatments/jobs/generate_quote_pdf.job.js';
import { expireQuotesJob } from '../src/modules/treatments/jobs/expire_quotes.job.js';

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
    const headers: Record<string, string> = { authorization: `Bearer ${token}` };
    if (tenantId) headers['x-tenant-id'] = tenantId;
    return headers;
  }

  const password = 'SenhaForte!99';
  const signup = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s5-quotes-send-${stamp}@example.com`,
      password,
      clinicName: 'Clinica Send',
      ownerName: 'Owner Send',
    }),
  });
  console.log('signup', signup.status);
  if (signup.status !== 201) failed = true;
  const token = dataOf(signup).accessToken as string;
  const tenantId = (dataOf(signup).tenant as { id: string }).id;
  const ownerUserId = (dataOf(signup).user as { id: string }).id;
  const membershipId = (dataOf(signup).membership as { id: string }).id;
  const smokeCtx = { tenantId, userId: ownerUserId, requestId: 'smoke-quotes-send' };

  const professional = await request('/api/v1/clinic/professionals', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ membershipId, croNumber: '12345', croState: 'GO' }),
  });
  if (professional.status !== 201) failed = true;
  const professionalId = dataOf(professional).id as string;

  const createPatient = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Maria Orcamento', phonePrimary: '62966660001' }),
  });
  if (createPatient.status !== 201) failed = true;
  const patientId = (dataOf(createPatient).patient as { id: string }).id;

  const procedures = await request('/api/v1/procedures', { headers: authHeaders(token, tenantId) });
  const procedureList = (procedures.body?.data as ProcedureRow[]) ?? [];
  const res01 = procedureList.find((row) => row.code === 'RES-01');
  if (!res01) failed = true;

  await request(`/api/v1/procedures/${res01?.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ priceCents: 35000 }),
  });

  const created = await request('/api/v1/quotes', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      patientId,
      professionalId,
      items: [{ procedureId: res01?.id, toothCode: '26' }],
    }),
  });
  console.log('quote-create', created.status);
  if (created.status !== 201) failed = true;
  const quoteId = dataOf(created).id as string;

  const pdfPending = await request(`/api/v1/quotes/${quoteId}/pdf`, {
    headers: authHeaders(token, tenantId),
  });
  console.log('pdf-pending', pdfPending.status, errorCode(pdfPending));
  if (pdfPending.status !== 409 || errorCode(pdfPending) !== 'PDF_PENDING') failed = true;

  const send = await request(`/api/v1/quotes/${quoteId}/send`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ channel: 'COPY' }),
  });
  const sendData = dataOf(send);
  const quoteAfterSend = sendData.quote as { status?: string } | undefined;
  const publicUrl = sendData.publicUrl as string | undefined;
  console.log('send', send.status, quoteAfterSend?.status, sendData.sentVia, Boolean(publicUrl));
  if (send.status !== 200) failed = true;
  if (quoteAfterSend?.status !== 'SENT') failed = true;
  if (sendData.sentVia !== 'COPY' || !publicUrl?.includes('/orcamento/')) failed = true;

  await generateQuotePdfJob({ tenantId, requestId: 'smoke-pdf', quoteId });

  const pdfReady = await request(`/api/v1/quotes/${quoteId}/pdf`, {
    headers: authHeaders(token, tenantId),
  });
  console.log('pdf-ready', pdfReady.status, Boolean(dataOf(pdfReady).url));
  if (pdfReady.status !== 200) failed = true;
  if (typeof dataOf(pdfReady).url !== 'string') failed = true;
  if (dataOf(pdfReady).expiresIn !== 900) failed = true;

  const resend = await request(`/api/v1/quotes/${quoteId}/send`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ channel: 'COPY' }),
  });
  console.log('resend-same-url', resend.status, dataOf(resend).publicUrl === publicUrl);
  if (resend.status !== 200) failed = true;
  if (dataOf(resend).publicUrl !== publicUrl) failed = true;

  await request(`/api/v1/procedures/${res01?.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ priceCents: 99999 }),
  });

  const dup = await request(`/api/v1/quotes/${quoteId}/duplicate`, {
    method: 'POST',
    headers: authHeaders(token, tenantId),
  });
  const dupItems = (dataOf(dup).items as Array<{ unitPriceCents: number }>) ?? [];
  console.log('duplicate', dup.status, dataOf(dup).status, dataOf(dup).number, dupItems[0]?.unitPriceCents);
  if (dup.status !== 201) failed = true;
  if (dataOf(dup).status !== 'DRAFT') failed = true;
  if (dataOf(dup).number !== '2') failed = true;
  if (dupItems[0]?.unitPriceCents !== 99999) failed = true;

  await tenantDb.runInTenantContext(smokeCtx, async (tx) => {
    await tx.quote.update({
      where: { id: quoteId },
      data: { validUntil: new Date('2020-01-01T00:00:00.000Z') },
    });
  });
  await expireQuotesJob({ tenantId, requestId: 'smoke-expire' });
  const expiredGet = await request(`/api/v1/quotes/${quoteId}`, {
    headers: authHeaders(token, tenantId),
  });
  console.log('expired', expiredGet.status, dataOf(expiredGet).status);
  if (dataOf(expiredGet).status !== 'EXPIRED') failed = true;

  const sendExpired = await request(`/api/v1/quotes/${quoteId}/send`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ channel: 'COPY' }),
  });
  console.log('send-expired', sendExpired.status, errorCode(sendExpired));
  if (sendExpired.status !== 409) failed = true;

  const dupExpired = await request(`/api/v1/quotes/${quoteId}/duplicate`, {
    method: 'POST',
    headers: authHeaders(token, tenantId),
  });
  console.log('duplicate-expired', dupExpired.status, dataOf(dupExpired).status);
  if (dupExpired.status !== 201 || dataOf(dupExpired).status !== 'DRAFT') failed = true;

  const outboxSent = await tenantDb.runInTenantContext(smokeCtx, async (tx) =>
    tx.outboxEvent.findFirst({
      where: { tenantId, name: 'treatments.quote_sent' },
      orderBy: { occurredAt: 'desc' },
    }),
  );
  const outboxExpired = await tenantDb.runInTenantContext(smokeCtx, async (tx) =>
    tx.outboxEvent.findFirst({
      where: { tenantId, name: 'treatments.quote_expired' },
      orderBy: { occurredAt: 'desc' },
    }),
  );
  console.log('outbox', Boolean(outboxSent), Boolean(outboxExpired));
  if (!outboxSent || !outboxExpired) failed = true;

  server.close();
  await prisma.$disconnect();

  if (failed) {
    console.error('FAIL: quotes send smoke');
    process.exit(1);
  }
  console.log('OK: quotes send smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
