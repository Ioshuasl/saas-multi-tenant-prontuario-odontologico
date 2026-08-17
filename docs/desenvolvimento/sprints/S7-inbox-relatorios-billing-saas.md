# Sprint 7 — Inbox, relatórios e cobrança do SaaS (E8b + E9 + E10 Must)

**Objetivo verificável:** Recepção abre a **caixa de entrada WhatsApp compartilhada**, lê e responde conversas ligadas ao paciente; o **painel inicial** mostra KPIs do dia/mês com drill-down; dono exporta CSV/XLSX assíncrono; clínica em trial vê **limites e status da assinatura** (sem checkout Stripe) e, ao expirar/suspender, fica em **somente leitura** com exportação liberada.

**Escopo:** Must de E8b (RF-E8-07..09), Must de E9 (RF-E9-01..08, 13..16) e Must de E10 (RF-E10-01..09, 12..14) com cobrança **manual** ([ADR-0010](../../adr/0010-billing-saas-manual-mvp.md)). Should: RF-E8-10 (ações contextuais na conversa), RF-E9-09..12 (conversão/origem/ocupação/consumo WA), RF-E10-15 (descartar dados demo). Sem Stripe/MP/Asaas. Sem campanhas/marketing/IA (RF-E8-22/23). Sem BI avançado (RF-E9-17..19). Sem NFS/cupons da nossa assinatura (RF-E10-16..). Sem exportação LGPD completa / audit UI (E11 → S8).  
**Pontos (roadmap):** ~45 · Épicos E8b + E9 + E10 · [docs/13](../../13-roadmap-estimativas.md)

**Pré-requisito:** S6 código Must (baixa/caixa/fluxo E7 + package `financeiro` + M4 demo local). Aceite M3 (uso real S4) **não** bloqueia S7. Carry-overs S5 (`SCHEDULED`) e RF-E7-19 (Could) **não** entram como blocos de produto desta sprint.

**Estado (2026-08-17):** Sprint 7 **planejada** (checklist). S6 fechada (código + aceite local; M4 demo local). M3 uso real S4 permanece pendente.

---

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — inbox HTTP em `messaging`; módulo novo `reporting`; módulo novo `subscription` + guards (Blocos 1–5) | `backend/` |
| **Frontend** | Sim — inbox em `messaging`; dashboard + `/relatorios`; `/assinatura` (Blocos 6–7) | `frontend/` |

Não misturar: um bloco é **só backend** ou **só frontend**, salvo contrato (`contracts/` / `docs/08`). Cruzar BC só por `*_public.ts` + outbox (nunca import direto `messaging` ↔ `patients` / `billing` / `reporting` / `subscription` por internals).

### Backend (Blocos 1–5)

- HTTP conversas/mensagens (list/get/send/assign/read/resolve) sobre tabelas `conversation`/`message` já stubadas na S3
- Webhook inbound já existe → completar unread + evento para UI (SSE ou polling)
- Módulo `reporting/`: `GET /reports/dashboard`, `no-shows`, `revenue`, `procedures` + job export
- Rotas E7 (`cash-flow` / `overdue` / `production`) **permanecem** em `billing` (paths estáveis); FE `/relatorios` consome os dois módulos
- Módulo `subscription/`: DDL `plan` / `subscription` / `usage_counter`; trial; `PlanLimitGuard` + `subscriptionGuard`
- **Não inclui** telas Next.js
- **Não inclui** checkout Stripe / `POST /subscription/checkout` real ([ADR-0010](../../adr/0010-billing-saas-manual-mvp.md))
- **Não inclui** export LGPD ZIP / DSR / break-glass (S8)
- **Não inclui** mover à força as 3 rotas E7 para `reporting` (evitar churn; só se sobrar tempo e sem quebrar FE)

### Frontend (Blocos 6–7)

