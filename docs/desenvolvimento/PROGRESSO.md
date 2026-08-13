# Progresso de desenvolvimento (log)

Append-only. Entradas mais recentes no topo.

---

## 2026-08-13 — S3 planejada: detalhamento técnico do canal do paciente

### Feito

- `docs/desenvolvimento/sprints/S3-canal-paciente.md` expandido: herança S2, cortes fechados (OTP no Postgres, `REQUESTED` default, `PUBLIC_BOOKING`, créditos mínimos, waitlist 30 min/3 lotes), DDL delta, jobs/outbox, payloads HTTP (incl. `POST /public/waitlist/:token/accept`), RLS público, pastas, UX (StepNavigator / FormDialog / wizard WA), qualidade + M2 vs código Must

### Validação

- Cruzado com RF E4b/E8a, módulos 04/08, docs/07–09/11/16, ADR-0005/0006, Prisma/código S2

### Próximo

- Implementar S3 pelo Bloco 1 (filas/outbox/worker)

---

## 2026-08-13 — Playwright E2E: base + specs S1/S2

### Feito

- `@playwright/test` na raiz; `playwright.config.ts` (webServer API `:3333` + web `:3001`)
- Scripts: `pnpm test:e2e` / `test:e2e:ui` / `test:e2e:headed`
- Specs por módulo já entregue: `e2e/identity.spec.ts` (E1), `clinic.spec.ts` (E2), `patients.spec.ts` (E3), `agenda.spec.ts` (E4a)
- Login UI: Identity testa o fluxo; clinic/patients/agenda reutilizam 1 contexto por worker (`e2e/helpers/fixtures.ts`) — access token em memória + refresh cookie rotaciona (storageState por teste invalida o token)
- Rate limit login (5/e-mail/60s): workers=1; specs autenticados não relogam a cada teste

### Validação

- `pnpm test:e2e` — 19 passed (identity, clinic, patients, agenda)

### Próximo

- Sprint 3; incluir job e2e no CI quando o ambiente de Actions tiver browsers + secrets JWT

---

## 2026-08-13 — Sprint 2: fechamento Must E3/E4a + visão por cadeira

### Feito

- `GET /appointments?chairId=` no backend (schema + list repository/service); docs/08 atualizado
- Agenda (`operacional`): toggle Profissional | Cadeira; listagem, create (cadeira opcional / pré-preenchida), bloqueio e série com `chairId`
- Smoke `test:scheduling`: create + list por cadeira + bloqueio por cadeira
- Checklist S2 + README de desenvolvimento: S2 **fechada**; próximo = S3

### Validação

- `pnpm --filter @repo/frontend typecheck`
- `pnpm --filter @repo/backend exec tsc --noEmit` (se aplicável)
- `pnpm test:scheduling`

### Não fecha S2 Must (explícito)

- M1 com recepcionista real (docs/13)
- Recrutamento de clínica-piloto (roadmap §5)
- Playwright E2E (smoke HTTP no lugar)

### Próximo

- Sprint 3 — canal do paciente

---

## 2026-08-13 — Seed de tenant demo + módulos

### Feito
- `backend/prisma/seed.ts` idempotente: tenant Clínica Teste (`owner@teste.local` / `SenhaForte!99`) + clínica, horários, cadeiras, profissionais, procedimentos, equipe, convite, pacientes/consentimentos e agenda
- README: credenciais de login de desenvolvimento

### Validação
- `pnpm db:seed`

### Próximo
- Visualizar telas no frontend com os dados seedados

---

## 2026-08-13 — DX compile: sem motion no Index/Form + ban barrel UI

### Feito

- Removidos `FadeIn`/`Stagger`/`MotionTable`/`MotionProvider` do caminho crítico (Index, Form, tabelas, shell)
- Motion só em `*FormDialog` (`MotionDialogBody`, chunk `next/dynamic`)
- ESLint `no-restricted-imports` + rules: proibido `@/shared/ui`, `@/shared/ui/index`, `@/shared/ui/sidebar`
- README: exclusão do Defender na pasta do repo

