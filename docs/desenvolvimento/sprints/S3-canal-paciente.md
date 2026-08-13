# Sprint 3 — Canal do paciente (E4b + E8a Must)

**Objetivo verificável:** Paciente agenda por `/agendar/{slug}` com OTP; cancelamento oferece fila via WhatsApp; Owner conecta WABA; D-1/H-3 + botão Confirm → `CONFIRMED` em < 5 s. Marco **M2:** confirmação WhatsApp ponta a ponta em número **real**.

**Escopo:** Must de E4b + E8a (conexão + confirmação/lembrete/fila). Sem inbox E8b.  
**Pontos (roadmap):** ~45 · Épicos E4b, E8a · Marco M2 · [docs/13](../../13-roadmap-estimativas.md)

**Pré-requisito:** S2 fechada (patients + appointments + availability + status machine + EXCLUDE). Playwright e2e S1/S2 já existe (`pnpm test:e2e`).

---

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — filas/outbox, public booking, waitlist, messaging E8a (Blocos 1–4) | `backend/` |
| **Frontend** | Sim — `public` agendar + `operacional` waitlist + `messaging` connect (Blocos 5–6) | `frontend/` |

Não misturar: um bloco é **só backend** ou **só frontend**, salvo contrato (`contracts/` / `docs/08`). Cruzar BC só por `*_public.ts` + outbox (nunca import direto scheduling ↔ messaging).

### Backend (Blocos 1–4)

- Redis + BullMQ + outbox transacional; processo `worker` (mesmo artefato da API)
- Autoagendamento público + OTP; waitlist + job de oferta
- Messaging E8a: account, templates agenda, automations D-1/H-3, webhook, créditos/kill switch mínimos, audit
- **Não inclui** telas Next.js
- **Não inclui** inbox compartilhada (E8b → S7): sem `GET/POST /messaging/conversations*`

### Frontend (Blocos 5–6)

- Package `public`: `/agendar/[slug]` + confirmação por token (mobile-first, sem AppShell)
- Package `operacional`: waitlist na agenda; estados `REQUESTED` / `CONFIRMED`
- Package `messaging`: wizard conexão WA, kill switch, usage/logs mínimos
- **Não inclui** novos endpoints de domínio — consome Blocos 1–4
- **Não inclui** inbox full (S7)

---

## Estado atual do código (herança S2 / S0)

Usar; **não** reimplementar.

| Já existe | Onde | Uso na S3 |
| --- | --- | --- |
| `tenant.slug` único (citext) | Prisma + clinic | Resolver clínica pública; **nunca** autorizar |
| `Tenant.timezone` IANA | Prisma | Quiet hours + D-1 12:00 local |
| `getWorkingWindows` | `clinic_public.ts` | Availability pública = mesma verdade |
| `GET /availability` + EXCLUDE gist | scheduling | Create público/waitlist pelo mesmo caminho |
| Status machine `REQUESTED→…→CONFIRMED` | `status_machine.ts` | Confirm WA/link só a partir de `SCHEDULED` |
| Origins `INTERNAL \| PUBLIC_BOOKING \| WAITLIST \| RECURRENCE` | `appointment.enum.ts` | Public → `PUBLIC_BOOKING`; fila → `WAITLIST` |
| Consents + canal `PUBLIC_BOOKING` | patients | Grant `DATA_PROCESSING` (+ `TERMS`) no verify |
| `hasMarketingConsent` | `patients_public.ts` | Gate marketing (`BLOCKED_NO_CONSENT`) |
| Onboarding step `WHATSAPP` | clinic enum | Wizard FE liga nesse passo (não bloqueia mínimos) |
| Redis no Compose + `REDIS_URL` / `WHATSAPP_*` no env | S0 | Filas + assinatura webhook |
| `backend/src/worker.ts` | esqueleto S0 | Completar no Bloco 1 |
| `rateLimit` middleware | identity login | Reusar para público (IP/telefone) |
| `KeyManagementPort` | shared | Guardar `access_token_ref` da WABA (nunca plaintext) |
| Package `public` (auth) + stub `messaging` | frontend | Estender; não criar package novo |
| E2E Playwright workers=1 | `e2e/` | Novos specs: public-booking, waitlist, messaging (fake) |

**Falta (entra nesta sprint):** `procedure.publicly_bookable`; settings de booking no tenant; tabelas waitlist / public_booking_token / messaging / outbox; `shared/queue/`; módulo `messaging/`; rotas públicas; `dev:worker`.

**Alinhar docs/07:** `appointment.origin` no código é `PUBLIC_BOOKING` (não `PUBLIC_LINK`). Consent channel `PUBLIC_BOOKING` já está no enum (docs/07 §3 ainda lista só IN_PERSON\|LINK\|WHATSAPP) — corrigir na migração/docs no Bloco 2.