- Package `messaging`: Index inbox 3 colunas + nav badge PENDING
- Manter `/app/whatsapp` = conta/QR/config (E8a); inbox em rota própria
- Dashboard `/app` com widgets E9; `/app/relatorios` + export UX; `/app/assinatura` (OWNER)
- **Não inclui** novos endpoints de domínio — consome Blocos 1–5
- **Não inclui** telas de comissão / NFS-e / campanhas

---

## Estado atual do código (herança S0–S6)

Usar; **não** reimplementar.

| Já existe | Onde | Uso na S7 |
| --- | --- | --- |
| WAHA client + fake adapter | `shared/integrations/whatsapp/` | Send texto/mídia outbound da inbox |
| Messaging E8a (account, QR, webhook, templates, automations, usage, logs) | `modules/messaging/` | Estender; não fork |
| Tabelas `conversation` / `message` (+ unique `provider_message_id`) | Prisma S3 stub | Base do inbox |
| Repos `UpsertConversation` / message persist | messaging | List/get/send |
| Webhook job + PENDING em remarcação | `process_whatsapp_webhook.job.ts` | Filtro inbox “PENDING” |
| FE `packages/messaging` Account/Usage/Log | frontend | Inbox = novas entidades Conversation/Message |
| `/app/whatsapp` | Account Form | Continua settings |
| `GET /reports/cash-flow\|overdue\|production` | billing S6 | Herança; não reimplementar números |
| Telas Fluxo/Inadimplência/Produção | `financeiro` S6 | Podem permanecer; `/relatorios` agrega + novos |
| `Tenant.status` + `trialEndsAt` | signup / Prisma | Semente do ciclo subscription |
| Soft quota anexos `ATTACHMENT_QUOTA_BYTES` | env / clinical | Ligar a `plan.limits.storageGb` + `usage_counter` |
| Permissões `messaging.*` / `reports.*` / `subscription.manage` | identity S1 | Só passar a usar |
| ObjectStorage presign | S4 | Mídia inbox + arquivo de export |
| Outbox + BullMQ | S3+ | Job export; trial-ending e-mail; opcional fan-out SSE |
| `DashboardHome` = greeting + onboarding | frontend | Substituir por widgets E9 |
| Aceite HTTP `backend/tests/` | S6 | Novos scripts `messaging/` / `reporting/` / `subscription/` |
| Módulos `reporting/` e `subscription/` | — | **Ainda não existem** (criar) |

**Entregar nesta sprint:** HTTP inbox; SSE ou polling; `reporting` (dashboard + GETs faltantes + export); `subscription` + guards; UI inbox + dashboard + relatórios + assinatura.

**Pós-código (ainda aberto, não é aceite S7):** M3 uso real S4; S8 (auditoria/LGPD/piloto); carry-over `SCHEDULED` S5; RF-E7-19; gateway de cobrança (ADR futuro).

**Alinhar docs/08:** preencher §2.8 `conversations*` e §2.9 dashboard/export; §2.10 sem checkout ativo (remover ou marcar 501/omitido). Alinhar docs/09 §4.3 (copy “janela Meta 24h” → WAHA: sem janela de preço; indicador “conversa recente” opcional).

