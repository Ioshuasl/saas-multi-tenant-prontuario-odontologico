# 16 — Estrutura de Pastas e Convenções de Código

Este documento fixa a estrutura de pastas do projeto. Ele reaproveita o **padrão Orius** (1 arquivo por operação CRUD em cada camada, classes curtas, separação explícita) — o mesmo usado em módulos como `Aluno` no `pdi-ioshua` — adaptado ao stack Node/TypeScript + Next.js deste SaaS.

Princípio geral: **a convenção de pastas/nomenclatura é do time (Orius); a regra de dependência e o `models/` rico são da arquitetura (DDD/Clean).** As duas coisas coexistem.

Referência canônica neste doc: entidade **`Patient`** (módulo `patients`).

---

## 0. Decisões fechadas (resumo)

| Tema | Decisão |
| --- | --- |
| Relação com DDD/`models/` | Híbrido: mantém `models/` com invariantes; granularidade Orius (1 arquivo por ação) em service/repository/action |
| Camada `actions/` | **Só quando há efeito além do repositório** (evento, outro módulo, outbox, side-effect). CRUD puro: `Service → Repository` |
| Nome da classe | Curto, **sem** prefixo da entidade: `ListService`, `CreateRepository`, `CreateAction` |
| Nome do arquivo | Backend: `snake_case` (`patient_create.service.ts`). Frontend: `PascalCase` (`PatientCreateService.ts`) |
| Vocabulário de operação | Alinhado à API REST: `list` / `get` / `create` / `update` / `delete` (+ auxiliares `get_by_<uk>`, verbos de domínio) |
| Frontend | `Data → Service → Hook` por ação + **TanStack Query** no hook; tipagens em `types/`, enums em `enum/` |
| Exemplo canônico | `Patient` |

---

## 1. Backend

### 1.1 Estrutura na raiz

```
backend/src/
├── server.ts
├── worker.ts
├── app.ts
├── routes/
│   └── index.ts                 # monta /api/v1
├── docs/
│   └── openapi.yaml             # gerado dos schemas Zod
├── shared/
│   ├── config/
│   ├── database/                # prisma, tenant-prisma (RLS), unit-of-work, outbox
│   ├── middlewares/
│   ├── integrations/
│   ├── crypto/                  # KeyManagementPort + envelope AES-GCM
│   ├── storage/                 # ObjectStorage port (MinIO/S3 + fake)
│   ├── queue/
│   ├── domain/                  # kernel: EntityId, TenantId, DomainEvent, erros base
│   └── helpers/
└── modules/
    └── <dominio>/               # ver 1.2
```

Módulos (bounded contexts): `identity`, `clinic`, `patients`, `scheduling`, `clinical-records`, `treatments`, `billing`, `messaging`, `reporting`, `subscription`.

Superfície HTTP transversal: `modules/platform/` (`platform.module.ts` + `platform_public.ts`) — consulta de `audit_log`, export LGPD, DSR, break-glass e `/ready`. **Não** é bounded context clínico. Gravação de auditoria permanece em `shared/database/write_audit.ts` (vários consumidores). Outbox, RLS helpers, health liveness e middlewares continuam em `shared/`. `platform` **não** importa internals de `patients` / `clinical_records` / `billing` / `messaging` — só `*_public.ts` ou SQL read-only no próprio repositório de export.

### 1.2 Estrutura de um módulo — exemplo `patients` / `Patient`

