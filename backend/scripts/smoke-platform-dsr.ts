process.env.STORAGE_FAKE = '1';

import { once } from 'node:events';
import type { Server } from 'node:http';
import { Role } from '../src/modules/identity/enum/role/role.enum.js';
import { AuditAction } from '../src/shared/database/write_audit.js';
import { hashToken } from '../src/shared/helpers/token_hash.js';
import { addDays } from '../src/modules/identity/helpers/slug.helper.js';
import { getPrismaClient, getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { idGenerator } from '../src/shared/helpers/id_generator.js';
import { hasMarketingConsent } from '../src/modules/patients/patients_public.js';
import { patientPackageJob } from '../src/modules/platform/jobs/patient_package.job.js';
import { dsrDueReminderJob } from '../src/modules/platform/jobs/dsr_due_reminder.job.js';
import { PATIENT_PACKAGE_PRESIGN_TTL_SECONDS } from '../src/modules/platform/helpers/patient_package_storage.helper.js';
import { readZipStoreFile } from '../src/modules/platform/helpers/zip_store.helper.js';
import { getObjectStorage, resetObjectStorageForTests } from '../src/shared/storage/index.js';
import { buildPatientPackageStorageKey } from '../src/modules/platform/helpers/patient_package_storage.helper.js';

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

  function authHeaders(token: string, tenantId?: string): HeadersInit {
    const headers: Record<string, string> = { authorization: `Bearer ${token}` };
    if (tenantId) headers['x-tenant-id'] = tenantId;
    return headers;
  }

  const password = 'SenhaForte!99';
  const signupA = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s8-dsr-a-${stamp}@example.com`,
      password,
      clinicName: 'Clinica DSR A',
      ownerName: 'Owner DSR A',
    }),
  });
  console.log('signup-a', signupA.status);
  if (signupA.status !== 201) failed = true;
  const tokenA = dataOf(signupA).accessToken as string;
  const tenantA = (dataOf(signupA).tenant as { id: string }).id;
  const ownerA = (dataOf(signupA).user as { id: string }).id;
  const membershipA = (dataOf(signupA).membership as { id: string }).id;
  const ctxA = { tenantId: tenantA, userId: ownerA, requestId: 'smoke-platform-dsr' };

  const signupB = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s8-dsr-b-${stamp}@example.com`,
      password,
      clinicName: 'Clinica DSR B',
      ownerName: 'Owner DSR B',
    }),
  });
  if (signupB.status !== 201) failed = true;
  const tokenB = dataOf(signupB).accessToken as string;
  const tenantB = (dataOf(signupB).tenant as { id: string }).id;

  const patientA = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Maria DsrA', phonePrimary: '62980001001', birthDate: '1990-01-15' }),
  });
  const patientAId = (dataOf(patientA).patient as { id: string }).id;
  const patientB = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(tokenB, tenantB), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Zelda Isolamento Bravo', phonePrimary: '62980001002' }),
  });
  const patientBId = (dataOf(patientB).patient as { id: string }).id;
  if (patientA.status !== 201 || patientB.status !== 201) failed = true;

  const professional = await request('/api/v1/clinic/professionals', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ membershipId: membershipA, croNumber: '44444', croState: 'GO' }),
  });
  if (professional.status !== 201) failed = true;

  const noteContent = 'Evolucao exclusiva da Maria no DSR ACCESS.';
  const note = await request(`/api/v1/patients/${patientAId}/record/notes`, {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ content: noteContent }),
  });
  console.log('note-a', note.status);
  if (note.status !== 201) failed = true;

  const access = await request('/api/v1/privacy/data-subject-requests', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ patientId: patientAId, type: 'ACCESS' }),
  });
  console.log('access-create', access.status, dataOf(access).status, dataOf(access).id);
  if (access.status !== 201 || dataOf(access).status !== 'RECEIVED' || !dataOf(access).id) {
    failed = true;
  }
  const accessId = dataOf(access).id as string;
  const dueAt = new Date(String(dataOf(access).dueAt)).getTime();
  const expectedDue = Date.now() + 15 * 24 * 60 * 60 * 1000;
  if (Number.isNaN(dueAt) || Math.abs(dueAt - expectedDue) > 120_000) failed = true;
  if (dataOf(access).exportUrl !== null) failed = true;

  await patientPackageJob({ tenantId: tenantA, requestId: ctxA.requestId, dsrId: accessId });

  const accessGet = await request(`/api/v1/privacy/data-subject-requests/${accessId}`, {
    headers: authHeaders(tokenA, tenantA),
  });
  console.log('access-get', accessGet.status, dataOf(accessGet).status, Boolean(dataOf(accessGet).exportUrl));
  if (accessGet.status !== 200 || dataOf(accessGet).status !== 'IN_PROGRESS') failed = true;
  if (typeof dataOf(accessGet).exportUrl !== 'string') failed = true;
  if (dataOf(accessGet).expiresIn !== PATIENT_PACKAGE_PRESIGN_TTL_SECONDS) failed = true;

  const zip = await getObjectStorage().getObject(buildPatientPackageStorageKey(tenantA, accessId));
  const jsonText = readZipStoreFile(zip ?? Buffer.alloc(0), 'paciente.json')?.toString('utf8') ?? '';
  const pdf = readZipStoreFile(zip ?? Buffer.alloc(0), 'paciente.pdf');
  const rawZip = zip?.toString('utf8') ?? '';
  console.log('package', {
    maria: jsonText.includes('Maria DsrA'),
    zelda: jsonText.includes('Zelda Isolamento Bravo') || rawZip.includes('Zelda Isolamento Bravo'),
    note: jsonText.includes(noteContent),
    pdf: Boolean(pdf && pdf.length > 100),
  });
  if (!jsonText.includes('Maria DsrA')) failed = true;
  if (jsonText.includes('Zelda Isolamento Bravo') || rawZip.includes('Zelda Isolamento Bravo')) failed = true;
  if (!jsonText.includes(noteContent)) failed = true;
  if (!pdf || pdf.length < 100) failed = true;

  const cross = await request(`/api/v1/privacy/data-subject-requests/${accessId}`, {
    headers: authHeaders(tokenB, tenantB),
  });
  console.log('cross-tenant', cross.status);
  if (cross.status !== 404) failed = true;

  const listB = await request('/api/v1/privacy/data-subject-requests', {
    headers: authHeaders(tokenB, tenantB),
  });
  const itemsB = ((dataOf(listB).items as Array<{ id: string }>) ?? []);
  if (itemsB.some((row) => row.id === accessId)) failed = true;

  const foreignPatient = await request('/api/v1/privacy/data-subject-requests', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ patientId: patientBId, type: 'ACCESS' }),
  });
  console.log('foreign-patient', foreignPatient.status);
  if (foreignPatient.status !== 404) failed = true;

  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.consent.create({
      data: {
        id: idGenerator.next(),
        tenantId: tenantA,
        patientId: patientAId,
        type: 'WHATSAPP_MARKETING',
        granted: true,
        documentVersion: 'v1',
        channel: 'IN_PERSON',
      },
    });
  });
  if (!(await hasMarketingConsent(ctxA, patientAId))) failed = true;

  const revoke = await request('/api/v1/privacy/data-subject-requests', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ patientId: patientAId, type: 'REVOKE_CONSENT' }),
  });
  console.log('revoke', revoke.status, dataOf(revoke).status);
  if (revoke.status !== 201 || dataOf(revoke).status !== 'COMPLETED') failed = true;
  if (await hasMarketingConsent(ctxA, patientAId)) failed = true;

  const correction = await request('/api/v1/privacy/data-subject-requests', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({
      patientId: patientAId,
      type: 'CORRECTION',
      notes: 'Corrigir grafia do nome na ficha.',
    }),
  });
  const correctionId = dataOf(correction).id as string;
  if (correction.status !== 201 || dataOf(correction).status !== 'RECEIVED') failed = true;

  const notesAfterCorrection = await request(`/api/v1/patients/${patientAId}/record/notes`, {
    headers: authHeaders(tokenA, tenantA),
  });
  const noteItems = (dataOf(notesAfterCorrection).items as Array<{ content?: string }>) ??
    ((notesAfterCorrection.body?.data as { items?: Array<{ content?: string }> })?.items ?? []);
  const stillHasNote =
    JSON.stringify(notesAfterCorrection.body).includes(noteContent) ||
    noteItems.some((row) => row.content === noteContent);
  if (!stillHasNote) failed = true;

  const completeCorrection = await request(`/api/v1/privacy/data-subject-requests/${correctionId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'COMPLETED', resolution: 'Nome corrigido na ficha cadastral.' }),
  });
  console.log('correction-complete', completeCorrection.status, dataOf(completeCorrection).status);
  if (completeCorrection.status !== 200 || dataOf(completeCorrection).status !== 'COMPLETED') {
    failed = true;
  }

  const deletion = await request('/api/v1/privacy/data-subject-requests', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ patientId: patientAId, type: 'DELETION' }),
  });
  console.log('deletion', deletion.status, dataOf(deletion).status);
  if (deletion.status !== 201 || dataOf(deletion).status !== 'IN_PROGRESS') failed = true;
  const notesAfterDeletion = await request(`/api/v1/patients/${patientAId}/record/notes`, {
    headers: authHeaders(tokenA, tenantA),
  });
  if (!JSON.stringify(notesAfterDeletion.body).includes(noteContent)) failed = true;

  const recEmail = `s8-dsr-rec-${stamp}@example.com`;
  const invite = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ email: recEmail, role: Role.RECEPTION }),
  });
  if (invite.status !== 201) failed = true;
  const inviteToken = `dsr-rec-${stamp}`;
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
  const recCreate = await request('/api/v1/privacy/data-subject-requests', {
    method: 'POST',
    headers: { ...authHeaders(recToken, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ patientId: patientAId, type: 'ACCESS' }),
  });
  console.log('reception', recCreate.status, errorCode(recCreate));
  if (recCreate.status !== 403 || errorCode(recCreate) !== 'FORBIDDEN') failed = true;

  jar.clear();
  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.dataSubjectRequest.update({
      where: { id: accessId },
      data: { dueAt: new Date() },
    });
  });
  await dsrDueReminderJob({
    tenantId: tenantA,
    requestId: 'smoke-dsr-reminder',
    timezone: 'America/Sao_Paulo',
  });

  const audits = await request('/api/v1/audit-logs?limit=100', { headers: authHeaders(tokenA, tenantA) });
  const auditItems = ((dataOf(audits).items as Array<{ action: string; resourceId: string | null }>) ?? []);
  const hasCreated = auditItems.some(
    (row) => row.action === AuditAction.DSR_CREATED && row.resourceId === accessId,
  );
  const hasCompleted = auditItems.some(
    (row) => row.action === AuditAction.DSR_COMPLETED && row.resourceId === correctionId,
  );
  console.log('audit-dsr', { hasCreated, hasCompleted });
  if (!hasCreated || !hasCompleted) failed = true;

  server.close();
  await prisma.$disconnect();

  if (failed) {
    console.error('FAIL: platform dsr smoke');
    process.exit(1);
  }
  console.log('OK: platform dsr smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
