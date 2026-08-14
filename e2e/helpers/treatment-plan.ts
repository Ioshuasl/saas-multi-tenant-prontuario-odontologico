import { DENTIST, OWNER } from './credentials';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3333';

type Envelope<T> = { data?: T; meta?: { nextCursor?: string | null } };

async function ownerSession(): Promise<{ token: string; tenantId: string }> {
  const login = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER.email, password: OWNER.password }),
  });
  if (!login.ok) throw new Error(`login seed falhou: ${login.status}`);
  const session = (await login.json()) as {
    data?: { accessToken?: string; tenant?: { id?: string } };
  };
  const token = session.data?.accessToken;
  const tenantId = session.data?.tenant?.id;
  if (!token || !tenantId) throw new Error('sessão seed sem token/tenant');
  return { token, tenantId };
}

function headers(token: string, tenantId: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': tenantId,
    'Content-Type': 'application/json',
  };
}

async function api<T>(
  path: string,
  init: RequestInit & { token: string; tenantId: string },
): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: { ...headers(init.token, init.tenantId), ...(init.headers ?? {}) },
  });
  const json = (await res.json()) as Envelope<T> & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} falhou: ${res.status} ${json.error?.message ?? ''}`);
  }
  return json.data as T;
}

export async function ensureActiveRes01Plan(patientName: string): Promise<void> {
  const { token, tenantId } = await ownerSession();
  const patients = await api<Array<{ id: string; name: string }>>(
    `/patients?search=${encodeURIComponent(patientName)}&limit=20`,
    { token, tenantId },
  );
  const patient = (Array.isArray(patients) ? patients : []).find((row) =>
    row.name.startsWith(patientName.split(' ')[0] ?? patientName),
  );
  if (!patient) throw new Error(`paciente ${patientName} não encontrado`);

  const plans = await api<Array<{ id: string; status: string }>>(
    `/treatment-plans?patientId=${encodeURIComponent(patient.id)}&status=ACTIVE`,
    { token, tenantId },
  );
  if (Array.isArray(plans) && plans.length > 0) {
    const plan = await api<{
      items: Array<{ procedureCode: string; status: string }>;
    }>(`/treatment-plans/${plans[0]!.id}`, { token, tenantId });
    const pending = plan.items.some(
      (item) => item.procedureCode === 'RES-01' && (item.status === 'PLANNED' || item.status === 'SCHEDULED'),
    );
    if (pending) return;
  }

  const professionals = await api<Array<{ id: string; name: string; active: boolean }>>(
    '/clinic/professionals',
    { token, tenantId },
  );
  const dentist = professionals.find((row) => row.name === DENTIST.name && row.active);
  if (!dentist) throw new Error('profissional dentista seed não encontrado');

  const procedures = await api<Array<{ id: string; code: string }>>('/procedures', {
    token, tenantId,
  });
  const restoration = procedures.find((row) => row.code === 'RES-01');
  if (!restoration) throw new Error('procedimento RES-01 não encontrado');

  const quote = await api<{ id: string }>('/quotes', {
    token,
    tenantId,
    method: 'POST',
    body: JSON.stringify({
      patientId: patient.id,
      professionalId: dentist.id,
      items: [{ procedureId: restoration.id, toothCode: '26', quantity: 1 }],
    }),
  });

  await api(`/quotes/${quote.id}/send`, {
    token,
    tenantId,
    method: 'POST',
    body: JSON.stringify({ channel: 'COPY' }),
  });

  const due = new Date();
  due.setDate(due.getDate() + 7);
  await api(`/quotes/${quote.id}/decision`, {
    token,
    tenantId,
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({
      decision: 'APPROVED',
      payment: {
        installments: 1,
        firstDueDate: due.toISOString().slice(0, 10),
        method: 'PIX',
      },
    }),
  });
}
