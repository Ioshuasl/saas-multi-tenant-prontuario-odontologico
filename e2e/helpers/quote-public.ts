import { DENTIST, OWNER, SEED_PATIENT } from './credentials';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3333';

type Envelope<T> = { data?: T };

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

export async function sendMariaDraftAndPublicUrl(): Promise<{
  publicUrl: string;
  itemLabels: string[];
}> {
  const { token, tenantId } = await ownerSession();
  const patients = await api<Array<{ id: string; name: string }>>(
    `/patients?search=${encodeURIComponent(SEED_PATIENT)}&limit=20`,
    { token, tenantId },
  );
  const list = Array.isArray(patients) ? patients : [];
  const patient = list.find((row) => row.name.startsWith('Maria'));
  if (!patient) throw new Error('Maria Silva não encontrada');

  const quotes = await api<Array<{ id: string; status: string; patientId: string }>>(
    `/quotes?patientId=${encodeURIComponent(patient.id)}&status=DRAFT&limit=20`,
    { token, tenantId },
  );
  const drafts = Array.isArray(quotes) ? quotes : [];
  let quoteId = drafts[0]?.id;
  if (!quoteId) {
    const professionals = await api<Array<{ id: string; name: string; active: boolean }>>(
      '/clinic/professionals',
      { token, tenantId },
    );
    const dentist = professionals.find((row) => row.name === DENTIST.name && row.active);
    const procedures = await api<Array<{ id: string; code: string }>>('/procedures', {
      token,
      tenantId,
    });
    const res01 = procedures.find((row) => row.code === 'RES-01');
    const prof01 = procedures.find((row) => row.code === 'PROF-01');
    const rad01 = procedures.find((row) => row.code === 'RAD-01');
    if (!dentist || !res01 || !prof01 || !rad01) {
      throw new Error('catálogo/profissional seed incompleto');
    }
    const created = await api<{ id: string }>('/quotes', {
      token,
      tenantId,
      method: 'POST',
      body: JSON.stringify({
        patientId: patient.id,
        professionalId: dentist.id,
        items: [
          { procedureId: res01.id, toothCode: '26', quantity: 1 },
          { procedureId: prof01.id, quantity: 1 },
          { procedureId: rad01.id, toothCode: '16', quantity: 1 },
        ],
      }),
    });
    quoteId = created.id;
  }

  const sent = await api<{ publicUrl?: string }>(`/quotes/${quoteId}/send`, {
    token,
    tenantId,
    method: 'POST',
    body: JSON.stringify({ channel: 'COPY' }),
  });
  if (!sent.publicUrl) throw new Error('send não devolveu publicUrl');

  const detail = await api<{
    items: Array<{ id: string; procedureName: string; toothCode: string | null }>;
  }>(`/quotes/${quoteId}`, { token, tenantId });

  return {
    publicUrl: sent.publicUrl,
    itemLabels: detail.items.map((item) =>
      item.toothCode ? `${item.procedureName} · dente ${item.toothCode}` : item.procedureName,
    ),
  };
}
