import { once } from 'node:events';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';
import { getPrismaClient, getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { AuditAction, writeAuditLog } from '../src/shared/database/write_audit.js';
import { hashToken } from '../src/shared/helpers/token_hash.js';
import { addDays } from '../src/modules/identity/helpers/slug.helper.js';
import { Role } from '../src/modules/identity/enum/role/role.enum.js';

type Json = { status: number; body: Record<string, unknown> | null };
type AuditItem = {
  id: string;
  action: string;
  patientId: string | null;
  actorId: string | null;
  metadata: Record<string, unknown> | null;
};

async function main() {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    process.env.NODE_ENV = 'test';
  }

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
      email: `s8-audit-a-${stamp}@example.com`,
      password,
      clinicName: 'Clinica Auditoria A',
      ownerName: 'Owner Auditoria A',
    }),
  });
  console.log('signup-a', signupA.status);
  if (signupA.status !== 201) failed = true;
  const tokenA = dataOf(signupA).accessToken as string;
  const tenantA = (dataOf(signupA).tenant as { id: string }).id;
  const ownerA = (dataOf(signupA).user as { id: string }).id;
  const membershipA = (dataOf(signupA).membership as { id: string }).id;
  const smokeA = { tenantId: tenantA, userId: ownerA, requestId: 'smoke-platform-audit' };

  const signupB = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s8-audit-b-${stamp}@example.com`,
      password,
      clinicName: 'Clinica Auditoria B',
      ownerName: 'Owner Auditoria B',
    }),
  });
  console.log('signup-b', signupB.status);
  if (signupB.status !== 201) failed = true;
  const tokenB = dataOf(signupB).accessToken as string;
  const tenantB = (dataOf(signupB).tenant as { id: string }).id;

  const patient = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Maria Auditoria', phonePrimary: '62988880001', birthDate: '1990-01-15' }),
  });
  console.log('patient-create', patient.status);
  if (patient.status !== 201) failed = true;
  const patientId = (dataOf(patient).patient as { id: string }).id;

  const professional = await request('/api/v1/clinic/professionals', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ membershipId: membershipA, croNumber: '22222', croState: 'GO' }),
  });
  console.log('professional', professional.status);
  if (professional.status !== 201) failed = true;

  const recordGet = await request(`/api/v1/patients/${patientId}/record`, {
    headers: authHeaders(tokenA, tenantA),
  });
  console.log('record-get', recordGet.status);
  if (recordGet.status !== 200) failed = true;

  const noteContent = 'Realizada avaliação clínica inicial com registro de higiene e queixa principal.';
  const createNote = await request(`/api/v1/patients/${patientId}/record/notes`, {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ content: noteContent }),
  });
  console.log('note-create', createNote.status);
  if (createNote.status !== 201) failed = true;
  const noteId = dataOf(createNote).id as string;

  const amend = await request(`/api/v1/patients/${patientId}/record/notes/${noteId}/amend`, {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({
      content: `${noteContent} Complemento de exame periodontal.`,
      reason: 'Correcao de omissao no exame periodontal.',
    }),
  });
  console.log('note-amend', amend.status);
  if (amend.status !== 201) failed = true;

  await writeAuditLog({
    tenantId: tenantA,
    actorId: ownerA,
    action: AuditAction.READ,
    resourceType: 'medical_record',
    resourceId: patientId,
    patientId,
    metadata: { path: '/legacy-read' },
  });
  await writeAuditLog({
    tenantId: tenantA,
    actorId: ownerA,
    action: AuditAction.MESSAGE_SENT,
    resourceType: 'message',
    patientId,
    metadata: {
      templateKey: 'appointment_created',
      body: 'nao-deve-aparecer',
      cpf: '12345678901',
      toMasked: '****0001',
    },
  });

  async function listAudit(token: string, tenantId: string, query = ''): Promise<Json> {
    return request(`/api/v1/audit-logs${query}`, { headers: authHeaders(token, tenantId) });
  }

  async function waitItems(
    predicate: (items: AuditItem[]) => boolean,
    attempts = 20,
  ): Promise<AuditItem[]> {
    let items: AuditItem[] = [];
    for (let i = 0; i < attempts; i += 1) {
      const json = await listAudit(tokenA, tenantA, '?limit=100');
      items = ((dataOf(json).items as AuditItem[]) ?? []);
      if (json.status === 200 && predicate(items)) return items;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return items;
  }

  const items = await waitItems(
    (rows) =>
      rows.some((row) => row.action === AuditAction.CLINICAL_READ && row.patientId === patientId) &&
      rows.some((row) => row.action === AuditAction.NOTE_CREATED && row.patientId === patientId) &&
      rows.some((row) => row.action === AuditAction.NOTE_AMENDED && row.patientId === patientId),
  );
  const hasClinicalRead = items.some(
    (row) => row.action === AuditAction.CLINICAL_READ && row.patientId === patientId,
  );
  const hasNoteCreated = items.some((row) => row.action === AuditAction.NOTE_CREATED);
  const hasNoteAmended = items.some((row) => row.action === AuditAction.NOTE_AMENDED);
  console.log('owner-list', items.length, { hasClinicalRead, hasNoteCreated, hasNoteAmended });
  if (!hasClinicalRead || !hasNoteCreated || !hasNoteAmended) failed = true;
  if (JSON.stringify(items).includes(noteContent) || JSON.stringify(items).includes('nao-deve-aparecer')) {
    failed = true;
  }

  const byPatient = await listAudit(tokenA, tenantA, `?patientId=${patientId}&limit=100`);
  const patientItems = ((dataOf(byPatient).items as AuditItem[]) ?? []);
  console.log('filter-patient', byPatient.status, patientItems.length);
  if (byPatient.status !== 200 || patientItems.some((row) => row.patientId && row.patientId !== patientId)) {
    failed = true;
  }
  if (!patientItems.some((row) => row.action === AuditAction.CLINICAL_READ)) failed = true;

  const byClinical = await listAudit(tokenA, tenantA, '?action=CLINICAL_READ&limit=100');
  const clinicalItems = ((dataOf(byClinical).items as AuditItem[]) ?? []);
  const clinicalActions = new Set(clinicalItems.map((row) => row.action));
  console.log('filter-clinical-read', byClinical.status, [...clinicalActions]);
  if (byClinical.status !== 200) failed = true;
  if (!clinicalActions.has(AuditAction.CLINICAL_READ) || !clinicalActions.has(AuditAction.READ)) failed = true;
  if ([...clinicalActions].some((action) => action !== AuditAction.CLINICAL_READ && action !== AuditAction.READ)) {
    failed = true;
  }

  const messageRow = items.find((row) => row.action === AuditAction.MESSAGE_SENT);
  const messageMeta = messageRow?.metadata ?? {};
  console.log('message-metadata', messageMeta);
  if (messageMeta.body !== undefined) failed = true;
  if (typeof messageMeta.cpf === 'string' && messageMeta.cpf.includes('12345678901')) failed = true;
  if (messageMeta.toMasked !== '****0001') failed = true;

  const page = await listAudit(tokenA, tenantA, '?limit=1');
  console.log('cursor', page.status, Boolean(dataOf(page).nextCursor));
  if (page.status !== 200 || !dataOf(page).nextCursor) failed = true;

  const tooLongFrom = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
  const tooLong = await listAudit(
    tokenA,
    tenantA,
    `?from=${encodeURIComponent(tooLongFrom)}&to=${encodeURIComponent(new Date().toISOString())}`,
  );
  console.log('period-too-long', tooLong.status, errorCode(tooLong));
  if (tooLong.status !== 422 || errorCode(tooLong) !== 'PERIOD_TOO_LONG') failed = true;

  const prisma = getPrismaClient();
  const tenantDb = getTenantPrisma();

  const recEmail = `s8-audit-rec-${stamp}@example.com`;
  const invite = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, tenantA), 'content-type': 'application/json' },
    body: JSON.stringify({ email: recEmail, role: Role.RECEPTION }),
  });
  if (invite.status !== 201) failed = true;
  const inviteId = dataOf(invite).id as string;
  const inviteToken = `audit-rec-${stamp}`;
  await tenantDb.runInTenantContext(smokeA, async (tx) => {
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
  const recList = await listAudit(recToken, tenantA);
  console.log('reception-list', recList.status, errorCode(recList));
  if (recList.status !== 403 || errorCode(recList) !== 'FORBIDDEN') failed = true;

  const listB = await listAudit(tokenB, tenantB, '?limit=100');
  const itemsB = ((dataOf(listB).items as AuditItem[]) ?? []);
  console.log('tenant-b-list', listB.status, itemsB.length);
  if (listB.status !== 200) failed = true;
  if (itemsB.some((row) => row.patientId === patientId)) failed = true;

  const sampleId = items.find((row) => row.action === AuditAction.NOTE_CREATED)?.id;
  let updateBlocked = false;
  let deleteBlocked = false;
  if (sampleId) {
    try {
      await tenantDb.runInTenantContext(smokeA, async (tx) => {
        await tx.auditLog.update({ where: { id: sampleId }, data: { action: 'TAMPER' } });
      });
    } catch {
      updateBlocked = true;
    }
    try {
      await tenantDb.runInTenantContext(smokeA, async (tx) => {
        await tx.auditLog.delete({ where: { id: sampleId } });
      });
    } catch {
      deleteBlocked = true;
    }
  }
  console.log('append-only', { updateBlocked, deleteBlocked });
  if (!updateBlocked || !deleteBlocked) failed = true;

  server.close();
  await prisma.$disconnect();

  if (failed) {
    console.error('FAIL: platform audit smoke');
    process.exit(1);
  }
  console.log('OK: platform audit smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
