# Sprint 5 — Orçamento → tratamento (E6 Must)

**Objetivo verificável:** Dentista/recepção monta orçamento → envia PDF + link → paciente (ou recepção) aprova (inclusive parcial) → nascem plano + parcelas na **mesma transação**; no atendimento, dentista executa item **só** com evolução assinada, atualizando odontograma (`PROCEDURE_EXECUTION`) e `production_entry`. Sem marco nomeado no [docs/13](../../13-roadmap-estimativas.md) (M4 fecha na S6 com baixa no caixa).

**Escopo:** Must de E6 (orçamento + PDF/envio + decisão + plano + parcelas + execução). Sem AR/AP/caixa/recibo/inadimplência (E7 → S6). Sem inbox E8b. Sem contratos jurídicos (RF-E6-19). Sem CRM de recusa (RF-E6-20).  
**Pontos (roadmap):** ~40 · Épico E6 · [docs/13](../../13-roadmap-estimativas.md)

**Pré-requisito:** S4 código Must (prontuário + odontograma + note append-only + `clinical_records_public` + ObjectStorage + token público + outbox/worker + template `anamnesis_request`). Aceite M3 (uso real) **não** bloqueia S5. Carry-over S4 (smokes no `ci.yml`) entra na qualidade desta sprint, não como bloco de produto.

**Estado (2026-08-14):** Sprint 5 fechada (código + aceite local). S6 fechada em 2026-08-17. Próxima: S7. M3 uso real S4 permanece pendente.

---

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — `treatments` + fatia `billing` (título/parcelas/produção) (Blocos 1–5) | `backend/` |
| **Frontend** | Sim — `operacional` orçamentos + `public` decisão + `clinico` plano no atendimento (Blocos 6–7) | `frontend/` |

Não misturar: um bloco é **só backend** ou **só frontend**, salvo contrato (`contracts/` / `docs/08`). Cruzar BC só por `*_public.ts` + outbox (nunca import direto `treatments` ↔ `clinical_records` / `billing` / `patients` / `clinic`).

### Backend (Blocos 1–5)

- DDL + RLS `quote`, `quote_item`, `treatment_plan`, `treatment_item`, `quote_number_counter`
- Fatia billing: `financial_category`, `receivable`, `installment`, `production_entry` (sem `payment` / caixa / `payable`)
- Máquina de estados do orçamento; preço congelado; desconto por papel; `requires_tooth`
- PDF comercial (job) + token `purpose=QUOTE` + send WA/e-mail
- `DecideQuote` atômico: plano + título + parcelas; `Idempotency-Key`; rollback se billing falhar
- Execução via `treatments` → `clinical_records_public` (note + odontograma) + `billing_public` (produção)
- **Não inclui** telas Next.js
- **Não inclui** `POST /installments/:id/payments`, caixa, AP, recibo, aging (S6)
- **Não inclui** contratos / assinatura eletrônica do paciente (fase 2)

### Frontend (Blocos 6–7)

- Package `operacional`: Index/Form de orçamentos + decisão presencial + aba na ficha
- Package `public`: `/orcamento/[token]` (mobile-first, sem AppShell, sem dado clínico)
- Package `clinico`: painel de plano no atendimento (substitui `PlanPlaceholder`) + executar
- Timeline da ficha: fonte `QUOTE` real (com `quotes.read`)
- **Não inclui** novos endpoints de domínio — consome Blocos 1–5
- **Não inclui** package `financeiro` (listas AR, baixa, caixa) — S6
- **Não inclui** inbox; CRM de orçamentos recusados

---

## Estado atual do código (herança S0–S4)

Usar; **não** reimplementar.

| Já existe | Onde | Uso na S5 |
| --- | --- | --- |
| Catálogo `procedure` (`price_cents`, `requiresTooth`, `requiresFace`) | clinic S1 | Copiar preço no item; validar dente/face |
| Seed procedimentos (RES/EXO/IMP/PROT/END…) | `procedure_catalog.helper.ts` | Mapa default de condição do odontograma na execução |
| Paciente + `legal_guardian` + timeline tipada `QUOTE` vazia | patients S2 | Menor no link público; timeline deixa de stubar |
| `Idempotency-Key` em appointment/waitlist | scheduling | Mesmo contrato HTTP na decisão / execute |
| Status `IN_SERVICE` + tela atendimento 3 áreas | S2/S4 | Painel direito = plano real + evolução |
| `ClinicalNote.create` / envelope / CRO / 423 | clinical_records S4 | Execução **cria** note via `*_public` (não duplicar domínio) |
| `tooth_state_history.source` inclui `PROCEDURE_EXECUTION` | S4 | Consumer real na execução |
| `POST /notes` com `procedures` **sem** side-effect E6 | docs/08 | Continua evolução avulsa; executar item **não** é atalho nesse POST |
| `ObjectStorage` presign PUT/GET | S4 | PDF do orçamento no bucket (não tabela `attachment` clínica) |
| `public_booking_token` + `createPublicToken` | scheduling S3/S4 | Estender `purpose` com `QUOTE` (TTL = `valid_until`) |
| Outbox + worker + BullMQ | S3 | PDF job, `quote_sent`, expire diário |
| Send-link anamnese (WA/e-mail/COPY) | S4 | Copiar padrão para `POST /quotes/:id/send` |
| Templates messaging (agenda + `anamnesis_request`) | E8a | Acrescentar `quote_sent` (utility; **sem** diagnóstico nas variáveis) |
| Permissões `quotes.*` já na matriz S1 | identity | Só **passar a usar**; ASB/FINANCE sem quotes |
| `PlanPlaceholder` “Disponível na Sprint 5” | `clinico` | Substituir; não criar package novo |
| Ficha paciente (tabs) | `operacional` | Tab **Orçamentos** com `Can quotes.read` |
| Money = `bigint` cents | docs/07 / billing módulo | Helper `splitInstallments` **sem** float |
| E2E Playwright workers=1 | `e2e/` | Specs: quotes + quote-public + execute-in-attendance |

