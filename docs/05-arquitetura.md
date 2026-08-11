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
                         │  │  interface (HTTP)     │  │  rotas, controllers, DTOs, validação
                         │  ├──────────────────────┤  │
                         │  │  application          │  │  use cases, ports, transações
                         │  ├──────────────────────┤  │
                         │  │  domain               │  │  entidades, agregados, VOs, regras
                         │  ├──────────────────────┤  │
                         │  │  infrastructure       │  │  Prisma, S3, WhatsApp, e-mail, filas
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
| `platform` (shared) | Kernel compartilhado: erros, Result, tipos base, tenant context, auditoria, eventos | `TenantId`, `DomainEvent`, `AuditLog` |

### Regras de dependência entre módulos

```
identity ← (todos, apenas para contexto de usuário/permissão)
clinic   ← patients, scheduling, treatments, billing
patients ← scheduling, clinical-records, treatments, billing, messaging
scheduling ← clinical-records (consulta ↔ atendimento), messaging (confirmações)
treatments ← billing (aprovação gera receivable), clinical-records (execução gera evolução)
reporting → lê read models de todos (nunca escreve)
```

1. Um módulo **só** pode importar de outro através do seu `public-api.ts` (contratos e DTOs), nunca de `domain/` ou `infrastructure/` alheios.
2. Comunicação preferencial entre módulos é por **evento de domínio** (in-process, transacional via outbox), não por chamada direta.
3. Chamada síncrona cross-module é permitida apenas para **consulta** (ex.: `patients.getPatientSummary(id)`), exposta como port do módulo consumidor.
4. Não há foreign key física entre agregados de módulos diferentes quando isso impediria extração futura — usamos FK apenas dentro do módulo e por `tenant_id`; entre módulos, referência por ID com validação na aplicação. **Exceção pragmática:** FK para `patients.patient` e `clinic.tenant` é permitida por serem o núcleo compartilhado e por ganho real de integridade.
5. `reporting` pode ler tabelas de outros módulos **somente** através de views versionadas (`vw_*`), que funcionam como contrato.

Essas regras são verificadas automaticamente (ver seção 8).

## 4. Camadas (dentro de cada módulo)

```
src/modules/scheduling/
├── domain/                      # regra de negócio pura — zero dependência externa
│   ├── entities/
│   │   ├── appointment.ts
│   │   └── waitlist-entry.ts
│   ├── value-objects/
│   │   ├── time-slot.ts
│   │   └── appointment-status.ts
│   ├── events/
│   │   ├── appointment-scheduled.event.ts
│   │   └── appointment-cancelled.event.ts
│   ├── errors/
│   │   └── slot-unavailable.error.ts
│   ├── services/                # domain services (regra que não cabe em 1 entidade)
│   │   └── availability-calculator.ts
│   └── repositories/            # INTERFACES (ports de saída)
│       └── appointment.repository.ts
├── application/                 # orquestração
│   ├── use-cases/
│   │   ├── schedule-appointment/
│   │   │   ├── schedule-appointment.usecase.ts
│   │   │   ├── schedule-appointment.input.ts
│   │   │   └── schedule-appointment.spec.ts
│   │   ├── cancel-appointment/
│   │   └── list-day-agenda/
│   ├── ports/                   # interfaces de serviços externos (notificação, clock…)
│   │   ├── notification.port.ts
│   │   └── clock.port.ts
│   └── subscribers/             # reage a eventos de outros módulos
│       └── on-quote-approved.subscriber.ts
├── infrastructure/              # adapters concretos
│   ├── persistence/
│   │   ├── prisma-appointment.repository.ts
│   │   └── mappers/appointment.mapper.ts
│   ├── http/
│   │   ├── appointment.controller.ts
│   │   ├── appointment.routes.ts
│   │   └── schemas/appointment.schema.ts   # Zod: validação + tipos de DTO
│   └── jobs/
│       └── send-confirmation.job.ts
├── public-api.ts                # o que outros módulos podem usar
└── module.ts                    # composição/DI e registro de rotas
```

### Regra de dependência (a regra da Clean Architecture)

```
infrastructure ──► application ──► domain
      │                                ▲
      └────────── implementa ports ────┘
```

- `domain` não importa nada de `application`, `infrastructure`, Express, Prisma, Zod ou Node APIs.
- `application` importa `domain` e **interfaces** de infraestrutura (ports).
- `infrastructure` importa tudo, e é o único lugar com bibliotecas externas.
- Verificado por lint (`eslint-plugin-boundaries` / `import/no-restricted-paths`) e por teste de arquitetura (`dependency-cruiser`).

## 5. Exemplos de código canônicos

### 5.1 Entidade de domínio (nada de framework aqui)

