import { createHmac } from 'node:crypto';
import { OWNER, SEED_PATIENT } from './credentials';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3333';
const HMAC_SECRET =
  process.env.E2E_WAHA_HMAC_KEY ??
  process.env.WAHA_HMAC_KEY ??
  process.env.WHATSAPP_APP_SECRET ??
  'dev-whatsapp-secret';

type ApiSession = { token: string; tenantId: string };

type Envelope<T> = { data?: T; error?: { message?: string; code?: string } };

let cachedOwnerSession: ApiSession | null = null;

async function loginWithBackoff(
  email: string,
  password: string,
  attempts = 6,
): Promise<ApiSession> {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const login = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    lastStatus = login.status;
    if (login.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 16_000));
      continue;
    }
    if (!login.ok) throw new Error(`login ${email} falhou: ${login.status}`);
    const session = (await login.json()) as {
      data?: { accessToken?: string; tenant?: { id?: string } };
    };
    const token = session.data?.accessToken;
    const tenantId = session.data?.tenant?.id;
    if (!token || !tenantId) throw new Error(`sessão ${email} sem token/tenant`);
    return { token, tenantId };
  }
  throw new Error(`login ${email} falhou: ${lastStatus}`);
}

/** OWNER tem messaging.configure + subscription.manage (ops). */
async function ownerSession(): Promise<ApiSession> {
  if (cachedOwnerSession) return cachedOwnerSession;
  cachedOwnerSession = await loginWithBackoff(OWNER.email, OWNER.password);
  return cachedOwnerSession;
}

/**
 * Smokes de subscription podem deixar o tenant seed EXPIRED/SUSPENDED.
 * Reativa via ops (sem subscriptionGuard) antes de writes de messaging.
 */
async function ensureTenantSubscriptionWritable(session: ApiSession): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/subscription/ops/status`, {
    method: 'POST',
    headers: headers(session.token, session.tenantId),
    body: JSON.stringify({
      status: 'ACTIVE',
      reason: 'e2e messaging-inbox: restore after subscription smokes',
    }),
  });
  const json = (await res.json()) as Envelope<{ status?: string }>;
  if (!res.ok) {
    throw new Error(
      `ops subscription ACTIVE falhou: ${res.status} ${json.error?.message ?? ''}`,
    );
  }
  if (json.data?.status !== 'ACTIVE') {
    throw new Error(`ops subscription ACTIVE retornou ${json.data?.status ?? 'sem status'}`);
  }
}

function headers(token: string, tenantId: string, extra?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': tenantId,
    'Content-Type': 'application/json',
    ...(extra ?? {}),
  };
}

async function api<T>(
  path: string,
  init: RequestInit & { token: string; tenantId: string },
): Promise<{ status: number; data: T | null }> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: { ...headers(init.token, init.tenantId, init.headers), ...(init.headers ?? {}) },
  });
  const json = (await res.json()) as Envelope<T>;
  if (!res.ok && res.status !== 404) {
    throw new Error(
      `${init.method ?? 'GET'} ${path} falhou: ${res.status} ${json.error?.message ?? ''}`,
    );
  }
  return { status: res.status, data: (json.data as T) ?? null };
}

type AccountSummary = { id: string; status: string; sessionName: string };
type PatientRow = { id: string; name: string; phonePrimary: string };
type ConversationRow = {
  id: string;
  contactPhone: string;
  contactName: string | null;
  patientId: string | null;
  unreadCount: number;
};

/** Garante conta WA fake CONNECTED + conversa com mensagem inbound da Maria (sem Meta). */
export async function ensureInboxSeedConversation(): Promise<{
  conversationId: string;
  patientName: string;
  contactPhone: string;
}> {
  const { token, tenantId } = await ownerSession();
  await ensureTenantSubscriptionWritable({ token, tenantId });

  let account = (
    await api<AccountSummary>('/messaging/account', { token, tenantId })
  ).data;

  if (!account) {
    const created = await api<AccountSummary>('/messaging/account', {
      method: 'POST',
      token,
      tenantId,
      body: JSON.stringify({ riskAccepted: true }),
    });
    account = created.data;
  }
  if (!account) throw new Error('falha ao obter conta WhatsApp');

  if (account.status !== 'CONNECTED') {
    await api('/messaging/account/test', {
      method: 'POST',
      token,
      tenantId,
      headers: { 'Idempotency-Key': `e2e-inbox-test-${Date.now()}` },
      body: JSON.stringify({ to: '5511988880001' }),
    });
    account = (await api<AccountSummary>('/messaging/account', { token, tenantId })).data;
  }
  if (!account || account.status !== 'CONNECTED') {
    throw new Error('conta WhatsApp não ficou CONNECTED (fake)');
  }

  const patients = await api<PatientRow[]>(
    `/patients?search=${encodeURIComponent(SEED_PATIENT)}&limit=20`,
    { token, tenantId },
  );
  const patient = (Array.isArray(patients.data) ? patients.data : []).find((row) =>
    row.name.includes('Maria'),
  );
  if (!patient) throw new Error('paciente Maria não encontrado no seed');

  const phoneDigits = patient.phonePrimary.replace(/\D/g, '');
  const e164 = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`;
  const stamp = Date.now();
  const wamid = `wamid.e2e.inbox.${stamp}`;
  const webhookRaw = JSON.stringify({
    event: 'message',
    session: account.sessionName,
    payload: {
      id: wamid,
      timestamp: Math.floor(stamp / 1000),
      from: `${e164}@c.us`,
      fromMe: false,
      type: 'chat',
      body: 'Oi, preciso remarcar (e2e inbox)',
    },
  });
  const hmac = createHmac('sha512', HMAC_SECRET).update(webhookRaw).digest('hex');
  const webhookRes = await fetch(`${API_URL}/api/v1/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-webhook-hmac': hmac },
    body: webhookRaw,
  });
  if (!webhookRes.ok) {
    throw new Error(`webhook inbox falhou: ${webhookRes.status}`);
  }

  let conversation: ConversationRow | undefined;
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const list = await api<ConversationRow[]>(
      `/messaging/conversations?q=${encodeURIComponent(e164)}&limit=20`,
      { token, tenantId },
    );
    conversation = (Array.isArray(list.data) ? list.data : []).find(
      (row) => row.contactPhone.includes(phoneDigits.slice(-8)),
    );
    if (conversation) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Fallback sem worker: account/test cria conversa OUTBOUND (ainda fake, sem Meta).
  if (!conversation) {
    await api('/messaging/account/test', {
      method: 'POST',
      token,
      tenantId,
      headers: { 'Idempotency-Key': `e2e-inbox-seed-${stamp}` },
      body: JSON.stringify({ to: e164 }),
    });
    const list = await api<ConversationRow[]>(
      `/messaging/conversations?q=${encodeURIComponent(e164)}&limit=20`,
      { token, tenantId },
    );
    conversation = (Array.isArray(list.data) ? list.data : []).find(
      (row) => row.contactPhone.includes(phoneDigits.slice(-8)),
    );
  }
  if (!conversation) throw new Error('conversa inbox não apareceu após webhook/test');

  return {
    conversationId: conversation.id,
    patientName: patient.name,
    contactPhone: conversation.contactPhone,
  };
}
