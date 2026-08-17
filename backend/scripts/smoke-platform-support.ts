process.env.STORAGE_FAKE = '1';

import { once } from 'node:events';
import type { Server } from 'node:http';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../src/shared/database/write_audit.js';
import { getPrismaClient } from '../src/shared/database/tenant_prisma.js';
import { patientAnonymizeJob } from '../src/modules/platform/jobs/patient_anonymize.job.js';

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  process.env.NODE_ENV = 'test';
}

type Json = { status: number; body: Record<string, unknown> | null };

async function main() {
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

  function authHeaders(
    token: string,
    extra?: { tenantId?: string; grantId?: string },
  ): HeadersInit {
    const headers: Record<string, string> = { authorization: `Bearer ${token}` };
    if (extra?.tenantId) headers['x-tenant-id'] = extra.tenantId;
    if (extra?.grantId) headers['x-support-grant-id'] = extra.grantId;
    return headers;
  }

  const password = 'SenhaForte!99';
  const mariaName = 'Maria Silva Anon';
  const mariaPhone = '62980002001';
  const mariaEmail = `maria-anon-${stamp}@example.com`;
  const pedroName = 'Pedro Nao Anonimizado';
  const noteContent = 'Evolucao clinica que deve permanecer apos anonimizacao.';
  const reason = 'Investigar ticket de piloto S8 com acesso temporario de leitura.';

  const signupA = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s8-support-a-${stamp}@example.com`,
      password,
      clinicName: 'Clinica Support A',
      ownerName: 'Owner Support A',
    }),
  });
  console.log('signup-a', signupA.status);
  if (signupA.status !== 201) failed = true;
  const tokenA = dataOf(signupA).accessToken as string;
  const tenantA = (dataOf(signupA).tenant as { id: string }).id;
  const membershipA = (dataOf(signupA).membership as { id: string }).id;

  const maria = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, { tenantId: tenantA }), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: mariaName,
      phonePrimary: mariaPhone,
      email: mariaEmail,
      birthDate: '1990-01-15',
    }),
  });
  const mariaId = (dataOf(maria).patient as { id: string } | undefined)?.id
    ?? (dataOf(maria).id as string | undefined);
  if (maria.status !== 201 || !mariaId) failed = true;

  const pedro = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, { tenantId: tenantA }), 'content-type': 'application/json' },
    body: JSON.stringify({ name: pedroName, phonePrimary: '62980002002' }),
  });
  const pedroId = (dataOf(pedro).patient as { id: string } | undefined)?.id
    ?? (dataOf(pedro).id as string | undefined);
  if (pedro.status !== 201 || !pedroId) failed = true;

  const professional = await request('/api/v1/clinic/professionals', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, { tenantId: tenantA }), 'content-type': 'application/json' },
    body: JSON.stringify({ membershipId: membershipA, croNumber: '55555', croState: 'GO' }),
  });
  if (professional.status !== 201) failed = true;

  const note = await request(`/api/v1/patients/${mariaId}/record/notes`, {
    method: 'POST',
    headers: { ...authHeaders(tokenA, { tenantId: tenantA }), 'content-type': 'application/json' },
    body: JSON.stringify({ content: noteContent }),
  });
  console.log('note-a', note.status);
  if (note.status !== 201) failed = true;

  const deletion = await request('/api/v1/privacy/data-subject-requests', {
    method: 'POST',
    headers: { ...authHeaders(tokenA, { tenantId: tenantA }), 'content-type': 'application/json' },
    body: JSON.stringify({ patientId: mariaId, type: 'DELETION' }),
  });
  console.log('deletion', deletion.status, dataOf(deletion).status);
  if (deletion.status !== 201 || dataOf(deletion).status !== 'IN_PROGRESS') failed = true;
  const deletionId = dataOf(deletion).id as string;

  await patientAnonymizeJob({
    tenantId: tenantA,
    requestId: 'smoke-platform-support',
    dsrId: deletionId,
  });

  const mariaAfter = await request(`/api/v1/patients/${mariaId}`, {
    headers: authHeaders(tokenA, { tenantId: tenantA }),
  });
  const mariaData = dataOf(mariaAfter);
  const mariaAnonName = String(mariaData.name ?? '');
  console.log('anon-maria', mariaAfter.status, mariaAnonName);
  if (mariaAfter.status !== 200) failed = true;
  if (!mariaAnonName.startsWith('ANON ')) failed = true;
  if (mariaAnonName.includes('Maria')) failed = true;
  if (mariaData.email === mariaEmail) failed = true;
  if (mariaData.phonePrimary === mariaPhone) failed = true;
  if (mariaData.cpf) failed = true;

  const notesAfter = await request(`/api/v1/patients/${mariaId}/record/notes`, {
    headers: authHeaders(tokenA, { tenantId: tenantA }),
  });
  if (!JSON.stringify(notesAfter.body).includes(noteContent)) failed = true;

  const pedroAfter = await request(`/api/v1/patients/${pedroId}`, {
    headers: authHeaders(tokenA, { tenantId: tenantA }),
  });
  if (dataOf(pedroAfter).name !== pedroName) failed = true;

  const deletionGet = await request(`/api/v1/privacy/data-subject-requests/${deletionId}`, {
    headers: authHeaders(tokenA, { tenantId: tenantA }),
  });
  if (deletionGet.status !== 200 || dataOf(deletionGet).status !== 'COMPLETED') failed = true;

  jar.clear();
  const signupOp1 = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s8-op1-${stamp}@example.com`,
      password,
      clinicName: 'Ops Dummy 1',
      ownerName: 'Operador Um',
    }),
  });
  if (signupOp1.status !== 201) failed = true;
  const tokenOp1 = dataOf(signupOp1).accessToken as string;
  const op1Id = (dataOf(signupOp1).user as { id: string }).id;

  jar.clear();
  const signupOp2 = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s8-op2-${stamp}@example.com`,
      password,
      clinicName: 'Ops Dummy 2',
      ownerName: 'Operador Dois',
    }),
  });
  if (signupOp2.status !== 201) failed = true;
  const tokenOp2 = dataOf(signupOp2).accessToken as string;
  const op2Id = (dataOf(signupOp2).user as { id: string }).id;

  await prisma.user.update({
    where: { id: op1Id },
    data: { platformRole: 'OPERATOR' },
  });
  await prisma.user.update({
    where: { id: op2Id },
    data: { platformRole: 'OPERATOR' },
  });

  jar.clear();
  const withoutGrant = await request(`/api/v1/patients/${mariaId}`, {
    headers: authHeaders(tokenOp1, { tenantId: tenantA }),
  });
  console.log('op1-no-grant', withoutGrant.status, errorCode(withoutGrant));
  if (withoutGrant.status !== 404) failed = true;

  const shortReason = await request('/api/v1/internal/support-access', {
    method: 'POST',
    headers: { ...authHeaders(tokenOp1), 'content-type': 'application/json' },
    body: JSON.stringify({ tenantId: tenantA, reason: 'motivo curto' }),
  });
  if (shortReason.status !== 422 || errorCode(shortReason) !== 'REASON_TOO_SHORT') failed = true;

  const badWindow = await request('/api/v1/internal/support-access', {
    method: 'POST',
    headers: { ...authHeaders(tokenOp1), 'content-type': 'application/json' },
    body: JSON.stringify({ tenantId: tenantA, reason, hours: 5 }),
  });
  if (badWindow.status !== 422 || errorCode(badWindow) !== 'GRANT_WINDOW_INVALID') failed = true;

  const createGrant = await request('/api/v1/internal/support-access', {
    method: 'POST',
    headers: { ...authHeaders(tokenOp1), 'content-type': 'application/json' },
    body: JSON.stringify({ tenantId: tenantA, reason, hours: 4 }),
  });
  console.log('grant-create', createGrant.status, dataOf(createGrant).status);
  if (createGrant.status !== 201 || dataOf(createGrant).status !== 'PENDING') failed = true;
  const grantId = dataOf(createGrant).id as string;

  const selfApprove = await request(`/api/v1/internal/support-access/${grantId}/approve`, {
    method: 'POST',
    headers: authHeaders(tokenOp1),
  });
  console.log('self-approve', selfApprove.status, errorCode(selfApprove));
  if (selfApprove.status !== 409 || errorCode(selfApprove) !== 'SELF_APPROVAL_FORBIDDEN') {
    failed = true;
  }

  const pendingUse = await request(`/api/v1/patients/${mariaId}`, {
    headers: authHeaders(tokenOp1, { tenantId: tenantA, grantId }),
  });
  if (pendingUse.status !== 404) failed = true;

  jar.clear();
  const approve = await request(`/api/v1/internal/support-access/${grantId}/approve`, {
    method: 'POST',
    headers: authHeaders(tokenOp2),
  });
  const expiresAt = new Date(String(dataOf(approve).expiresAt));
  const maxWindow = Date.now() + 4 * 60 * 60 * 1000 + 5_000;
  console.log('approve', approve.status, dataOf(approve).status, dataOf(approve).expiresAt);
  if (approve.status !== 200 || dataOf(approve).status !== 'APPROVED') failed = true;
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() > maxWindow) failed = true;
  if (dataOf(approve).approverId !== op2Id) failed = true;

  const audits = await request('/api/v1/audit-logs?limit=100', {
    headers: authHeaders(tokenA, { tenantId: tenantA }),
  });
  const auditItems = ((dataOf(audits).items as Array<{ action: string; resourceId: string | null }>) ?? []);
  const granted = auditItems.some(
    (row) => row.action === AuditAction.SUPPORT_ACCESS_GRANTED && row.resourceId === grantId,
  );
  console.log('audit-granted', granted);
  if (!granted) failed = true;

  jar.clear();
  const op2Use = await request(`/api/v1/patients/${mariaId}`, {
    headers: authHeaders(tokenOp2, { tenantId: tenantA, grantId }),
  });
  if (op2Use.status !== 404) failed = true;

  const withGrant = await request(`/api/v1/patients/${mariaId}`, {
    headers: authHeaders(tokenOp1, { tenantId: tenantA, grantId }),
  });
  console.log('op1-with-grant', withGrant.status, dataOf(withGrant).name);
  if (withGrant.status !== 200) failed = true;
  if (!String(dataOf(withGrant).name ?? '').startsWith('ANON ')) failed = true;

  const auditsUsed = await request('/api/v1/audit-logs?limit=100', {
    headers: authHeaders(tokenA, { tenantId: tenantA }),
  });
  const usedItems = ((dataOf(auditsUsed).items as Array<{ action: string; resourceId: string | null }>) ?? []);
  const used = usedItems.some(
    (row) => row.action === AuditAction.SUPPORT_ACCESS_USED && row.resourceId === grantId,
  );
  console.log('audit-used', used);
  if (!used) failed = true;

  await prisma.$executeRaw(
    Prisma.sql`UPDATE platform.support_access SET expires_at = NOW() - INTERVAL '1 minute' WHERE id = ${grantId}::uuid`,
  );

  const expired = await request(`/api/v1/patients/${mariaId}`, {
    headers: authHeaders(tokenOp1, { tenantId: tenantA, grantId }),
  });
  console.log('expired', expired.status, errorCode(expired));
  if (expired.status !== 404) failed = true;

  server.close();
  await prisma.$disconnect();

  if (failed) {
    console.error('FAIL: platform support smoke');
    process.exit(1);
  }
  console.log('OK: platform support smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