```ts
// modules/scheduling/domain/entities/appointment.ts
import { TenantId, EntityId, DomainEvent } from '@/modules/platform/domain';
import { TimeSlot } from '../value-objects/time-slot';
import { AppointmentStatus } from '../value-objects/appointment-status';
import { AppointmentScheduled } from '../events/appointment-scheduled.event';
import { InvalidStatusTransitionError } from '../errors/invalid-status-transition.error';

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
// modules/scheduling/domain/value-objects/time-slot.ts
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
// modules/scheduling/domain/value-objects/appointment-status.ts
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

### 5.4 Use case (application)

```ts
// modules/scheduling/application/use-cases/schedule-appointment/schedule-appointment.usecase.ts
import { Appointment } from '../../../domain/entities/appointment';
import { TimeSlot } from '../../../domain/value-objects/time-slot';
import type { AppointmentRepository } from '../../../domain/repositories/appointment.repository';
import type { AvailabilityCalculator } from '../../../domain/services/availability-calculator';
import type { UnitOfWork } from '@/modules/platform/application/unit-of-work';
import type { IdGenerator } from '@/modules/platform/application/id-generator';
import { SlotUnavailableError } from '../../../domain/errors/slot-unavailable.error';
import type { ScheduleAppointmentInput, ScheduleAppointmentOutput } from './schedule-appointment.input';

export class ScheduleAppointmentUseCase {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly availability: AvailabilityCalculator,
    private readonly uow: UnitOfWork,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: ScheduleAppointmentInput): Promise<ScheduleAppointmentOutput> {
    const slot = TimeSlot.create(input.startsAt, input.endsAt);

    return this.uow.run(async () => {
      const isFree = await this.availability.isSlotAvailable({
        tenantId: input.tenantId,
        professionalId: input.professionalId,
        chairId: input.chairId,
        slot,
      });
      if (!isFree) throw new SlotUnavailableError(slot);

      const appointment = Appointment.schedule(this.ids.next(), {
        tenantId: input.tenantId,
        unitId: input.unitId,
        patientId: input.patientId,
        professionalId: input.professionalId,
        chairId: input.chairId,
        procedureId: input.procedureId,
        slot,
        notes: input.notes ?? null,
      });

      await this.appointments.save(appointment);       // pode lançar SlotUnavailable pela constraint do banco
      await this.uow.publish(appointment.pullEvents()); // outbox transacional

      return { appointmentId: appointment.id, status: appointment.status.value };
    });
  }
}
```

### 5.5 Controller (interface HTTP) — fino por definição

```ts
// modules/scheduling/infrastructure/http/appointment.controller.ts
import type { Request, Response } from 'express';
import { scheduleAppointmentSchema } from './schemas/appointment.schema';
import type { ScheduleAppointmentUseCase } from '../../application/use-cases/schedule-appointment/schedule-appointment.usecase';

export class AppointmentController {
  constructor(private readonly scheduleAppointment: ScheduleAppointmentUseCase) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const body = scheduleAppointmentSchema.parse(req.body);
    const result = await this.scheduleAppointment.execute({
      ...body,
      tenantId: req.ctx.tenantId,
      unitId: req.ctx.unitId,
    });
    res.status(201).json({ data: result });
  };
}
```

Erros de domínio são convertidos em HTTP por um **error handler central** (mapa `DomainError → status`), nunca com `try/catch` espalhado em controllers.

### 5.6 Repositório concreto com contexto de tenant

```ts
// modules/scheduling/infrastructure/persistence/prisma-appointment.repository.ts
import type { AppointmentRepository } from '../../domain/repositories/appointment.repository';
import { Appointment } from '../../domain/entities/appointment';
import { AppointmentMapper } from './mappers/appointment.mapper';
import type { TenantPrisma } from '@/modules/platform/infrastructure/tenant-prisma';
import { SlotUnavailableError } from '../../domain/errors/slot-unavailable.error';

const EXCLUSION_VIOLATION = '23P01';

export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly db: TenantPrisma) {}

  async save(appointment: Appointment): Promise<void> {
    const data = AppointmentMapper.toPersistence(appointment);
    try {
      await this.db.client.appointment.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      });
    } catch (error) {
      if (isPgError(error, EXCLUSION_VIOLATION)) throw new SlotUnavailableError(appointment.slot);
      throw error;
    }
  }
}
```

`TenantPrisma` é um wrapper que garante `SET LOCAL app.tenant_id` na transação corrente (ver [Multi-Tenancy](./06-multi-tenancy.md)) — nenhum repositório monta `tenant_id` à mão em `WHERE`.

### 5.7 Evento de domínio + outbox

```ts
// modules/messaging/application/subscribers/on-appointment-scheduled.subscriber.ts
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