---

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E4](../../requisitos/funcionais/04-agenda.md) | E4b: RF-E4-11..15, 18–19 |
| [RF E8](../../requisitos/funcionais/08-whatsapp-comunicacao.md) | E8a: RF-E8-01..06, 11–19 (sem 07–10 inbox) |
| [Módulo scheduling §6–8](../../modulos/04-agenda.md) | Público / waitlist / notificações |
| [Módulo messaging](../../modulos/08-whatsapp-comunicacao.md) | Templates / automations / webhook / créditos |
| [ADR-0005](../../adr/0005-whatsapp-cloud-api.md) | Cloud API / port `MessagingProvider` |
| [ADR-0006](../../adr/0006-filas-bullmq.md) | Outbox + BullMQ; **proibido** `queue.add` no use case |
| [API v1 §2.4 / §2.8 / §3.5](../../08-api-v1.md) | Contratos HTTP + webhook |
| [Modelo §4 + §8 + outbox](../../07-modelo-de-dados.md) | DDL |
| [Frontend](../../09-frontend.md) | Packages `public` / `messaging` / rotas `(public)` |
| [Pastas](../../16-estrutura-de-pastas.md) | `jobs/`, `*_public.ts`, worker |
| [Infra §7](../../11-infra-devops.md) | Nomes de filas/jobs |
| [Multi-tenant](../../06-multi-tenancy.md) | Slug ≠ autorização; RLS no dispatcher |
| [S2](./S2-pacientes-agenda.md) | Dependência patients + appointments + availability |

---

## Decisões de corte (fechadas no planejamento)

1. **Provider:** port `MessagingProvider` + adapter Meta Cloud API. CI/smoke/e2e local com **adapter fake**. Aceite M2 exige número real (R1).
2. **OTP público:** 6 dígitos, TTL **5 min**, **3 tentativas**. Canal preferencial = template auth WhatsApp; fallback **e-mail** (Mailpit/Resend já existe) se WABA ausente/erro. SMS **não** entra (fase 2). Booking **não** bloqueia se WA estiver down.
3. **Onde guarda OTP:** hash + `attempts` + `expires_at` em `public_booking_token` (purpose `BOOKING`). **Não** depender do Redis para OTP — API pública continua se Redis cair.
4. **Status pós-verify (default seed):** `REQUESTED` (recepção aprova → `SCHEDULED`). Tenant pode mudar para `SCHEDULED` direto via `bookingSettings.publicStatus`. D-1/H-3 **só** para status em `{SCHEDULED, CONFIRMED}` (não dispara em `REQUESTED`/`CANCELLED`).
5. **Confirm WA/link:** transição `SCHEDULED → CONFIRMED` (máquina S2). `REQUESTED` não confirma pelo paciente.
6. **Inbox E8b** (RF-E8-07..10, conversas) → **S7**. S3 persiste `message` (idempotência `wamid` + audit) e stub de `conversation` só para **Remarcar** (status `PENDING` + badge). Sem UI de chat.
7. **Templates S3:** `appointment_created`, `appointment_confirmation`, `appointment_reminder`, `appointment_cancelled`, `waitlist_offer` (+ auth OTP se WA). Orçamento/recibo/anamnese/birthday/recall **fora**.
8. **Créditos mínimos:** `message_credit_ledger` + franquia fake no seed; débito no **callback de entrega** (não no send). Sem saldo: marketing bloqueado; transacional crítico usa margem de cortesia (config, default 50 msgs); automação pulada + alerta; **agenda não bloqueia** (RF-E8-16). Kill switch = desliga todas as automations do tenant (`messaging.automations` + flag na account).
9. **Waitlist:** DDL docs/07 (`preferred_periods` jsonb `[{ weekday, from, to }]`, `priority` smallint `0=NORMAL`, `1=URGENT`). Oferta **30 min**; first-accept-wins via EXCLUDE + status `OFFERED→SCHEDULED`; até **3 lotes**; depois slot fica livre. Aceite: botão WA `WAITLIST_<offerId>` **e** link público (contrato novo em docs/08).
10. **Origin appointment:** `PUBLIC_BOOKING` / `WAITLIST` (enum já no código). **Patient:** adicionar `origin` (`INTERNAL` \| `PUBLIC_BOOKING`) para a recepção filtrar “conferir dados”.
11. **Procedure:** `publicly_bookable boolean NOT NULL DEFAULT false`. Só esses aparecem no link público (RF-E4-13). Seed: marcar 1–2 procedimentos demo.
12. **Tenant `bookingSettings` jsonb** (não tabela nova):