```
modules/patients/
├── models/                                    # DOMÍNIO (DDD) — zero framework
│   ├── patient.model.ts
│   ├── value-objects/
│   │   ├── cpf.vo.ts
│   │   └── phone-number.vo.ts
│   ├── events/
│   │   └── patient-created.event.ts
│   └── errors/
│       └── duplicate-patient-cpf.error.ts
│
├── schemas/                                   # Zod (entrada HTTP)
│   └── patient.schema.ts                      # create/update/list query + tipos
│
├── repositories/
│   └── patient/
│       ├── patient_list.repository.ts         # class ListRepository
│       ├── patient_get.repository.ts          # class GetRepository
│       ├── patient_create.repository.ts       # class CreateRepository
│       ├── patient_update.repository.ts       # class UpdateRepository
│       ├── patient_delete.repository.ts       # class DeleteRepository
│       ├── patient_get_by_cpf.repository.ts   # class GetByCpfRepository
│       └── mappers/
│           └── patient.mapper.ts              # row ↔ Patient (domínio)
│
├── actions/                                   # SÓ quando há efeito além do repositório
│   └── patient/
│       └── patient_create.action.ts           # class CreateAction
│           # ex.: persiste + publica outbox (medical_record) na mesma UoW
│
├── services/                                  # 1 operação = 1 arquivo = 1 classe curta
│   └── patient/
│       ├── patient_list.service.ts            # class ListService
│       ├── patient_get.service.ts             # class GetService
│       ├── patient_create.service.ts          # class CreateService
│       ├── patient_update.service.ts          # class UpdateService
│       ├── patient_delete.service.ts          # class DeleteService
│       └── patient_get_by_cpf.service.ts      # class GetByCpfService (unicidade)
│
├── controllers/
│   └── patient.controller.ts                  # fino: parse → service → resposta
├── routes/
│   └── v1/patient.routes.ts
├── types/                                     # tipagens TS do módulo (substitui interfaces/)
│   ├── patient/
│   │   ├── patient_create.types.ts            # input/output da operação
│   │   ├── patient_list.types.ts
│   │   └── patient_summary.types.ts
│   └── ports/
│       └── clinical_records.port.ts           # ports de saída (Clean Architecture)
├── enum/                                      # enums / mapas const tipados
│   └── patient/
│       ├── patient_origin.enum.ts
│       └── consent_type.enum.ts
├── subscribers/
├── jobs/
├── helpers/
├── patients_public.ts                         # fronteira entre módulos
└── patients.module.ts                         # DI + registro de rotas
```

> **`interfaces/` não existe mais.** Tipagens e ports ficam em `types/`; enums em `enum/`.
### 1.3 Fluxo por camada

```
HTTP  →  routes  →  controller  →  service  →  [action?]  →  repository  →  Prisma
                                      │
                                      └── models/ (invariantes, VOs, eventos)
```

| Situação | Fluxo |
| --- | --- |
| CRUD puro (list/get/update simples) | `Service` → `Repository` |
| Persistência **+** efeito (evento, outro agregado, outbox, chamada a port) | `Service` → `Action` → `Repository` (+ ports) |
| Unicidade / lookup auxiliar | `GetBy<Uk>Service` chamado pelo `CreateService`/`UpdateService` |

### 1.4 Nomenclatura (backend)

| Peça | Convenção | Exemplo |
| --- | --- | --- |
| Arquivo | `snake_case` + sufixo de papel | `patient_create.service.ts` |
| Classe de operação | Curta, **sem** entidade | `CreateService`, `ListRepository`, `CreateAction` |
| Parâmetro de entrada | `<entidade>Schema` / campos tipados — **nunca** `data` genérico | `patientSchema: PatientCreateSchema` |
| Update | `execute(patientId, patientSchema)` | id no path, body sem PK |
| Operações CRUD | `list` `get` `create` `update` `delete` | alinhado a [08 — API v1](./08-api-v1.md) |
| Auxiliares | `get_by_<campo>` | `patient_get_by_cpf.service.ts` → `GetByCpfService` |
| Verbos de domínio (não-CRUD) | verbo no arquivo/classe | `appointment_confirm.service.ts` → `ConfirmService` |
| Eventos | `<modulo>.<entidade>_<verbo_passado>` | `patients.patient_created` |
| Tipagens | `types/<entidade>/` ou `types/ports/` | `patient_create.types.ts`, `clinical_records.port.ts` |
| Enums | `enum/<entidade>/` | `patient_origin.enum.ts` → `PatientOrigin` |

```
# CRUD Patient
patient_list.service.ts       → class ListService
patient_get.service.ts        → class GetService
patient_create.service.ts     → class CreateService
patient_update.service.ts     → class UpdateService
patient_delete.service.ts     → class DeleteService
patient_get_by_cpf.service.ts → class GetByCpfService

patient_list.repository.ts    → class ListRepository
patient_create.repository.ts  → class CreateRepository
patient_create.action.ts      → class CreateAction   # só se houver efeito extra
```

