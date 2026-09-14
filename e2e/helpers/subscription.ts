import { OWNER } from './credentials';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3333';

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

async function ownerSession(): Promise<ApiSession> {
  if (cachedOwnerSession) return cachedOwnerSession;
  cachedOwnerSession = await loginWithBackoff(OWNER.email, OWNER.password);
  return cachedOwnerSession;
}

function headers(token: string, tenantId: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': tenantId,
    'Content-Type': 'application/json',
  };
}

export async function setSubscriptionStatus(
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED' | 'PAST_DUE' | 'CANCELLED',
  reason: string,
): Promise<void> {
  const session = await ownerSession();
  const res = await fetch(`${API_URL}/api/v1/subscription/ops/status`, {
    method: 'POST',
    headers: headers(session.token, session.tenantId),
    body: JSON.stringify({ status, reason }),
  });
  const json = (await res.json()) as Envelope<{ status?: string }>;
  if (!res.ok) {
    throw new Error(`ops subscription ${status} falhou: ${res.status} ${json.error?.message ?? ''}`);
  }
}

export async function ensureSubscriptionActive(): Promise<void> {
  await setSubscriptionStatus('ACTIVE', 'e2e subscription: restore ACTIVE');
}
