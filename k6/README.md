# Carga representativa (S8)

k6 **não** entra no CI de PR (tempo/custo). Gate local/staging, 1 tenant.

## Pré-requisito

1. Compose (API + Postgres + Redis + MinIO) no ar.
2. Seed de volume (idempotente; ≥ 10k pacientes e ≥ 5k agendamentos; 200 no dia civil `America/Sao_Paulo`):

```bash
pnpm --filter @repo/backend seed:load
```

Login: `carga@teste.local` / `SenhaForte!99`.

3. [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) instalado.

## Rodar

```bash
k6 run k6/load.js
```

Opcionais: `BASE_URL` (default `http://localhost:3333`), `LOAD_EMAIL`, `LOAD_PASSWORD`, `SEARCH`, `AGENDA_FROM`, `AGENDA_TO`, `DASHBOARD_DATE`.

## Gate (20 VUs)

| Rota | p95 |
| --- | --- |
| `GET /api/v1/patients?search=` | < 300 ms |
| `GET /api/v1/appointments?from=&to=` (dia, ~200 itens) | < 1 s |
| `GET /api/v1/reports/dashboard` | < 400 ms |

Login ocorre uma vez em `setup()` (rate limit 5/min por e-mail).