### 1.5 Quando criar `actions/`

**Criar Action** se o caso de uso, além de ler/gravar no repositório da entidade, também:

- publica evento de domínio / grava outbox;
- chama port de outro módulo;
- orquestra mais de um repositório na mesma transação;
- dispara efeito que não é “só o SQL/Prisma desta entidade”.

**Não criar Action** para: listar, buscar por id, update de campos, soft-delete simples, get_by_cpf. Nesses casos o `Service` chama o `Repository` direto.

Exemplo `Patient` — create precisa do prontuário vazio e do evento:

```ts
// services/patient/patient_create.service.ts
export class CreateService {
  constructor(
    private readonly getByCpf: GetByCpfService,
    private readonly createAction: CreateAction, // efeito além do repo
  ) {}

  async execute(ctx: RequestContext, patientSchema: PatientCreateSchema) {
    const existing = await this.getByCpf.execute(ctx, patientSchema.cpf, false);
    if (existing) throw new DuplicatePatientCpfError(patientSchema.cpf);
    return this.createAction.execute(ctx, patientSchema);
  }
}

// actions/patient/patient_create.action.ts
export class CreateAction {
  constructor(
    private readonly createRepository: CreateRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(ctx: RequestContext, patientSchema: PatientCreateSchema) {
    return this.uow.run(ctx, async () => {
      const patient = Patient.create(/* ... VOs / invariantes ... */);
      await this.createRepository.execute(ctx, patient);
      await this.uow.publish(patient.pullEvents()); // outbox → clinical-records cria MedicalRecord
      return patient;
    });
  }
}
```

Exemplo `Patient` — list **sem** Action:

```ts
// services/patient/patient_list.service.ts
export class ListService {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(ctx: RequestContext, query: PatientListQuery) {
    return this.listRepository.execute(ctx, query);
  }
}
```

### 1.6 Regras de dependência (Clean Architecture)

```
controllers · routes · repositories · jobs · subscribers · actions
        │                                         ▲
        ▼                                         │
    services  ──────────────────────────────►  models
```

- `models/` não importa Express, Prisma, Zod, HTTP.
- `services/` orquestra; chama `models/`, `actions/` (quando existir) ou `repositories/`; não importa Prisma Client direto.
- `actions/` orquestra persistência + efeitos; não conhece HTTP.
- `repositories/` é a única pasta do módulo que fala com Prisma (via `TenantPrisma`).
- Cruzar módulo **somente** por `<dominio>_public.ts`.

Equivalência Clean Architecture:

| Camada canônica | Pasta aqui |
| --- | --- |
| domain | `models/` |
| application (use cases) | `services/` + `actions/` (quando houver) |
| application (ports + tipagens) | `types/` (inclui `types/ports/`) |
| enums / constantes tipadas | `enum/` |
| interface (HTTP) | `controllers/` + `routes/` + `schemas/` |
| infrastructure | `repositories/`, `jobs/`, `shared/integrations/` |

> **`models/` não é model de ORM.** Mapeamento de tabelas: `prisma/schema.prisma`. `models/` = invariantes de domínio.

### 1.7 Onde colocar o quê

| Se você está escrevendo… | Vai em |
| --- | --- |
| regra sempre verdadeira sobre a entidade | `models/` |
| validação de formato de entrada | `schemas/` (Zod) |
| tipagem TS (DTO, input/output, summary) | `types/<entidade>/` |
| port de saída (clock, storage, outro módulo) | `types/ports/` |
| enum / mapa `as const` do domínio | `enum/<entidade>/` |
| orquestração de **uma** operação (list/create/…) | `services/<entidade>/` |
| persistência + efeitos colaterais | `actions/<entidade>/` |
| SQL/Prisma/mapper | `repositories/<entidade>/` |
| `req`/`res`/status HTTP | `controllers/` |
| API externa | `shared/integrations/` (via port em `types/ports/`) |
| API para outro módulo | `<dominio>_public.ts` |

### 1.8 Verificação automática (CI)

