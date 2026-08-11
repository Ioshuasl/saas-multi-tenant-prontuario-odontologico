# 05 — Arquitetura

## 1. Visão geral

Monólito modular deployado como uma única aplicação Node.js, com módulos internos (bounded contexts) isolados por fronteiras explícitas, cada um organizado em camadas segundo Clean Architecture + DDD. O frontend Next.js é uma aplicação separada que consome a API `/api/v1`.

```
                         ┌───────────────────────────┐
   Navegador (clínica)   │  Next.js (React + TSX)    │
   Celular (paciente)    │  App Router, SSR/CSR      │
                         └────────────┬──────────────┘
                                      │ HTTPS  /api/v1
                         ┌────────────▼──────────────┐
                         │      API Express (BFF-less)│
                         │  ┌──────────────────────┐  │
                         │  │ routes + controllers  │  │  rotas v1, controllers finos, Zod
                         │  ├──────────────────────┤  │
                         │  │ services              │  │  casos de uso, transações
                         │  ├──────────────────────┤  │
                         │  │ models                │  │  entidades, agregados, VOs, regras
                         │  ├──────────────────────┤  │
                         │  │ repositories + shared │  │  Prisma, S3, WhatsApp, e-mail, filas
                         │  └──────────────────────┘  │
                         │   módulos: identity, clinic,│
                         │   patients, scheduling,     │
                         │   clinical-records,         │
                         │   treatments, billing,       │
                         │   messaging, reporting,      │
                         │   subscription               │
                         └───┬────────────┬────────────┘
                             │            │
                   ┌─────────▼──┐   ┌─────▼─────────┐   ┌──────────────┐
                   │ PostgreSQL │   │ Redis + BullMQ│   │ Object store │
                   │  (RLS)     │   │ (jobs/cron)   │   │ (S3/R2)      │
                   └────────────┘   └───────┬───────┘   └──────────────┘
                                            │
                                     ┌──────▼───────────────┐
                                     │ Worker (mesmo código)│  consumidores de fila
                                     └──────┬───────────────┘
                                            │
                        WhatsApp Cloud API · e-mail (SES/Resend) · storage
```

Duas execuções do **mesmo artefato**: processo `api` (HTTP) e processo `worker` (filas/cron). Isso mantém um único deploy conceitual sem acoplar latência de request a trabalho assíncrono.

## 2. Por que monólito modular

Detalhado em [ADR-0001](./adr/0001-monolito-modular.md). Em resumo: com um time pequeno e domínio ainda em descoberta, microsserviços transferem complexidade de negócio para complexidade operacional (transações distribuídas, versionamento de contratos, observabilidade). O monólito modular preserva a opção de extrair um módulo depois — desde que as fronteiras sejam respeitadas desde o dia 1.

**As fronteiras são a única coisa que não podemos relaxar.** Se módulos passarem a importar internals uns dos outros, o resultado é um monólito emaranhado — o pior dos dois mundos.

## 3. Módulos (bounded contexts)

| Módulo | Responsabilidade | Agregados principais |
| --- | --- | --- |
| `identity` | Autenticação, usuários, papéis, permissões, convites, sessões | `User`, `Membership`, `Invitation`, `Role` |
| `clinic` | Tenant, unidades, horários, cadeiras, catálogo de procedimentos, configurações | `Tenant`, `Unit`, `BusinessHours`, `Procedure`, `Chair` |
| `patients` | Cadastro, contatos, responsável legal, consentimentos, deduplicação | `Patient`, `Consent`, `LegalGuardian` |
| `scheduling` | Agenda, disponibilidade, agendamentos, bloqueios, recorrência, fila de espera, autoagendamento | `Appointment`, `Availability`, `Block`, `WaitlistEntry` |
| `clinical-records` | Anamnese, odontograma, evoluções, anexos, alertas clínicos | `MedicalRecord`, `Anamnesis`, `Odontogram`, `ClinicalNote`, `Attachment` |
| `treatments` | Orçamentos, planos de tratamento, execução de procedimentos | `Quote`, `TreatmentPlan`, `TreatmentItem` |
| `billing` | Financeiro da clínica: AR/AP, caixa, fluxo de caixa, inadimplência, produção | `Receivable`, `Payable`, `Payment`, `CashSession`, `LedgerEntry` |
| `messaging` | WhatsApp Cloud API, templates, automações, inbox, créditos, log de envio | `Conversation`, `Message`, `MessageTemplate`, `Automation`, `MessageCredit` |
| `reporting` | Consultas de leitura/relatórios (CQRS-lite: acesso somente leitura a views) | — (read models) |
| `subscription` | Assinatura do SaaS, planos, limites, trial | `Subscription`, `Plan`, `UsageCounter` |
| `platform` (capacidades transversais, implementadas em `shared/`) | Erros e tipos base, tenant context, auditoria, outbox, exportação/LGPD, feature flags, integrações, filas | `TenantId`, `DomainEvent`, `AuditLog` |