```json
{
  "minLeadMinutes": 120,
  "maxLeadDays": 60,
  "publicStatus": "REQUESTED",
  "courtesyTransactionalMessages": 50
}
```

Buffer extra entre slots: **não** nesta sprint (availability S2 sem buffer; módulo §4 fica para depois).

13. **Cadeira no público:** opcional/`null`. Paciente escolhe procedimento + profissional (se >1 visível); unidade = default do tenant.
14. **Permissões:** waitlist = `agenda.write`; conectar WA / kill switch = `messaging.configure`; usage/logs = `messaging.read`. Já existem na matriz S1.
15. **Eventos:** scheduling **publica** via outbox; messaging **consome** no dispatcher. Messaging **publica** `confirmation_received` / `cancellation_received` / `waitlist_offer_accepted`; scheduling consome → status / waitlist. Payload de job = **IDs** (`tenantId`, `appointmentId`, `requestId`). Zero dado clínico no Redis.
16. **Token na URL:** opaco (random); só **hash** no banco. Sem PII, slug de paciente ou horário na query.
17. **Telefone:** normalizar E.164 no booking (`55…`). Dedupe paciente por `phone_primary` (vínculo automático após OTP; flag “conferir” se nome divergir).

---

## Fora desta sprint

- Caixa de entrada compartilhada (E8b → S7) e SSE da inbox
- Templates de orçamento, recibo, anamnese, birthday/recall / NPS / marketing em massa / chatbot
- Anamnese pós-booking (S4); quotes públicos
- SMS como canal primário (fase 2) — só e-mail como fallback de OTP
- SSE agenda (Should RF-E4-20); multi-unidade UI
- Billing de créditos real / Stripe (franquia fake + ledger basta)
- Alterar algoritmo de availability (buffer, overbooking)

---

## Arquitetura técnica

```
HTTP público (sem JWT)
  → rateLimit(IP|telefone) → publicTenantContext(slug) → RLS app.tenant_id
  → scheduling (booking/waitlist accept) | messaging (webhook)

HTTP autenticado
  → authenticate → tenantContext → authorize(permission)
  → waitlist CRUD | messaging account/automations/usage/logs

Use case com efeito extra
  → Service → Action → UoW (agregado + outbox_event)   // NUNCA queue.add aqui

Worker (mesmo artefato)
  → dispatch-outbox (5s) → BullMQ
  → handlers em modules/<bc>/jobs/  (abre RLS com tenantId do payload)
```

### Pastas-alvo (docs/16)

```
backend/src/
  worker.ts                                      # bootstrap BullMQ + dispatcher
  shared/
    queue/                                       # connection, filas, job names, DLQ
    database/outbox*                             # append na UoW + dispatcher
    messaging/                                   # port MessagingProvider (+ fake + cloud adapters)
  modules/scheduling/
    jobs/   offer_waitlist_slot.job.ts
            schedule_appointment_notifications.job.ts
    scheduling_public.ts                         # createFromPublic, confirmFromToken, applyWaitlistAccept
  modules/messaging/
    messaging_public.ts                          # enqueueTemplate? NÃO — só leitura de account status se preciso
    jobs/   send_whatsapp_message.job.ts
            process_whatsapp_webhook.job.ts
    ports / adapters isolados da infra Meta
  modules/patients/
    patients_public.ts                           # findOrCreateFromPublicBooking + consents

frontend/src/
  app/(public)/agendar/[slug]/page.tsx
  app/(public)/agendar/[slug]/confirmar/[token]/page.tsx
  app/(public)/fila/[token]/page.tsx             # aceite waitlist (opcional se só WA button)
  app/(app)/app/configuracoes/whatsapp/page.tsx  # ou /app/whatsapp — package messaging
  packages/public/…/Booking|BookingConfirm
  packages/operacional/…/Waitlist
  packages/messaging/…/Account|Automation|Usage
```

Action **somente** quando há efeito além do repositório (outbox, outro BC, OTP consume). CRUD waitlist list/delete puro: Service → Repository.

### RLS / ator público

- Rotas `/api/v1/public/*` **sem** Bearer. Middleware `publicTenantContext`: `SELECT id FROM tenant WHERE slug=$1` → `set_config('app.tenant_id', …)` (sem `app.user_id`).
- Webhook `/api/v1/webhooks/whatsapp`: sem tenant na URL; resolve por `phone_number_id` → account. Assinatura **antes** de qualquer DB.
- `appointment_history.actor_type`: `PATIENT` (confirm/cancel/waitlist accept) ou `SYSTEM` (automação).
- Dispatcher outbox: role com bypass controlado (docs/06); handlers reabrem RLS com `tenantId` do payload.
- Slug inválido → `404 NOT_FOUND` (não revelar se o slug “quase existe”).

