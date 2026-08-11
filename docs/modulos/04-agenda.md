# Módulo — Agenda (`scheduling`)

## 1. Responsabilidade

Marcar, mover, confirmar e encerrar compromissos, garantindo que **nenhum recurso seja duplo-agendado** e que a disponibilidade publicada seja verdadeira. É o coração operacional do produto: se a agenda falha, a clínica abandona o sistema no primeiro dia.

## 2. Agregado `Appointment`

```ts
interface AppointmentProps {
  tenantId: TenantId; unitId: EntityId;
  patientId: EntityId;
  professionalId: EntityId;
  chairId?: EntityId;
  procedureId?: EntityId;
  slot: TimeSlot;                 // value object [startsAt, endsAt)
  status: AppointmentStatus;
  origin: 'INTERNAL' | 'PUBLIC_BOOKING' | 'WAITLIST' | 'RECALL';
  seriesId?: EntityId;            // recorrência
  notes?: string;                 // administrativo, não clínico
  cancelReason?: string;
  confirmedAt?: Date; arrivedAt?: Date; startedAt?: Date; completedAt?: Date;
}
```

### Máquina de estados

```
REQUESTED ──► SCHEDULED ──► CONFIRMED ──► IN_SERVICE ──► COMPLETED
    │             │  │           │
    │             │  └───────────┴──► NO_SHOW ──► SCHEDULED (reagendado)
    └─────────────┴──────────────────► CANCELLED
```

Regras:

1. Transição fora do mapa → `409 INVALID_STATE_TRANSITION`.
2. `CANCELLED` exige motivo; `NO_SHOW` só após o horário de início; `COMPLETED` só a partir de `IN_SERVICE`.
3. `COMPLETED` sem evolução clínica registrada gera **pendência** visível ao dentista (não bloqueia, para não travar a operação, mas aparece em relatório).
4. `CANCELLED` e `NO_SHOW` liberam o slot e disparam a oferta para a fila de espera.
5. Estados terminais (`COMPLETED`, `CANCELLED`) não voltam atrás; correção é novo agendamento.

## 3. Prevenção de double-booking (defesa em três camadas)

**Camada 1 — UI:** só mostra slots retornados por `GET /availability`.

**Camada 2 — Domínio:** o use case recalcula disponibilidade dentro da transação, considerando horário de trabalho, bloqueios, feriados e agendamentos existentes.

**Camada 3 — Banco (a que realmente garante):**

```sql
ALTER TABLE appointment
  ADD CONSTRAINT appointment_no_overlap_professional
  EXCLUDE USING gist (
    tenant_id WITH =, professional_id WITH =, period WITH &&
  ) WHERE (status NOT IN ('CANCELLED', 'NO_SHOW'));

ALTER TABLE appointment
  ADD CONSTRAINT appointment_no_overlap_chair
  EXCLUDE USING gist (
    tenant_id WITH =, chair_id WITH =, period WITH &&
  ) WHERE (chair_id IS NOT NULL AND status NOT IN ('CANCELLED', 'NO_SHOW'));
```

A violação da constraint (`23P01`) é traduzida em `SlotUnavailableError` → `409 SLOT_UNAVAILABLE`, com sugestão dos próximos horários livres. Isso resolve a corrida entre duas recepcionistas e entre recepção e autoagendamento sem lock pessimista.

## 4. Cálculo de disponibilidade

```ts
export class AvailabilityCalculator {
  async slotsFor(input: { unitId: EntityId; professionalId: EntityId; date: string; durationMinutes: number }) {
    const windows  = await this.clinic.getWorkingWindows(input);          // horário efetivo
    const blocks   = await this.blocks.findByDate(input);                 // bloqueios/férias
    const booked   = await this.appointments.findActiveByDate(input);     // já agendados
    const settings = await this.clinic.getSchedulingSettings(input);      // granularidade, buffer, antecedência

    return windows
      .flatMap((w) => this.split(w, input.durationMinutes, settings.granularityMinutes))
      .map((slot) => ({
        ...slot,
        available: !this.overlapsAny(slot, [...blocks, ...booked], settings.bufferMinutes),
        reason: this.reasonFor(slot, blocks, booked, settings),
      }));
  }
}
```

Parâmetros configuráveis por tenant: granularidade (10/15/20/30 min), buffer entre consultas, antecedência mínima e máxima para agendamento público, permissão de overbooking (default: proibido).

## 5. Bloqueios e recorrência

- `schedule_block`: férias, almoço extra, reunião, manutenção de equipamento — por unidade, cadeira ou profissional, com motivo e possibilidade de dia inteiro.
- Criar bloqueio sobre agendamentos existentes **não** cancela nada: retorna a lista de conflitos para decisão humana explícita.
- `appointment_series`: recorrência (ex.: manutenção ortodôntica mensal). Geração limitada a 12 ocorrências futuras (evita explosão de dados); exclusão com escopo `THIS | FUTURE | ALL`. Ocorrência individual pode ser movida sem afetar a série.