**Entregar nesta sprint:** módulos `treatments/` + `billing/` (fatia); tabelas E6 + RLS; port `createReceivableFromApprovedQuote`; rotas §2.6 + público quotes; UI orçamentos + `/orcamento/[token]`; plano no atendimento; timeline QUOTE.

**Pós-código (ainda aberto, não é aceite S5):** M3 uso real S4; baixa/caixa M4 (S6); smokes S4 no CI (fazer nesta sprint se ainda faltarem).

**Alinhar docs/07:** `quote.number` **não** usar `IDENTITY` global — counter por tenant (lição S2 `patient_code`). `treatment_item.status` no módulo = `PLANNED\|SCHEDULED\|EXECUTED\|CANCELLED` (DDL §6 lista `IN_PROGRESS` — migração usa a lista do **módulo**). Colunas extras: `quote.duplicated_from_id`, `reject_reason`, `pdf_storage_key`, `idempotency_key` (decisão), `quote_item.approved`. `public_booking_token.purpose` inclui `QUOTE`.

---

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E6](../../requisitos/funcionais/06-orcamentos-tratamentos.md) | Must RF-E6-01..11, 13–17; Should 12, 18 |
| [RF-E5-08 / RF-E5-16](../../requisitos/funcionais/05-prontuario.md) | Odontograma na execução; painel plano no atendimento |
| [Módulo treatments](../../modulos/06-orcamentos-tratamentos.md) | Agregados, aprovação atômica, testes §11 |
| [Módulo billing](../../modulos/07-financeiro.md) | Port de título; `production_entry`; **sem** HTTP E7 |
| [API v1 §2.6 + §3.4 + público](../../08-api-v1.md) | Contratos HTTP; preencher `GET\|POST /public/quotes/:token` |
| [Modelo §6 + §7](../../07-modelo-de-dados.md) | DDL quote/plan + receivable/installment/production |
| [Frontend §4.2 + rotas](../../09-frontend.md) | Atendimento com plano; `/app/orcamentos`; `(public)` |
| [Pastas](../../16-estrutura-de-pastas.md) | `treatments/`, `billing/`, `*_public.ts`, jobs |
| [Identidade — matriz](../../modulos/01-identidade-acesso.md) | `quotes.read/write/approve`; recepção sem clínico |
| [Qualidade §2.5](../../12-qualidade-testes.md) | Propriedade: parcelas somam o total |
| [Messaging templates](../../modulos/08-whatsapp-comunicacao.md) | `quote_sent` utility |
| [S4](./S4-prontuario.md) | Note, odontograma, storage, token, placeholder plano |

---

## Decisões de corte (fechadas no planejamento)