---

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E8](../../requisitos/funcionais/08-whatsapp-comunicacao.md) | Must RF-E8-07..09; Should 10 (+ 20/21 se sobrar) |
| [RF E9](../../requisitos/funcionais/09-relatorios.md) | Must RF-E9-01..08, 13..16; Should 09..12 |
| [RF E10](../../requisitos/funcionais/10-billing-saas.md) | Must RF-E10-01..09, 12..14; Should 15 |
| [Módulo messaging](../../modulos/08-whatsapp-comunicacao.md) | §6 inbox; §7 webhook; §10 eventos |
| [Módulo reporting](../../modulos/09-relatorios.md) | §2–§3 dashboard; §5 cache; §6 export |
| [Módulo subscription](../../modulos/10-billing-saas.md) | Planos, trial, limites, cobrança manual |
| [ADR-0010](../../adr/0010-billing-saas-manual-mvp.md) | Sem checkout no MVP |
| [ADR-0016](../../adr/0016-waha-default-messaging.md) | WAHA; sem franquia Meta default |
| [API v1 §2.8 / §2.9 / §2.10](../../08-api-v1.md) | Contratos; preencher payloads no PR do bloco |
| [Modelo §8–§9](../../07-modelo-de-dados.md) | conversation/message; plan/subscription/usage |
| [Frontend §4.3 + rotas](../../09-frontend.md) | Inbox 3 colunas; dashboard; assinatura |
| [Pastas](../../16-estrutura-de-pastas.md) | `messaging/`, `reporting/`, `subscription/`, packages FE |
| [Identidade — matriz](../../modulos/01-identidade-acesso.md) | `messaging.*`, `reports.*`, `subscription.manage` |
| [S6](./S6-financeiro.md) | Relatórios E7 já no billing; M4 fechado local |
| [S3](./S3-canal-paciente.md) | E8a + stubs conversation |

---

## Decisões de corte (fechadas no planejamento)

1. **Must nesta sprint:** E8b RF-E8-07..09; E9 RF-E9-01..08 + 13..16; E10 RF-E10-01..09 + 12..14 (manual). Should: RF-E8-10, RF-E9-09..12, RF-E10-15. Se estourar tempo, **ordem de escorrega** (último → primeiro a cair): RF-E10-15 → RF-E9-09..12 → RF-E8-10 → RF-E8-20/21. **Não** escorregar inbox list/send nem dashboard mínimo nem trial/limites/suspensão.
2. **Cobrança SaaS = manual ([ADR-0010](../../adr/0010-billing-saas-manual-mvp.md)):** **proibido** integrar Stripe/MP/Asaas nesta sprint. `POST /subscription/checkout` **não** implementa pagamento — omitir da superfície útil ou responder `501 NOT_IMPLEMENTED` com mensagem “fale conosco”. Ativação `ACTIVE` / `SUSPENDED`: script ops auditado (`backend/scripts/` ou endpoint **platform** interno se já existir padrão) — **não** self-serve cartão.
3. **Reporting BC novo:** criar `backend/src/modules/reporting/` com `reporting.module.ts` + `reporting_public.ts`. Possui `dashboard`, `no-shows`, `revenue`, `procedures`, export. As rotas S6 `cash-flow` / `overdue` / `production` **ficam** em `billing` (contrato estável). `reporting` **não** importa internals de `billing` — lê via query própria / views / `billing_public` mínimo se precisar de agregados já existentes. Preferir SQL read-only no reporting sem duplicar regra de baixa.
4. **Subscription BC novo:** `plan`, `subscription`, `usage_counter` + RLS. Signup continua setando `tenant.trialEndsAt`; Bloco 5 cria `subscription` TRIAL ligada ao plano default (Essencial) no signup **ou** backfill no migrate/seed. `PlanLimitGuard` → `402 PLAN_LIMIT_EXCEEDED`. `subscriptionGuard`: `SUSPENDED`/`EXPIRED` → escrita `403`/`402` conforme docs (somente leitura + export); automações messaging **off**.
5. **Inbox HTTP (definir contrato nesta sprint — docs/08 hoje só placeholder):**  
   `GET /messaging/conversations` · `GET …/:id` · `GET …/:id/messages` · `POST …/:id/messages` · `PATCH …/:id` (assign/status/patientId) · `POST …/:id/read`. Filtros: `status=OPEN|PENDING|CLOSED`, busca telefone/nome, unread. Paginação cursor. Envio: texto e/ou attachment (ObjectStorage + WAHA). Idempotency-Key em POST message.
