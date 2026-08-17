process.env.STORAGE_FAKE = '1';

import { createHash, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { getObjectStorage, resetObjectStorageForTests } from '../src/shared/storage/index.js';
import { Role } from '../src/modules/identity/enum/role/role.enum.js';
import { AuditAction } from '../src/shared/database/write_audit.js';
import { hashToken } from '../src/shared/helpers/token_hash.js';
import { addDays } from '../src/modules/identity/helpers/slug.helper.js';
import { getPrismaClient, getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { tenantExportJob } from '../src/modules/platform/jobs/tenant_export.job.js';
import {
  buildTenantExportStorageKey,
  TENANT_EXPORT_PRESIGN_TTL_SECONDS,
} from '../src/modules/platform/helpers/tenant_export_storage.helper.js';
import { readZipStoreFile } from '../src/modules/platform/helpers/zip_store.helper.js';

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  process.env.NODE_ENV = 'test';
}

type Json = { status: number; body: Record<string, unknown> | null };

async function main() {
  resetObjectStorageForTests();

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

  const password = 'SenhaForte!99';
  const signupA = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s8-exp-a-${stamp}@example.com`,
      password,
      clinicName: 'Clinica Export A',
      ownerName: 'Owner Export A',
    }),
  });
  console.log('signup-a', signupA.status);
  if (signupA.status !== 201) failed = true;
  const tokenA = dataOf(signupA).accessToken as string;
  const tenantA = (dataOf(signupA).tenant as { id: string }).id;
  const ownerA = (dataOf(signupA).user as { id: string }).id;
  const membershipA = (dataOf(signupA).membership as { id: string }).id;
  const ctxA = { tenantId: tenantA, userId: ownerA, requestId: 'smoke-platform-export' };

  const signupB = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s8-exp-b-${stamp}@example.com`,
      password,
      clinicName: 'Clinica Export B',
      ownerName: 'Owner Export B',
    }),
  });
  console.log('signup-b', signupB.status);
  if (signupB.status !== 201) failed = true;
  const tokenB = dataOf(signupB).accessToken as string;
  const tenantB = (dataOf(signupB).tenant as { id: string }).id;
  const ownerB = (dataOf(signupB).user as { id: string }).id;
  const ctxB = { tenantId: tenantB, userId: ownerB, requestId: 'smoke-platform-export-b' };

  const patientA = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Maria ExportA', phonePrimary: '62970001001', birthDate: '1990-01-15' }),
  });
  const patientAId = (dataOf(patientA).patient as { id: string }).id;
  const patientB = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(tokenB, tenantB), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Zelda Isolamento Bravo', phonePrimary: '62970001002' }),
  });
  const patientBId = (dataOf(patientB).patient as { id: string }).id;
  if (patientA.status !== 201 || patientB.status !== 201) failed = true;

  const professional = await request('/api/v1/clinic/professionals', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ membershipId: membershipA, croNumber: '33333', croState: 'GO' }),
  });
  if (professional.status !== 201) failed = true;

  const noteContent = 'Evolucao exclusiva da clinica A para o ZIP LGPD.';
  const note = await request(`/api/v1/patients/${patientAId}/record/notes`, {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ content: noteContent }),
  });
  console.log('note-a', note.status);
  if (note.status !== 201) failed = true;

  const units = await request('/api/v1/clinic/units', { headers: authHeaders(tokenA, tenantA) });
  const unitId = ((units.body?.data as Array<{ id: string }>) ?? [])[0]?.id;
  const procedures = await request('/api/v1/procedures', { headers: authHeaders(tokenA, tenantA) });
  const res01 = ((procedures.body?.data as Array<{ id: string; code: string }>) ?? []).find(
    (row) => row.code === 'RES-01',
  );
  const professionalId = dataOf(professional).id as string;
  if (unitId && professionalId && res01) {
    const startsAt = new Date();
    await tenantDb.runInTenantContext(ctxA, async (tx) => {
      await tx.appointment.create({
        data: {
          id: randomUUID(),
          tenantId: tenantA,
          unitId,
          patientId: patientAId,
          professionalId,
          procedureId: res01.id,
          startsAt,
          endsAt: new Date(startsAt.getTime() + 30 * 60_000),
          status: 'CONFIRMED',
        },
      });
    });
  }

  async function seedAttachment(ctx: { tenantId: string; userId: string; requestId: string }, patientId: string, marker: string) {
    const id = randomUUID();
    const body = Buffer.from(marker, 'utf8');
    const storageKey = `tenants/${ctx.tenantId}/attachments/${id}.txt`;
    await getObjectStorage().putObject(storageKey, body, 'text/plain');
    await tenantDb.runInTenantContext(ctx, async (tx) => {
      await tx.attachment.create({
        data: {
          id,
          tenantId: ctx.tenantId,
          patientId,
          category: 'DOCUMENT',
          fileName: `${marker}.txt`,
          storageKey,
          mimeType: 'text/plain',
          sizeBytes: BigInt(body.length),
          checksumSha256: createHash('sha256').update(body).digest('hex'),
          uploadedBy: ctx.userId,
        },
      });
    });
  }

  await seedAttachment(ctxA, patientAId, 'anexo-clinica-a');
  await seedAttachment(ctxB, patientBId, 'anexo-clinica-b');

  const created = await request('/api/v1/privacy/exports', {
    method: 'POST',
    headers: {
      ...authHeaders(tokenA, tenantA, { 'idempotency-key': `exp-${stamp}` }),
      'content-type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  console.log('create', created.status, dataOf(created).exportId, dataOf(created).status);
  if (created.status !== 202 || dataOf(created).status !== 'PENDING' || !dataOf(created).exportId) {
    failed = true;
  }
  const exportId = dataOf(created).exportId as string;

  const reused = await request('/api/v1/privacy/exports', {
    method: 'POST',
    headers: {
      ...authHeaders(tokenA, tenantA, { 'idempotency-key': `exp-${stamp}` }),
      'content-type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  console.log('idempotency', reused.status, errorCode(reused));
  if (reused.status !== 409 || errorCode(reused) !== 'IDEMPOTENCY_KEY_REUSED') failed = true;

  const pending = await request(`/api/v1/privacy/exports/${exportId}`, {
    headers: authHeaders(tokenA, tenantA),
  });
  console.log('pending', pending.status, dataOf(pending).status, dataOf(pending).url);
  if (pending.status !== 200 || dataOf(pending).status !== 'PENDING' || dataOf(pending).url !== null) {
    failed = true;
  }

  await tenantExportJob({
    tenantId: tenantA,
    requestId: ctxA.requestId,
    exportId,
  });

  const ready = await request(`/api/v1/privacy/exports/${exportId}`, {
    headers: authHeaders(tokenA, tenantA),
  });
  console.log('ready', ready.status, dataOf(ready).status, Boolean(dataOf(ready).url), dataOf(ready).expiresIn);
  if (ready.status !== 200 || dataOf(ready).status !== 'READY') failed = true;
  if (typeof dataOf(ready).url !== 'string' || dataOf(ready).expiresIn !== TENANT_EXPORT_PRESIGN_TTL_SECONDS) {
    failed = true;
  }

  const zip = await getObjectStorage().getObject(buildTenantExportStorageKey(tenantA, exportId));
  if (!zip || zip.readUInt32LE(0) !== 0x04034b50) failed = true;
  const patientsJson = readZipStoreFile(zip ?? Buffer.alloc(0), 'json/patients.json')?.toString('utf8') ?? '';
  const notesJson = readZipStoreFile(zip ?? Buffer.alloc(0), 'json/clinical_notes.json')?.toString('utf8') ?? '';
  const patientsCsv = readZipStoreFile(zip ?? Buffer.alloc(0), 'csv/patients.csv')?.toString('utf8') ?? '';
  const appointmentsCsv = readZipStoreFile(zip ?? Buffer.alloc(0), 'csv/appointments.csv')?.toString('utf8') ?? '';
  const rawZip = zip?.toString('utf8') ?? '';
  console.log('zip-a', {
    maria: patientsJson.includes('Maria ExportA'),
    zelda: patientsJson.includes('Zelda Isolamento Bravo') || rawZip.includes('Zelda Isolamento Bravo'),
    note: notesJson.includes(noteContent),
    csv: patientsCsv.includes('Maria ExportA') && appointmentsCsv.includes(patientAId),
    anexoA: rawZip.includes('anexo-clinica-a'),
    anexoB: rawZip.includes('anexo-clinica-b'),
  });
  if (!patientsJson.includes('Maria ExportA')) failed = true;
  if (patientsJson.includes('Zelda Isolamento Bravo') || rawZip.includes('Zelda Isolamento Bravo')) failed = true;
  if (!notesJson.includes(noteContent)) failed = true;
  if (!patientsCsv.includes('Maria ExportA') || !appointmentsCsv.includes(patientAId)) failed = true;
  if (!rawZip.includes('anexo-clinica-a') || rawZip.includes('anexo-clinica-b')) failed = true;

  const cross = await request(`/api/v1/privacy/exports/${exportId}`, {
    headers: authHeaders(tokenB, tenantB),
  });
  console.log('cross-tenant', cross.status);
  if (cross.status !== 404) failed = true;

  const recEmail = `s8-exp-rec-${stamp}@example.com`;
  const invite = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ email: recEmail, role: Role.RECEPTION }),
  });
  if (invite.status !== 201) failed = true;
  const inviteToken = `exp-rec-${stamp}`;
  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.invitation.update({
      where: { id: dataOf(invite).id as string },
      data: { tokenHash: hashToken(inviteToken), expiresAt: addDays(new Date(), 7) },
    });
  });
  jar.clear();
  const accept = await request('/api/v1/users/invitations/accept', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: inviteToken, name: 'Recepcionista', password }),
  });
  const recToken = dataOf(accept).accessToken as string;
  const recCreate = await request('/api/v1/privacy/exports', {
    method: 'POST',
    headers: { ...authHeaders(recToken, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  console.log('reception', recCreate.status, errorCode(recCreate));
  if (recCreate.status !== 403 || errorCode(recCreate) !== 'FORBIDDEN') failed = true;

  jar.clear();
  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.subscription.update({
      where: { tenantId: tenantA },
      data: { status: 'SUSPENDED' },
    });
  });
  const suspended = await request('/api/v1/privacy/exports', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  console.log('suspended', suspended.status, dataOf(suspended).status);
  if (suspended.status !== 202 || dataOf(suspended).status !== 'PENDING') failed = true;

  const audits = await request('/api/v1/audit-logs?limit=100', { headers: authHeaders(tokenA, tenantA) });
  const auditItems = ((dataOf(audits).items as Array<{ action: string; resourceId: string | null }>) ?? []);
  const hasRequested = auditItems.some(
    (row) => row.action === AuditAction.EXPORT_REQUESTED && row.resourceId === exportId,
  );
  const hasCompleted = auditItems.some(
    (row) => row.action === AuditAction.EXPORT_COMPLETED && row.resourceId === exportId,
  );
  console.log('audit-export', { hasRequested, hasCompleted });
  if (!hasRequested || !hasCompleted) failed = true;

  server.close();
  await prisma.$disconnect();

  if (failed) {
    console.error('FAIL: platform export smoke');
    process.exit(1);
  }
  console.log('OK: platform export smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
