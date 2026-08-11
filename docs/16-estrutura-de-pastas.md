# 16 — Estrutura de Pastas e Convenções de Código

Este documento fixa a estrutura de pastas do projeto. Ele parte da convenção que o time já usa nos outros projetos e explica, item por item, o que foi mantido, o que foi acrescentado e **por quê** — para que a decisão seja consciente e não uma cópia de template.

Princípio geral: **a convenção de pastas é do time; a regra de dependência é da arquitetura.** Nomes de pasta familiares reduzem atrito diário; regras de dependência impedem que o monólito modular apodreça. As duas coisas coexistem sem conflito.

---

## 1. Backend

### 1.1 Estrutura adotada

```
backend/src/
├── server.ts                    # bootstrap: lê env, conecta, listen
├── worker.ts                    # bootstrap de filas/cron (mesmo código, outro processo)
├── app.ts                       # Express: middlewares + rotas, SEM listen (testável via Supertest)
├── routes/
│   └── index.ts                 # monta /api/v1 agregando as rotas de cada módulo
├── docs/
│   └── openapi.yaml             # GERADO dos schemas Zod — não editar à mão
├── shared/
│   ├── config/                  # env schema (Zod), constantes, feature flags
│   ├── database/                # prisma client, tenant-prisma (RLS), unit-of-work, outbox
│   ├── middlewares/             # auth, tenant, error handler, rate limit, requestId, audit
│   ├── integrations/            # whatsapp, storage S3, e-mail, gateway de pagamento
│   ├── queue/                   # filas BullMQ, dispatcher do outbox, scheduler de cron
│   ├── domain/                  # kernel: EntityId, TenantId, DomainEvent, erros base
│   └── helpers/                 # puro e reutilizável: datas, moeda, CPF, FDI, id (UUID v7)
└── modules/
    └── <dominio>/               # ver 1.2
```

Um módulo por bounded context: `identity`, `clinic`, `patients`, `scheduling`, `clinical-records`, `treatments`, `billing`, `messaging`, `reporting`, `subscription`. As capacidades transversais chamadas de `platform` nos outros documentos (auditoria, outbox, exportação/LGPD, feature flags) não são um módulo de domínio: vivem em `shared/`.

### 1.2 Estrutura de um módulo

```
modules/scheduling/
├── models/                      # ← DOMÍNIO (era "domain/")
│   ├── appointment.model.ts
│   ├── value-objects/
│   ├── events/
│   ├── errors/
│   └── availability-calculator.ts        # domain service
├── services/                    # ← APLICAÇÃO: 1 caso de uso por arquivo
│   ├── schedule-appointment.service.ts
│   └── schedule-appointment.service.spec.ts
├── repositories/
│   ├── appointment.repository.ts         # interface (contrato)
│   ├── prisma-appointment.repository.ts  # implementação
│   └── mappers/appointment.mapper.ts
├── controllers/
├── routes/v1/
├── schemas/                     # Zod
├── interfaces/                  # ports de saída + tipos de entrada/saída
├── enum/
├── subscribers/                 # reage a eventos de outros módulos
├── jobs/                        # handlers de fila do módulo
├── helpers/                     # puro, específico do módulo
├── scheduling_public.ts         # fronteira: o que outros módulos podem importar
└── scheduling.module.ts         # composição de dependências + exporta rotas/subscribers
```

### 1.3 O que mudou em relação à convenção original, e por quê

| Convenção original | Aqui | Motivo |
| --- | --- | --- |
| `models/` = model de ORM | `models/` = modelo **de domínio** | Com Prisma, o mapeamento de tabelas já vive em `prisma/schema.prisma`. A pasta fica livre para o que realmente importa: a classe que **impede** estado inválido. `Appointment` sabe que não se remarca consulta concluída; uma classe que só espelha colunas não sabe nada. |
| `services/` = tudo que não é controller | `services/` = **um caso de uso por arquivo** | Impede o "service God" de 2 mil linhas. `schedule-appointment.service.ts` tem um método público `execute` e é testável sem banco. |
| `repositories/` = acesso a dados | `repositories/` = **interface + implementação** juntas | O `service` depende de `appointment.repository.ts` (contrato); a implementação Prisma fica ao lado. Assim o teste de caso de uso usa um fake em memória, sem Testcontainers. |
| `interfaces/` = tipos diversos | `interfaces/` = **ports de saída** + tipos de I/O | É onde entram `notification.port.ts`, `clock.port.ts`, `storage.port.ts`. Dependência invertida: o domínio declara o que precisa, a borda implementa. |
| `routes/` | `routes/v1/` | Requisito de API versionada ([ADR-0003](./adr/0003-versionamento-api.md)). A versão vive só na borda; `services/` e `models/` não sabem que existe versão. |
| `<dominio>_public.ts` opcional | **obrigatório** | É a única fronteira entre módulos. Sem ele o monólito modular vira monólito emaranhado em poucos meses. |
| — | `subscribers/` e `jobs/` (novos) | O produto depende de trabalho assíncrono (lembrete D-1, webhook do WhatsApp, cron de inadimplência). Sem pasta própria isso acaba dentro de controller. |
| `shared/` | `shared/` + `shared/domain/` (kernel) | Mantido como estava, com um acréscimo: tipos base do domínio (`TenantId`, `DomainEvent`) que todos os módulos usam. |