1. **Must E6 nesta sprint:** RF-E6-01..11, 13–17. Should: RF-E6-12 (motivo na rejeição — **obrigatório no POST** se `REJECTED`; barato). RF-E6-18 (progresso % no `GET treatment-plans/:id`). Se estourar tempo, **último** a escorregar = RF-E6-18 e vínculo `appointment.treatment_item_id` → `SCHEDULED` — só com reclassificação explícita neste checklist.
2. **Financeiro da clínica (E7)** → **S6**. S5 **cria** `receivable` + `installment` + `production_entry` e **não** expõe baixa, estorno, caixa, AP, recibo, overdue job, crédito de paciente. `GET /receivables` autenticado **não** entra (parcelas voltam no `POST /decision` e no `GET /quotes/:id` após aprovado). Package `financeiro` não ganha Index.
3. **Execução é dona do treatments, não do POST /notes:** único HTTP que marca `EXECUTED` é `POST /api/v1/treatment-items/:id/execute` (e batch, ver contratos). O use case, **na mesma UoW**, chama `clinical_records_public.createSignedNote` + `applyExecutionToothState` (`source=PROCEDURE_EXECUTION`) + `billing_public.createProductionEntry`. `POST /notes` continua evolução avulsa (S4); `treatmentItemIds` nesse body → `422` com hint `/treatment-items/:id/execute`. **Proibido** atalho “marcar executado” sem note ≥10 e CRO.
4. **Sem ciclo de imports:** `treatments` → `clinical_records_public` / `billing_public` / `patients_public` / `clinic_public` / `scheduling_public`. `billing` **não** importa `treatments`. `clinical_records` **não** importa `treatments` (o evento `treatments.item_executed` fica emit-only para reporting). `arch:check` deve falhar se o ciclo aparecer.
5. **Aprovação síncrona via port (não outbox):** `DecideQuoteAction` chama `billing_public.createReceivableFromApprovedQuote` **dentro** de `uow.run`. Falha no título → rollback de plano e status do orçamento (teste obrigatório: billing stub throw). Efeitos não críticos (PDF já gerado no send, WA de confirmação, reporting) → outbox.
6. **Idempotência da decisão:** header `Idempotency-Key` **obrigatório** em `POST .../decision` (público e autenticado). Mesma chave + mesmo body → resposta original. Mesma chave + body diferente → `409 IDEMPOTENCY_KEY_REUSED`. Persistência: `quote.idempotency_key` unique parcial por tenant **ou** tabela `idempotency_record` do módulo (padrão appointment). Duplo POST = **um** plano e **um** título.
7. **Preço congelado:** `quote_item.unit_price_cents` copiado de `procedure.price_cents` no **create/add item**. `PATCH` de item em `DRAFT` recopia se `procedureId` mudar; send **não** recopia. Duplicate = novo DRAFT com preços **atuais** do catálogo + `duplicated_from_id`.
8. **Desconto (RF-E6-04) sem workflow de aprovação:** tetos `RECEPTION` = 0%, `DENTIST` = 10% do subtotal, `OWNER` = ilimitado. Acima do teto → `422 DISCOUNT_LIMIT_EXCEEDED` (sem fila para o Owner). `quotes.approve` nesta sprint = **decisão presencial autenticada** (além de `quotes.write` no CRUD/send). Recepção **tem** `quotes.write` e **não** tem `quotes.approve` na matriz — mas a matriz HTTP docs/08 autoriza recepção em `POST /decision`. **Corte:** recepção **pode** registrar decisão presencial (`quotes.write` basta no POST decision autenticado); `quotes.approve` reservado se no futuro houver desconto excepcional. Documentar o desvio vs docs/08 na atualização do Bloco 4 (preferir a matriz de papéis + este corte, não inventar terceiro papel).
9. **Validade:** default **30 dias** (`valid_until` = hoje no TZ do tenant + 30). Job diário `expire-quotes` (fila `platform`, cron por tenant TZ) marca `SENT` vencido → `EXPIRED`. `EXPIRED`/`REJECTED`/`APPROVED`/`PARTIALLY_APPROVED` não aceitam decisão. Duplicate permitido a partir de SENT/EXPIRED/REJECTED/parcial.
10. **Aprovação parcial:** `approvedItemIds` obrigatório se `decision=APPROVED` e o cliente não quer todos; se a lista é subconjunto próprio → status `PARTIALLY_APPROVED` e plano só com esses itens; itens omitidos ficam no orçamento (`quote_item.approved=false`) como oportunidade (sem CRM). Aprovar zero itens → `422`. `REJECTED` não cria plano nem título; `reason` ≥10 chars.
11. **Parcelas:** `Σ installment.amount_cents + downPaymentCents = approvedTotalCents`. Resíduo de divisão inteira na **primeira** parcela. `downPaymentCents` **não** gera `payment` na S5 (só entra na conta do split; parcelas `OPEN` cobrem o restante). `installments` ≥ 1. Datas: `firstDueDate` + meses seguintes (civil, TZ tenant). Teste de propriedade (fast-check) no helper — **proibido** `number` float no cálculo.
12. **Token público:** reusa `public_booking_token` `purpose=QUOTE`, expira em `valid_until` 23:59:59 no TZ do tenant (ou `expires_at` = fim do dia). One-shot no `decision` (`used_at`). Sem PII na URL. Path canônico: `GET|POST /api/v1/public/quotes/:token` (sem slug). Rate limit IP. PDF: `GET` público **não** devolve diagnóstico; itens = nome do procedimento + dente/face + valores.
13. **Menor (RF-E6-16):** se idade < 18 (birthDate) **ou** `legal_guardian` cadastrado como responsável, decisão pelo link exige `guardianCpf` igual a um guardian do paciente. Sem guardian cadastrado + menor → `422 GUARDIAN_REQUIRED` (clínica cadastra responsável antes). Decisão presencial autenticada: recepção/dentista responde pela clínica (não exige CPF na API).
14. **PDF (RF-E6-17):** job `generate-quote-pdf` após send (e regenerate se reenvio). Conteúdo: clínica (nome, CNPJ, endereço, telefone, CRO do responsável técnico), paciente (nome + código de ficha, **sem** anamnese/alertas), itens, desconto, total, validade, condições de pagamento propostas (N parcelas se já informadas no draft; senão omitir), campo assinatura. **Zero** texto de evolução/diagnóstico. Lib Node (pdfkit ou equivalente) — **sem** Chromium. Storage key `tenants/{tenantId}/quotes/{quoteId}/v{n}.pdf`; `GET /quotes/:id/pdf` → URL assinada 15 min (`quotes.read`).
15. **Send:** `DRAFT` → `SENT` + token + job PDF + outbox `treatments.quote_sent` → worker envia template `quote_sent` (variáveis: primeiro nome, clínica, valor total, URL). Fallback e-mail / `COPY` como anamnese. Reenvio com status `SENT` (não expirado): não muda itens; novo token invalida o anterior **ou** reusa o mesmo até decidir (preferir **um token vigente**; reenviar a mesma URL). Clínica sem WA não bloqueia.
16. **Item com dente:** `requiresTooth` sem `toothCode` → `422`. `requiresFace` sem `face` → `422`. Faces = mesmo enum do odontograma `M|D|V|L|O|C`.
17. **Odontograma na execução (RF-E5-08):** mapa default por prefixo de `procedure.code`: `RES-*`→`RESTORED`, `EXO-*`→`EXTRACTED`, `IMP-*`→`IMPLANT`, `PROT-*`→`CROWN`, `END-*`→`ROOT_CANAL`. Demais com `requiresTooth` exigem `toothState` no body; sem dente no item → 422 já no orçamento. Body pode **sobrescrever** a condição. Histórico `source=PROCEDURE_EXECUTION`. Conflito ABSENT/EXTRACTED+restauração: mesma regra S4 (`TOOTH_STATE_CONFLICT` + justification).
18. **Cancelar item:** só `PLANNED`/`SCHEDULED`; motivo ≥10. `EXECUTED` → `422 ITEM_ALREADY_EXECUTED` (estorno é S6). Cancelar todos os itens restantes + nenhum executado → plano `CANCELLED`; se houver executados → plano permanece `ACTIVE` até o último não-cancelado executar (`COMPLETED`).
19. **`SCHEDULED` (Should):** `POST /appointments` já existente pode receber `treatmentItemId` opcional; scheduling persiste a coluna (hoje referência lógica) e publica evento; `treatments` marca item `SCHEDULED`. Não bloqueia aceite Must se escorregar.
20. **Eventos:** `treatments` publica `quote_created`, `quote_sent`, `quote_approved`, `quote_rejected`, `quote_expired`, `plan_created`, `item_executed`, `plan_completed`. Consumers reporting/CRM **não** existem — só persistir outbox. Messaging consome `quote_sent` (e opcional `quote_approved` para WA de confirmação — Should).
21. **Pasta:** `backend/src/modules/treatments/` e `billing/` (snake, igual `clinical_records`). `treatments_public.ts` / `billing_public.ts`.
22. **Rotas FE:** `/app/orcamentos` (`operacional`); ficha tab Orçamentos; atendimento painel plano; público `/orcamento/[token]` (`(public)`). Nav: item Orçamentos se `quotes.read`.
23. **Money / logs:** centavos `bigint`; logs **sem** dump de PDF binário; token quote não em plaintext no `audit_log`.
24. **Owner dentista:** monta orçamento com `quotes.write`; executa item só com CRO + `clinical_records.write` (mesmo gate S4). OWNER sem CRO envia orçamento, não executa.