### Regras de dependência entre módulos

```
identity ← (todos, apenas para contexto de usuário/permissão)
clinic   ← patients, scheduling, treatments, billing
patients ← scheduling, clinical-records, treatments, billing, messaging
scheduling ← clinical-records (consulta ↔ atendimento), messaging (confirmações)
treatments ← billing (aprovação gera receivable), clinical-records (execução gera evolução)
reporting → lê read models de todos (nunca escreve)
```

1. Um módulo **só** pode importar de outro através do seu `<dominio>_public.ts` (contratos e DTOs), nunca de `models/`, `services/` ou `repositories/` alheios.
2. Comunicação preferencial entre módulos é por **evento de domínio** (in-process, transacional via outbox), não por chamada direta.
3. Chamada síncrona cross-module é permitida apenas para **consulta** (ex.: `patients.getPatientSummary(id)`), exposta como port do módulo consumidor.
4. Não há foreign key física entre agregados de módulos diferentes quando isso impediria extração futura — usamos FK apenas dentro do módulo e por `tenant_id`; entre módulos, referência por ID com validação na aplicação. **Exceção pragmática:** FK para `patients.patient` e `clinic.tenant` é permitida por serem o núcleo compartilhado e por ganho real de integridade.
5. `reporting` pode ler tabelas de outros módulos **somente** através de views versionadas (`vw_*`), que funcionam como contrato.

Essas regras são verificadas automaticamente (ver seção 8).

## 4. Camadas (dentro de cada módulo)

A estrutura de pastas segue o **padrão Orius** do time (1 arquivo por operação, classes curtas, `snake_case` no backend), com `models/` rico (DDD) e `actions/` só quando há efeito além do repositório. Mapeamento completo, nomenclatura e exemplo canônico `Patient` em [16 — Estrutura de Pastas](./16-estrutura-de-pastas.md).

```
backend/src/modules/patients/
├── models/                              # DOMÍNIO: regra pura — zero dependência externa
│   ├── patient.model.ts
│   ├── value-objects/{cpf,phone-number}.vo.ts
│   ├── events/patient-created.event.ts
│   └── errors/duplicate-patient-cpf.error.ts
├── schemas/
│   └── patient.schema.ts                # Zod: create/update/list
├── repositories/patient/                # 1 operação = 1 arquivo; classe curta
│   ├── patient_list.repository.ts       # class ListRepository
│   ├── patient_get.repository.ts        # class GetRepository
│   ├── patient_create.repository.ts     # class CreateRepository
│   ├── patient_update.repository.ts
│   ├── patient_delete.repository.ts
│   ├── patient_get_by_cpf.repository.ts
│   └── mappers/patient.mapper.ts
├── actions/patient/                     # SÓ se houver efeito além do repositório
│   └── patient_create.action.ts         # class CreateAction (persist + outbox)
├── services/patient/                    # 1 operação = 1 arquivo; classe curta
│   ├── patient_list.service.ts          # class ListService
│   ├── patient_get.service.ts           # class GetService
│   ├── patient_create.service.ts        # class CreateService
│   ├── patient_update.service.ts
│   ├── patient_delete.service.ts
│   └── patient_get_by_cpf.service.ts    # class GetByCpfService
├── controllers/
│   └── patient.controller.ts
├── routes/v1/patient.routes.ts
├── types/                               # tipagens TS + ports (sem pasta interfaces/)
│   ├── patient/{patient_create,patient_list}.types.ts
│   └── ports/clinical_records.port.ts
├── enum/patient/                        # enums do módulo
│   ├── patient_origin.enum.ts
│   └── consent_type.enum.ts
├── subscribers/
├── jobs/
├── helpers/
├── patients_public.ts
└── patients.module.ts
```

