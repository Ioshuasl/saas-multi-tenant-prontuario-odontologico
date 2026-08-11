# SaaS Multi-Tenant — Prontuário Odontológico

Software odontológico completo entregue como SaaS B2B multi-tenant: prontuário eletrônico, agenda online com autoagendamento, gestão financeira e WhatsApp oficial para clínicas.

**Status atual do repositório: planejamento.** Nenhum código de aplicação foi implementado ainda — toda a especificação funcional, técnica e operacional do MVP está em [`docs/`](./docs/README.md).

## Stack e arquitetura

| Camada | Escolha |
| --- | --- |
| Frontend | React + TypeScript (TSX) com Next.js (App Router) |
| Backend | Node.js + TypeScript + Express, API REST versionada (`/api/v1`) |
| Arquitetura | Monólito modular, módulos em camadas, DDD, Clean Architecture, SOLID |
| Banco | PostgreSQL com `tenant_id` + Row Level Security |
| Filas | Redis + BullMQ com outbox transacional |
| Mensageria | WhatsApp Business Cloud API oficial |

## Por onde começar

1. [Visão de produto](./docs/01-visao-produto.md) e [escopo do MVP](./docs/04-escopo-mvp.md) — o que será construído.
2. [Arquitetura](./docs/05-arquitetura.md), [multi-tenancy](./docs/06-multi-tenancy.md), [modelo de dados](./docs/07-modelo-de-dados.md) e [API v1](./docs/08-api-v1.md) — como será construído.
3. [Decisões de arquitetura (ADRs)](./docs/README.md#decisões-de-arquitetura-adrs) — por que foi construído assim.

Índice completo: [`docs/README.md`](./docs/README.md).