---

## Fora desta sprint

- Baixa, estorno, caixa, AP, recibo, fluxo de caixa, inadimplência, crédito de paciente (E7 → S6)
- `POST /installments/:id/payments` e qualquer tela `financeiro/`
- Contratos / assinatura eletrônica do paciente (RF-E6-19, fase 2)
- CRM/funil de orçamentos não aprovados (RF-E6-20)
- Inbox WhatsApp / SSE (S7)
- Comissionamento automático (fase 2) — só grava `production_entry`
- NFS-e, Pix cobrança, boleto, maquininha
- Billing SaaS / Stripe (E10)
- Exportação LGPD (S8)
- Templates `payment_receipt` / `payment_overdue` (S6+)

---

## Arquitetura técnica

```
HTTP autenticado (quotes.*)
  → authenticate → tenantContext → authorize
  → treatments (quotes CRUD / send / decision / plans / execute / cancel)

HTTP público (sem JWT)
  → rateLimit(IP) → resolve token QUOTE → RLS app.tenant_id
  → GET proposta comercial | POST decision (mesmo use case autenticado + decided_by=PATIENT_LINK)

DecideQuote
  → Service → Action → uow.run
       quote.approve/reject
       TreatmentPlan.fromApprovedQuote
       billing_public.createReceivableFromApprovedQuote   // SYNC, mesma TX
       outbox quote_approved | quote_rejected

ExecuteItem
  → Action → uow.run
       clinical_records_public.createSignedNote
       clinical_records_public.applyExecutionToothState
       item → EXECUTED + clinical_note_id
       billing_public.createProductionEntry
       outbox item_executed / plan_completed

PDF
  → send publica outbox → job generate-quote-pdf → PUT storage → pdf_storage_key
```

### Pastas-alvo (docs/16 + snake do repo)

```
backend/src/
  modules/treatments/
    models/                    # Quote, QuoteItem, TreatmentPlan, TreatmentItem
    jobs/   expire_quotes.job.ts
    treatments_public.ts       # listQuotesForTimeline, getActivePlanForPatient, …
    treatments.module.ts
  modules/billing/
    helpers/split_installments.helper.ts
    billing_public.ts          # createReceivableFromApprovedQuote, createProductionEntry
    billing.module.ts          # sem rotas HTTP E7 nesta sprint
  modules/clinical_records/
    clinical_records_public.ts # + createSignedNote, applyExecutionToothState
  modules/scheduling/
    enum/.../public_booking_token_purpose.enum.ts  # + QUOTE
  modules/messaging/
    enum/template/template.enum.ts                 # + quote_sent
  shared/helpers/           # pdf quote renderer fino OU treatments/helpers

frontend/src/
  app/(public)/orcamento/[token]/page.tsx
  app/(app)/app/orcamentos/page.tsx
  app/(app)/app/orcamentos/[id]/page.tsx   # opcional; senão FormDialog na Index
  packages/public/…/QuoteDecision
  packages/operacional/…/Quote
  packages/clinico/…/TreatmentPlan          # substitui PlanPlaceholder
```

