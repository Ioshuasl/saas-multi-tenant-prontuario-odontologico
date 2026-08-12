# Sprint 3 — Canal do paciente (E4b + E8a Must)

**Objetivo verificável:** Paciente agenda por `/agendar/{slug}` com OTP; cancelamento oferece fila via WhatsApp; Owner conecta WABA; D-1/H-3 + botão Confirm → `CONFIRMED` em &lt;5s. Marco **M2:** confirmação WhatsApp ponta a ponta em número **real**.

**Escopo:** Must de E4b + E8a (conexão + confirmação/lembrete/fila). Sem inbox E8b.  
**Pontos (roadmap):** ~45 · Épicos E4b, E8a · Marco M2 · [docs/13](../../13-roadmap-estimativas.md)

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — public booking, waitlist, messaging E8a, BullMQ/outbox (Blocos 1–4) | `backend/` |
| **Frontend** | Sim — `public` agendar + operacional waitlist + messaging connect (Blocos 5–6) | `frontend/` |

Não misturar: um bloco é **só backend** ou **só frontend**, salvo contrato (`contracts/`).

### Backend (Blocos 1–4)

- Redis + BullMQ + outbox; worker process
- Autoagendamento público + OTP; waitlist + offer job
- Messaging: account, templates agenda, automations D-1/H-3, webhook, credits/kill switch mínimos, audit
- **Não inclui** telas Next.js
- **Não inclui** inbox compartilhada (E8b → S7)

### Frontend (Blocos 5–6)

- Package `public`: fluxo `/agendar/[slug]` (mobile-first)
- Package `operacional`: waitlist na agenda; estados REQUESTED/CONFIRMED
- Package `messaging` (ou admin): wizard conexão WA, kill switch/usage
- **Não inclui** novos endpoints de domínio — consome Blocos 1–4
- **Não inclui** inbox full (S7)

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E4](../../requisitos/funcionais/04-agenda.md) | E4b: RF-E4-11..15, 18–19 |
| [RF E8](../../requisitos/funcionais/08-whatsapp-comunicacao.md) | E8a: RF-E8-01..06, 11–19 |
| [Módulo scheduling](../../modulos/04-agenda.md) | Público / waitlist |
| [Módulo messaging](../../modulos/08-whatsapp-comunicacao.md) | Templates / automations |
| [ADR-0005](../../adr/0005-whatsapp-cloud-api.md) | Cloud API / port |
| [ADR-0006](../../adr/0006-filas-bullmq.md) | Filas / delayed jobs |
| [API v1 §2.4 / §2.8](../../08-api-v1.md) | Público, waitlist, messaging |
| [Modelo §4](../../07-modelo-de-dados.md) | `waitlist_entry`, `public_booking_token` |
| [Frontend](../../09-frontend.md) | Packages `public` / `messaging` |
| [S2](./S2-pacientes-agenda.md) | Dependência patients + appointments + availability |

## Decisões de corte (fechadas no planejamento)

1. Messaging = port `MessagingProvider` + adapter Meta; CI/smoke com **adapter fake**; aceite M2 exige número real (R1).
2. OTP público = WhatsApp (auth template) com fallback **SMS/e-mail** se WABA atrasar — booking não bloqueia.
3. Inbox E8b (RF-E8-07..10) → **S7**.
4. Templates S3: `appointment_created`, `appointment_confirmation`, `appointment_reminder`, `appointment_cancelled`, `waitlist_offer` (+ auth OTP se WA).
5. Dependência dura: S2 com availability + appointments + patients + status machine.

## Fora desta sprint

- Caixa de entrada compartilhada (E8b → S7)
- Templates de orçamento, recibo, anamnese, birthday/recall (módulos futuros / fase 2)
- SSE agenda (Should), NPS, marketing em massa / chatbot
- Anamnese pós-booking (S4)
- SMS como canal primário de contingência operacional (fase 2) — só fallback de OTP se necessário

## Blocos de entrega

### Bloco 1 — Backend: infra filas

- [ ] Redis operacional + BullMQ (filas `scheduling`, `messaging`)
- [ ] Outbox transacional + dispatcher → filas
- [ ] Worker (mesmo artefato API, comando separado)
- [ ] Jobs idempotentes com `tenantId` + `requestId` no payload
- [ ] Smoke: enqueue/process com fake; API sobe sem Redis (agenda continua — msgs na fila quando voltar)

### Bloco 2 — Backend: autoagendamento público (E4b)

- [ ] DDL + RLS: `public_booking_token` (e campos/políticas de booking no tenant se ainda faltarem)
- [ ] `GET /public/clinics/:slug` (dados mínimos + procedimentos `publicly_bookable`)
- [ ] `GET /public/clinics/:slug/availability` (mesma verdade que `/availability` autenticada)
- [ ] `POST .../bookings` → envia OTP; rate limit IP/telefone (RF-E4-12)
- [ ] `POST .../bookings/verify` → cria/liga patient + appointment (`PUBLIC_LINK`; `REQUESTED` ou `SCHEDULED` por política)
- [ ] Respeitar lead time min/max, horários, procedimento público (RF-E4-11..13)
- [ ] `GET /public/appointments/:token/confirm` (link de confirmação)
- [ ] Concorrência público + recepção → EXCLUDE / `409 SLOT_UNAVAILABLE`

