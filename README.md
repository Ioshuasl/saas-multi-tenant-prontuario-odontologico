# SaaS Multi-Tenant — Prontuário Odontológico

Software odontológico completo entregue como SaaS B2B multi-tenant: prontuário eletrônico, agenda online com autoagendamento, gestão financeira e WhatsApp oficial para clínicas.

**Status:** Sprint 0 — scaffold do monorepo em andamento. Especificação em [`docs/`](./docs/README.md). Diário de implementação em [`docs/desenvolvimento/`](./docs/desenvolvimento/README.md).

## Stack e arquitetura

| Camada | Escolha |
| --- | --- |
| Frontend | React + TypeScript (TSX) com Next.js (App Router) |
| Backend | Node.js + TypeScript + Express, API REST versionada (`/api/v1`) |
| Arquitetura | Monólito modular, módulos em camadas, DDD, Clean Architecture, SOLID |
| Banco | PostgreSQL com `tenant_id` + Row Level Security |
| Filas | Redis + BullMQ com outbox transacional |
| Mensageria | WhatsApp Business Cloud API oficial |

## Monorepo

```
backend/     # API Express + Prisma + worker
frontend/    # Next.js App Router
contracts/   # tipos compartilhados (envelope API)
docs/        # especificação + docs/desenvolvimento/
```

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm --filter @repo/contracts build
pnpm db:migrate
pnpm db:seed    # tenant de demo + dados por módulo
pnpm dev:api     # http://localhost:3333/health
pnpm dev:worker  # outbox + BullMQ (http://localhost:3334/health)
pnpm dev:web     # http://localhost:3002/login
pnpm test:e2e   # Playwright (sobe API+web se não estiverem no ar)
```

Login de desenvolvimento (após `pnpm db:seed`):

| Papel | E-mail | Senha |
| --- | --- | --- |
| Owner | `owner@teste.local` | `SenhaForte!99` |
| Dentista | `dentist@teste.local` | `SenhaForte!99` |
| Recepção | `recepcao@teste.local` | `SenhaForte!99` |

O seed é idempotente: preenche clínica, horários, cadeiras, profissionais, procedimentos, equipe, convite pendente (`auxiliar@teste.local`), pacientes/responsáveis/consentimentos e agenda (consultas + bloqueio).

E2E (Playwright) — jornadas UI dos módulos já entregues (`e2e/`):

```bash
pnpm exec playwright install chromium   # uma vez
pnpm db:seed                            # tenant demo
pnpm test:e2e                           # identity, clinic, patients, agenda
pnpm test:e2e:ui                        # UI mode
```

Requer Postgres no ar (`docker compose up -d`). Se `pnpm dev:api` / `pnpm dev:web` já estiverem rodando, o Playwright reutiliza. Specs autenticados compartilham um login por worker (rate limit de login da API).

A **primeira visita** a cada rota do Next (Turbopack, só em dev) compila o grafo client; recarregar a mesma URL é quente. A sidebar não faz prefetch em massa. Metas no Windows após limpar `frontend/.next`: `/app` frio < 6s, demais rotas `(app)` < 3s, navegação já compilada < 200ms percebidos, `/login` quente < 500ms.

No Windows, exclua a pasta do repo do Defender (PowerShell **admin**):

```powershell
Add-MpPreference -ExclusionPath (Resolve-Path .)
```

## Por onde começar

1. [Visão de produto](./docs/01-visao-produto.md) e [escopo do MVP](./docs/04-escopo-mvp.md)
2. [Arquitetura](./docs/05-arquitetura.md), [estrutura de pastas](./docs/16-estrutura-de-pastas.md), [API v1](./docs/08-api-v1.md)
3. [Progresso de desenvolvimento](./docs/desenvolvimento/PROGRESSO.md)