Action **somente** quando há efeito além do repositório (outbox, port billing/clinical, token, PDF). CRUD list de quotes em DRAFT: `Service → Repository`.

### RLS / ator

- Todas as tabelas E6 + fatia billing: `tenant_id` + `platform.enable_tenant_rls`.
- Quote/plan de outro tenant → `404`.
- Ator público: sem `app.user_id`; `decided_by=PATIENT_LINK`.
- Recepção: orçamento sim; prontuário/execute **não** (403 + audit).
- FINANCE / ASB: 403 em todas as rotas `quotes*` / `treatment-*`.
- Slug/token inválido → `404` (mesmo shape usado/expirado).

---

## Contratos HTTP (S5) — payloads

Envelope `{ data }` / `{ error }`; camelCase; datas ISO com offset; UUID v7; dinheiro `*Cents` inteiro. Atualizar `docs/08` no mesmo PR do Bloco correspondente.

### Público (rate limit)

```
GET  /api/v1/public/quotes/:token
POST /api/v1/public/quotes/:token/decision
```

| Chave | Janela | Max |
| --- | --- | --- |
| `public:quotes:ip:{ip}` | 1 h | 30 |

**GET token válido:**

```json
{
  "data": {
    "clinicName": "Clínica Teste",
    "patientFirstName": "Maria",
    "validUntil": "2026-09-12",
    "subtotalCents": 200000,
    "discountCents": 20000,
    "totalCents": 180000,
    "items": [
      { "id": "…", "procedureName": "Restauração em resina — 1 face", "toothCode": "26", "face": "O", "quantity": 1, "totalCents": 180000 }
    ],
    "requiresGuardian": false
  }
}
```

Sem CPF, telefone, CRO interno, anamnese, alertas, odontograma, notas clínicas. Token usado/expirado/inexistente → `404`.

**POST decision:** header `Idempotency-Key` obrigatório.

```json
{
  "decision": "APPROVED",
  "approvedItemIds": ["…"],
  "payment": {
    "installments": 6,
    "firstDueDate": "2026-09-05",
    "method": "PIX",
    "downPaymentCents": 20000
  },
  "guardianCpf": null,
  "reason": null
}
```

Resposta: mesmo shape autenticado §3.4 (`quoteId`, `status`, `treatmentPlanId`, `receivable.installments`). `REJECTED` + `reason`. Idempotente se `used_at` já setado.

### Autenticado (`quotes.read` / `.write`)

```
GET    /api/v1/quotes                      ?patientId=&status=&from=&to=&cursor=&limit=
POST   /api/v1/quotes
GET    /api/v1/quotes/:id
PATCH  /api/v1/quotes/:id                  só DRAFT
POST   /api/v1/quotes/:id/items
DELETE /api/v1/quotes/:id/items/:itemId    só DRAFT
POST   /api/v1/quotes/:id/send             { channel: WHATSAPP|EMAIL|COPY }
POST   /api/v1/quotes/:id/duplicate
POST   /api/v1/quotes/:id/decision         Idempotency-Key
GET    /api/v1/quotes/:id/pdf

GET    /api/v1/treatment-plans             ?patientId=&status=
GET    /api/v1/treatment-plans/:id
POST   /api/v1/treatment-items/:id/execute
POST   /api/v1/treatment-items/execute     { itemIds, note, appointmentId?, toothStates? }
POST   /api/v1/treatment-items/:id/cancel  { reason }
```

**POST quote:** `{ "patientId", "professionalId", "unitId?", "validUntil?", "notes?", "items": [{ "procedureId", "toothCode?", "face?", "quantity", "discountCents?" }] }`  
Totais calculados no servidor. `unitId` default = unidade do paciente.

**PATCH quote (DRAFT):** desconto de cabeçalho / validade / notas / recálculo.

**POST item:** preço copiado do catálogo **agora**.

**POST send:** `{ "channel": "WHATSAPP"|"EMAIL"|"COPY" }` → `{ "expiresAt", "sentVia", "publicUrl?" }`. `COPY` só devolve URL.

**POST decision autenticado:** `decided_by=USER`; `quotes.write`. Shape docs/08 §3.4.

**GET quote após aprovado:** inclui `treatmentPlanId`, `receivable` (id, totalCents, installments[]).

**GET plan:** itens + `progressPercent` (Should) + `executedCents` / `pendingCents`.

**POST execute (um id):** `{ "appointmentId?", "note", "toothState?", "justification?" }`  
Cria note assinada; marca item; odontograma; produção. Sem CRO → `422`. ASB/recepção → `403`. Item já `EXECUTED` → `409`.

**POST execute batch:** um `clinical_note` para N itens do **mesmo** paciente/plano; `note` ≥10.

