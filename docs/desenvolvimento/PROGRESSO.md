# Progresso de desenvolvimento (log)

Append-only. Entradas mais recentes no topo.

---

## 2026-08-12 — Planejamento Sprint 2 e Sprint 3

### Feito

- Checklist [`sprints/S2-pacientes-agenda.md`](./sprints/S2-pacientes-agenda.md) — E3 + E4a, Blocos 0–5, M1, carry-over S1
- Checklist [`sprints/S3-canal-paciente.md`](./sprints/S3-canal-paciente.md) — E4b + E8a, Blocos 1–6, M2, riscos WABA
- README de desenvolvimento atualizado (fase = S2 planejada)

### Não feito (propositadamente)

- Nenhuma implementação de código — aguarda início do Bloco 0/1 da S2

### Próximo

- S2 Bloco 0 (UI exceções / horário profissional) ou Bloco 1 (patients DDL + API)
- Em paralelo: iniciar onboarding WABA/templates Meta (R1 → M2)

---

## 2026-08-12 — Sprint 1: fechamento Must E1/E2 + Qualidade

### Feito

- `getWorkingWindows` em `clinic_public` (unidade ∩ profissional ∩ exceções; TZ do tenant)
- `PATCH /clinic/units/:id/chairs/:chairId` + UI admin (editar/inativar)
- CI Integration: `test:identity` + `test:clinic` (JWT efêmero + env de smoke)
- Checklist S1 atualizado; carry-over S2 documentado (UI exceções/horário profissional; conflitos reais)

### Validação

- `typecheck` · `arch:check` · `test:clinic` ok

### Próximo

- Sprint 2 (pacientes + agenda), começando com o carry-over de horários na UI se necessário

---

## 2026-08-12 — Sprint 1 Bloco 3: clínica E2 Must (backend)

### Feito

- Migração `20260812140000_s1_clinic_block3`: `tenant.accepted_payment_methods`, `tenant.onboarding`
- Módulo `clinic` completo: perfil, units/chairs, business-hours + exceptions, professionals, procedures, import-catalog, onboarding wizard
- Catálogo padrão centralizado em `procedure_catalog.helper.ts` (reutilizado no signup seed e import-catalog)
- Rotas registradas em `buildClinicRouter()` (`/clinic`, `/procedures`)
- Script `pnpm test:clinic` (`smoke-clinic.ts`)

### Validação

- `typecheck` · `arch:check` · `db:migrate` · `test:clinic` ok

### Próximo

- Bloco 4 (frontend): UI mínima signup/login/clínica/wizard

---

### Feito

- Convite create / list / resend / revoke / accept (7 dias, token de uso único); e-mail via Mailpit (SMTP) em local e Resend em production (ADR-0009)
- `GET /auth/me`, `POST /auth/switch-tenant`, `X-Tenant-Id` validado contra memberships (`403 TENANT_NOT_ALLOWED`)
- `GET|PATCH /users` (papel/ativo/overrides); último Owner não pode ser rebaixado nem desativado
- Reset de senha (`forgot` 202 sem enumeração; token 1h); lockout 5 falhas / 10 min progressivo + rate limit HTTP
- `audit_log`: LOGIN, LOGIN_FAILED, LOGOUT, PASSWORD_RESET, MEMBER_INVITED, ROLE_CHANGED, MEMBER_DEACTIVATED, PERMISSION_DENIED, REFRESH_REUSE_DETECTED
- Script `pnpm test:identity` (`smoke-identity.ts`): convite, me, switch, último Owner, RECEPTION → 403 em prontuário + audit

### Validação

- `typecheck` · `arch:check` · `lint` backend ok
- `db:migrate` / `test:identity` / `test:rls` exigem Postgres no ar (Docker Desktop estava parado neste ambiente)

### Próximo

- Bloco 3 (backend): clínica E2 Must (perfil, units/chairs, horários, procedimentos, profissionais, wizard)

---

## 2026-08-12 — Convenção: sprints separam Backend e Frontend

### Feito

- `docs/desenvolvimento/README.md`: toda sprint deve detalhar Backend vs Frontend (se um lado não entra, dizer explicitamente)
- `sprints/S1-identidade-clinica.md`: seção de camadas + blocos rotulados (1–3 backend, 4 frontend) + aceite separado

### Próximo

- Bloco 2 (backend): convite, RBAC/`me`, reset senha, rate limit, audit

---

## 2026-08-11 — Sprint 1 Bloco 1: identity + auth core

### Feito

- Migração `20260811200000_s1_identity_clinic`: identity/clinic DDL + RLS (membership SELECT por `app.user_id`; tenant SELECT via membership ativo)
- Módulo `identity`: signup/login/refresh/logout/logout-all (JWT RS256, Argon2id, cookie refresh rotativo)
- Seed clínica no signup via `clinic_public.seedClinicOnSignup` (unidade + horários seg–sex + catálogo procedimentos)
- Middlewares `authenticate`, `tenantContext`, `authorize`
- JWT em env como Base64(PEM); script `backend/scripts/smoke-auth.ts`

### Validação

- `pnpm db:migrate` · `typecheck` · `arch:check` · `test:rls` · `smoke-auth` (signup/login/refresh/logout/logout-all/409 duplicado) ok
- Lint backend ok após fixes

### Próximo