Vocabulário de operação alinhado à API REST: `list` / `get` / `create` / `update` / `delete` (+ `get_by_<uk>` e verbos de domínio como `confirm`, `cancel`).

### Regra de dependência (a regra da Clean Architecture)

```
controllers · routes · repositories · jobs · subscribers · actions
        │                                              ▲
        ▼                                              │
    services  ──────────────────────────────────►  models
                      │
                      └── types/ · enum/
```

- `models/` (domínio) não importa Express, Prisma, Zod ou HTTP.
- `services/` orquestra; chama `models/`, `actions/` (quando existir) ou `repositories/` — nunca Prisma Client direto.
- `actions/` só quando há efeito além do repositório (evento/outbox/outro módulo); CRUD puro: `Service → Repository`.
- Tipagens e ports em `types/`; enums em `enum/` — **não há pasta `interfaces/`**.
- `controllers/`, `routes/`, `repositories/`, `jobs/` e `subscribers/` são a borda.
- Verificado por lint (`eslint-plugin-boundaries` / `import/no-restricted-paths`) e por `dependency-cruiser`.

Equivalência com o vocabulário canônico de Clean Architecture:

| Camada canônica | Pasta aqui |
| --- | --- |
| `domain` (entidades, VOs, eventos, domain services) | `models/` |
| `application` (use cases) | `services/` + `actions/` (quando houver) |
| `application` (ports + tipagens) | `types/` (inclui `types/ports/`) |
| enums / constantes tipadas | `enum/` |
| `interface` (HTTP) | `controllers/` + `routes/` + `schemas/` |
| `infrastructure` (adapters) | `repositories/`, `jobs/`, `shared/integrations/` |

> **`models/` aqui não é model de ORM.** Com Prisma, o mapeamento de tabelas vive em `prisma/schema.prisma`; `models/` guarda o modelo **de domínio**.

## 5. Exemplos de código canônicos

### 5.1 Entidade de domínio em `models/` (nada de framework aqui)

```ts
// modules/scheduling/models/appointment.model.ts
import { TenantId, EntityId, DomainEvent } from '@/shared/domain';
import { TimeSlot } from './value-objects/time-slot.vo';
import { AppointmentStatus } from './value-objects/appointment-status.vo';
import { AppointmentScheduled } from './events/appointment-scheduled.event';
import { InvalidStatusTransitionError } from './errors/invalid-status-transition.error';

export interface AppointmentProps {
  tenantId: TenantId;
  unitId: EntityId;
  patientId: EntityId;
  professionalId: EntityId;
  chairId: EntityId | null;
  procedureId: EntityId | null;
  slot: TimeSlot;
  status: AppointmentStatus;
  notes: string | null;
}

export class Appointment {
  private events: DomainEvent[] = [];

  private constructor(
    readonly id: EntityId,
    private props: AppointmentProps,
  ) {}

  static schedule(id: EntityId, props: Omit<AppointmentProps, 'status'>): Appointment {
    const appointment = new Appointment(id, { ...props, status: AppointmentStatus.SCHEDULED });
    appointment.events.push(
      new AppointmentScheduled({
        tenantId: props.tenantId,
        appointmentId: id,
        patientId: props.patientId,
        startsAt: props.slot.start,
      }),
    );
    return appointment;
  }

  confirm(): void {
    this.transitionTo(AppointmentStatus.CONFIRMED);
  }

  cancel(reason: string): void {
    this.transitionTo(AppointmentStatus.CANCELLED);
    this.props.notes = reason;
  }

  reschedule(slot: TimeSlot): void {
    if (this.props.status.isFinal()) {
      throw new InvalidStatusTransitionError(this.props.status, 'reschedule');
    }
    this.props.slot = slot;
    this.props.status = AppointmentStatus.SCHEDULED;
  }

  private transitionTo(next: AppointmentStatus): void {
    if (!this.props.status.canTransitionTo(next)) {
      throw new InvalidStatusTransitionError(this.props.status, next.value);
    }
    this.props.status = next;
  }

  pullEvents(): DomainEvent[] {
    const pending = this.events;
    this.events = [];
    return pending;
  }

  get slot(): TimeSlot { return this.props.slot; }
  get status(): AppointmentStatus { return this.props.status; }
  get tenantId(): TenantId { return this.props.tenantId; }
}
```