6. **Rota FE inbox:** `/app/inbox` (3 colunas: lista | thread | contexto paciente). `/app/whatsapp` permanece **conta/QR/templates/automations**. Nav: Inbox se `messaging.read`; badge contagem PENDING/unread.
7. **Sem janela Meta de preço (RF-E8-08 / ADR-0016):** UI **não** bloqueia envio por “24h window”. Indicador “última mensagem há X” é opcional (UX), não regra de negócio. Atualizar copy em docs/09 §4.3 no PR do Bloco 6.
8. **Realtime:** preferir `GET /api/v1/stream` (SSE) para `message_received` / unread; **MVP aceitável** = polling 5–10s na inbox se SSE estourar. Agenda SSE (RF-E4-20 Should) só se o mesmo stream já existir — senão fica explícito como escorregado.
9. **Export (RF-E9-13..):** `POST /reports/:report/export` → `202` + `exportId`; job gera CSV (`;`, UTF-8 BOM) ou XLSX; `GET /exports/:id` → status + URL assinada 15 min. Nova tabela `report_export` (`tenant_id`, `report`, `format`, `status`, `storage_key`, `requested_by`, `error`). Audit `REPORT_EXPORTED`. Dentista: só dados do próprio escopo.
10. **Dashboard (RF-E9-01..):** `GET /reports/dashboard?date=` (TZ tenant): agenda do dia (contagens por status), a receber hoje (cents + count), faltas no mês, produção do mês (cents). Cards com link de drill-down para rotas já existentes ou páginas de relatório. Cache Redis ≤60s (módulo §5) — se Redis down, calcula sem cache (não 503).
11. **GETs E9 faltantes:** `no-shows`, `revenue`, `procedures` com `from`/`to` e teto de período (módulo: ex. 366 dias → `422`). Escopo dentista: `reports.read` sem `reports.financial` → só produção/próprios onde couber; no-shows/revenue financeiros → `reports.financial` ou 403.
12. **Should relatórios (RF-E9-09..12):** conversão de orçamentos, pacientes novos/origem, ocupação agenda, consumo WA — **entrar** se Blocos 3–4 fecharem cedo; senão checklist marca escorregado sem improviso de BI.
13. **Planos seed:** Essencial / Clínica / Rede conforme [módulo §2](../../modulos/10-billing-saas.md) (limites profissionais, users, units, storageGb). `messages_month`: com WAHA **não** há franquia Meta — ainda assim registrar uso; limite do plano **observa** e pode avisar (não cortar conversa clínica no meio) — alinhar módulo messaging “cortesia”; se conflito, **não** bloquear inbox send por franquia no MVP (só banner).
14. **Histórico no paciente (RF-E8-09):** `GET /patients/:id/messages` ou incluir na timeline tipada `MESSAGE` — preferir endpoint messaging filtrado por `patientId` + aba/seção na ficha se `messaging.read` (Data em operacional ou messaging package; **sem** import clinico↔messaging indevido).
15. **Ações contextuais (RF-E8-10 Should):** botões que **navegam** para telas existentes (agendar, orçamento, anamnese, recibo, cobrar) com query `patientId` — **não** reimplementar fluxos dentro do thread. Se escorregar, inbox ainda Must.
16. **Notas internas na conversa (módulo §6):** Could/corte — **fora** se não estiver no RF Must; não inventar entidade sem RF.
17. **Suspensão:** writing HTTP mutável → bloqueado; GET ok; export ok; jobs de automação D-1/H-3 **não** enfileiram novos envios; inbox send humano: **bloqueado** em SUSPENDED/EXPIRED (somente leitura) — perguntar só se produto quiser permitir reply humanitário; default = bloqueado como escrita.
18. **Carry-overs explícitos fora dos blocos:** M3 S4; `appointment.treatment_item_id` → `SCHEDULED`; RF-E7-19; badge alerta agenda S4; LGPD ZIP S8.
19. **Papéis:** RECEPTION/FINANCE/OWNER: inbox com `messaging.read/write`. DENTIST: `messaging.read/write` (matriz) — pode usar inbox; sem `reports.financial`. ASB: messaging conforme matriz. OWNER: `subscription.manage` vê `/assinatura`. ASB/DENTIST: 403 em subscription.
20. **arch:check:** `reporting` ↛ internals billing/treatments; `subscription` ↛ billing clínico; `messaging` ↛ patients internals (só `*_public` para vincular paciente).
21. **Money / PII:** exports e dashboard em cents inteiros; logs sem corpo completo de mensagem clínica; telefone mascarado em logs.
22. **Demo discard (RF-E10-15 Should):** apaga dados seed/demo do tenant trial com confirmação; **nunca** em ACTIVE pago sem double-confirm; se escorregar, fica explícito.