---

## Contratos HTTP (S3) — payloads

Envelope `{ data }` / `{ error }`; camelCase; datas ISO com offset; UUID v7. Atualizar `docs/08` no mesmo PR do Bloco correspondente.

### Público (rate limit agressivo)

```
GET  /api/v1/public/clinics/:slug
GET  /api/v1/public/clinics/:slug/availability   ?procedureId=&professionalId=&from=&to=
POST /api/v1/public/clinics/:slug/bookings         solicita OTP
POST /api/v1/public/clinics/:slug/bookings/verify  OTP → patient + appointment
GET  /api/v1/public/appointments/:token/confirm    link D-1 / e-mail
POST /api/v1/public/waitlist/:token/accept         first-accept-wins  ← novo em docs/08
```

**GET clinic (mínimo, sem preço clínico sensível além do catálogo público):**

```json
{
  "data": {
    "name": "Clínica Teste",
    "slug": "clinica-teste-xxxxxxxx",
    "timezone": "America/Sao_Paulo",
    "procedures": [{ "id": "…", "name": "Consulta", "defaultMinutes": 30 }],
    "professionals": [{ "id": "…", "name": "Dra. Ana Souza" }]
  }
}
```

Só `procedure.publicly_bookable=true` e profissionais `active`. Sem CRO, sem telefone interno, sem pacientes.

**POST bookings:**

```json
{
  "procedureId": "…",
  "professionalId": "…",
  "startsAt": "2026-08-20T14:00:00-03:00",
  "name": "João Paciente",
  "phone": "62999990000",
  "email": "joao@example.com",
  "consentDataProcessing": true,
  "consentTerms": true,
  "consentWhatsappMarketing": false
}
```

Resposta: `{ "data": { "bookingId": "…", "otpSentVia": "WHATSAPP"|"EMAIL", "expiresInSeconds": 300 } }`  
Erros: `409 SLOT_UNAVAILABLE` (+ sugestões se a API interna já devolve), `422 BUSINESS_RULE_VIOLATION` (lead time / procedimento não público / consent obrigatório false), `429 RATE_LIMITED`.

**POST verify:** `{ "bookingId", "code": "123456" }` → appointment + patient.  
OTP inválido incrementa attempts; 3ª falha invalida o token (`409` / `422`). Recalc availability no submit (corrida com recepção).

**GET confirm / POST waitlist accept:** token one-shot (`used_at`). Idempotente: segunda chamada no mesmo token → mesmo resultado sem novo side-effect (`200` com status atual ou `409 INVALID_STATE_TRANSITION` se já cancelado).

### Rate limit sugerido (público)

| Chave | Janela | Max |
| --- | --- | --- |
| `public:book:ip:{ip}` | 1 h | 20 |
| `public:book:phone:{e164}` | 1 h | 5 |
| `public:verify:ip:{ip}` | 1 h | 30 |
| `public:avail:ip:{ip}` | 1 min | 60 |
| webhook Meta | — | só assinatura (não rate-limitar o handshake GET) |

### Autenticado — waitlist (`agenda.write`)

```
GET    /api/v1/waitlist?status=&professionalId=&procedureId=
POST   /api/v1/waitlist
DELETE /api/v1/waitlist/:id
POST   /api/v1/waitlist/:id/offer          oferta manual (também dispara o mesmo job)
```

**POST waitlist:**

```json
{
  "patientId": "…",
  "professionalId": null,
  "procedureId": "…",
  "preferredPeriods": [{ "weekday": 1, "from": "08:00", "to": "12:00" }],
  "priority": 0
}
```

`Idempotency-Key` em `POST .../offer`.

### Autenticado — messaging E8a

```
GET|POST|DELETE /api/v1/messaging/account
POST            /api/v1/messaging/account/test      Idempotency-Key
GET             /api/v1/messaging/templates
GET|PATCH       /api/v1/messaging/automations[/:key]
GET             /api/v1/messaging/usage
GET             /api/v1/messaging/logs?from=&to=&result=
POST|GET        /api/v1/webhooks/whatsapp           público (assinatura / handshake Meta)
```

**Não implementar:** `/messaging/conversations*`.

**POST account:** `{ wabaId, phoneNumberId, displayPhone, accessToken }` → token vai para KMS (`access_token_ref`); status `PENDING→CONNECTED` após test send ok.