### Bloco 3 — Backend: fila de espera

- [ ] DDL + RLS: `waitlist_entry`
- [ ] `GET|POST|DELETE /waitlist`
- [ ] Job `offer-waitlist-slot` em cancel/NO_SHOW (RF-E4-14..15)
- [ ] `POST /waitlist/:id/offer`; first-accept-wins; token/expiração (ex.: 30 min)
- [ ] Integração com messaging (template `waitlist_offer`)

### Bloco 4 — Backend: messaging E8a

- [ ] Módulo `backend/src/modules/messaging/` + `messaging_public.ts`
- [ ] Account: connect / test / disconnect; status (RF-E8-01..02)
- [ ] Templates MVP agenda listados; sem dado clínico no payload (RF-E8-12..13)
- [ ] Automations D-1 @ 12:00 TZ tenant + H-3; quiet hours 21h–8h; skip cancelados (RF-E8-03..04)
- [ ] Create/move → agenda jobs; cancel/move → cancela jobs antigos (RF-E4-18)
- [ ] Webhook Meta: assinatura → 200 rápido → fila; idempotência por `wamid` (RF-E8-05, 18)
- [ ] Confirm → `CONFIRMED`; Remarcar → flag atenção humana (RF-E8-06, RF-E4-19)
- [ ] Marketing gated por consent (`BLOCKED_NO_CONSENT`) (RF-E8-14)
- [ ] Credits + kill switch mínimos; sem crédito → alerta, **não** bloqueia agenda; débito no delivery (RF-E8-11, 15–17)
- [ ] Audit de envios (RF-E8-19)
- [ ] Adapter fake para CI; adapter Cloud API para M2

### Bloco 5 — Frontend: public booking

- [ ] Rota `(public)/agendar/[slug]` (SSR/mobile-first)
- [ ] Fluxo: serviço → (profissional) → data/hora → identidade → OTP → sucesso
- [ ] Tratamento de `409 SLOT_UNAVAILABLE` e rate limit
- [ ] Página/fluxo de confirmação por link (`:token/confirm`)

### Bloco 6 — Frontend: waitlist + WhatsApp ops

- [ ] Waitlist na agenda operacional (add/remove / status de oferta)
- [ ] Wizard Owner: conectar WhatsApp, test send, erros acionáveis
- [ ] Kill switch / usage / logs mínimos
- [ ] Agenda mostra `REQUESTED` vs `SCHEDULED`/`CONFIRMED` vindos do público/WhatsApp

## Endpoints-alvo (docs/08)

```
GET  /api/v1/public/clinics/:slug
GET  /api/v1/public/clinics/:slug/availability
POST /api/v1/public/clinics/:slug/bookings
POST /api/v1/public/clinics/:slug/bookings/verify
GET  /api/v1/public/appointments/:token/confirm

GET|POST|DELETE /api/v1/waitlist[/:id]
POST            /api/v1/waitlist/:id/offer

GET|POST|DELETE /api/v1/messaging/account
POST            /api/v1/messaging/account/test
GET|PATCH       /api/v1/messaging/automations[/:key]
GET             /api/v1/messaging/usage
GET             /api/v1/messaging/logs
POST|GET        /api/v1/webhooks/whatsapp
```

**Backend**

- [ ] Public booking + OTP + rate limit; mesma availability da agenda interna
- [ ] Waitlist + offer first-accept-wins
- [ ] D-1/H-3 + webhook Confirm → `CONFIRMED` idempotente
- [ ] Sem crédito: automação pulada + alerta; agenda ok
- [ ] Quiet hours; jobs limpos em move/cancel

**Frontend**

- [ ] `/agendar/{slug}` ponta a ponta (OTP mock/fake em local)
- [ ] Conexão WA + waitlist usáveis pelo Owner/Recepção

## Qualidade

- CI: lint, typecheck, arch:check, migrate, test:rls, smokes public-booking / waitlist / messaging (fake provider)
- Webhook: mesmo `wamid` duas vezes → um efeito
- Resiliência: Redis/WhatsApp down → ainda agenda; mensagens enfileiradas (docs/12)
- Envelope `{ data }` / `{ error }`; camelCase

## Aceite M2 (manual + real)

- [ ] Número WhatsApp real conectado; templates aprovados
- [ ] Confirmação por botão &lt; 5s até status `CONFIRMED`
- [ ] Cancelamento dispara oferta de fila; primeiro aceita
- [ ] Checklist paralelo: WABA iniciado antes/durante S2 (risco R1)

## Bloqueios

| Risco | Mitigação |
| --- | --- |
| R1 — aprovação WABA/templates Meta | Iniciar onboarding **antes** da S3; OTP fallback SMS/e-mail; fake provider no CI |
| Dependência S2 incompleta | Não iniciar Blocos 2–4 sem availability + appointments + patients |

## Notas

- Eventos: `scheduling.appointment_*` ↔ messaging subscribers; waitlist via cancel/NO_SHOW.
- Slug do tenant só para rotas públicas — **nunca** autorização (docs/06).
- Clínica-piloto (recrutada na S2) valida UX de booking + confirmação.
- Carry-over pós-S3: inbox E8b (S7); templates de orçamento/anamnese quando E5–E6 existirem.