### Validação

- `pnpm --filter @repo/frontend typecheck`

### Próximo

- Polish M1 / S3

---

## 2026-08-13 — Frontend: compile dev + navegação (Turbopack)

### Feito

- `(app)/layout` virou RSC; `MotionProvider` + `TooltipProvider` só no `AppShell` autenticado
- Removido `PageTransition` (`AnimatePresence mode="wait"`); `FadeIn` permanece nas páginas; `prefetch={false}` na nav; `loading.tsx` em `(app)/app`
- `optimizePackageImports` ampliado; combobox via `@base-ui/react/combobox`; `framer-motion` direto removido (`motion` permanece)
- `sidebar.tsx` fatiado (`sidebar-context` / `sidebar-chrome` / `sidebar-panel` / `sidebar-menu`); header sem popover de notificações placeholder; clinic query não bloqueia children
- `next/dynamic` nos FormDialogs de Agenda, Pacientes, Chair, Procedure, Professional, Member

### Baseline (antes, terminal `pnpm dev:web`)

| Rota | Compile frio | GET frio | GET quente |
|---|---|---|---|
| `/login` | 3.3s | 4.5s | ~0.9s |
| `/app` | 25.3s | 26.4s | 2.0s |
| `/app/onboarding` | 12.9s | 15.1s | 2.6s |
| `/app/pacientes` | 16.5s | 18.1s | 0.25s |
| `/app/agenda` | 3.0s | 3.3s | 0.33s |
| config clínicas (média) | 1.0–1.8s | 1.3–2.3s | 0.3–0.6s |

### Depois (`.next` limpo, Turbopack)

| Rota | Compile frio | GET frio | GET quente |
|---|---|---|---|
| `/login` | 7.6s* | 10.6s | **394ms** |
| `/app` | **4.4s** (era 25.3s) | 6.2s | **291ms** |
| `/app/onboarding` | **1.4s** (era 12.9s) | 1.8s | 435ms |
| `/app/pacientes` | **2.2s** (era 16.5s) | 3.0s | 396ms |
| `/app/agenda` | 2.7s | 3.1s | 402ms |
| config clínicas | 1.1–1.6s | 1.4–1.9s | 380–472ms |

\* `/login` frio agora absorve font/CSS do root (antes pagos em `/` 6.5s + login 3.3s). Quente < 500ms. `/app` e onboarding/pacientes batem as metas de compile.

### Validação

- `pnpm --filter @repo/frontend typecheck` → OK
- Re-medida após restart com `frontend/.next` limpo

### Próximo

- Polish M1 / S3 canal paciente

---

## 2026-08-12 — Sprint 2 Bloco 5: frontend agenda (`operacional`, Notion)

### Feito

- Design via **ui-ux-pro-max** + tokens Notion já no `globals.css`: grade densa, bordas `#E9E9E7`, status pastel com rótulo (a11y), motion 150–200ms, sem sombra pesada
- `/app/agenda` — Dia/Semana, slots 10/15/20/30/60, filtro profissional
- Criar em ≤3 interações (slot → paciente → Agendar); série WEEKLY/MONTHLY
- Drag/resize otimista + rollback em `409`; detalhes: status, cancelar, escopo série
- Bloqueio com alerta de conflitos; nav Agenda

### Validação

- `pnpm --filter @repo/frontend exec tsc --noEmit` → OK

### Próximo

- Polish M1 / S3 canal paciente; visão por cadeira quando a API filtrar `chairId`

---

## 2026-08-12 — Sprint 2 Bloco 4: frontend pacientes (`operacional`)

### Feito

- Package `frontend/src/packages/operacional/` — Patient (types/enum/schema/data/service/hooks/components)
- Rotas `/app/pacientes` (Index + busca + FormDialog) e `/app/pacientes/[id]` (ficha: dados, guardians, consents, timeline)
- Check-duplicate UX: CPF bloqueia create; telefone só avisa
- Nav: item Pacientes; `apiClient.requestEnvelope` para lista com `meta.nextCursor`

### Validação

