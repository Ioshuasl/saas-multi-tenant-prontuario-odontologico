import { OWNER } from './credentials';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3333';

type AppointmentRow = {
  id: string;
  status: string;
  notes?: string | null;
  patient?: { name?: string } | null;
};

async function ownerSession(): Promise<{ token: string; tenantId: string }> {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const login = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: OWNER.email, password: OWNER.password }),
    });
    lastStatus = login.status;
    if (login.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 16_000));
      continue;
    }
    if (!login.ok) throw new Error(`login seed falhou: ${login.status}`);
    const session = (await login.json()) as {
      data?: { accessToken?: string; tenant?: { id?: string } };
    };
    const token = session.data?.accessToken ?? '';
    const tenantId = session.data?.tenant?.id ?? '';
    if (!token || !tenantId) throw new Error('sessão seed sem token/tenant');
    return { token, tenantId };
  }
  throw new Error(`login seed falhou: ${lastStatus}`);
}

async function listTodayAppointments(
  token: string,
  tenantId: string,
  status?: string,
): Promise<AppointmentRow[]> {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  if (status) params.set('status', status);
  const list = await fetch(`${API_URL}/api/v1/appointments?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Id': tenantId,
    },
  });
  if (!list.ok) throw new Error(`list appointments falhou: ${list.status}`);
  const json = (await list.json()) as {
    data?: AppointmentRow[] | { items?: AppointmentRow[] };
  };
  return Array.isArray(json.data) ? json.data : (json.data?.items ?? []);
}

function isJoaoPedro(row: AppointmentRow): boolean {
  return Boolean(
    row.patient?.name?.includes('João Pedro') || row.notes?.includes('Profilaxia'),
  );
}

/**
 * Indica se o seed:today-1000 está pronto para “Iniciar atendimento”.
 * Se estiver IN_SERVICE (run anterior), o spec usa “Abrir atendimento”.
 */
export async function getJoaoPedroAttendanceMode(): Promise<'start' | 'open'> {
  const { token, tenantId } = await ownerSession();
  const items = await listTodayAppointments(token, tenantId);
  const joao = items.find(isJoaoPedro);
  if (!joao) {
    throw new Error('João Pedro seed ausente — rode pnpm db:seed');
  }
  if (joao.status === 'CONFIRMED') return 'start';
  if (joao.status === 'IN_SERVICE') return 'open';
  throw new Error(
    `João Pedro em status ${joao.status} — rode pnpm db:seed (seed:today-1000)`,
  );
}

export async function getSeedAppointmentId(status: string): Promise<string> {
  const { token, tenantId } = await ownerSession();
  const items = await listTodayAppointments(token, tenantId, status);
  const first = items[0];
  if (!first?.id) throw new Error(`nenhum agendamento ${status} no seed`);
  return first.id;
}