### 5.2 Value object com invariante

```ts
// modules/scheduling/models/value-objects/time-slot.vo.ts
import { InvalidTimeSlotError } from '../errors/invalid-time-slot.error';

export class TimeSlot {
  private constructor(readonly start: Date, readonly end: Date) {}

  static create(start: Date, end: Date): TimeSlot {
    if (end <= start) throw new InvalidTimeSlotError('end must be after start');
    const minutes = (end.getTime() - start.getTime()) / 60_000;
    if (minutes < 5 || minutes > 8 * 60) {
      throw new InvalidTimeSlotError('duration must be between 5 minutes and 8 hours');
    }
    return new TimeSlot(start, end);
  }

  overlaps(other: TimeSlot): boolean {
    return this.start < other.end && other.start < this.end;
  }

  get durationMinutes(): number {
    return (this.end.getTime() - this.start.getTime()) / 60_000;
  }
}
```

### 5.3 Máquina de estados do agendamento

```ts
// modules/scheduling/models/value-objects/appointment-status.vo.ts
const TRANSITIONS = {
  REQUESTED: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['CONFIRMED', 'IN_SERVICE', 'NO_SHOW', 'CANCELLED'],
  CONFIRMED: ['IN_SERVICE', 'NO_SHOW', 'CANCELLED'],
  IN_SERVICE: ['COMPLETED'],
  COMPLETED: [],
  NO_SHOW: ['SCHEDULED'],   // reagendamento após falta
  CANCELLED: [],
} as const;

export type AppointmentStatusValue = keyof typeof TRANSITIONS;

export class AppointmentStatus {
  private constructor(readonly value: AppointmentStatusValue) {}

  static readonly REQUESTED = new AppointmentStatus('REQUESTED');
  static readonly SCHEDULED = new AppointmentStatus('SCHEDULED');
  static readonly CONFIRMED = new AppointmentStatus('CONFIRMED');
  static readonly IN_SERVICE = new AppointmentStatus('IN_SERVICE');
  static readonly COMPLETED = new AppointmentStatus('COMPLETED');
  static readonly NO_SHOW = new AppointmentStatus('NO_SHOW');
  static readonly CANCELLED = new AppointmentStatus('CANCELLED');

  canTransitionTo(next: AppointmentStatus): boolean {
    return (TRANSITIONS[this.value] as readonly string[]).includes(next.value);
  }

  isFinal(): boolean {
    return TRANSITIONS[this.value].length === 0;
  }
}
```

### 5.4 Caso de uso (`services/`) — classe curta, 1 operação por arquivo

Padrão Orius: arquivo `patient_create.service.ts`, classe `CreateService`. Quando há efeito além do repositório (outbox, outro módulo), o service delega a um `CreateAction`. Detalhes em [doc 16](./16-estrutura-de-pastas.md).

