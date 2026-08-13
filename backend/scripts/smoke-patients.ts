import { once } from 'node:events';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';

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

  function authHeaders(token: string, tenantId?: string): HeadersInit {
    const headers: Record<string, string> = { authorization: `Bearer ${token}` };
    if (tenantId) headers['x-tenant-id'] = tenantId;
    return headers;
  }

  const password = 'SenhaForte!99';
  const ownerEmail = `s2-patients-${stamp}@example.com`;

  const signup = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: ownerEmail,
      password,
      clinicName: 'Clinica Pacientes',
      ownerName: 'Owner Pacientes',
    }),
  });
  console.log('signup', signup.status);
  if (signup.status !== 201) failed = true;

  const token = dataOf(signup).accessToken as string;
  const tenantId = (dataOf(signup).tenant as { id: string }).id;

  const create = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Maria Silva',
      phonePrimary: '62999990001',
      cpf: '39053344705',
      birthDate: '1990-05-10',
    }),
  });
  console.log('patient-create', create.status, (dataOf(create).patient as { code?: number })?.code);
  if (create.status !== 201) failed = true;
  const patientId = (dataOf(create).patient as { id: string }).id;
  if ((dataOf(create).patient as { code: number }).code !== 1) failed = true;

  const record = await request(`/api/v1/patients/${patientId}/record`, {
    headers: authHeaders(token, tenantId),
  });
  console.log('patient-record', record.status, dataOf(record).medicalRecordId ? 'ok' : dataOf(record));
  if (record.status !== 200) failed = true;
  if (dataOf(record).patientId !== patientId) failed = true;
  if (!dataOf(record).medicalRecordId) failed = true;
  if (dataOf(record).anamnesisStale !== true) failed = true;

  const dupCpf = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Outra Pessoa',
      phonePrimary: '62999990002',
      cpf: '39053344705',
    }),
  });
  console.log('patient-dup-cpf', dupCpf.status, (dupCpf.body?.error as { code?: string })?.code);
  if (dupCpf.status !== 409) failed = true;

  const phoneWarn = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Familiar Silva',
      phonePrimary: '62999990001',
    }),
  });
  console.log(
    'patient-phone-warn',
    phoneWarn.status,
    (dataOf(phoneWarn).warnings as string[]) ?? [],
  );
  if (phoneWarn.status !== 201) failed = true;
  if (!(dataOf(phoneWarn).warnings as string[])?.includes('POSSIBLE_PHONE_DUPLICATE')) {
    failed = true;
  }

  const minor = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Joao Menor',
      phonePrimary: '62988887777',
      birthDate: '2015-01-01',
    }),
  });
  console.log('patient-minor', minor.status, (dataOf(minor).warnings as string[]) ?? []);
  if (minor.status !== 201) failed = true;
  if (!(dataOf(minor).warnings as string[])?.includes('MINOR_WITHOUT_GUARDIAN')) failed = true;
  const minorId = (dataOf(minor).patient as { id: string }).id;

  const guardian = await request(`/api/v1/patients/${minorId}/guardians`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Ana Responsavel',
      phone: '62977776666',
      relationship: 'mae',
    }),
  });
  console.log('guardian-create', guardian.status);
  if (guardian.status !== 201) failed = true;

  const consent = await request(`/api/v1/patients/${patientId}/consents`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      type: 'WHATSAPP_MARKETING',
      granted: true,
      documentVersion: 'v1',
      channel: 'IN_PERSON',
    }),
  });
  console.log('consent-grant', consent.status);
  if (consent.status !== 201) failed = true;

  const consentRevoke = await request(`/api/v1/patients/${patientId}/consents`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      type: 'WHATSAPP_MARKETING',
      granted: false,
      documentVersion: 'v1',
      channel: 'IN_PERSON',
    }),
  });
  console.log('consent-revoke', consentRevoke.status, dataOf(consentRevoke).granted);
  if (consentRevoke.status !== 201 || dataOf(consentRevoke).granted !== false) failed = true;

  const searchJosePrep = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'José Souza',
      phonePrimary: '62911112222',
    }),
  });
  if (searchJosePrep.status !== 201) failed = true;

  const searchJose = await request('/api/v1/patients?search=jose', {
    headers: authHeaders(token, tenantId),
  });
  const joseItems = (searchJose.body?.data as unknown[]) ?? [];
  console.log('search-jose', searchJose.status, joseItems.length);
  if (searchJose.status !== 200 || joseItems.length < 1) failed = true;

  const searchPhone = await request('/api/v1/patients?search=0001', {
    headers: authHeaders(token, tenantId),
  });
  console.log(
    'search-phone',
    searchPhone.status,
    ((searchPhone.body?.data as unknown[]) ?? []).length,
  );
  if (searchPhone.status !== 200) failed = true;

  const searchCode = await request('/api/v1/patients?search=1', {
    headers: authHeaders(token, tenantId),
  });
  console.log('search-code', searchCode.status, ((searchCode.body?.data as unknown[]) ?? []).length);
  if (searchCode.status !== 200) failed = true;

  const checkDup = await request('/api/v1/patients/check-duplicate?cpf=39053344705&phone=62999990001', {
    headers: authHeaders(token, tenantId),
  });
  console.log(
    'check-duplicate',
    checkDup.status,
    Boolean(dataOf(checkDup).cpfMatch),
    ((dataOf(checkDup).phoneMatches as unknown[]) ?? []).length,
  );
  if (checkDup.status !== 200 || !dataOf(checkDup).cpfMatch) failed = true;

  const deactivate = await request(`/api/v1/patients/${patientId}`, {
    method: 'DELETE',
    headers: authHeaders(token, tenantId),
  });
  console.log('patient-deactivate', deactivate.status, dataOf(deactivate).active);
  if (deactivate.status !== 200 || dataOf(deactivate).active !== false) failed = true;

  // Cross-tenant CPF allowed
  const signup2 = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `s2-patients-b-${stamp}@example.com`,
      password,
      clinicName: 'Outra Clinica',
      ownerName: 'Owner B',
    }),
  });
  const token2 = dataOf(signup2).accessToken as string;
  const tenant2 = (dataOf(signup2).tenant as { id: string }).id;
  const otherTenant = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token2, tenant2), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Maria Outra',
      phonePrimary: '11999998888',
      cpf: '39053344705',
    }),
  });
  console.log('patient-other-tenant-cpf', otherTenant.status);
  if (otherTenant.status !== 201) failed = true;

  server.close();
  if (failed) {
    console.error('smoke-patients FAILED');
    process.exit(1);
  }
  console.log('smoke-patients OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