### 1.4 Onde colocar o quê (decisões rápidas)

| Se você está escrevendo… | Vai em |
| --- | --- |
| regra que deve ser sempre verdadeira sobre uma entidade | `models/` |
| validação de formato de entrada (CPF, data, obrigatoriedade) | `schemas/` (Zod) |
| orquestração: buscar, decidir, salvar, publicar evento | `services/` |
| SQL, Prisma, mapeamento de row | `repositories/` |
| leitura de `req`, escrita de `res`, status HTTP | `controllers/` |
| chamada a API externa (WhatsApp, S3, gateway) | `shared/integrations/` (via port em `interfaces/`) |
| formatação de moeda/data usada em 2+ módulos | `shared/helpers/` |
| reação a um evento de outro módulo | `subscribers/` |
| algo que outro módulo precisa consultar | `<dominio>_public.ts` |

### 1.5 Convenções de nome de arquivo

`kebab-case` no arquivo, `PascalCase` na classe, com sufixo indicando o papel:

```
appointment.model.ts            → class Appointment
time-slot.vo.ts                 → class TimeSlot
appointment-scheduled.event.ts  → class AppointmentScheduled
slot-unavailable.error.ts       → class SlotUnavailableError
schedule-appointment.service.ts → class ScheduleAppointmentService
appointment.repository.ts       → interface AppointmentRepository
prisma-appointment.repository.ts→ class PrismaAppointmentRepository
appointment.controller.ts       → class AppointmentController
appointment.routes.ts           → function buildAppointmentRoutes
appointment.schema.ts           → const scheduleAppointmentSchema
appointment-origin.enum.ts      → const AppointmentOrigin
notification.port.ts            → interface NotificationPort
```

Sufixo não é decoração: `.spec.ts` ao lado do arquivo testado, e o sufixo permite que o lint e o `dependency-cruiser` escrevam regras por padrão de nome (ex.: "`*.service.ts` não pode importar `prisma-*.repository.ts`").

### 1.6 Regras verificadas automaticamente

```js
// .dependency-cruiser.js (essencial)
forbidden: [
  {
    name: 'no-framework-in-models',
    from: { path: 'src/modules/[^/]+/models' },
    to: { dependencyTypes: ['npm'], pathNot: '^(date-fns|uuid)$' },
  },
  {
    name: 'services-nao-usam-implementacao',
    from: { path: 'src/modules/[^/]+/services' },
    to: { path: 'src/modules/[^/]+/(controllers|routes)|repositories/prisma-' },
  },
  {
    name: 'cruzar-modulo-so-pelo-public',
    from: { path: 'src/modules/([^/]+)/' },
    to: { path: 'src/modules/(?!$1)([^/]+)/(?!\\2_public\\.ts)' },
  },
  {
    name: 'prisma-so-na-borda',
    from: { pathNot: 'src/(shared/database|modules/[^/]+/repositories)' },
    to: { path: '@prisma/client' },
  },
]
```

Fronteira sem verificação automática apodrece — essa é a razão de as regras existirem no CI e não apenas neste documento.

---

## 2. Frontend

### 2.1 Estrutura adotada

