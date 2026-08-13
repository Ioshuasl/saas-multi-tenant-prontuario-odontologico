import { once } from 'node:events';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';
import { getPrismaClient, getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { hashToken } from '../src/shared/helpers/token_hash.js';
import { addDays } from '../src/modules/identity/helpers/slug.helper.js';
import { Role } from '../src/modules/identity/enum/role/role.enum.js';

type Json = { status: number; body: Record<string, unknown> | null };

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
  const ownerEmail = `s4-odonto-${stamp}@example.com`;
  const receptionEmail = `s4-odonto-rec-${stamp}@example.com`;

  const signup = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: ownerEmail,
      password,
      clinicName: 'Clinica Odontograma',
      ownerName: 'Owner Odontograma',
    }),
  });
  console.log('signup', signup.status);
  if (signup.status !== 201) failed = true;
  const token = dataOf(signup).accessToken as string;
  const tenantId = (dataOf(signup).tenant as { id: string }).id;
  const ownerUserId = (dataOf(signup).user as { id: string }).id;

  const createPatient = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Joao Silva', phonePrimary: '62999991111' }),
  });
  console.log('patient-create', createPatient.status);
  if (createPatient.status !== 201) failed = true;
  const patientId = (dataOf(createPatient).patient as { id: string }).id;

  const empty = await request(
    `/api/v1/patients/${patientId}/record/odontogram?dentition=PERMANENT`,
    { headers: authHeaders(token, tenantId) },
  );
  console.log('odontogram-empty', empty.status, (dataOf(empty).teeth as unknown[])?.length);
  if (empty.status !== 200) failed = true;
  if (!Array.isArray(dataOf(empty).teeth) || (dataOf(empty).teeth as unknown[]).length !== 0) {
    failed = true;
  }

  const putCaries = await request(`/api/v1/patients/${patientId}/record/odontogram/teeth/26`, {
    method: 'PUT',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ dentition: 'PERMANENT', face: 'O', condition: 'CARIES', notes: null }),
  });
  console.log('put-caries', putCaries.status, dataOf(putCaries).condition);
  if (putCaries.status !== 200 || dataOf(putCaries).condition !== 'CARIES') failed = true;
  const atAfterCaries = new Date().toISOString();
  await new Promise((r) => setTimeout(r, 80));

  const putRestored = await request(`/api/v1/patients/${patientId}/record/odontogram/teeth/26`, {
    method: 'PUT',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ dentition: 'PERMANENT', face: 'O', condition: 'RESTORED' }),
  });
  console.log('put-restored', putRestored.status, dataOf(putRestored).condition);
  if (putRestored.status !== 200 || dataOf(putRestored).condition !== 'RESTORED') failed = true;

  const current = await request(
    `/api/v1/patients/${patientId}/record/odontogram?dentition=PERMANENT`,
    { headers: authHeaders(token, tenantId) },
  );
  const currentTeeth = (dataOf(current).teeth as Array<Record<string, unknown>>) ?? [];
  const tooth26 = currentTeeth.find((t) => t.toothCode === '26' && t.face === 'O');
  console.log('get-current', current.status, tooth26?.condition, (tooth26?.history as unknown[])?.length);
  if (current.status !== 200 || tooth26?.condition !== 'RESTORED') failed = true;
  if (!Array.isArray(tooth26?.history) || (tooth26?.history as unknown[]).length < 2) failed = true;

  const historical = await request(
    `/api/v1/patients/${patientId}/record/odontogram?dentition=PERMANENT&at=${encodeURIComponent(atAfterCaries)}`,
    { headers: authHeaders(token, tenantId) },
  );
  const histTeeth = (dataOf(historical).teeth as Array<Record<string, unknown>>) ?? [];
  const hist26 = histTeeth.find((t) => t.toothCode === '26' && t.face === 'O');
  console.log('get-at', historical.status, hist26?.condition);
  if (historical.status !== 200 || hist26?.condition !== 'CARIES') {
    console.error('FAIL: reconstrução ?at= deveria ser CARIES', hist26);
    failed = true;
  }

  const invalid = await request(`/api/v1/patients/${patientId}/record/odontogram/teeth/99`, {
    method: 'PUT',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ dentition: 'PERMANENT', condition: 'HEALTHY' }),
  });
  console.log('put-invalid', invalid.status, errorCode(invalid));
  if (invalid.status !== 422 || errorCode(invalid) !== 'BUSINESS_RULE_VIOLATION') failed = true;

  const deciduous = await request(`/api/v1/patients/${patientId}/record/odontogram/teeth/51`, {
    method: 'PUT',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ dentition: 'DECIDUOUS', condition: 'HEALTHY' }),
  });
  console.log('put-deciduous', deciduous.status, dataOf(deciduous).condition);
  if (deciduous.status !== 200 || dataOf(deciduous).condition !== 'HEALTHY') failed = true;

  const extracted = await request(`/api/v1/patients/${patientId}/record/odontogram/teeth/26`, {
    method: 'PUT',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ dentition: 'PERMANENT', condition: 'EXTRACTED' }),
  });
  console.log('put-extracted', extracted.status, dataOf(extracted).condition);
  if (extracted.status !== 200) failed = true;

  const conflict = await request(`/api/v1/patients/${patientId}/record/odontogram/teeth/26`, {
    method: 'PUT',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ dentition: 'PERMANENT', face: 'O', condition: 'RESTORED' }),
  });
  console.log('put-conflict', conflict.status, errorCode(conflict));
  if (conflict.status !== 422 || errorCode(conflict) !== 'TOOTH_STATE_CONFLICT') failed = true;

  const forced = await request(`/api/v1/patients/${patientId}/record/odontogram/teeth/26`, {
    method: 'PUT',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      dentition: 'PERMANENT',
      face: 'O',
      condition: 'RESTORED',
      justification: 'implante imediato com coroa provisória',
    }),
  });
  console.log('put-justified', forced.status, dataOf(forced).condition);
  if (forced.status !== 200 || dataOf(forced).condition !== 'RESTORED') failed = true;

  const prisma = getPrismaClient();
  const tenantDb = getTenantPrisma();
  const outbox = await tenantDb.runInTenantContext(
    { tenantId, userId: ownerUserId, requestId: 'smoke' },
    async (tx) =>
      tx.outboxEvent.findFirst({
        where: { tenantId, name: 'clinical_records.odontogram_updated' },
        orderBy: { occurredAt: 'desc' },
      }),
  );
  console.log('outbox-odontogram', Boolean(outbox));
  if (!outbox) failed = true;

  const inviteRec = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ email: receptionEmail, role: Role.RECEPTION }),
  });
  if (inviteRec.status !== 201) failed = true;
  const recInviteId = dataOf(inviteRec).id as string;
  const recToken = `odonto-rec-${stamp}`;
  await tenantDb.runInTenantContext(
    { tenantId, userId: ownerUserId, requestId: 'smoke' },
    async (tx) => {
      await tx.invitation.update({
        where: { id: recInviteId },
        data: { tokenHash: hashToken(recToken), expiresAt: addDays(new Date(), 7) },
      });
    },
  );
  jar.clear();
  const acceptRec = await request('/api/v1/users/invitations/accept', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: recToken, name: 'Recepcionista', password }),
  });
  if (acceptRec.status !== 200) failed = true;
  const recAccess = dataOf(acceptRec).accessToken as string;

  const recGet = await request(
    `/api/v1/patients/${patientId}/record/odontogram?dentition=PERMANENT`,
    { headers: authHeaders(recAccess, tenantId) },
  );
  console.log('reception-get', recGet.status, errorCode(recGet));
  if (recGet.status !== 403 || errorCode(recGet) !== 'FORBIDDEN') failed = true;

  const recPut = await request(`/api/v1/patients/${patientId}/record/odontogram/teeth/11`, {
    method: 'PUT',
    headers: { ...authHeaders(recAccess, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ dentition: 'PERMANENT', condition: 'HEALTHY' }),
  });
  console.log('reception-put', recPut.status, errorCode(recPut));
  if (recPut.status !== 403) failed = true;

  server.close();
  await prisma.$disconnect();

  if (failed) {
    console.error('FAIL: odontogram smoke');
    process.exit(1);
  }
  console.log('OK: odontogram smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