**PATCH automations/:key:** `{ enabled?, config? }` keys S3: `CONFIRMATION_D1`, `REMINDER_H3` (e `WAITLIST_OFFER` se exposto). Config exemplo: `{ "sendAtLocalTime": "12:00", "onlyForStatuses": ["SCHEDULED","CONFIRMED"] }`.

### Webhook Meta (§3.5)

- `GET`: `hub.mode=subscribe` + `hub.verify_token` == `WHATSAPP_VERIFY_TOKEN` → devolve `hub.challenge`.
- `POST`: `X-Hub-Signature-256` HMAC-SHA256 do **raw body** com `WHATSAPP_APP_SECRET`. Inválido → `401`, nada na fila.
- Responder **`200` imediatamente** → `queue.add('process-whatsapp-webhook', {…}, { jobId: wamid })`.
- Express: capturar `rawBody` (verify do `express.json`) — sem raw body a assinatura não fecha.

Botões:

| payload | Efeito |
| --- | --- |
| `CONFIRM_<appointmentId>` | outbox `messaging.confirmation_received` → scheduling `CONFIRMED` |
| `CANCEL_<appointmentId>` | `cancellation_received` → cancel + motivo "paciente via WhatsApp" + waitlist job |
| `WAITLIST_<offerId>` | `waitlist_offer_accepted` → first-accept-wins |
| outro / texto livre | persiste `message` inbound; **sem** inbox UI (S7). Remarcar conhecido (`REBOOK_<id>` ou texto “Remarcar”) → `conversation.status=PENDING` |

Idempotência: unique `message.provider_message_id` = `wamid`. Mesmo POST duas vezes → um efeito.

---

## DDL (migração S3) + RLS

Todas com `tenant_id` + `platform.enable_tenant_rls` (exceto onde docs/06 disser bypass do dispatcher).

| Tabela | Notas |
| --- | --- |
| `waitlist_entry` | docs/07 §4; index `(tenant_id, status, priority DESC, created_at)` |
| `public_booking_token` | purpose `BOOKING\|CONFIRMATION\|WAITLIST_OFFER` (ANAMNESIS/QUOTE não usar ainda); `token_hash` unique; `used_at`; jsonb opcional `meta` (attempts, phone hash, booking snapshot **sem** clínico) |
| `outbox_event` | docs/07 §9; index pending |
| `whatsapp_account` | 1 por tenant no MVP; `access_token_ref` KMS |
| `message_template` | seed global (`tenant_id` null) + override opcional |
| `automation` + `automation_run` | unique `(tenant_id, automation_id, target_type, target_id)` — se o módulo pedir `scheduled_for` na unique, incluir na migração e documentar desvio vs docs/07 |
| `message` | unique parcial `provider_message_id`; audit RF-E8-19 |
| `conversation` | stub mínimo (phone, status, `service_window_expires_at`); **sem** UI |
| `message_credit_ledger` | kinds `PURCHASE\|BONUS\|CONSUMPTION\|ADJUSTMENT` (seed = `BONUS`) |
| `procedure.publicly_bookable` | boolean default false |
| `tenant.booking_settings` | jsonb default conforme corte #12 |
| `patient.origin` | text default `INTERNAL` |

`cleanup-expired-tokens` (fila `platform`, cron diário): expira `public_booking_token` e waitlist `OFFERED` vencida → `EXPIRED`.

---

## Jobs e eventos (docs/11 §7 + ADR-0006)

| Fila | Job | Idempotência | Quando |
| --- | --- | --- | --- |
| `platform` | `dispatch-outbox` | `outbox_event.id` | contínuo ~5 s |
| `platform` | `cleanup-expired-tokens` | data do cron + tenant | diário |
| `scheduling` | `schedule-appointment-notifications` | appointmentId + version | create/move |
| `scheduling` | `offer-waitlist-slot` | slot + lote (appointmentId cancelado) | cancel / NO_SHOW / offer manual |
| `messaging` | `send-whatsapp-message` | `automation_run` unique / messageId | D-1, H-3, created, cancelled, waitlist, OTP |
| `messaging` | `process-whatsapp-webhook` | `jobId=wamid` | POST webhook |

Delayed:

| Momento | Template | Cálculo |
| --- | --- | --- |
| Imediato | `appointment_created` | após `appointment_scheduled` (status SCHEDULED) |
| D-1 12:00 TZ tenant | `appointment_confirmation` | `startsAt - 1 day` @ 12:00 local; se cair na quiet hours → 08:00 |
| H-3 | `appointment_reminder` | `startsAt - 3h`; quiet hours → 08:00 |
| Cancel | `appointment_cancelled` | imediato (se fora 21h–8h; senão 08:00) |
| Waitlist | `waitlist_offer` | no job de oferta |