```js
// .dependency-cruiser.js (essencial)
forbidden: [
  { name: 'no-framework-in-models', from: { path: 'src/modules/[^/]+/models' },
    to: { dependencyTypes: ['npm'], pathNot: '^(date-fns|uuid)$' } },
  { name: 'services-nao-importam-prisma', from: { path: 'src/modules/[^/]+/services' },
    to: { path: '@prisma/client' } },
  { name: 'cruzar-modulo-so-pelo-public',
    from: { path: 'src/modules/([^/]+)/' },
    to: { path: 'src/modules/(?!$1)([^/]+)/(?!\\2_public\\.ts)' } },
  { name: 'prisma-so-na-borda',
    from: { pathNot: 'src/(shared/database|modules/[^/]+/repositories)' },
    to: { path: '@prisma/client' } },
]
```

---

## 2. Frontend

### 2.1 Estrutura na raiz

```
frontend/src/
├── app/                         # ROTAS (App Router) — page.tsx fino
│   ├── (public)/
│   └── (app)/
│       └── pacientes/page.tsx   # só compõe PatientIndex
├── packages/
│   ├── operacional/             # recepção: Patient, Appointment, …
│   ├── clinico/
│   ├── financeiro/
│   ├── admin/
│   ├── messaging/
│   └── public/
└── shared/
    ├── ui/
    ├── layout/
    ├── api/                     # api-client + query-client (TanStack)
    ├── hooks/
    ├── auth/
    ├── helpers/
    └── styles/
```

### 2.2 Estrutura por entidade — padrão Orius + TanStack Query

Camadas **por ação**: `Data → Service → Hook`. O hook é quem usa TanStack Query.

```
packages/operacional/
├── components/Patient/
│   ├── PatientIndex.tsx
│   ├── PatientTable.tsx
│   ├── PatientColumns.tsx
│   ├── PatientFilter.tsx
│   ├── PatientForm.tsx              # página (se rota própria)
│   ├── PatientFormDialog.tsx        # modal
│   └── PatientSelectColumns.tsx     # uso em selects
├── data/Patient/
│   ├── PatientListData.ts           # único lugar que chama a API (GET lista)
│   ├── PatientGetData.ts
│   ├── PatientCreateData.ts
│   ├── PatientUpdateData.ts
│   └── PatientDeleteData.ts
├── services/Patient/
│   ├── PatientListService.ts        # 'use server' opcional / thin wrapper
│   ├── PatientGetService.ts
│   ├── PatientCreateService.ts
│   ├── PatientUpdateService.ts
│   └── PatientDeleteService.ts
├── hooks/Patient/
│   ├── usePatientListHook.ts        # useQuery → List
│   ├── usePatientGetHook.ts         # useQuery → Get
│   ├── usePatientCreateHook.ts      # useMutation → Create
│   ├── usePatientUpdateHook.ts
│   ├── usePatientDeleteHook.ts
│   └── usePatientFormHook.ts        # RHF + Zod (sem fetch)
├── types/Patient/                   # tipagens TS (substitui interfaces/)
│   ├── PatientTypes.ts              # entidade / summary
│   ├── PatientFilterTypes.ts
│   ├── PatientTableTypes.ts
│   ├── PatientFormTypes.ts
│   └── PatientFormDialogTypes.ts
├── enum/Patient/                    # enums da entidade no frontend
│   └── PatientOriginEnum.ts
└── schemas/Patient/
    └── PatientSchema.ts             # FormValues + zod (espelha contracts/)
```

### 2.3 Nomenclatura (frontend)

| Peça | Convenção | Exemplo |
| --- | --- | --- |
| Pastas de entidade | `PascalCase` | `Patient/` |
| Arquivos | `PascalCase` + papel | `PatientCreateData.ts`, `usePatientCreateHook.ts` |
| Tipagens | `types/<Entidade>/` | `PatientFormTypes.ts` |
| Enums | `enum/<Entidade>/` | `PatientOriginEnum.ts` |
| Operações | mesmas do REST | `List` `Get` `Create` `Update` `Delete` |
| Form vs FormDialog | `Form` = página; `FormDialog` = modal | não misturar |
| Query keys | `['patients', …]` | invalidar no `onSuccess` das mutations |

### 2.4 Fluxo e exemplos canônicos

```
Component → Hook (TanStack Query) → Service → Data → api-client → /api/v1
```

**Data** — único ponto com HTTP:

