/**
 * Carga representativa S8 (corte #13): 20 VUs contra 1 tenant com ≥10k pacientes / ≥5k agenda.
 * Não roda no CI de PR.
 *
 * Pré: API no ar + `pnpm --filter @repo/backend seed:load`
 * Uso: k6 run k6/load.js
 * Env: BASE_URL, LOAD_EMAIL, LOAD_PASSWORD, SEARCH, AGENDA_FROM, AGENDA_TO, DASHBOARD_DATE
 */
import http from 'k6/http';
import { check, fail } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';
const LOAD_EMAIL = __ENV.LOAD_EMAIL || 'carga@teste.local';
const LOAD_PASSWORD = __ENV.LOAD_PASSWORD || 'SenhaForte!99';
const SEARCH = __ENV.SEARCH || 'Carga Paciente 0000001';

function todayYmdSaoPaulo() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function addDaysYmd(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${utc.getUTCFullYear()}-${mm}-${dd}`;
}

const TODAY = __ENV.DASHBOARD_DATE || todayYmdSaoPaulo();
const AGENDA_FROM = __ENV.AGENDA_FROM || `${TODAY}T00:00:00-03:00`;
const AGENDA_TO = __ENV.AGENDA_TO || `${addDaysYmd(TODAY, 1)}T00:00:00-03:00`;

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    'http_req_duration{name:search}': ['p(95)<300'],
    'http_req_duration{name:agenda}': ['p(95)<1000'],
    'http_req_duration{name:dashboard}': ['p(95)<400'],
    'http_req_failed{name:search}': ['rate<0.01'],
    'http_req_failed{name:agenda}': ['rate<0.01'],
    'http_req_failed{name:dashboard}': ['rate<0.01'],
  },
};

export function setup() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: LOAD_EMAIL, password: LOAD_PASSWORD }),
    { headers: { 'content-type': 'application/json' } },
  );
  if (res.status !== 200) {
    fail(`login falhou: ${res.status} ${res.body}`);
  }
  const body = res.json();
  const token = body.data && body.data.accessToken;
  if (!token) fail('login sem accessToken');
  return { token };
}

function authHeaders(token) {
  return { authorization: `Bearer ${token}` };
}

export default function (data) {
  const headers = authHeaders(data.token);

  const search = http.get(
    `${BASE_URL}/api/v1/patients?search=${encodeURIComponent(SEARCH)}`,
    { headers, tags: { name: 'search' } },
  );
  check(search, { 'search 200': (r) => r.status === 200 });

  const agenda = http.get(
    `${BASE_URL}/api/v1/appointments?from=${encodeURIComponent(AGENDA_FROM)}&to=${encodeURIComponent(AGENDA_TO)}`,
    { headers, tags: { name: 'agenda' } },
  );
  check(agenda, { 'agenda 200': (r) => r.status === 200 });

  const dashboard = http.get(
    `${BASE_URL}/api/v1/reports/dashboard?date=${TODAY}`,
    { headers, tags: { name: 'dashboard' } },
  );
  check(dashboard, { 'dashboard 200': (r) => r.status === 200 });
}