```ts
// modules/patients/services/patient/patient_create.service.ts
import type { GetByCpfService } from './patient_get_by_cpf.service';
import type { CreateAction } from '../../actions/patient/patient_create.action';
import type { PatientCreateSchema } from '../../schemas/patient.schema';
import { DuplicatePatientCpfError } from '../../models/errors/duplicate-patient-cpf.error';
import type { RequestContext } from '@/shared/domain';

export class CreateService {
  constructor(
    private readonly getByCpf: GetByCpfService,
    private readonly createAction: CreateAction,
  ) {}

  async execute(ctx: RequestContext, patientSchema: PatientCreateSchema) {
    const existing = await this.getByCpf.execute(ctx, patientSchema.cpf, false);
    if (existing) throw new DuplicatePatientCpfError(patientSchema.cpf);
    return this.createAction.execute(ctx, patientSchema);
  }
}
```

```ts
// modules/scheduling/services/appointment/appointment_create.service.ts
// Verbo de domínio não-CRUD usa o mesmo padrão: arquivo snake_case, classe curta.
export class CreateService {
  constructor(
    private readonly createAction: CreateAction, // disponibilidade + save + outbox
  ) {}

  async execute(ctx: RequestContext, appointmentSchema: AppointmentCreateSchema) {
    return this.createAction.execute(ctx, appointmentSchema);
  }
}
```

### 5.5 Controller (interface HTTP) — fino por definição

```ts
// modules/patients/controllers/patient.controller.ts
import type { Request, Response } from 'express';
import { patientCreateSchema } from '../schemas/patient.schema';
import type { CreateService } from '../services/patient/patient_create.service';

export class PatientController {
  constructor(private readonly createService: CreateService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const patientSchema = patientCreateSchema.parse(req.body);
    const result = await this.createService.execute(req.ctx, patientSchema);
    res.status(201).json({ data: result });
  };
}
```

Erros de domínio são convertidos em HTTP por um **error handler central** (mapa `DomainError → status`), nunca com `try/catch` espalhado em controllers. Parâmetro tipado: `patientSchema` — nunca `data` genérico.

### 5.6 Repositório — 1 operação por arquivo, classe curta

```ts
// modules/patients/repositories/patient/patient_create.repository.ts
import { PatientMapper } from './mappers/patient.mapper';
import type { Patient } from '../../models/patient.model';
import type { TenantPrisma } from '@/shared/database/tenant-prisma';
import type { RequestContext } from '@/shared/domain';

export class CreateRepository {
  constructor(private readonly db: TenantPrisma) {}

  async execute(ctx: RequestContext, patient: Patient): Promise<void> {
    const row = PatientMapper.toPersistence(patient);
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.patient.create({ data: row });
    });
  }
}
```

`TenantPrisma` garante `SET LOCAL app.tenant_id` na transação corrente (ver [Multi-Tenancy](./06-multi-tenancy.md)) — nenhum repositório monta `tenant_id` à mão em `WHERE`.

### 5.7 Evento de domínio + outbox (via Action)

```ts
// modules/patients/actions/patient/patient_create.action.ts
export class CreateAction {
  constructor(
    private readonly createRepository: CreateRepository,
    private readonly uow: UnitOfWork,
    private readonly ids: IdGenerator,
  ) {}

  async execute(ctx: RequestContext, patientSchema: PatientCreateSchema) {
    return this.uow.run(ctx, async () => {
      const patient = Patient.create(this.ids.next(), { /* ... */ });
      await this.createRepository.execute(ctx, patient);
      await this.uow.publish(patient.pullEvents()); // outbox na mesma transação
      return patient;
    });
  }
}
```

```ts
// modules/messaging/subscribers/on-appointment-scheduled.subscriber.ts
export class OnAppointmentScheduledSubscriber {
  constructor(private readonly enqueue: ScheduleConfirmationMessages) {}

  static readonly event = 'scheduling.appointment_scheduled';

  async handle(event: AppointmentScheduledPayload): Promise<void> {
    await this.enqueue.execute({
      tenantId: event.tenantId,
      appointmentId: event.appointmentId,
      patientId: event.patientId,
      startsAt: event.startsAt,
    });
  }
}
```