```ts
// data/Patient/PatientListData.ts
import { apiClient } from '@/shared/api/api-client';
import type { PatientListQuery, PatientListResult } from '@repo/contracts';

export async function PatientListData(query: PatientListQuery): Promise<PatientListResult> {
  return apiClient.request('/patients', { method: 'GET', query });
}
```

```ts
// data/Patient/PatientCreateData.ts
export async function PatientCreateData(body: PatientCreateInput): Promise<Patient> {
  return apiClient.request('/patients', { method: 'POST', body });
}
```

**Service** — thin; sem regra de negócio de servidor:

```ts
// services/Patient/PatientListService.ts
import { PatientListData } from '@/packages/operacional/data/Patient/PatientListData';

export async function PatientListService(query: PatientListQuery) {
  return PatientListData(query);
}
```

**Hook** — TanStack Query:

```ts
// hooks/Patient/usePatientListHook.ts
export function usePatientListHook(query: PatientListQuery) {
  return useQuery({
    queryKey: ['patients', 'list', query],
    queryFn: () => PatientListService(query),
    staleTime: 15_000,
  });
}

// hooks/Patient/usePatientCreateHook.ts
export function usePatientCreateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: PatientCreateService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}
```

### 2.5 Regras do frontend

1. **Rota é fina.** `page.tsx` só compõe; zero fetch na página.
2. **Package não importa de outro package.** Compartilhar → `shared/`.
3. **`shared/` só com 2+ consumidores reais.**
4. **Data é o único lugar que fala com a API** daquela ação.
5. **Service não chama `fetch` direto** — só Data.
6. **Hook não monta URL** — só Service + Query/Mutation.
7. **Componente não chama Data/Service** — só Hooks (e FormHook).
8. Tipos de request/response vêm de `contracts/`, não redigitados.

### 2.6 Agrupamento dos packages

| Package | Perfil | Entidades (exemplos) |
| --- | --- | --- |
| `operacional` | recepção | `Patient`, `Appointment`, … |
| `clinico` | dentista | `ClinicalNote`, `Odontogram`, `Quote`, … |
| `financeiro` | financeiro/dono | `Receivable`, `Payment`, `CashSession`, … |
| `admin` | dono | `Clinic`, `Procedure`, `Subscription`, … |
| `messaging` | recepção + dono | `Conversation`, `Message`, … |
| `public` | paciente/visitante | booking, anamnese, orçamento por token |

---

## 3. O que é fixo e o que é negociável

**Fixo**

- 1 operação = 1 arquivo em `services/`, `repositories/` e (quando existir) `actions/`;
- classe curta sem prefixo da entidade;
- backend `snake_case` / frontend `PascalCase`;
- vocabulário `list|get|create|update|delete`;
- `actions/` só com efeito além do repositório;
- tipagens em `types/`; enums em `enum/` — **sem pasta `interfaces/`**;
- `models/` sem framework;
- cruzar módulo só por `<dominio>_public.ts`;
- Prisma só em `repositories/` e `shared/database/`;
- frontend: `Data → Service → Hook` + TanStack Query;
- package do frontend não importa outro package.

**Negociável** (PR + nota neste documento)

- subdividir `models/` por agregado em módulos grandes;
- pasta `go/` sob `services/<entidade>/` (como no Orius Python) — **não adotada** no Node; a pasta da entidade já isola;
- juntar enums triviais em um único arquivo por módulo se forem poucos;
- novos packages no frontend conforme o produto cresce.

Módulos CRUD simples (categorias financeiras, tags) podem omitir `models/` ricos e `actions/` — bastam `schemas` + `services` + `repositories`. Cerimônia de domínio fica onde há invariante: agenda, prontuário, orçamento, financeiro, paciente (duplicidade/consentimento).

## Referências

- [05 — Arquitetura](./05-arquitetura.md)
- [08 — API v1](./08-api-v1.md)
- [09 — Frontend](./09-frontend.md)
- [12 — Qualidade e Testes](./12-qualidade-testes.md)
- [ADR-0001 — Monólito modular](./adr/0001-monolito-modular.md)
- Padrão de referência externo: módulo `Aluno` em `pdi-ioshua` (Orius)
