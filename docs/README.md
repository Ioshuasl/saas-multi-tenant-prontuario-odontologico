# Documentação — SaaS B2B Multi-Tenant Odontológico

Planejamento do MVP de um software odontológico completo (prontuário digital, agenda online, gestão financeira e WhatsApp para clínicas), entregue como SaaS B2B multi-tenant.

## Stack e arquitetura de referência

- **Frontend:** React + TypeScript (TSX) com Next.js (App Router)
- **Backend:** Node.js + TypeScript + Express, API REST versionada (`/api/v1`)
- **Arquitetura:** monólito modular com módulos em camadas, Domain-Driven Design (DDD), Clean Architecture e princípios SOLID
- **Banco:** PostgreSQL, multi-tenancy por `tenant_id` + Row Level Security (RLS)

## Índice

| Documento | Conteúdo |
| --- | --- |
| [01 — Visão de Produto](./01-visao-produto.md) | Problema, proposta de valor, posicionamento, modelo de negócio |
| [02 — Benchmark de Mercado](./02-benchmark-mercado.md) | Análise de Simples Dental, Clinicorp, Codental e Dental Office e o que herdar |
| [03 — Personas e Jornadas](./03-personas-jornadas.md) | Personas, jornadas críticas e cenários de uso |
| [04 — Escopo do MVP](./04-escopo-mvp.md) | Dentro/fora do escopo, épicos, user stories e critérios de aceite |
| [05 — Arquitetura](./05-arquitetura.md) | Monólito modular, camadas, DDD, Clean Architecture, estrutura de pastas |
| [06 — Multi-Tenancy](./06-multi-tenancy.md) | Estratégia de isolamento, RLS, resolução de tenant, onboarding |
| [07 — Modelo de Dados](./07-modelo-de-dados.md) | Entidades, agregados, DDL de referência, migrações |
| [08 — API v1](./08-api-v1.md) | Convenções REST, versionamento, contratos por módulo, erros |
| [09 — Frontend](./09-frontend.md) | Estrutura Next.js, rotas, design system, estados e cache |
| [10 — Segurança, LGPD e Compliance](./10-seguranca-lgpd-compliance.md) | LGPD, requisitos CFO/prontuário eletrônico, auditoria, retenção |
| [11 — Infraestrutura e DevOps](./11-infra-devops.md) | Ambientes, CI/CD, observabilidade, backup, custos |
| [12 — Qualidade e Testes](./12-qualidade-testes.md) | Pirâmide de testes, padrões, lint/typecheck, Definition of Done |
| [13 — Roadmap e Estimativas](./13-roadmap-estimativas.md) | Fases, marcos, sequenciamento e riscos |
| [14 — Métricas e KPIs](./14-metricas-kpis.md) | North star, métricas de produto e de negócio SaaS |
| [15 — Glossário](./15-glossario.md) | Vocabulário do domínio odontológico e ubiquitous language |

### Módulos (detalhamento funcional + domínio)

- [Identidade e Acesso](./modulos/01-identidade-acesso.md)
- [Clínica e Cadastros](./modulos/02-clinica-cadastros.md)
- [Pacientes e CRM](./modulos/03-pacientes-crm.md)
- [Agenda](./modulos/04-agenda.md)
- [Prontuário Clínico](./modulos/05-prontuario.md)
- [Orçamentos e Tratamentos](./modulos/06-orcamentos-tratamentos.md)
- [Financeiro](./modulos/07-financeiro.md)
- [WhatsApp e Comunicação](./modulos/08-whatsapp-comunicacao.md)
- [Relatórios e Indicadores](./modulos/09-relatorios.md)
- [Billing SaaS (assinatura da clínica)](./modulos/10-billing-saas.md)

### Decisões de arquitetura (ADRs)

- [ADR-0001 — Monólito modular em vez de microsserviços](./adr/0001-monolito-modular.md)
- [ADR-0002 — Multi-tenancy com banco compartilhado + RLS](./adr/0002-multi-tenancy-rls.md)
- [ADR-0003 — Versionamento da API por prefixo de URL](./adr/0003-versionamento-api.md)
- [ADR-0004 — Prisma como ORM e camada de persistência](./adr/0004-orm-prisma.md)
- [ADR-0005 — WhatsApp Cloud API oficial em vez de WhatsApp Web não oficial](./adr/0005-whatsapp-cloud-api.md)
- [ADR-0006 — Filas com BullMQ/Redis dentro do monólito](./adr/0006-filas-bullmq.md)

## Como usar estes documentos

1. Leia `01`, `03` e `04` para entender **o que** será construído no MVP.
2. Leia `05`, `06`, `07` e `08` antes de escrever a primeira linha de código — eles definem os contratos internos que mantêm o monólito modular saudável.
3. Cada arquivo em `modulos/` é o ponto de partida para o backlog daquele módulo (bounded context).
4. Toda decisão técnica relevante nova entra como um novo ADR em `adr/`, nunca como edição silenciosa de um documento existente.

> Escopo desta pasta: **planejamento**. Nenhum código de aplicação é assumido como existente ainda; os exemplos de código são ilustrativos e servem como referência de padrão a ser seguido na implementação.