Erros estáveis: `403 FORBIDDEN`, `404 NOT_FOUND`, `409 INVALID_STATE_TRANSITION` / `IDEMPOTENCY_KEY_REUSED` / `ITEM_ALREADY_EXECUTED`, `422 BUSINESS_RULE_VIOLATION` (dente, desconto, validade, guardian, note curta, CRO), `423 RECORD_IMMUTABLE` não se aplica a quote (usa máquina de estados).

---

## DDL (migração S5) + RLS

Todas com `tenant_id` + `platform.enable_tenant_rls`.

| Tabela / alteração | Notas |
| --- | --- |
| `quote_number_counter` | `(tenant_id, last_number)` — **não** IDENTITY global |
| `quote` | unique `(tenant_id, number)`; status módulo; `duplicated_from_id`; `reject_reason`; `pdf_storage_key`; `idempotency_key`; `decided_by` |
| `quote_item` | preço congelado; `approved` boolean; dente/face |
| `treatment_plan` | `quote_id`; status `ACTIVE\|COMPLETED\|CANCELLED` |
| `treatment_item` | status módulo; `clinical_note_id`; `quote_item_id`; `price_cents` |
| `financial_category` | seed “Procedimentos” (`REVENUE`) no signup/seed |
| `receivable` | origin quote; `total_cents`; `installments` count |
| `installment` | `amount_cents`; status `OPEN`; unique `(tenant_id, receivable_id, number)` |
| `production_entry` | na execução |
| `public_booking_token.purpose` | + `QUOTE` |
| `appointment.treatment_item_id` | opcional (Should SCHEDULED) — FK lógica ok |
| Seed | 1 orçamento DRAFT da Maria (itens RES-01 dente 26) para E2E; categorias financeiras mínimas |

`enable_tenant_rls` + `test:rls` nas tabelas novas (quote cross-tenant = 0 rows / 404).

---

## Jobs e eventos

| Fila | Job | Idempotência | Quando |
| --- | --- | --- | --- |
| `platform` | `dispatch-outbox` | (já S3) | contínuo |
| `platform` | `generate-quote-pdf` | `quoteId` + versão | após send |
| `platform` | `expire-quotes` | por dia/tenant | cron diário TZ |

Eventos de domínio (outbox `name`):

| Publicado por | Nome | Consumidor S5 |
| --- | --- | --- |
| treatments | `treatments.quote_created` | nenhum |
| treatments | `treatments.quote_sent` | messaging → template `quote_sent` |
| treatments | `treatments.quote_approved` / `_rejected` / `_expired` | messaging confirmação = Should |
| treatments | `treatments.plan_created` | nenhum (plano já na TX) |
| treatments | `treatments.item_executed` / `plan_completed` | nenhum (produção já via port) |
| billing | `billing.receivable_created` | nenhum (S6+) |