Fluxo: use case grava agregado **e** registro na tabela `outbox_event` na mesma transação → dispatcher (no worker) lê o outbox, entrega aos subscribers e marca como processado. Isso dá entrega **at-least-once** com atomicidade, sem broker externo. Handlers precisam ser idempotentes.

## 6. Estrutura do monorepo

```
.
├── apps/
│   ├── api/                      # Express + módulos (o monólito modular)
│   │   ├── src/
│   │   │   ├── main.ts           # bootstrap HTTP
│   │   │   ├── worker.ts         # bootstrap de filas/cron
│   │   │   ├── app.ts            # composição de middlewares e rotas v1
│   │   │   ├── config/           # env schema (Zod), constantes
│   │   │   ├── modules/
│   │   │   │   ├── platform/
│   │   │   │   ├── identity/
│   │   │   │   ├── clinic/
│   │   │   │   ├── patients/
│   │   │   │   ├── scheduling/
│   │   │   │   ├── clinical-records/
│   │   │   │   ├── treatments/
│   │   │   │   ├── billing/
│   │   │   │   ├── messaging/
│   │   │   │   ├── reporting/
│   │   │   │   └── subscription/
│   │   │   └── shared/http/      # middlewares: auth, tenant, error, rate limit
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── test/
│   └── web/                      # Next.js (App Router)
│       └── src/app/...
├── packages/
│   ├── contracts/                # tipos/DTOs compartilhados api↔web (gerados dos schemas Zod)
│   ├── ui/                       # design system (componentes React)
│   ├── config/                   # eslint, tsconfig, prettier compartilhados
│   └── utils/                    # helpers puros (datas, moeda, CPF, FDI)
├── docs/
├── docker-compose.yml
└── package.json                  # workspaces (pnpm)
```

`packages/contracts` é o único ponto de acoplamento entre `web` e `api`: os schemas Zod da camada HTTP são a fonte da verdade e exportam tipos para o frontend, eliminando DTO duplicado e drift de contrato.

## 7. Composição de dependências (DI simples, sem framework)

```ts
// modules/scheduling/module.ts
export function buildSchedulingModule(deps: PlatformDeps): SchedulingModule {
  const repository = new PrismaAppointmentRepository(deps.db);
  const availability = new AvailabilityCalculator(repository, deps.businessHours);
  const scheduleAppointment = new ScheduleAppointmentUseCase(repository, availability, deps.uow, deps.ids);

  const controller = new AppointmentController(scheduleAppointment);

  return {
    routes: buildAppointmentRoutes(controller),
    subscribers: [new OnQuoteApprovedSubscriber(scheduleAppointment)],
    publicApi: { getAppointmentSummary: /* ... */ },
  };
}
```

Injeção manual por construtor: explícita, tipada, sem decorators nem container mágico. Se o número de módulos crescer muito, avaliamos um container (`tsyringe`) — mas não antes de doer.

## 8. Fitness functions (a arquitetura verificada por CI)

| Verificação | Ferramenta |
| --- | --- |
| `domain` não importa Prisma/Express/Zod/axios | `dependency-cruiser` (regra `no-framework-in-domain`) |
| Módulo só importa `public-api.ts` de outro módulo | `eslint-plugin-boundaries` |
| Sem dependência circular entre módulos | `dependency-cruiser` |
| Toda tabela com dado de tenant tem `tenant_id` + policy RLS | teste de integração que varre `information_schema` |
| Nenhuma query sem contexto de tenant | teste que roda os casos de uso sem `SET app.tenant_id` e espera erro |
| Cobertura mínima em `domain/` e `application/` | Vitest coverage (limite ≥ 85% em domain) |
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
| IDs | UUID v7 | Ordenável por tempo, bom para índice, não sequencial previsível |
| Testes | Vitest (unit/integration) + Supertest (API) + Testcontainers (Postgres) + Playwright (e2e) | Testar RLS exige banco real |
| Docs de API | OpenAPI gerado dos schemas Zod (`zod-to-openapi`) + Scalar/Swagger UI | Documentação que não mente |

## 10. Anti-padrões proibidos

1. Controller com regra de negócio ou query.
2. Entidade de domínio anêmica (apenas getters/setters) com a regra no service.
3. `PrismaClient` importado fora de `infrastructure/`.
4. Módulo importando `../outro-modulo/domain/...`.
5. `any`, `as unknown as`, `getattr`-like dinâmico para escapar de tipos.
6. Query sem `tenant_id`/RLS ativa.
7. Mutação destrutiva de dado clínico (`UPDATE` que apaga versão anterior de evolução).
8. Lógica de negócio duplicada no frontend (frontend valida para UX; a verdade é do servidor).
9. Job sem idempotência ou sem limite de retry.
10. Segredo em `.env` comitado ou log de dado pessoal/clínico.