## 6. Fila de espera e reencaixe (diferencial)

```ts
interface WaitlistEntry {
  patientId: EntityId;
  procedureId?: EntityId;
  professionalId?: EntityId;      // opcional: "qualquer dentista"
  preferences: { weekdays: number[]; periods: ('MORNING' | 'AFTERNOON')[]; notBefore?: Date; notAfter?: Date };
  priority: 'URGENT' | 'NORMAL';
  status: 'WAITING' | 'OFFERED' | 'SCHEDULED' | 'EXPIRED' | 'CANCELLED';
}
```

Fluxo automático quando um slot vaga:

1. Evento `scheduling.appointment_cancelled` (ou `no_show`) → job `offer-waitlist-slot`.
2. Filtra a fila por compatibilidade (profissional, procedimento/duração, preferência de dia/período) e ordena por prioridade e antiguidade.
3. Envia WhatsApp com template de utilidade e link de aceite de uso único, válido por **30 minutos**.
4. Primeiro a aceitar leva o horário; a constraint do banco resolve empates. Os demais recebem aviso de que o horário foi ocupado.
5. Se ninguém aceitar em 30 min, oferece ao próximo lote (até 3 lotes) e então marca o slot como livre na agenda.

Métrica de sucesso: `% de cancelamentos convertidos em novo agendamento` ([doc 14](../14-metricas-kpis.md)).

## 7. Autoagendamento público

Fluxo: `GET /public/clinics/:slug` → serviços e profissionais visíveis → `GET .../availability` → `POST .../bookings` (nome + telefone + consentimento → envia OTP) → `POST .../bookings/verify` (código de 6 dígitos, 5 min, 3 tentativas) → cria `Appointment` com `status = REQUESTED` ou `SCHEDULED` (configurável: com ou sem aprovação da recepção).

Proteções: rate limit por IP e por telefone; apenas procedimentos marcados como `publicly_bookable`; antecedência mínima configurável (default 2h); janela máxima (default 60 dias); recálculo de disponibilidade no submit; paciente novo é criado com `origin = PUBLIC_BOOKING` e sinalizado para conferência de dados na recepção; possível duplicata é detectada por telefone e vinculada ao paciente existente após conferência.

## 8. Notificações automáticas

Ao criar/confirmar/mover um agendamento, o módulo agenda jobs delayed (e cancela os antigos ao mover/cancelar):

| Momento | Template | Categoria | Ação do paciente |
| --- | --- | --- | --- |
| Imediato (criação) | `appointment_created` | utility | — |
| D-1 às 12:00 (tz do tenant) | `appointment_confirmation` | utility | Botões Confirmar / Cancelar |
| H-3 | `appointment_reminder` | utility | — |
| Cancelamento | `appointment_cancelled` | utility | — |
| Pós-atendimento (D+1) | `post_visit` | utility/marketing | Avaliação (fase 2) |

Regra de silêncio: nada é enviado entre 21:00 e 08:00 no fuso do tenant (jobs são reagendados para a janela permitida).

## 9. Eventos

| Publicados |
| --- |
| `scheduling.appointment_scheduled` · `appointment_rescheduled` · `appointment_confirmed` · `appointment_cancelled` · `appointment_no_show` · `appointment_started` · `appointment_completed` · `waitlist_offer_sent` · `waitlist_offer_accepted` |

| Consumidos | Efeito |
| --- | --- |
| `messaging.confirmation_received` | Transição para `CONFIRMED` |
| `messaging.cancellation_received` | Cancela com motivo "paciente via WhatsApp" e aciona a fila |
| `clinic.business_hours_changed` | Lista agendamentos fora do novo horário para revisão |
| `patients.patient_deactivated` | Alerta sobre agendamentos futuros |

## 10. Endpoints

Ver [API v1 §2.4](../08-api-v1.md#24-agenda-scheduling).

## 11. Testes obrigatórios

- 20 requisições concorrentes no mesmo slot → exatamente 1 sucesso.
- Reagendar cancela e recria as notificações (não fica lembrete do horário antigo).
- Slot fora do horário de trabalho não aparece em `availability` nem é aceito no POST.
- Fila de espera: dois pacientes aceitando o mesmo horário → só o primeiro é agendado.
- Autoagendamento respeita antecedência mínima e procedimentos públicos.
- Bloqueio sobre agendamento existente retorna conflitos e não cancela nada.
- Transições inválidas rejeitadas (confirmar cancelado, completar sem iniciar, `NO_SHOW` antes da hora).
- Recorrência gera 12 ocorrências e a exclusão com escopo `FUTURE` preserva as passadas.
- Nenhuma mensagem é enviada na janela de silêncio.
- Agenda de um dia com 200 agendamentos responde em < 1 s.