Quiet hours **21:00–08:00** fuso do tenant: **reagendar**, não drop. Cancel/move **remove** jobs delayed antigos (BullMQ `jobId` estável por `appointmentId+automationKey`).

Eventos de domínio (outbox `name`):

| Publicado por | Nome | Consumidor |
| --- | --- | --- |
| scheduling | `scheduling.appointment_scheduled` / `_rescheduled` / `_cancelled` / `_no_show` / `_confirmed` | messaging (agenda/cancela sends) |
| scheduling | `scheduling.waitlist_offer_sent` / `_accepted` | reporting (depois); messaging aviso aos perdedores |
| messaging | `messaging.confirmation_received` | scheduling → `CONFIRMED` |
| messaging | `messaging.cancellation_received` | scheduling → cancel + waitlist |
| messaging | `messaging.waitlist_offer_accepted` | scheduling → occupy slot |
| messaging | `messaging.credits_low` / `_exhausted` | UI alerta (polling usage na S3; SSE depois) |

---

## Fluxos (domínio + UX)

### A. Autoagendamento (RF-E4-11..13)

**Backend:** availability pública = `getWorkingWindows` + appointments/blocks + lead min/max + só `publicly_bookable`. Verify: findOrCreate patient (telefone) → consents canal `PUBLIC_BOOKING` → create appointment `origin=PUBLIC_BOOKING` via `scheduling_public` (mesmo EXCLUDE) → token CONFIRMATION → outbox se status já `SCHEDULED`.

**Frontend (`public`, mobile-first):** fluxo **principal** (etapas visíveis, próxima bloqueada até a atual) — não usar AppShell.

1. Serviço (`publicly_bookable`)
2. Profissional (pular se só 1)
3. Data/hora (slots da availability)
4. Identidade (nome, telefone, e-mail opcional, consents)
5. OTP
6. Sucesso (resumo horário + “aguarde confirmação da clínica” se `REQUESTED`)

Estados: loading skeleton, vazio (sem slots / slug 404), `409` “horário acabou de ser ocupado” + recarregar slots, `429` com tempo, OTP inválido/expirado, sucesso. Uma CTA primary por passo.

### B. Confirmação por link (RF-E4-19)

Página pública mínima: token → sucesso “Consulta confirmada” / erro “link inválido ou expirado” / já confirmada. Sem login.

### C. Fila de espera (RF-E4-14..15)

**Recepção (`operacional`):** **FormDialog** na agenda (cadastro auxiliar) + lista compacta (status WAITING/OFFERED/…). Não é Index CRUD de domínio clínico. Add/remove; oferta manual opcional.

**Automático:** cancel/NO_SHOW → outbox → `offer-waitlist-slot` → filtra compatíveis (profissional null = qualquer, procedimento/duração, weekday/período) → ordena priority DESC + `created_at` → envia lote → 30 min → próximo lote (máx. 3).

**Aceite:** WA button ou `/fila/[token]`. Primeiro grava appointment `WAITLIST` + EXCLUDE; demais → `EXPIRED` + template curto “horário ocupado” (mesmo `waitlist_offer` ou mensagem de sistema fake se template extra não aprovado — **não** inventar template novo além da lista S3; perdedores podem só expirar sem segundo template se Meta atrasar).

### D. WhatsApp ops (RF-E8-01..06, 11, 15–19)

**Owner (`messaging`):** wizard **Form** (conectar → test send → estado CONNECTED/ERROR com `last_error` acionável). Kill switch + usage (consumo/custo período) + logs (`result`, template, timestamp — sem body clínico). Onboarding step WHATSAPP aponta para essa rota (ainda pulável).

**Agenda operacional:** badge `REQUESTED` vs `SCHEDULED`/`CONFIRMED`; entrada “Fila de espera”; opcional contador “Remarcações pendentes” (conversations `PENDING`) — clique leva à lista mínima, **não** ao chat.

---

## Blocos de entrega

### Bloco 1 — Backend: infra filas

- [x] `shared/queue/` (BullMQ connection via `REDIS_URL`, nomes docs/11, retry/backoff, DLQ)
- [x] `outbox_event` + append na UoW + `dispatch-outbox` (5 s)
- [x] `worker.ts` real + script `pnpm --filter @repo/backend dev:worker` (+ raiz `dev:worker` se fizer sentido)
- [x] Jobs idempotentes: `tenantId` + `requestId`; payload por referência
- [x] Smoke: enqueue/process com fake; **API sobe sem Redis** (agenda síncrona ok; outbox acumula; msgs saem quando Redis voltar)
- [x] Health worker opcional (`/health` do processo worker ou log periódico)