- `pnpm --filter @repo/frontend exec tsc --noEmit` → OK

### Próximo

- S2 Bloco 5: frontend agenda (`operacional`)

---

## 2026-08-12 — Sprint 2 Bloco 3: bloqueios, recorrência, timeline

### Feito

- `POST|DELETE /schedule-blocks` — bloqueio por unidade/profissional/cadeira; retorna `conflicts` sem cancelar (RF-E4-08..09)
- `POST|DELETE /appointment-series` — RRULE `DAILY|WEEKLY|MONTHLY`, máx. 12 ocorrências; delete `?scope=THIS|FUTURE|ALL` (+ `appointmentId` para THIS/FUTURE)
- `GET /patients/:id/timeline` — itens de agenda via `scheduling_public`; fontes CLINICAL/QUOTE/PAYMENT/MESSAGE tipadas vazias conforme permissão (RF-E3-09/10)
- Smoke scheduling estendido (block, series, timeline)

### Validação

- `tsc` · `arch:check` · `test:scheduling` → **smoke-scheduling OK**

### Próximo

- S2 Bloco 4: frontend pacientes (`operacional`)

---

## 2026-08-12 — Sprint 2 Bloco 2: scheduling core (E4a)

### Feito

- Migração `20260812190000_s2_scheduling`: `appointment` (EXCLUDE gist profissional/cadeira), `appointment_history`, `schedule_block`, `appointment_series` + RLS + GRANT
- Módulo `backend/src/modules/scheduling/`: CRUD, status machine, history, `GET /availability` via `clinic.getWorkingWindows`, `Idempotency-Key`, `409 SLOT_UNAVAILABLE` + sugestões
- `scheduling_public.ts` (`listFutureAppointmentIds`, `getAppointmentById`); patients deixa de stubar futuros
- Exceção de horário (`clinic`) passa a retornar conflitos reais de `appointment`
- Smoke `pnpm test:scheduling` (20 concorrentes → 1 sucesso) + passo no CI
- docs/07: `appointment_series` + FK `recurrence_id`

### Validação

- `db:migrate` · `tsc` · `arch:check` · `test:scheduling` → **smoke-scheduling OK**

### Próximo

- S2 Bloco 3: bloqueios HTTP, recorrência com escopo, timeline parcial

---

## 2026-08-12 — Sprint 2 Bloco 1: patients (E3 Must backend)

### Feito

- Migrações `20260812180000_s2_patients` + `…_grants`: `patient`, `patient_code_counter`, `legal_guardian`, `consent` + RLS + GRANT `app_user`
- Módulo `backend/src/modules/patients/`: CRUD, busca (unaccent/telefone/código/CPF), check-duplicate, guardians, consents grant/revoke, soft-delete
- Nº de ficha sequencial por tenant (`patient_code_counter`); CPF único por tenant; telefone só aviso
- `patients_public.ts` (`getPatientById`, `hasMarketingConsent`); futuro appointments stub até Bloco 2
- Smoke `pnpm test:patients` + passo no CI Integration
- docs/07: `code` por tenant (não IDENTITY global)

### Validação

- `db:migrate` · `tsc` · `arch:check` · `test:patients` → **smoke-patients OK**

### Próximo

- S2 Bloco 2: scheduling core (appointment + EXCLUDE + availability)

---

## 2026-08-12 — Sprint 2 Bloco 0: horários (carry-over S1)

### Feito

- Migração `20260812160000_s2_weekday_iso`: CHECK weekday **1–7 ISO**; docs/07 e comentário Prisma alinhados
- `POST .../business-hours/exceptions` retorna `conflicts: []` (lista real no Bloco 2 com `appointment`)
- Admin UI: grade semanal com escopo unidade **ou** profissional; formulário de exceções + alerta de conflitos
- Smoke clinic: asserts `conflicts` array + weekday 7 (domingo)

### Validação

- Lint IDE nos arquivos tocados ok
- `db:migrate` / `test:clinic` / typecheck — rodar com Postgres no ar

### Próximo

- S2 Bloco 1: patients DDL + API

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