---

## Fora desta sprint

- Checkout Stripe / Mercado Pago / Asaas (RF-E10-10, 18)
- Créditos Meta como SKU (RF-E10-11)
- Campanhas em massa / chatbot IA / SMS (RF-E8-22/23)
- Analytics avançado / benchmark / BI externo (RF-E9-17..19)
- NFS-e / cupons / indicação da nossa assinatura (RF-E10-16+)
- Exportação LGPD completa, DSR, break-glass, audit UI (E11 → S8)
- NFS-e paciente, boleto, maquininha, comissão, régua cobrança (E7 leftovers)
- `SCHEDULED` treatment item (carry-over S5)
- RF-E7-19 bloqueio agenda inadimplente (Could)
- M3 uso real S4

---

## Arquitetura técnica

```
HTTP autenticado
  → authenticate → tenantContext → subscriptionGuard → authorize
  → messaging/conversations*     (E8b)
  → reporting/* + /exports/:id   (E9)
  → subscription/*               (E10)
  → stream (SSE) opcional

Webhook WAHA (já S3)
  → job process → upsert conversation/message
  → outbox message_received → SSE/poll

Send inbox
  → Service → Action → WAHA send + persist message OUT
  → Idempotency-Key

Report export
  → POST export → report_export PENDING
  → job → CSV/XLSX → storage → READY
  → GET exports/:id signed URL

Trial expiry
  → cron → subscription EXPIRED / tenant status
  → automations off; writes blocked
```

### Pastas-alvo (docs/16 + snake do repo)

```
backend/src/
  modules/messaging/
    routes/v1/conversation.routes.ts
    controllers/conversation.controller.ts
    services/conversation|message/…
    repositories/conversation|message/…   # estender
  modules/reporting/                      # NOVO
    reporting.module.ts
    reporting_public.ts
    routes/v1/report.routes.ts
    routes/v1/export.routes.ts
    jobs/report_export.job.ts
    services/… repositories/…
  modules/subscription/                   # NOVO
    subscription.module.ts
    subscription_public.ts
    routes/v1/subscription.routes.ts
    services/… repositories/plan|subscription|usage…
  shared/middlewares/
    subscription_guard.middleware.ts
    plan_limit (via subscription_public)

frontend/src/
  app/(app)/app/page.tsx                  # Dashboard E9
  app/(app)/app/inbox/page.tsx
  app/(app)/app/whatsapp/page.tsx         # settings (já)
  app/(app)/app/relatorios/page.tsx
  app/(app)/app/assinatura/page.tsx
  packages/messaging/…/Conversation|Message
  packages/admin/…/Dashboard|Subscription|Report   # ou package reports se preferir — perguntar só se conflitar com admin
```

Preferência FE: widgets de dashboard e páginas de relatório em `admin` **ou** package `reports` novo — **corte:** usar `admin` para Subscription + Dashboard shell; relatórios em `admin/components/Report` **sem** criar package npm extra, a menos que docs/16 exija — alinhar a `docs/16` no Bloco 6 (se `reports` package não existir, não inventar monorepo package; pastas sob `packages/admin`).

Action **somente** quando há efeito além do repositório (WAHA send, outbox, export job, status subscription).

### RLS / ator