Fluxo: Action grava agregado **e** registro na tabela `outbox_event` na mesma transação → dispatcher (no worker) lê o outbox, entrega aos subscribers e marca como processado. Entrega **at-least-once**; handlers idempotentes.

## 6. Estrutura do repositório

```
.
├── backend/
│   ├── src/
│   │   ├── server.ts             # bootstrap HTTP (listen)
│   │   ├── worker.ts             # bootstrap de filas/cron (mesmo código, outro processo)
│   │   ├── app.ts                # Express: middlewares + rotas (sem listen — testável)
│   │   ├── routes/index.ts       # monta /api/v1 a partir das rotas de cada módulo
│   │   ├── docs/openapi.yaml     # gerado dos schemas Zod (não editar à mão)
│   │   ├── shared/
│   │   │   ├── config/           # env schema (Zod), constantes
│   │   │   ├── database/         # prisma client, tenant-prisma (RLS), unit-of-work, outbox
│   │   │   ├── middlewares/      # auth, tenant, error handler, rate limit, requestId
│   │   │   ├── integrations/     # whatsapp, storage S3, e-mail, gateway de pagamento
│   │   │   ├── queue/            # filas BullMQ, dispatcher do outbox, scheduler
│   │   │   ├── domain/           # kernel: EntityId, TenantId, DomainEvent, erros base
│   │   │   └── helpers/          # puro e reutilizável: datas, moeda, CPF, FDI, id
│   │   └── modules/
│   │       ├── identity/  clinic/  patients/  scheduling/
│   │       ├── clinical-records/  treatments/  billing/
│   │       └── messaging/  reporting/  subscription/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── test/                     # setup de integração (Testcontainers), factories
├── frontend/
│   └── src/
│       ├── app/                  # rotas (Next.js App Router) — 1 pasta ≈ 1 rota
│       ├── packages/             # admin/ · operacional/ · clinico/ · financeiro/ · public/
│       └── shared/               # ui, layout, api, hooks, helpers
├── contracts/                    # tipos/DTOs compartilhados backend↔frontend (dos schemas Zod)
├── docs/
├── docker-compose.yml
└── package.json                  # workspaces (pnpm)
```

`contracts/` é o único ponto de acoplamento entre frontend e backend: os schemas Zod das rotas são a fonte da verdade e exportam tipos para o frontend, eliminando DTO duplicado e drift de contrato.

A hierarquia `backend/` + `frontend/` é a mesma dos outros projetos do time; workspaces pnpm existem apenas para compartilhar `contracts/` e configuração de lint/tsconfig, não para fragmentar o código em N pacotes.

## 7. Composição de dependências (DI simples, sem framework)

```ts
// modules/patients/patients.module.ts
export function buildPatientsModule(deps: SharedDeps): PatientsModule {
  const listRepository = new ListRepository(deps.db);
  const createRepository = new CreateRepository(deps.db);
  const getByCpfRepository = new GetByCpfRepository(deps.db);

  const getByCpfService = new GetByCpfService(getByCpfRepository);
  const createAction = new CreateAction(createRepository, deps.uow, deps.ids);
  const createService = new CreateService(getByCpfService, createAction);
  const listService = new ListService(listRepository);

  const controller = new PatientController(createService, listService /* … */);

  return {
    routes: buildPatientRoutes(controller),
    subscribers: [],
    publicApi: { getPatientSummary: /* ... */ }, // patients_public.ts
  };
}
```

Injeção manual por construtor: explícita, tipada, sem decorators nem container mágico. Classes curtas (`CreateService`, `ListRepository`) — a entidade está no caminho do arquivo, não no nome da classe.

## 8. Fitness functions (a arquitetura verificada por CI)

