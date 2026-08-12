# Sprint 2 — Pacientes e Agenda interna (E3 + E4a Must)

**Objetivo verificável:** Owner/Recepção cadastra paciente → busca → agenda no dia/semana (criar em ≤3 interações, mover/redimensionar, status, bloqueio) com anti-conflito no banco. Marco **M1:** recepção agenda um dia inteiro sem treinamento formal.

**Escopo:** Must completo de E3 + E4a + UI operacional + carry-over S1 (horários).  
**Pontos (roadmap):** ~45 · Épicos E3, E4a · Marco M1 · [docs/13](../../13-roadmap-estimativas.md)

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — patients + scheduling interna (Blocos 0 parcial, 1–3) | `backend/` |
| **Frontend** | Sim — admin (carry-over horários) + operacional pacientes/agenda (Blocos 0, 4–5) | `frontend/` |

Não misturar: um bloco é **só backend** ou **só frontend**, salvo Bloco 0 (carry-over clinic UI + ajuste weekday) e contrato compartilhado (`contracts/`).

### Backend (Blocos 1–3 + parte do 0)

- DDL + RLS `patient`, `legal_guardian`, `consent`, `appointment` (+ EXCLUDE gist), `appointment_history`, `schedule_block`, `appointment_series`
- Módulos `patients` e `scheduling`; APIs públicas `patients_public` / `scheduling_public`
- Availability via `clinic.getWorkingWindows`; máquina de estados; `409 SLOT_UNAVAILABLE`
- Timeline parcial (só agendamentos); bloqueios com lista de conflitos; recorrência
- **Não inclui** telas Next.js (exceto nota do Bloco 0 no FE)
- **Não inclui** waitlist, autoagendamento público, jobs D-1/H-3, WhatsApp send (S3)

### Frontend (Blocos 0, 4–5)

- Package `admin`: UI de exceções de horário + horário por profissional (carry-over S1)
- Package `operacional`: pacientes + agenda dia/semana
- Fluxo Page → Hook → Service → Data → API
- **Não inclui** novos endpoints — consome o que os Blocos 1–3 expuseram
- **Não inclui** `/agendar/{slug}`, waitlist UI, conexão WhatsApp (S3)

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E3](../../requisitos/funcionais/03-pacientes.md) | Aceite pacientes (Must RF-E3-01..13) |
| [RF E4](../../requisitos/funcionais/04-agenda.md) | Aceite agenda interna (E4a: RF-E4-01..10, 16–17) |
| [Módulo patients](../../modulos/03-pacientes-crm.md) | Domínio / dedupe / consent |
| [Módulo scheduling](../../modulos/04-agenda.md) | Domínio / status / availability |
| [API v1 §2.3–2.4](../../08-api-v1.md) | Contratos HTTP (sem waitlist/público) |
| [Modelo de dados §3–4](../../07-modelo-de-dados.md) | DDL |
| [Frontend](../../09-frontend.md) | Package `operacional` |
| [Estrutura](../../16-estrutura-de-pastas.md) | Pastas / nomenclatura |
| [Qualidade](../../12-qualidade-testes.md) | RLS, EXCLUDE, smokes |
| [S1](./S1-identidade-clinica.md) | Carry-over horários / conflitos |

## Decisões de corte (fechadas no planejamento)

1. Must completo E3 + E4a (inclui recorrência RF-E4-10 e DnD RF-E4-05). Se estourar tempo, **último** a escorregar = recorrência — só com reclassificação explícita neste checklist.
2. RF-E4-18/19 (jobs D-1/H-3 + confirmação WhatsApp/link) → **S3**. Na S2, `CONFIRMED` via API interna.
3. Timeline S2 = só **agendamentos** (+ seções vazias tipadas para clínico/financeiro/mensagens). Sem stubs falsos de prontuário.
4. RF-E3-12: na S2 valida só **agendamento futuro** (parcela aberta quando billing existir).
5. DDL recorrência: `appointment_series` + `appointment.recurrence_id` (alinhar docs/07 na migração).
6. Weekday canônico: **1=Mon … 7=Sun** (alinhar nota 0–6 em docs/07 no Bloco 0).
7. `patient_contact` do diagrama §1 **não** entra no DDL (endereço em `patient.address` jsonb).

## Fora desta sprint

- Autoagendamento público, OTP, fila de espera / reencaixe (E4b → S3)
- Jobs confirmação D-1 / lembrete H-3 e botões WhatsApp (→ S3)
- SSE tempo real (RF-E4-20 Should)
- Merge de duplicatas / CRM / recall (Could / fase 2)
- Prontuário, orçamentos, financeiro
- Inbox WhatsApp (E8b → S7)
- Multi-unidade UI

## Blocos de entrega

### Bloco 0 — Carry-over S1: horários (clinic)

**Backend (se necessário)**

- [ ] Alinhar weekday 1–7 ISO em clinic + docs/07 (comentário/migração se divergir)
- [ ] Ao criar `business_hours_exception`, retornar lista de conflitos de `appointment` (vazio até Bloco 2 existir; depois real)

**Frontend (`admin`)**

- [ ] UI de exceções de horário (feriado/férias)
- [ ] UI de horário por profissional (`professionalId` na grade)
- [ ] Exibir conflitos retornados ao salvar exceção (não cancela agendamentos)

### Bloco 1 — Backend: patients (E3 Must)