`clinical_records.note_created` **não** marca item sozinho (corte #3) — evita dupla execução se o dentista assinar evolução avulsa.

---

## Fluxos (domínio + UX)

### A. Montar e enviar (RF-E6-01..06, 17)

**Backend:** create DRAFT → add/remove items → totais → send (PDF + token + WA/e-mail).

**Frontend operacional:** Index `/app/orcamentos` (filtro paciente/status) + FormDialog criar a partir da ficha ou da lista. Linhas: procedimento (Select catálogo), dente/face se flagged, qtd, desconto (respeita teto na UX **e** no servidor). Banner de validade. Enviar: canais COPY/WA/e-mail. Download PDF quando `pdf_storage_key` pronto (polling curto / toast).

**Público:** 1 página mobile-first: clínica + primeiro nome + tabela comercial + total + validade → aprovar todos / selecionar itens / rejeitar com motivo → sucesso. Estados: skeleton, 404, expirado, já decidido, 429, menor (CPF responsável).

### B. Decisão e parcelas (RF-E6-07..11, 16)

Presencial: na ficha/Index, FormDialog decisão (itens + N parcelas + 1º vencimento + entrada) com `Idempotency-Key` gerado no cliente (uuid). Sucesso mostra plano id + lista de parcelas (somente leitura). Duplo clique não duplica.

### C. Atendimento / executar (RF-E6-13..15, RF-E5-08, RF-E5-16)

Substituir `PlanPlaceholder`: lista itens `PLANNED`/`SCHEDULED` do plano `ACTIVE` do paciente; checkbox + valor; Executar pede texto de evolução (pode prefixar template com nome do procedimento) → `POST .../execute`. Item `EXECUTED` riscado. ASB vê o plano (`quotes.read`? **não** — ASB sem quotes). Corte: painel plano no atendimento exige `quotes.read` **ou** `clinical_records.read`? Dentista tem os dois. ASB tem só clínico — **mostra plano? ** Não (sem `quotes.read`); ASB continua anexando sem ver preços. Recepção não entra na rota de atendimento.

### D. Timeline (US-5.5 parcial)

`GET /patients/:id/timeline` fonte `QUOTE`: treatments_public lista orçamentos do paciente (id, number, status, totalCents, decidedAt) se caller tem `quotes.read`; senão seção vazia como hoje.

---

## Blocos de entrega

### Bloco 1 — Backend: fundação (DDL, RLS, counters, billing port vazio)

- [x] Migração quote/plan/item + counter + fatia billing + RLS + purpose `QUOTE`
- [x] Módulos `treatments/` + `billing/` + `*_public.ts` (ensure/createReceivable stub testável)
- [x] `splitInstallments(total, n, downPayment)` + teste de propriedade (fast-check ou tabela de casos + 100 pares aleatórios)
- [x] Seed categoria “Procedimentos” + backfill não se aplica a quotes
- [x] Alinhar docs/07 (number por tenant; status do item) + docs/08 esqueleto §2.6 / público quotes
- [x] `test:rls` nas novas tabelas

### Bloco 2 — Backend: CRUD orçamento (preço, dente, desconto, máquina DRAFT)

- [x] `GET|POST|PATCH /quotes` + items; totais no servidor
- [x] Copiar `unit_price_cents` do catálogo; mudança posterior de preço **não** altera item existente (teste)
- [x] `requiresTooth` / `requiresFace` → 422
- [x] Teto de desconto por papel → 422
- [x] PATCH fora de DRAFT → `409 INVALID_STATE_TRANSITION`
- [x] Outbox `quote_created`
- [x] Smoke `test:quotes-crud`

### Bloco 3 — Backend: send, PDF, token, expire, duplicate

- [x] `POST /quotes/:id/send` (DRAFT→SENT; token; job PDF; outbox `quote_sent`)
- [x] Template `quote_sent` no enum + worker (WA se CONNECTED; senão e-mail; COPY)
- [x] `GET /quotes/:id/pdf` URL assinada 15 min; PDF sem diagnóstico
- [x] Job `expire-quotes`; decisão em expirado → 409
- [x] `POST /duplicate` com preços atuais + `duplicated_from_id`
- [x] Smoke `test:quotes-send` (fake storage + fake messaging)

### Bloco 4 — Backend: decisão atômica + público + menor

- [x] `POST /quotes/:id/decision` autenticado + `Idempotency-Key`
- [x] Aprovação total/parcial → plano + receivable + parcelas na mesma TX
- [x] Stub billing throw → rollback status e **zero** planos
- [x] Duplo POST mesma key → um plano / um título
- [x] `GET|POST /public/quotes/:token[/decision]` + rate limit; menor + guardian
- [x] Rejeição com motivo; sem plano
- [x] `GET quotes/:id` devolve receivable após aprovado
- [x] Smoke `test:quotes-decision`

### Bloco 5 — Backend: plano, execute, odontograma, produção, cancel

- [x] `GET /treatment-plans` + `/:id` (progress Should)
- [x] `clinical_records_public.createSignedNote` + `applyExecutionToothState`
- [x] `POST /treatment-items/:id/execute` + batch; CRO; note ≥10
- [x] Mapa código→condição + override `toothState`; history `PROCEDURE_EXECUTION`
- [x] `billing_public.createProductionEntry`
- [x] Cancel só não-executado; executado 422
- [x] `POST /notes` com `treatmentItemIds` → 422 hint execute
- [x] Timeline QUOTE via `treatments_public`
- [x] Smoke `test:treatments-execute` (note imutável + dente RESTORED + 1 production_entry)

### Bloco 6 — Frontend: orçamentos (operacional + public + ficha)

- [x] `/app/orcamentos` — Page → Component → Hook → Service → Data
- [x] FormDialog criar/editar DRAFT; enviar; duplicar; PDF; decisão presencial
- [x] Ficha: tab **Orçamentos** com `Can quotes.read`; timeline QUOTE preenchida
- [x] `(public)/orcamento/[token]` — mobile-first; parcial; rejeitar; menor
- [x] E2E `e2e/quotes.spec.ts` + `e2e/quote-public.spec.ts` (token seed/debug; sem Meta)

### Bloco 7 — Frontend: plano no atendimento (`clinico`)

- [x] Substituir `PlanPlaceholder` por lista do plano ACTIVE
- [x] Executar item(ns) + evolução assinada (mesmo banner imutável)
- [x] Odontograma atualiza após execute (invalidate queries)
- [x] ASB sem preços/plano; recepção sem atendimento clínico
- [x] E2E `e2e/treatment-execute.spec.ts` (dentista seed; item RES-01 → RESTORED)

---

## Endpoints-alvo (resumo)

```
GET|POST        /api/v1/public/quotes/:token[/decision]

GET|POST        /api/v1/quotes
GET|PATCH       /api/v1/quotes/:id
POST|DELETE     /api/v1/quotes/:id/items[/:itemId]
POST            /api/v1/quotes/:id/send
POST            /api/v1/quotes/:id/duplicate
POST            /api/v1/quotes/:id/decision
GET             /api/v1/quotes/:id/pdf

GET             /api/v1/treatment-plans[/:id]
POST            /api/v1/treatment-items/:id/execute
POST            /api/v1/treatment-items/execute
POST            /api/v1/treatment-items/:id/cancel
```

**Backend — aceite de código**

- [x] Preço do catálogo alterado não muda orçamento SENT/DRAFT já itemizado
- [x] `requiresTooth` sem dente 422; desconto recepção > 0% 422; dentista > 10% 422; owner ok
- [x] Send gera token + PDF storage; público 404 após used/expired
- [x] Decisão parcial: plano só com itens escolhidos; Σ parcelas + entrada = total aprovado
- [x] Idempotency: 2× POST = 1 plano + 1 título; billing throw = 0 planos
- [x] Expirado não decide; duplicate usa preço novo
- [x] Execute: note assinada + odontograma PROCEDURE_EXECUTION + production_entry; sem CRO 422; item executado não cancela
- [x] Recepção 403 em execute e em rotas clínicas; ASB 403 em quotes
- [x] Cross-tenant quote/pdf/plan → 404

**Frontend — aceite de código**

- [x] Fluxo Index → DRAFT → enviar → `/orcamento/{token}` aprova 6× com entrada → UI mostra parcelas
- [x] Atendimento: executar item do plano + evolução; odontograma reflete
- [x] Recepção monta/envia/decide e **não** vê prontuário
- [x] FINANCE/ASB sem nav Orçamentos

---

## Qualidade

**Carry-over S4:** plugar no `ci.yml` os smokes `test:clinical-crypto` / `test:anamnesis` / `test:odontogram` / `test:clinical-notes` / `test:attachments` se ainda faltarem.

- CI: lint, typecheck, arch:check, migrate, `test:rls` (novas tabelas), smokes `test:quotes-crud` / `test:quotes-send` / `test:quotes-decision` / `test:treatments-execute`
- Domínio: decisão em 1 TX; execute sem note impossível
- Integração: 2 tenants → orçamento B invisível; 3× R$ 100,00 = 3334+3333+3333 ou resíduo na primeira conforme helper documentado; 100,00 em 3× com entrada 1,00
- Resiliência: MinIO down → send 503 no PDF job mas quote já SENT (ou bloquear send até PDF? **Corte:** SENT primeiro, PDF assíncrono; GET pdf 404/`409 PDF_PENDING` até job); Redis down → HTTP decisão 200 (outbox acumula)
- E2E Playwright: quotes + quote-public + treatment-execute; **não** exigir WABA/S3 reais (fake)
- Envelope `{ data }` / `{ error }`; camelCase; UTC no banco; cents inteiros
- arch:check: `treatments` ↛ internals de `billing`/`clinical_records`; inverso sem `treatments`
- Logs: **zero** token quote plaintext / DEK / conteúdo de evolução extraído no PDF worker além do permitido (PDF **não** lê clinical_note)

Testes obrigatórios extra ([módulo treatments §11](../../modulos/06-orcamentos-tratamentos.md)): parcial; soma parcelas; idempotency; rollback billing; preço congelado; expirado; desconto; execute só com evolução; item executado não cancela; `requires_tooth`.

---

## Aceite de produto (código + demo local)

- [x] Orçamento da Maria (seed) enviado; link público aprova 2 de 3 itens; plano tem 2 itens; parcelas somam o parcial
- [x] Dra. Ana inicia atendimento e executa restauração 26 → evolução imutável + dente RESTORED + 1 `production_entry`
- [x] Recepção envia orçamento e registra decisão presencial; sem acesso ao prontuário
- [x] Não comunicar “contrato assinado” nem “elimine o papel” (PDF comercial ≠ validade jurídica)

Não há marco M4 nesta sprint. M4 foi demonstrado na S6 (baixa aparece no fluxo de caixa — demo local).

---

## Bloqueios

| Risco | Mitigação |
| --- | --- |
| Escopo explode com tela financeira | Corte #2: sem package `financeiro`; parcelas só no quote/plan |
| Ciclo treatments ↔ clinical_records | Corte #3–4: execute chama `*_public`; notes não executa item |
| Arredondamento de parcelas | Helper único + teste de propriedade no Bloco 1 **antes** da API |
| PDF com dado clínico | Renderer só recebe DTO comercial; review no PR do Bloco 3 |
| Duplo clique na aprovação | Idempotency-Key obrigatório no Bloco 4; E2E duplo submit |
| Token/PDF/MinIO | Fake storage nos smokes; Compose MinIO já S0/S4 |
| WABA `quote_sent` não aprovado na Meta | Fallback e-mail/COPY; não bloqueia aceite (igual anamnese) |
| docs/07 IDENTITY vs counter | Seguir counter por tenant (S2); alinhar doc na migração |
| Recepção vs `quotes.approve` | Corte #8 explícito; atualizar docs/08 matriz no Bloco 4 |

## Notas

- `APP_PUBLIC_URL` + token → `https://…/orcamento/{token}` (nunca PII na query).
- Seed e2e: Maria + João Pedro; Dra. Ana (CRO); procedimentos RES-01/PROF-01; quote DRAFT opcional recriado no `db:seed` (idempotente).
- Package `operacional` **não** importa `clinico`: ficha lista orçamentos via Data próprio; atendimento fica em `clinico` com Data de plan próprio.
- Package `clinico` **não** importa `operacional`.
- Carry-over pós-S5: E7 baixa/caixa; `appointment.treatment_item_id` se não couber; badge alerta S4; smokes S4 no CI se ainda abertos.
- Playwright: `workers: 1`; spec pública **não** usa fixture owner para o GET anônimo; execute usa **dentist** (CRO).
- Em dúvida de produto/DDL/contrato **não** listada acima → perguntar antes de implementar (não improvisar NFS-e, contrato jurídico, baixa de parcela ou CRM).