| Verificação | Ferramenta |
| --- | --- |
| `models/` não importa Prisma/Express/Zod/axios | `dependency-cruiser` (regra `no-framework-in-models`) |
| `services/` não importa `@prisma/client` nem `controllers/` | `dependency-cruiser` |
| Prisma só em `repositories/` e `shared/database/` | `dependency-cruiser` |
| Módulo só importa `<dominio>_public.ts` de outro módulo | `eslint-plugin-boundaries` |
| Sem dependência circular entre módulos | `dependency-cruiser` |
| Toda tabela com dado de tenant tem `tenant_id` + policy RLS | teste de integração que varre `information_schema` |
| Nenhuma query sem contexto de tenant | teste que roda os casos de uso sem `SET app.tenant_id` e espera erro |
| Cobertura mínima em `models/` e `services/` | Vitest coverage (limite ≥ 85% em `models/`) |
| Contrato da API não quebra | snapshot do OpenAPI gerado + teste de compatibilidade |

## 9. Decisões técnicas complementares

| Tema | Escolha | Racional |
| --- | --- | --- |
| Runtime | Node.js LTS (≥ 22) | Estabilidade, suporte longo |
| Linguagem | TypeScript `strict` + `noUncheckedIndexedAccess` | Segurança de tipos real; proíbe `any`/`as` casual |
| HTTP | Express 5 | Requisito do projeto; maduro, com `async` nativo no 5 |
| Validação | Zod nos limites (HTTP, env, webhook) | Um schema = validação + tipo; nada entra sem parse |
| ORM | Prisma | DX, migrações versionadas, tipos gerados ([ADR-0004](./adr/0004-orm-prisma.md)) |
| Consultas complexas/relatório | SQL cru via `$queryRaw` tipado ou views | ORM não é bom para relatório; view é contrato |
| Filas/cron | BullMQ + Redis ([ADR-0006](./adr/0006-filas-bullmq.md)) | Retry, backoff, delayed jobs (essencial para lembrete D-1) |
| Autenticação | JWT curto + refresh rotativo httpOnly | Sem sessão em memória; suporta múltiplas abas |
| Storage de anexos | S3-compatível com URL pré-assinada | Upload não passa pela API; barato e escalável |
| Logs | Pino (JSON) com `requestId`/`tenantId`/`userId` | Correlação e agregação |
| Erros | Hierarquia `DomainError`/`ApplicationError`/`InfraError` + handler central | Mapeamento consistente para HTTP |
| Datas | UTC no banco, timezone do tenant na borda; `date-fns-tz` | Agenda é o coração do produto: erro de fuso é bug crítico |
| Dinheiro | Inteiro em centavos (`bigint`/`number` inteiro), nunca `float` | Precisão em parcelamento |
| IDs | UUID v7 gerado na **aplicação** (`IdGenerator`) | Ordenável por tempo; sem extensão Postgres ([ADR-0011](./adr/0011-uuid-v7-aplicacao.md)) |
| Testes | Vitest (unit/integration) + Supertest (API) + Testcontainers (Postgres) + Playwright (e2e) | Testar RLS exige banco real |
| Docs de API | OpenAPI gerado dos schemas Zod (`zod-to-openapi`) + Scalar/Swagger UI | Documentação que não mente |

## 10. Anti-padrões proibidos

1. Controller com regra de negócio ou query.
2. Entidade anêmica em `models/` (só getters/setters) com a regra toda no `service`.
3. Prefixo da entidade no nome da classe (`PatientCreateService` ❌ → `CreateService` ✅; a entidade vive no path do arquivo).
4. Parâmetro genérico `data` — usar `patientSchema` / tipagem explícita.
5. `actions/` para CRUD puro sem efeito colateral (Action só com efeito além do repositório).
6. `PrismaClient` importado fora de `repositories/` ou `shared/database/`.
7. Módulo importando `../outro-modulo/models/...` — só `<dominio>_public.ts` é permitido.
8. `any`, `as unknown as`, acesso dinâmico a atributo para escapar de tipos.
9. Query sem `tenant_id`/RLS ativa.
10. Mutação destrutiva de dado clínico (`UPDATE` que apaga versão anterior de evolução).
11. Lógica de negócio duplicada no frontend (frontend valida para UX; a verdade é do servidor).
12. Job sem idempotência ou sem limite de retry.
13. Segredo em `.env` comitado ou log de dado pessoal/clínico.