- `conversation` / `message` / `report_export` / `plan` (global?) / `subscription` / `usage_counter`: tenant isolation.
- `plan` pode ser tabela global (sem tenant) só leitura — se DDL for global, sem RLS tenant; `subscription` por tenant.
- Cross-tenant conversation → `404`.
- SUSPENDED: mutações `402`/`403`; GETs ok.

---

## Contratos HTTP (S7) — esqueleto

Envelope `{ data }` / `{ error }`; camelCase; UUID v7; `*Cents` inteiro. Preencher `docs/08` no PR do bloco.

### Mensageria — inbox (`messaging.read` / `.write`)

```
GET    /api/v1/messaging/conversations           ?status=&q=&cursor=&limit=
GET    /api/v1/messaging/conversations/:id
GET    /api/v1/messaging/conversations/:id/messages  ?cursor=&limit=
POST   /api/v1/messaging/conversations/:id/messages  Idempotency-Key  { text?, mediaStorageKey? }
PATCH  /api/v1/messaging/conversations/:id           { assignedToUserId?, status?, patientId? }
POST   /api/v1/messaging/conversations/:id/read

GET    /api/v1/stream                            SSE (opcional Bloco 1/2)
```

### Relatórios (`reports.read` / `reports.financial`)

```
GET    /api/v1/reports/dashboard                 ?date=
GET    /api/v1/reports/no-shows                  ?from=&to=
GET    /api/v1/reports/revenue                   ?from=&to=&basis?=
GET    /api/v1/reports/procedures                ?from=&to=
POST   /api/v1/reports/:report/export            { format: CSV|XLSX, from?, to?, filters? } → 202
GET    /api/v1/exports/:id

# Já S6 (billing) — não quebrar:
GET    /api/v1/reports/cash-flow|overdue|production
```

### Assinatura (`subscription.manage` para mutação ops; GET usage para OWNER)

```
GET    /api/v1/subscription
GET    /api/v1/subscription/plans
GET    /api/v1/subscription/usage
# POST /subscription/checkout  → omitido ou 501 (ADR-0010)
```

Erros estáveis: `402 PLAN_LIMIT_EXCEEDED` / `SUBSCRIPTION_REQUIRED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 IDEMPOTENCY_KEY_REUSED`, `422` período inválido, `501 NOT_IMPLEMENTED` (checkout).

---

## DDL (migração S7) + RLS

| Tabela / alteração | Notas |
| --- | --- |
| `conversation` / `message` | Já existem — migrations só se faltar coluna (`assigned_to`, `unread_count`, `status` PENDING/OPEN/CLOSED, `patient_id`) |
| `report_export` | Nova; status `PENDING\|RUNNING\|READY\|FAILED`; `storage_key`; RLS tenant |
| `plan` | Catálogo (pode ser global); code `ESSENCIAL\|CLINICA\|REDE`; `limits` jsonb |
| `subscription` | `tenant_id` unique; status; `plan_id`; `trial_ends_at`; external_* nullable |
| `usage_counter` | `(tenant_id, metric, period)` ou similar módulo §4 |
| Views opcionais | `vw_*` só se query do dashboard exigir e for barato |

---

## Jobs e eventos

| Job / evento | Fila | Notas |
| --- | --- | --- |
| `report-export` | `reporting` | Gera arquivo; marca READY/FAILED |
| `trial-expire` / `subscription-lifecycle` | `platform` ou `subscription` | TRIAL→EXPIRED; e-mail Resend |
| `message_received` (outbox) | já messaging | Fan-out SSE |
| Automations D-1/H-3 | messaging | Respeitam subscription ativa |

---

## Fluxos (domínio + UX)

### A. Inbox (RF-E8-07..09)

**Backend:** list → open thread → send → webhook inbound append. Vincular `patientId` por E.164.

**Frontend:** `/app/inbox` 3 colunas; badge nav; contexto paciente (nome, próximo agendamento link). Sem Meta window lock.

### B. Dashboard + relatórios (E9)