### Bloco 2 — Backend: autoagendamento público (E4b)

- [x] DDL: `public_booking_token`, `procedure.publicly_bookable`, `tenant.booking_settings`, `patient.origin` + RLS
- [x] Middleware `publicTenantContext` + rate limits
- [x] `GET /public/clinics/:slug` + `.../availability` (reusa scheduling availability)
- [x] `POST .../bookings` + `.../verify` (OTP hash, 5 min, 3 tentativas; WA ou e-mail)
- [x] Lead time min/max, expediente, procedimento público (RF-E4-11..13)
- [x] `GET /public/appointments/:token/confirm`
- [x] `patients_public.findOrCreateFromPublicBooking` + consents
- [x] Concorrência público + recepção → EXCLUDE / `409 SLOT_UNAVAILABLE`
- [x] Estender `scheduling_public` / `clinic_public` o mínimo (sem vazar Prisma)
- [x] Alinhar docs/07 origin/consent + docs/08 payloads
- [x] Smoke `test:public-booking`

### Bloco 3 — Backend: fila de espera

- [x] DDL + RLS `waitlist_entry`
- [x] `GET|POST|DELETE /waitlist` + `POST /waitlist/:id/offer`
- [x] `POST /public/waitlist/:token/accept` (+ docs/08)
- [x] Job `offer-waitlist-slot` em cancel/NO_SHOW (RF-E4-14..15)
- [x] First-accept-wins; token 30 min; até 3 lotes
- [x] Integração messaging: template `waitlist_offer` + botão `WAITLIST_<offerId>`
- [x] Dois aceites concorrentes → 1 appointment (teste obrigatório)
- [x] Smoke `test:waitlist`

### Bloco 4 — Backend: messaging E8a

- [x] Módulo `backend/src/modules/messaging/` + `messaging_public.ts` (só o que outros BCs precisarem **ler**)
- [x] Port `MessagingProvider` + `FakeMessagingProvider` + `WhatsAppCloudProvider`
- [x] Account connect / test / disconnect; status (RF-E8-01..02); token no KMS
- [x] Templates MVP agenda; variáveis só nome/clínica/data/hora; **sem** clínico (RF-E8-12 recorte + RF-E8-13)
- [x] Automations D-1 @ 12:00 TZ + H-3; quiet hours; skip cancelados/`REQUESTED` (RF-E8-03..04)
- [x] Create/move → agenda jobs; cancel/move → cancela jobs antigos (RF-E4-18)
- [x] Webhook: assinatura → 200 → fila; idempotência `wamid` (RF-E8-05, 18)
- [x] Confirm → `CONFIRMED`; Remarcar → conversation `PENDING` (RF-E8-06, RF-E4-19)
- [x] Marketing gated (`BLOCKED_NO_CONSENT`) (RF-E8-14) — mesmo sem template marketing no recorte, o gate no port
- [x] Credits + kill switch mínimos; débito no delivery (RF-E8-11, 15–17)
- [x] Audit via `message` + `GET /messaging/logs` (RF-E8-19)
- [x] Smoke `test:messaging` (fake) + teste wamid duplicado

### Bloco 5 — Frontend: public booking

- [x] Rotas `(public)/agendar/[slug]` (+ confirmar token; opcional `/fila/[token]`)
- [x] Camadas Page → Component → Hook (TanStack) → Service → Data → API (`packages/public`)
- [x] Fluxo etapas A; mobile-first; 1 primary por passo
- [x] `409` / `429` / OTP / slug 404
- [x] Confirmação por link
- [x] E2E `e2e/public-booking.spec.ts` (OTP fake / Mailpit; seed slug)

### Bloco 6 — Frontend: waitlist + WhatsApp ops

- [x] Waitlist na agenda (`operacional`, FormDialog + lista)
- [x] Agenda: `REQUESTED` vs `SCHEDULED`/`CONFIRMED`; badge remarcação se houver
- [x] Wizard Owner conectar WA + test + erros acionáveis (`messaging`)
- [x] Kill switch / usage / logs mínimos
- [x] Onboarding: passo WHATSAPP aponta para a rota (continua pulável)
- [x] E2E `e2e/waitlist.spec.ts` + `e2e/messaging.spec.ts` (fake; sem Meta real no CI)

---

## Endpoints-alvo (resumo)

