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
pnpm dev:api    # http://localhost:3333/health
pnpm dev:web    # http://localhost:3000/login
```

## Por onde começar

1. [Visão de produto](./docs/01-visao-produto.md) e [escopo do MVP](./docs/04-escopo-mvp.md)
2. [Arquitetura](./docs/05-arquitetura.md), [estrutura de pastas](./docs/16-estrutura-de-pastas.md), [API v1](./docs/08-api-v1.md)
3. [Progresso de desenvolvimento](./docs/desenvolvimento/PROGRESSO.md)