**Frontend:** `/app` cards do dia; `/app/relatorios` lista; export pede job e oferece URL quando READY. Reusar telas financeiro para cash-flow/overdue/production via links.

### C. Assinatura (E10)

**Frontend:** `/app/assinatura` plano atual, uso vs limite, dias de trial, CTA “falar para ativar”. Banner global se TRIAL&lt;3d ou PAST_DUE/SUSPENDED.

---

## Blocos de entrega

### Bloco 1 — Backend: inbox foundation

- [ ] Rotas conversations list/get/messages/send/patch/read + Idempotency-Key no send
- [ ] Reusar WAHA send; persist OUT/IN; unread
- [ ] Filtro PENDING/OPEN/CLOSED; vincular patient por telefone (`patients_public`)
- [ ] Smoke `test:messaging-inbox` (fake WAHA)
- [ ] Atualizar docs/08 §2.8 conversations

### Bloco 2 — Backend: inbox polish + realtime

- [ ] Mídia (presign + send document/image via WAHA se suportado; senão texto-only explícito)
- [ ] Histórico por `patientId` (endpoint ou query)
- [ ] SSE `/stream` **ou** documentar polling-only no aceite
- [ ] Should stubs RF-E8-10 (deep-links metadata) se couber

### Bloco 3 — Backend: módulo `reporting` (dashboard + GETs)

- [ ] Scaffold `reporting/` + registro no app
- [ ] `GET /reports/dashboard`
- [ ] `GET /reports/no-shows` · `/revenue` · `/procedures`
- [ ] Escopo dentista + teto de período + cache opcional
- [ ] Smoke `test:reporting-dashboard`
- [ ] docs/08 §2.9

### Bloco 4 — Backend: export assíncrono

- [ ] DDL `report_export` + RLS
- [ ] `POST /reports/:report/export` → 202; job; `GET /exports/:id`
- [ ] CSV `;` UTF-8 BOM; XLSX se lib leve já no monorepo — senão CSV Must + XLSX Should
- [ ] Audit `REPORT_EXPORTED`
- [ ] Smoke `test:reporting-export`

### Bloco 5 — Backend: módulo `subscription`

- [ ] DDL plan/subscription/usage_counter + seed planos
- [ ] `GET /subscription` · `/plans` · `/usage`
- [ ] `PlanLimitGuard` (profissionais, storage upload, users)
- [ ] `subscriptionGuard` (SUSPENDED/EXPIRED)
- [ ] Job trial expiry; desliga automações
- [ ] Ops: script/endpoint auditado para ACTIVE/SUSPENDED (sem checkout)
- [ ] Smoke `test:subscription`
- [ ] ADR-0010 respeitado (sem gateway)

### Bloco 6 — Frontend: inbox

- [ ] `/app/inbox` Page → Component → Hook → Service → Data
- [ ] 3 colunas; badge nav; `/app/whatsapp` intacto
- [ ] E2E `e2e/messaging-inbox.spec.ts` (fake; sem Meta)

### Bloco 7 — Frontend: dashboard + relatórios + assinatura

- [ ] `/app` dashboard E9 (substituir greeting-only)
- [ ] `/app/relatorios` + UX export
- [ ] `/app/assinatura` + banners trial/suspenso
- [ ] E2E `e2e/reports-dashboard.spec.ts` + `e2e/subscription.spec.ts` (owner)

---

## Endpoints-alvo (resumo)

```
GET|PATCH       /api/v1/messaging/conversations[/:id]
GET|POST        /api/v1/messaging/conversations/:id/messages
POST            /api/v1/messaging/conversations/:id/read
GET             /api/v1/stream

GET             /api/v1/reports/dashboard|no-shows|revenue|procedures
POST            /api/v1/reports/:report/export
GET             /api/v1/exports/:id

GET             /api/v1/subscription
GET             /api/v1/subscription/plans
GET             /api/v1/subscription/usage
```

**Backend — aceite de código**

