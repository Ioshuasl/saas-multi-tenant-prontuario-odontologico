import { once } from 'node:events';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';
import { authenticateMiddleware } from '../src/shared/middlewares/authenticate.middleware.js';
import { authorize } from '../src/shared/middlewares/authorize.middleware.js';
import { tenantContextMiddleware } from '../src/shared/middlewares/tenant_context.middleware.js';
import { getPrismaClient, getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { hashToken } from '../src/shared/helpers/token_hash.js';
import { idGenerator } from '../src/shared/helpers/id_generator.js';
import { addDays, addHours } from '../src/modules/identity/helpers/slug.helper.js';
import { Role } from '../src/modules/identity/enum/role/role.enum.js';
import { AuditAction } from '../src/shared/database/write_audit.js';

type Json = { status: number; body: Record<string, unknown> | null };

async function main() {
  const app = createApp({
    registerApi: (api) => {
      api.get(
        '/patients/:patientId/record',
        (req, res, next) => {
          void authenticateMiddleware(req, res, next);
        },
        tenantContextMiddleware,
        authorize('clinical_records.read'),
        (_req, res) => {
          res.status(200).json({ data: { ok: true } });
        },
      );
    },
  });

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
      headers.set(
        'cookie',
        [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; '),
      );
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

  const ownerEmail = `s2-owner-${stamp}@example.com`;
  const owner2Email = `s2-owner2-${stamp}@example.com`;
  const receptionEmail = `s2-rec-${stamp}@example.com`;
  const password = 'SenhaForte!99';

  const signup1 = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: ownerEmail,
      password,
      clinicName: 'Clinica Bloco2 A',
      ownerName: 'Owner A',
    }),
  });
  console.log('signup-a', signup1.status);
  if (signup1.status !== 201) failed = true;
  const tokenA = dataOf(signup1).accessToken as string;
  const tenantA = (dataOf(signup1).tenant as { id: string }).id;
  const ownerUserId = (dataOf(signup1).user as { id: string }).id;

  const me = await request('/api/v1/auth/me', {
    headers: { authorization: `Bearer ${tokenA}` },
  });
  console.log('me', me.status, Array.isArray((dataOf(me).memberships as unknown[]) ?? []));
  if (me.status !== 200) failed = true;
  const meData = dataOf(me);
  const perms = (meData.current as { permissions: string[] }).permissions;
  if (!perms.includes('users.manage') || !perms.includes('clinical_records.read')) failed = true;

  const signup2 = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: owner2Email,
      password,
      clinicName: 'Clinica Bloco2 B',
      ownerName: 'Owner B',
    }),
  });
  if (signup2.status !== 201) failed = true;
  const tokenB = dataOf(signup2).accessToken as string;
  const tenantB = (dataOf(signup2).tenant as { id: string }).id;

  const inviteA = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${tokenB}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email: ownerEmail, role: Role.DENTIST }),
  });
  console.log('invite-cross', inviteA.status);
  if (inviteA.status !== 201) failed = true;
  const inviteAId = dataOf(inviteA).id as string;

  const prisma = getPrismaClient();
  const tenantDb = getTenantPrisma();
  const knownInviteToken = `invite-token-${stamp}`;
  await tenantDb.runInTenantContext(
    { tenantId: tenantB, userId: (dataOf(signup2).user as { id: string }).id, requestId: 'smoke' },
    async (tx) => {
      await tx.invitation.update({
        where: { id: inviteAId },
        data: { tokenHash: hashToken(knownInviteToken), expiresAt: addDays(new Date(), 7) },
      });
    },
  );

  const accept = await request('/api/v1/users/invitations/accept', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token: knownInviteToken,
      name: 'Owner A',
      password,
    }),
  });
  console.log('accept', accept.status, errorCode(accept));
  if (accept.status !== 200) failed = true;

  jar.clear();
  const loginA = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ownerEmail, password }),
  });
  const tokenA2 = dataOf(loginA).accessToken as string;
  const me2 = await request('/api/v1/auth/me', {
    headers: { authorization: `Bearer ${tokenA2}` },
  });
  const membershipCount = ((dataOf(me2).memberships as unknown[]) ?? []).length;
  console.log('me-multi', me2.status, membershipCount);
  if (membershipCount < 2) failed = true;

  const switched = await request('/api/v1/auth/switch-tenant', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${tokenA2}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ tenantId: tenantB }),
  });
  console.log('switch-tenant', switched.status);
  if (switched.status !== 200) failed = true;
  const tokenSwitched = dataOf(switched).accessToken as string;

  const deniedTenant = await request('/api/v1/auth/me', {
    headers: {
      authorization: `Bearer ${tokenSwitched}`,
      'x-tenant-id': '00000000-0000-0000-0000-000000000000',
    },
  });
  console.log('tenant-denied', deniedTenant.status, errorCode(deniedTenant));
  if (deniedTenant.status !== 403 || errorCode(deniedTenant) !== 'TENANT_NOT_ALLOWED') failed = true;

  const inviteRec = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${tokenA}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email: receptionEmail, role: Role.RECEPTION }),
  });
  console.log('invite-reception', inviteRec.status);
  if (inviteRec.status !== 201) failed = true;
  const recInviteId = dataOf(inviteRec).id as string;
  const recToken = `rec-token-${stamp}`;
  await tenantDb.runInTenantContext(
    { tenantId: tenantA, userId: ownerUserId, requestId: 'smoke' },
    async (tx) => {
      await tx.invitation.update({
        where: { id: recInviteId },
        data: { tokenHash: hashToken(recToken), expiresAt: addDays(new Date(), 7) },
      });
    },
  );

  const acceptRec = await request('/api/v1/users/invitations/accept', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token: recToken,
      name: 'Recepcionista',
      password,
    }),
  });
  console.log('accept-reception', acceptRec.status);
  if (acceptRec.status !== 200) failed = true;
  const recAccess = dataOf(acceptRec).accessToken as string;
  const recPerms = (
    await request('/api/v1/auth/me', { headers: { authorization: `Bearer ${recAccess}` } })
  );
  const recCurrent = dataOf(recPerms).current as { permissions: string[] };
  if (recCurrent.permissions.includes('clinical_records.read')) {
    console.error('FAIL: RECEPTION não deve ter clinical_records.read');
    failed = true;
  }

  const record = await request('/api/v1/patients/00000000-0000-0000-0000-000000000001/record', {
    headers: { authorization: `Bearer ${recAccess}` },
  });
  console.log('reception-record', record.status, errorCode(record));
  if (record.status !== 403 || errorCode(record) !== 'FORBIDDEN') failed = true;

  await new Promise((r) => setTimeout(r, 50));
  const deniedAudit = await tenantDb.runInTenantContext(
    { tenantId: tenantA, userId: ownerUserId, requestId: 'smoke' },
    async (tx) =>
      tx.auditLog.findFirst({
        where: { action: AuditAction.PERMISSION_DENIED, tenantId: tenantA },
        orderBy: { createdAt: 'desc' },
      }),
  );
  console.log('audit-denied', Boolean(deniedAudit));
  if (!deniedAudit) failed = true;

  const demote = await request(`/api/v1/users/${ownerUserId}`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${tokenA}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ role: Role.DENTIST }),
  });
  console.log('last-owner', demote.status, errorCode(demote));
  if (demote.status !== 422 || errorCode(demote) !== 'BUSINESS_RULE_VIOLATION') failed = true;

  const members = await request('/api/v1/users', {
    headers: { authorization: `Bearer ${tokenA}` },
  });
  console.log('list-users', members.status, Array.isArray(members.body?.data));
  if (members.status !== 200) failed = true;

  const resend = await request(`/api/v1/users/invitations/${recInviteId}/resend`, {
    method: 'POST',
    headers: { authorization: `Bearer ${tokenA}` },
  });
  console.log('resend-used', resend.status, errorCode(resend));
  if (resend.status !== 409) failed = true;

  const recOnUsers = await request('/api/v1/users', {
    headers: { authorization: `Bearer ${recAccess}` },
  });
  console.log('reception-users', recOnUsers.status, errorCode(recOnUsers));
  if (recOnUsers.status !== 403) failed = true;

  const forgot = await request('/api/v1/auth/password/forgot', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ownerEmail }),
  });
  console.log('forgot', forgot.status);
  if (forgot.status !== 202) failed = true;

  const resetRaw = `reset-${stamp}`;
  await prisma.passwordResetToken.create({
    data: {
      id: idGenerator.next(),
      userId: ownerUserId,
      tokenHash: hashToken(resetRaw),
      expiresAt: addHours(new Date(), 1),
    },
  });
  const reset = await request('/api/v1/auth/password/reset', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: resetRaw, password: 'OutraSenha!88' }),
  });
  console.log('reset', reset.status);
  if (reset.status !== 200) failed = true;

  const loginOld = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ownerEmail, password }),
  });
  console.log('login-old-password', loginOld.status);
  if (loginOld.status !== 401) failed = true;

  const loginNew = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ownerEmail, password: 'OutraSenha!88' }),
  });
  console.log('login-new-password', loginNew.status);
  if (loginNew.status !== 200) failed = true;

  server.close();
  await prisma.$disconnect();

  if (failed) {
    console.error('FAIL: identity smoke');
    process.exit(1);
  }
  console.log('OK: identity smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