- [ ] Migração Prisma + RLS: `patient`, `legal_guardian`, `consent`
- [ ] Código de ficha sequencial por tenant, imutável (RF-E3-13)
- [ ] CRUD + soft-delete / inativação (RF-E3-01, E3-11)
- [ ] CPF validado quando informado; duplicado → `409` + referência (RF-E3-02)
- [ ] Aviso de possível duplicata por telefone (não bloqueia) (RF-E3-03)
- [ ] Busca: nome (sem acento), telefone (últimos 4), CPF, código (RF-E3-04)
- [ ] Responsável legal (menores) (RF-E3-05..06 — bloqueio de orçamento fica para S5)
- [ ] Consentimentos versionados grant/revoke (RF-E3-07..08)
- [ ] Inativar com agendamento futuro → confirmação explícita (RF-E3-12 parcial)
- [ ] Módulo `backend/src/modules/patients/` + `patients_public.ts`
- [ ] Smoke `test:patients` + RLS patients no CI

### Bloco 2 — Backend: scheduling core (E4a)

- [ ] Migração + RLS: `appointment` (tstzrange + **EXCLUDE gist**), `appointment_history`, `schedule_block`, `appointment_series`
- [ ] `GET /availability` via `clinic.getWorkingWindows` + appointments/blocks
- [ ] Create / update / move / resize; `Idempotency-Key`; `409 SLOT_UNAVAILABLE` + sugestões (RF-E4-06..07)
- [ ] Máquina de estados + `POST .../status`; `409 INVALID_STATE_TRANSITION` (RF-E4-16..17)
- [ ] Histórico append-only (RF-E4-05)
- [ ] Duração padrão do procedimento, ajustável (RF-E4-04)
- [ ] Origin `INTERNAL`; status default alinhado à API
- [ ] Módulo `backend/src/modules/scheduling/` + `scheduling_public.ts`
- [ ] Smoke: 20 creates concorrentes no mesmo slot → 1 sucesso

### Bloco 3 — Backend: bloqueios, recorrência, timeline

- [ ] Schedule blocks (profissional / cadeira / unidade); lista conflitos; não cancela (RF-E4-08..09)
- [ ] Recorrência + delete scope `THIS|FUTURE|ALL` (RF-E4-10); máx. 12 ocorrências futuras (módulo)
- [ ] `GET /patients/:id/timeline` — itens de agenda reais; demais fontes vazias tipadas (RF-E3-09..10 parcial)
- [ ] Timeline da recepção omite/clínica: sem itens clínicos (ainda inexistentes)

### Bloco 4 — Frontend: pacientes (`operacional`)

- [ ] Rotas `(app)/pacientes` (+ detail)
- [ ] Index / Table / busca / Form / FormDialog
- [ ] Guardians + consents na ficha
- [ ] Detail com timeline parcial
- [ ] Check-duplicate UX (CPF bloqueante; telefone aviso)
- [ ] Fluxo Page → Hook → Service → Data → API

### Bloco 5 — Frontend: agenda (`operacional`)

- [ ] Rota `(app)/agenda` — visão dia/semana por profissional e/ou cadeira (RF-E4-01)
- [ ] Grade com slots configuráveis (10/15/20/30/60)
- [ ] Status coloridos (7 estados) (RF-E4-02)
- [ ] Criar a partir de slot livre em ≤ 3 interações (RF-E4-03)
- [ ] Drag / resize otimista + rollback em `409` (RF-E4-05)
- [ ] UI de bloqueios + conflitos
- [ ] UI mínima de recorrência (criar série / excluir com escopo)

## Endpoints-alvo (docs/08)

```
GET|POST          /api/v1/patients
GET|PATCH|DELETE  /api/v1/patients/:id
GET               /api/v1/patients/:id/timeline
GET|POST          /api/v1/patients/:id/consents
POST              /api/v1/patients/:id/guardians
GET               /api/v1/patients/check-duplicate

GET|POST          /api/v1/appointments
GET|PATCH|DELETE  /api/v1/appointments/:id
POST              /api/v1/appointments/:id/status
GET               /api/v1/appointments/:id/history
GET               /api/v1/availability
POST|DELETE       /api/v1/schedule-blocks[/:id]
POST|DELETE       /api/v1/appointment-series[/:id]?scope=THIS|FUTURE|ALL
```

**Backend**

- [ ] Paciente: CRUD + busca + dedupe CPF/telefone + consents + guardian + soft-delete
- [ ] Appointment: anti-conflito DB (EXCLUDE) + app; status machine; history
- [ ] Availability coerente com `getWorkingWindows`
- [ ] Bloqueios sem cancelamento automático; recorrência com escopo
- [ ] Timeline parcial (agenda)

**Frontend**

- [ ] Pacientes ponta a ponta em local
- [ ] Agenda dia/semana usável (M1): criar, mover, status, bloqueio
- [ ] Carry-over S1: exceções + horário por profissional

## Qualidade

- CI: lint, typecheck, arch:check, migrate, test:rls (patients/appointments), `test:patients`, `test:scheduling`
- Domínio: máquina de status + `TimeSlot` (docs/12)
- Integração: 20 concorrentes → 1 sucesso no slot
- E2E mínimo (Playwright quando houver base; senão smoke HTTP): signup → paciente → agendar → status
- Envelope `{ data }` / `{ error }`; camelCase; UTC no banco / TZ do tenant

## Bloqueios

_Nenhum no planejamento. Dependência: S1 fechada (`getWorkingWindows`)._

## Notas

- Cruzar módulos só via `*_public.ts` / eventos (docs/05, docs/16).
- Índice agenda: `(tenant_id, unit_id, starts_at)`; risco R3 (fuso) e R9 (volume) — índices desde a S2.
- Recrutar clínica-piloto durante a S2 (roadmap §5).
- Carry-over para S3: máquina `CONFIRMED` / `REQUESTED` pronta para WhatsApp e link público; availability reutilizada no autoagendamento.
