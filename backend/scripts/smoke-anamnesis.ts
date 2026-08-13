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
  const ownerEmail = `s4-anamnesis-${stamp}@example.com`;
  const receptionEmail = `s4-rec-${stamp}@example.com`;

  const signup = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: ownerEmail,
      password,
      clinicName: 'Clinica Anamnese',
      ownerName: 'Owner Anamnese',
    }),
  });
  console.log('signup', signup.status);
  if (signup.status !== 201) failed = true;
  const token = dataOf(signup).accessToken as string;
  const tenantId = (dataOf(signup).tenant as { id: string }).id;
  const ownerUserId = (dataOf(signup).user as { id: string }).id;

  const forms = await request('/api/v1/anamnesis-forms', {
    headers: authHeaders(token, tenantId),
  });
  console.log('forms-list', forms.status);
  if (forms.status !== 200) failed = true;
  const formItems = (dataOf(forms).items as Array<Record<string, unknown>>) ?? [];
  const geral = formItems.find((f) => f.name === 'Anamnese Geral' && f.version === 1 && f.active === true);
  if (!geral) {
    console.error('FAIL: seed Anamnese Geral v1 ausente', formItems);
    failed = true;
  }
  const v1Questions = (geral?.questions as Array<{ id: string }>) ?? [];
  if (!v1Questions.some((q) => q.id === 'allergy_meds') || !v1Questions.some((q) => q.id === 'main_complaint')) {
    console.error('FAIL: perguntas v1 incompletas');
    failed = true;
  }

  const createPatient = await request('/api/v1/patients', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Maria Silva',
      phonePrimary: '62999990001',
      sex: 'F',
      email: `maria-${stamp}@example.com`,
    }),
  });
  console.log('patient-create', createPatient.status);
  if (createPatient.status !== 201) failed = true;
  const patientId = (dataOf(createPatient).patient as { id: string }).id;

  const sendLink = await request(`/api/v1/patients/${patientId}/record/anamnesis/send-link`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ channel: 'COPY' }),
  });
  console.log('send-link', sendLink.status, dataOf(sendLink).sentVia);
  if (sendLink.status !== 200) failed = true;
  if (dataOf(sendLink).sentVia !== 'COPY') failed = true;
  const publicUrl = dataOf(sendLink).publicUrl as string;
  if (!publicUrl?.includes('/anamnese/')) {
    console.error('FAIL: publicUrl ausente', dataOf(sendLink));
    failed = true;
  }
  const rawToken = publicUrl?.split('/anamnese/')[1] ?? '';

  const publicGet = await request(`/api/v1/public/anamnesis/${rawToken}`);
  console.log('public-get', publicGet.status, dataOf(publicGet).patientFirstName);
  if (publicGet.status !== 200) failed = true;
  if (dataOf(publicGet).patientFirstName !== 'Maria') failed = true;
  const publicForm = dataOf(publicGet).form as { name?: string; version?: number; questions?: Array<{ id: string }> };
  if (publicForm?.name !== 'Anamnese Geral' || publicForm?.version !== 1) failed = true;
  const publicQids = (publicForm?.questions ?? []).map((q) => q.id);
  if (!publicQids.includes('pregnant')) {
    console.error('FAIL: showWhen F deveria incluir pregnant', publicQids);
    failed = true;
  }
  if (!publicQids.includes('main_complaint')) failed = true;

  const public404 = await request('/api/v1/public/anamnesis/token-invalido-xx');
  console.log('public-404', public404.status, errorCode(public404));
  if (public404.status !== 404 || errorCode(public404) !== 'NOT_FOUND') failed = true;

  const answers = {
    allergy_meds: { value: true, text: 'Dipirona' },
    diabetes: 'Não',
    smoker: 'Não',
    main_complaint: 'Dor no 26',
  };

  const publicPost = await request(`/api/v1/public/anamnesis/${rawToken}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  console.log('public-post', publicPost.status, dataOf(publicPost).accepted);
  if (publicPost.status !== 200 || dataOf(publicPost).accepted !== true) failed = true;

  const publicIdem = await request(`/api/v1/public/anamnesis/${rawToken}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  console.log('public-idempotent', publicIdem.status, dataOf(publicIdem).accepted);
  if (publicIdem.status !== 200 || dataOf(publicIdem).accepted !== true) failed = true;

  const publicGetUsed = await request(`/api/v1/public/anamnesis/${rawToken}`);
  console.log('public-used', publicGetUsed.status, errorCode(publicGetUsed));
  if (publicGetUsed.status !== 404) failed = true;

  const record = await request(`/api/v1/patients/${patientId}/record`, {
    headers: authHeaders(token, tenantId),
  });
  console.log('record', record.status, dataOf(record).anamnesisStale, (dataOf(record).alerts as unknown[])?.length);
  if (record.status !== 200) failed = true;
  if (dataOf(record).anamnesisStale !== false) failed = true;
  const recordAlerts = (dataOf(record).alerts as Array<Record<string, unknown>>) ?? [];
  const allergy = recordAlerts.find((a) => a.category === 'ALLERGY' && a.severity === 'CRITICAL' && a.active === true);
  if (!allergy) {
    console.error('FAIL: alerta CRITICAL ALLERGY ausente', recordAlerts);
    failed = true;
  }

  const history = await request(`/api/v1/patients/${patientId}/record/anamnesis`, {
    headers: authHeaders(token, tenantId),
  });
  console.log('anamnesis-history', history.status);
  if (history.status !== 200) failed = true;
  const historyItems = (dataOf(history).items as Array<Record<string, unknown>>) ?? [];
  if (historyItems.length < 1) failed = true;
  const first = historyItems[0];
  if (first?.formVersion !== 1 || first?.answeredBy !== 'PATIENT') failed = true;
  const histAnswers = first?.answers as Record<string, unknown> | undefined;
  const allergyAns = histAnswers?.allergy_meds as { value?: boolean; text?: string } | undefined;
  if (allergyAns?.value !== true || allergyAns?.text !== 'Dipirona') {
    console.error('FAIL: answers não decifradas', histAnswers);
    failed = true;
  }
  const histQids = ((first?.questions as Array<{ id: string }>) ?? []).map((q) => q.id);
  if (!histQids.includes('allergy_meds')) failed = true;

  const newForm = await request('/api/v1/anamnesis-forms', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Anamnese Geral',
      questions: [
        { id: 'allergy_meds', label: 'Possui alergia a medicamentos?', type: 'BOOLEAN_WITH_TEXT' },
        { id: 'main_complaint', label: 'Queixa principal', type: 'TEXT', required: true },
        { id: 'extra_v2', label: 'Pergunta nova v2', type: 'TEXT' },
      ],
    }),
  });
  console.log('form-v2', newForm.status, dataOf(newForm).version);
  if (newForm.status !== 201 || dataOf(newForm).version !== 2) failed = true;

  const historyAfterV2 = await request(`/api/v1/patients/${patientId}/record/anamnesis`, {
    headers: authHeaders(token, tenantId),
  });
  const afterItems = (dataOf(historyAfterV2).items as Array<Record<string, unknown>>) ?? [];
  const oldResp = afterItems.find((i) => i.formVersion === 1);
  const oldQids = ((oldResp?.questions as Array<{ id: string }>) ?? []).map((q) => q.id);
  console.log('history-after-v2', oldQids.includes('extra_v2') ? 'leaked-v2' : 'ok-v1');
  if (!oldResp || oldQids.includes('extra_v2') || !oldQids.includes('allergy_meds')) {
    console.error('FAIL: resposta antiga deve manter perguntas v1', oldQids);
    failed = true;
  }

  const alerts = await request(`/api/v1/patients/${patientId}/record/alerts`, {
    headers: authHeaders(token, tenantId),
  });
  console.log('alerts-list', alerts.status);
  if (alerts.status !== 200) failed = true;
  const alertItems = (dataOf(alerts).items as Array<Record<string, unknown>>) ?? [];
  const criticalId = alertItems.find((a) => a.severity === 'CRITICAL')?.id as string | undefined;

  const manual = await request(`/api/v1/patients/${patientId}/record/alerts`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      severity: 'WARNING',
      category: 'OTHER',
      description: 'Observação manual do dentista',
    }),
  });
  console.log('alert-manual', manual.status, dataOf(manual).source);
  if (manual.status !== 201 || dataOf(manual).source !== 'MANUAL') failed = true;
  const warningId = dataOf(manual).id as string;

  if (criticalId) {
    const patchCritical = await request(`/api/v1/patients/${patientId}/record/alerts/${criticalId}`, {
      method: 'PATCH',
      headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
      body: JSON.stringify({ active: false }),
    });
    console.log('patch-critical', patchCritical.status, errorCode(patchCritical));
    if (patchCritical.status !== 422 || errorCode(patchCritical) !== 'BUSINESS_RULE_VIOLATION') failed = true;
  } else {
    failed = true;
  }

  const patchWarning = await request(`/api/v1/patients/${patientId}/record/alerts/${warningId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ active: false }),
  });
  console.log('patch-warning', patchWarning.status, dataOf(patchWarning).active);
  if (patchWarning.status !== 200 || dataOf(patchWarning).active !== false) failed = true;

  const proPost = await request(`/api/v1/patients/${patientId}/record/anamnesis`, {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({
      answers: {
        allergy_meds: { value: false },
        main_complaint: 'Reavaliação profissional',
      },
    }),
  });
  console.log('pro-post', proPost.status, dataOf(proPost).accepted);
  if (proPost.status !== 201 || dataOf(proPost).accepted !== true) failed = true;

  const inviteRec = await request('/api/v1/users/invitations', {
    method: 'POST',
    headers: { ...authHeaders(token, tenantId), 'content-type': 'application/json' },
    body: JSON.stringify({ email: receptionEmail, role: Role.RECEPTION }),
  });
  console.log('invite-reception', inviteRec.status);
  if (inviteRec.status !== 201) failed = true;
  const recInviteId = dataOf(inviteRec).id as string;
  const recToken = `rec-token-${stamp}`;
  const prisma = getPrismaClient();
  const tenantDb = getTenantPrisma();
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
  console.log('accept-reception', acceptRec.status);
  if (acceptRec.status !== 200) failed = true;
  const recAccess = dataOf(acceptRec).accessToken as string;

  const recAnamnesis = await request(`/api/v1/patients/${patientId}/record/anamnesis`, {
    headers: authHeaders(recAccess, tenantId),
  });
  console.log('reception-anamnesis', recAnamnesis.status, errorCode(recAnamnesis));
  if (recAnamnesis.status !== 403 || errorCode(recAnamnesis) !== 'FORBIDDEN') failed = true;

  const recForms = await request('/api/v1/anamnesis-forms', {
    headers: authHeaders(recAccess, tenantId),
  });
  console.log('reception-forms', recForms.status, errorCode(recForms));
  if (recForms.status !== 403) failed = true;

  server.close();
  await prisma.$disconnect();

  if (failed) {
    console.error('FAIL: anamnesis smoke');
    process.exit(1);
  }
  console.log('OK: anamnesis smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