- Bloco 2: convite, RBAC/`me`, reset senha, rate limit, audit

---

## 2026-08-11 — Sprint 1: documentação do plano (sem código)

### Feito

- Checklist [`sprints/S1-identidade-clinica.md`](./sprints/S1-identidade-clinica.md) — blocos 1–4, RFs E1/E2, endpoints, aceite
- Atualizado [`README.md`](./README.md) (fase = S1, docs prontas)
- Escopo: Must completo E1+E2 + UI mínima (decisão 1A / 2A)

### Não feito (propositadamente)

- Nenhuma implementação de código nesta entrada — aguarda início do Bloco 1

### Próximo

- Bloco 1: migração identity/clinic + signup + login/refresh/logout

---

## 2026-08-11 — Sprint 0: ESLint real + push CI

### Feito

- `eslint.config.mjs` (flat) com `typescript-eslint` recommendedTypeChecked
- `pnpm lint` real em backend/frontend/contracts (sem stub)
- Push `main`; CI Quality falhou na 1ª tentativa (Prisma client); corrigido com `prisma generate` no typecheck/CI
- **CI verde:** [run 31531294140](https://github.com/Ioshuasl/saas-multi-tenant-prontuario-odontologico/actions/runs/31531294140) — Quality + Integration success

### Validação

- Local: `pnpm lint` / `typecheck` / `arch:check` / `test:kms` ok
- GitHub Actions: success

### Sprint 0

Checklist em [`sprints/S0-fundacao.md`](./sprints/S0-fundacao.md) **completa**.

---

## 2026-08-11 — Sprint 0: dependency-cruiser + KeyManagementPort

### Feito

- `backend/.dependency-cruiser.cjs` — regras Clean/Orius (models sem framework, Prisma só na borda, sem ciclos, cruzar módulo via `*_public.ts`)
- Scripts `pnpm arch:check` / `pnpm test:kms`; CI Quality roda ambos
- `KeyManagementPort` + `LocalKeyManagementAdapter` (AES-256-GCM wrap DEK; KEK via `KEK_LOCAL_BASE64`; fallback só em dev; production exige KEK)

### Validação

- `pnpm arch:check` → no dependency violations (24 modules)
- `pnpm test:kms` → OK wrap/unwrap + falha com KEK errada + production sem KEK
- `typecheck` backend ok

### Próximo

- ESLint real
- Confirmar CI no GitHub após push
- Dockerfiles EasyPanel

---

## 2026-08-11 — Sprint 0: CI + migração RLS

### Feito

- GitHub Actions [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): quality (install, typecheck, lint stub, audit high+, gitleaks) + integration (Postgres, migrate, `test:rls`)
- Docker init de roles `app_migrator` / `app_user` ([`docker/postgres/init`](../../docker/postgres/init/01-roles.sql))
- Migração `20260811180000_init_rls`: `tenant`, `tenant_crypto_key`, `audit_log`, schema `platform`, helper `enable_tenant_rls`, FORCE RLS
- `TenantPrisma` (`runInTenantContext` + `runProvisioning`)
- Script `pnpm test:rls` — isolamento cross-tenant + tabelas com `tenant_id` sem RLS

### Validação local

- `prisma migrate deploy` ok
- `pnpm test:rls` → `OK: RLS isolation checks passed`
- `typecheck` backend/frontend ok
- `pnpm audit --audit-level=high` ok (overrides `postcss`/`sharp` via Next)
- Docker Desktop precisou ser iniciado; volume recriado para carregar roles do init

### Referências

- [docs/06](../06-multi-tenancy.md) · [ADR-0002](../adr/0002-multi-tenancy-rls.md)
- [S0 checklist](./sprints/S0-fundacao.md)

### Próximo

- dependency-cruiser (`arch:check`)
- ESLint real (substituir stub)
- Port `KeyManagementPort` stub
- Dockerfiles EasyPanel

---

## 2026-08-11 — Sprint 0: início do scaffold do monorepo

### Feito

- Criada pasta [`docs/desenvolvimento/`](./README.md) para diário de implementação.
- Scaffold inicial do monorepo:
  - raiz: `pnpm` workspaces, scripts, `docker-compose.yml`, `.gitignore`, `.env.example`
  - `contracts/` — tipos compartilhados (envelope API)
  - `backend/` — Express + TS, `/health` + `/api/v1/health`, env Zod, helmet/CORS, esqueleto Orius
  - `frontend/` — Next.js App Router, packages vazios, layout + login mock (`/login` → `/app`)
  - `backend/prisma/` — schema mínimo (`tenant` + `tenant_crypto_key`)

### Validação

- `pnpm install` ok
- `pnpm --filter @repo/contracts build` ok
- `typecheck` backend + frontend ok
- smoke `/health` → `{ "data": { "status": "ok", "service": "api" } }`

### Referências

- [docs/16 — Estrutura](../16-estrutura-de-pastas.md)
- [docs/13 — Roadmap S0](../13-roadmap-estimativas.md)
- [docs/05 — Arquitetura](../05-arquitetura.md)
- [Sprint S0 checklist](./sprints/S0-fundacao.md)

### Próximo

- CI GitHub Actions (lint, typecheck, audit)
- Middlewares de segurança esqueleto + dependency-cruiser
- Migração Prisma com RLS
- Login mock apontando health da API
- Port `KeyManagementPort` stub
