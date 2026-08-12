# Sprint 1 — Identidade e Clínica (E1 + E2 Must)

**Objetivo verificável:** Owner cria clínica (signup) → entra (login/refresh) → convida membro → configura clínica (dados, horários, cadeiras, profissionais, procedimentos) pela API e por telas mínimas no Next.js. Papéis e RLS/RBAC ativos.

**Escopo:** 1A — tudo Must de E1 + E2 + UI mínima.  
**Pontos (roadmap):** ~40 · Épicos E1, E2 · [docs/13](../../13-roadmap-estimativas.md)

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — API identity + clinic Must (Blocos 1–3) | `backend/` |
| **Frontend** | Sim — UI mínima dos mesmos fluxos (Bloco 4) | `frontend/` |

Não misturar: um bloco é **só backend** ou **só frontend**, salvo nota explícita de contrato compartilhado (`contracts/`).

### Backend (Blocos 1–3)

- DDL + RLS identity/clinic
- Auth: signup, login, refresh, logout, logout-all, reset senha, convite, `me`, switch tenant, RBAC
- Clínica: perfil, units/chairs, horários, procedimentos, profissionais, wizard API
- Middlewares, audit, testes RLS/RBAC
- **Não inclui** telas Next.js

### Frontend (Bloco 4)

- Package `public`: signup, login, forgot/reset, accept invite
- Package `admin`: shell autenticado + cadastros da clínica + membros/convites
- Wizard de onboarding (passos puláveis após mínimos)
- Fluxo Page → Hook → Service → Data → API; access token em memória; refresh via cookie
- **Não inclui** novos endpoints — consome o que os Blocos 1–3 expuseram

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E1](../../requisitos/funcionais/01-identidade-acesso.md) | Aceite identidade |
| [RF E2](../../requisitos/funcionais/02-clinica-cadastros.md) | Aceite clínica |
| [Módulo identity](../../modulos/01-identidade-acesso.md) | Domínio / permissões |
| [Módulo clinic](../../modulos/02-clinica-cadastros.md) | Domínio / seed procedimentos |
| [API v1 §2.1–2.2](../../08-api-v1.md) | Contratos HTTP |
| [Modelo de dados §2](../../07-modelo-de-dados.md) | DDL |
| [Estrutura Orius](../../16-estrutura-de-pastas.md) | Pastas / nomenclatura |

## Fora desta sprint

- MFA, lista de sessões (Could)
- UI multi-unidade / consolidação (fase 2)
- Agenda, pacientes, prontuário
- Dockerfiles EasyPanel (não bloqueia S1 local)

## Blocos de entrega

### Bloco 1 — Backend: fundação de domínio + auth core

- [x] Migração Prisma: `user`, `membership`, `invitation`, `refresh_token`, `unit`, `chair`, `professional`, `business_hours`, `business_hours_exception`, `procedure` (+ campos de perfil em `tenant`)
- [x] RLS com `platform.enable_tenant_rls` nas tabelas com `tenant_id`; `user` / `refresh_token` globais sem RLS de tenant; `membership` SELECT também por `app.user_id` (login)
- [x] Módulo `backend/src/modules/identity/` (Orius)
- [x] Signup atômico (RF-E1-01..03): Tenant + Unit default + User Argon2id + Membership OWNER + DEK + seeds horários/procedimentos
- [x] Login / refresh / logout / logout-all (RF-E1-04..07)
- [x] Middlewares: `authenticate`, `tenantContext`, `authorize(permission)`

### Bloco 2 — Backend: convite, papéis, me

- [x] Convite create / resend / revoke / accept (RF-E1-09..10); e-mail Resend / Mailpit local
- [x] Matriz `ROLE_PERMISSIONS` + update membership; último Owner protegido (RF-E1-11..13)
- [x] `GET /auth/me`, switch tenant `X-Tenant-Id` (RF-E1-14..15)
- [x] Reset de senha (RF-E1-08)
- [x] Rate limit login (5 falhas / 10 min) (RF-E1-06)
- [x] `audit_log`: LOGIN, falha, logout, reset, convite, mudança de papel, PERMISSION_DENIED
- [x] Testes: RLS + recepção sem `clinical_records` → 403

### Bloco 3 — Backend: clínica (E2 Must)

| Área | RFs | Status |
| --- | --- | --- |
| Perfil tenant + slug | E2-01, E2-02 | [x] |
| Units / Chairs | E2-03, E2-04 | [x] |
| Business hours + exceptions | E2-05..07 | [x] |
| Procedures CRUD + seed | E2-08..10, E2-13 | [x] |
| Professionals | E2-11..12 | [x] |
| Payment methods | E2-14 | [x] |
| Onboarding wizard API | E2-15 | [x] |

Módulo: `backend/src/modules/clinic/`.

### Bloco 4 — Frontend: UI mínima

- [x] Package `public`: signup, login, forgot/reset password, accept invite
- [x] Package `admin`: shell autenticado, clinic, hours, chairs, professionals, procedures, members/invites
- [x] Wizard onboarding (passos puláveis após mínimos)
- [x] Fluxo Page → Hook → Service → Data → API
- [x] Substituir login mock da S0 por auth real

## Endpoints-alvo (docs/08)

```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
POST   /api/v1/auth/password/forgot
POST   /api/v1/auth/password/reset
GET    /api/v1/auth/me
POST   /api/v1/auth/switch-tenant
POST   /api/v1/users/invitations
GET    /api/v1/users/invitations
DELETE /api/v1/users/invitations/:id
POST   /api/v1/users/invitations/accept
PATCH  /api/v1/users/memberships/:id   # papel/ativo (implícito no RF)

GET    /api/v1/clinic
PATCH  /api/v1/clinic
GET|POST|PATCH /api/v1/clinic/units...
GET|POST|PATCH /api/v1/clinic/units/:id/chairs...
GET|PUT        /api/v1/clinic/business-hours...
POST           /api/v1/clinic/business-hours/exceptions
GET|POST|PATCH /api/v1/clinic/professionals...
GET|POST|PATCH /api/v1/procedures...
POST           /api/v1/procedures/import-catalog
GET|PATCH      /api/v1/clinic/onboarding
```

**Backend**

- [x] Signup atômico; e-mail duplicado → `409` sem leak cross-tenant
- [x] Login + refresh rotation + detecção de reuso
- [x] Convite 7 dias; Recepção sem prontuário (`403` + audit)
- [x] Owner configura clínica / horários / procedimentos / profissionais via API
- [x] Seed de procedimentos no signup (preço 0)
- [x] `getWorkingWindows` (unidade ∩ profissional ∩ exceções) via `clinic_public`
- [x] PATCH cadeira (nome/cor/ativo)

**Frontend**

- [x] UI mínima cobre os fluxos ponta a ponta em local (signup → login → clínica → convite)
- [x] Login mock da S0 substituído por auth real
- [x] UI de cadeiras com edição/inativação

## Qualidade

- CI: lint, typecheck, arch:check, migrate, test:rls, test:identity, test:clinic
- Envelope `{ data }` / `{ error }`; camelCase nos payloads

## Bloqueios

_Nenhum. S1 Must E1/E2 + Qualidade fechados (2026-08-12)._

## Notas

- Signup usa `TenantPrisma.runProvisioning` + contexto de tenant para seeds sob RLS.
- Refresh em cookie httpOnly; access token em memória no frontend (docs/09).
- Slug do tenant único global (citext); timezone IANA no tenant.
- Carry-over explícito para S2 (não bloqueia S1): UI de exceções/horário por profissional; lista real de conflitos de agenda ao criar exceção.