```
frontend/src/
├── app/                         # ROTAS (substitui pages/ + routes/)
│   ├── (public)/                # login, signup, agendar/[slug], anamnese/[token]…
│   └── (app)/                   # área autenticada: agenda, pacientes, financeiro…
├── packages/
│   ├── operacional/             # scheduling, patients
│   ├── clinico/                 # clinical-records, treatments
│   ├── financeiro/              # billing
│   ├── admin/                   # clinic, subscription, reporting
│   ├── messaging/               # inbox WhatsApp
│   └── public/                  # auth, autoagendamento, links por token
└── shared/
    ├── ui/                      # design system
    ├── layout/                  # shell, sidebar, seletor de unidade
    ├── api/                     # api-client, query-client
    ├── hooks/
    ├── auth/
    ├── helpers/                 # format (moeda, data, CPF), dental (FDI)
    └── styles/
```

Cada domínio dentro de um package tem `api/`, `hooks/`, `components/` e `types/`.

### 2.2 A única mudança relevante: `app/` no lugar de `pages/` + `routes/`

Isso não é preferência, é consequência do Next.js App Router: o roteamento **é** o sistema de arquivos. Não existe arquivo de configuração de rotas para manter, então `routes/` deixaria de ter conteúdo e `pages/` seria um segundo lugar competindo com `app/` pelo mesmo papel.

O que se preserva da convenção original é o que ela realmente garante: **1 arquivo ≈ 1 rota, e a rota é fina.** Um `page.tsx` cuida de parâmetro de URL, metadata e composição; toda lógica vem de `packages/`. Rota com `useQuery` e regra dentro é o anti-padrão a evitar.

Equivalência:

| Convenção original | Aqui |
| --- | --- |
| `pages/agenda.tsx` | `app/(app)/agenda/page.tsx` |
| `routes/index.tsx` (mapa de rotas + guards) | grupos de rota `(public)` / `(app)` + `middleware.ts` |
| `packages/admin/...` | `packages/admin/...` (idêntico) |
| `shared/...` | `shared/...` (idêntico) |

### 2.3 Agrupamento dos packages

Os packages são agrupados **por quem usa**, e cada subpasta espelha um módulo do backend — o que dá rastreabilidade direta entre tela e API:

| Package | Perfil que usa | Módulos do backend |
| --- | --- | --- |
| `operacional` | recepção | `scheduling`, `patients` |
| `clinico` | dentista | `clinical-records`, `treatments` |
| `financeiro` | financeiro/dono | `billing` |
| `admin` | dono da clínica | `clinic`, `subscription`, `reporting` |
| `messaging` | recepção + dono | `messaging` |
| `public` | paciente e visitante | rotas públicas de `scheduling`, `identity` |

### 2.4 Regras

1. **Package não importa de package.** Precisa compartilhar? Sobe para `shared/`. É o equivalente do `_public.ts` do backend.
2. **`shared/` só recebe o que já tem 2+ consumidores reais.** Abstrair antes de existir o segundo caso gera abstração errada.
3. **Componente em `shared/ui` é burro:** recebe dados por prop, não busca dados nem conhece domínio.
4. **Server Component é o padrão**; `'use client'` só onde há interação (agenda, odontograma, inbox, formulários).
5. Tipos de request/response vêm de `contracts/`, nunca redigitados no frontend.

Verificação: `eslint-plugin-boundaries` com `packages/*` como elementos independentes e `shared/*` como destino permitido.

---

## 3. O que é fixo e o que é negociável

**Fixo** (quebra a arquitetura se relaxado):

- `models/` sem dependência de framework;
- `services/` sem depender de implementação concreta;
- cruzar módulo só por `<dominio>_public.ts`;
- Prisma só em `shared/database/` e `repositories/prisma-*`;
- rota versionada;
- package do frontend não importa outro package.

**Negociável** (ajustar quando incomodar, com PR e nota neste documento):

- criar `use-cases/` separado de `services/` se um módulo passar de ~25 services;
- subdividir `models/` por agregado em módulos grandes (`clinical-records` provavelmente vai precisar);
- juntar `enum/` dentro de `models/` se ficarem poucos arquivos;
- criar novos packages no frontend conforme o produto cresce.

Módulos essencialmente CRUD (catálogo de procedimentos, categorias financeiras) podem usar a versão enxuta — `controllers/` + `services/` + `repositories/` + `schemas/`, sem value objects nem eventos. A cerimônia é reservada a onde há invariante: agenda, prontuário, orçamento e financeiro.

## Referências

- [05 — Arquitetura](./05-arquitetura.md)
- [09 — Frontend](./09-frontend.md)
- [12 — Qualidade e Testes](./12-qualidade-testes.md)
- [ADR-0001 — Monólito modular](./adr/0001-monolito-modular.md)