- [ ] Inbox: inbound webhook cria/atualiza conversa; send persiste OUT; outro tenant 404
- [ ] Duplo POST message mesma Idempotency-Key = 1 mensagem
- [ ] Dashboard 200 com KPIs inteiros (cents); dentista sem financial onde couber 403
- [ ] Export 202 → READY → URL; CSV com `;` e BOM
- [ ] Trial expira → writes 402/403; GET/export ok; automations não disparam
- [ ] Plan limit profissionais → 402 com mensagem acionável
- [ ] Checkout não cobra (501/ausente)
- [ ] Cross-tenant export/conversation → 404

**Frontend — aceite de código**

- [ ] Inbox 3 colunas: listar, abrir, enviar texto; badge atualiza
- [ ] Dashboard mostra cards do dia; link para drill-down
- [ ] Export pede e baixa quando pronto (ou copia URL)
- [ ] OWNER vê assinatura/trial; ASB/DENTIST sem nav Assinatura
- [ ] SUSPENDED: UI deixa claro somente leitura

---

## Qualidade

- CI: lint, typecheck, arch:check, migrate, `test:rls` (novas tabelas), smokes inbox / reporting / subscription
- Domínio: subscriptionGuard antes de escrita; export at-least-once idempotente por `exportId`
- Integração: 2 tenants → conversa B invisível; dashboard sem float
- Resiliência: WAHA down → send 503; Redis down → dashboard sem cache; MinIO down → export FAILED sem corromper HTTP 202 já emitido
- E2E Playwright workers=1; **não** exigir WABA/S3 reais (fake)
- Envelope `{ data }` / `{ error }`; camelCase; UTC no banco; cents inteiros
- arch:check: reporting/subscription/messaging sem cycles proibidos
- Logs: **zero** dump de corpo completo de mensagem / PDF export / DEK

---

## Aceite de produto (código + demo local)

- [ ] Recepção abre inbox, vê mensagem do paciente seed (ou simulada), responde; conversa aparece no histórico do paciente
- [ ] Dono abre `/app` e vê agenda do dia + a receber hoje + produção do mês (números coerentes com S6)
- [ ] Dono exporta um relatório CSV e abre o arquivo
- [ ] Trial: banner com dias; após forçar expiry, clínica não cria paciente/agendamento; ainda lista e exporta
- [ ] OWNER vê planos/limites em `/assinatura`; CTA sem checkout falso de cartão
- [ ] Dra. Ana não acessa relatórios financeiros consolidados; produção própria ok

Não há marco M5 nesta sprint (M5 = S8 piloto). M3 permanece uso real S4.

---

## Bloqueios

| Risco | Mitigação |
| --- | --- |
| Escopo explode com Stripe | ADR-0010 + corte #2 |
| Mover rotas E7 quebra FE S6 | Corte #3: paths billing estáveis |
| SSE atrasa inbox | Polling aceito no aceite (corte #8) |
| docs/09 ainda fala janela Meta | Corte #7: alinhar copy no Bloco 6 |
| Franquia messages vs WAHA | Corte #13: não cortar send clínico por franquia |
| Reporting lê demais billing | Só `*_public` / SQL read-only; arch:check |
| Ops ativar plano sem UI | Script auditado explícito no Bloco 5 |
| Três épicos em ~45 pts | Ordem de escorrega #1; Must inbox+dashboard+trial primeiro |

## Notas

- Seed e2e: conversa PENDING + paciente Maria; tenant teste com trial ativo.
- Package `messaging` **não** importa `financeiro`/`clinico`; deep-links só por URL.
- Aceite HTTP: estender `backend/tests/messaging|reporting|subscription/`.
- Playwright: inbox usa **reception**; subscription usa **owner**; dashboard owner/finance.
- Em dúvida de produto/DDL/contrato **não** fechada acima → **perguntar** antes de implementar (não improvisar gateway, campanha, BI, nem sequestrar dados na suspensão).