```
GET  /api/v1/public/clinics/:slug
GET  /api/v1/public/clinics/:slug/availability
POST /api/v1/public/clinics/:slug/bookings
POST /api/v1/public/clinics/:slug/bookings/verify
GET  /api/v1/public/appointments/:token/confirm
POST /api/v1/public/waitlist/:token/accept

GET|POST|DELETE /api/v1/waitlist[/:id]
POST            /api/v1/waitlist/:id/offer

GET|POST|DELETE /api/v1/messaging/account
POST            /api/v1/messaging/account/test
GET             /api/v1/messaging/templates
GET|PATCH       /api/v1/messaging/automations[/:key]
GET             /api/v1/messaging/usage
GET             /api/v1/messaging/logs
POST|GET        /api/v1/webhooks/whatsapp
```

**Backend — aceite de código**

- [ ] Public booking + OTP + rate limit; mesma availability da agenda interna
- [ ] Waitlist + offer first-accept-wins (DB)
- [ ] D-1/H-3 + webhook/link Confirm → `CONFIRMED` idempotente
- [ ] Sem crédito: automação pulada + alerta; agenda ok
- [ ] Quiet hours; jobs limpos em move/cancel
- [ ] Redis/WA down → agenda interna e (OTP e-mail) seguem

**Frontend — aceite de código**

- [ ] `/agendar/{slug}` ponta a ponta (OTP fake em local) — spec E2E pronta; rodar `pnpm test:e2e e2e/public-booking.spec.ts` com API + Mailpit
- [ ] Conexão WA + waitlist usáveis pelo Owner/Recepção — UI pronta; rodar `pnpm test:e2e e2e/waitlist.spec.ts e2e/messaging.spec.ts`
- [x] Agenda distingue `REQUESTED` / `CONFIRMED`

---

## Qualidade

- CI: lint, typecheck, arch:check, migrate, test:rls (novas tabelas), smokes `test:public-booking` / `test:waitlist` / `test:messaging` (fake)
- Domínio: quiet hours; lead time; first-accept-wins; status machine (confirm cancelado não quebra)
- Integração: mesmo `wamid` 2× → 1 efeito; 20 concorrentes no slot público → 1 sucesso; 2 aceites waitlist → 1 appointment
- Resiliência: Redis down → HTTP agenda 200; outbox pendente; WA down → fila + UI “envios pausados”
- E2E Playwright: public-booking + waitlist + messaging fake; **não** exigir WABA no CI
- Envelope `{ data }` / `{ error }`; camelCase; UTC no banco / TZ do tenant nos jobs
- arch:check: messaging ↛ scheduling (só `*_public` + eventos)

Testes obrigatórios extra (módulos 04 §11 / 08 §12) que caem nesta sprint: silêncio 21h–8h; cancel recria notificações; procedimento não público rejeitado; assinatura webhook inválida → 401.

---

## Aceite M2 (manual + número real)

- [ ] WABA conectada; templates agenda **aprovados** na Meta
- [ ] Confirmação por botão < 5 s até status `CONFIRMED` (agenda interna atualiza sem refresh forçado além do polling atual)
- [ ] Cancelamento dispara oferta de fila; primeiro aceite ocupa o slot
- [ ] Link `/agendar/{slug}` da clínica-piloto (ou seed) fecha um booking real (OTP WA ou e-mail)
- [ ] Checklist paralelo: onboarding WABA iniciado **antes/durante** S2 (risco R1) — se templates atrasarem, fake + e-mail cobrem código; M2 fica pendente explícito (não fingir fechamento)

---

## Bloqueios

| Risco | Mitigação |
| --- | --- |
| R1 — aprovação WABA/templates Meta | Onboarding Meta **já**; OTP fallback e-mail; fake no CI; M2 separado do “código Must” |
| Redis indisponível | Outbox retém; OTP no Postgres; API síncrona ok |
| Dependência S2 incompleta | Não iniciar Blocos 2–4 sem availability + appointments + patients + EXCLUDE — **já fechado** |
| Clínica-piloto / recepcionista real | Validação de uso (como M1); não bloqueia merge de código |
| Revisão jurídica Termos/DPA (roadmap S3) | Texto de consentimento do booking usa versão string (`document_version`); copy jurídico pode iterar sem DDL |

## Notas

- `APP_PUBLIC_URL` + slug → link completo `https://…/agendar/{slug}` (onboarding já expõe `publicBookingPath` relativo — Bloco 6 alinhar URL absoluta).
- Seed e2e: 1 procedimento `publicly_bookable`, `bookingSettings` default, créditos bônus, automations D-1/H-3 enabled, WABA fake.
- Carry-over pós-S3: inbox E8b (S7); templates E5–E6; buffer de availability; SMS OTP.
- Playwright: manter `workers: 1` por rate limit de login; specs públicos **não** precisam do fixture owner (exceto waitlist ops).
- Em dúvida de produto/DDL/contrato **não** listada acima → perguntar antes de implementar (não improvisar template Meta, inbox ou buffer).
