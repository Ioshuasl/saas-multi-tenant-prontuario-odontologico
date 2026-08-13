import { DENTIST, OWNER } from './credentials';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3333';

export async function getSeedAppointmentId(status: string): Promise<string> {
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

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
    status,
  });
  const list = await fetch(`${API_URL}/api/v1/appointments?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Id': tenantId,
    },
  });
  if (!list.ok) throw new Error(`list appointments falhou: ${list.status}`);
  const json = (await list.json()) as { data?: Array<{ id: string }> | { items?: Array<{ id: string }> } };
  const items = Array.isArray(json.data) ? json.data : (json.data?.items ?? []);
  const first = items[0];
  if (!first?.id) throw new Error(`nenhum agendamento ${status} no seed`);
  return first.id;
}
