# Sprint 6 — Financeiro: baixa, caixa, fluxo (E7 Must)

**Objetivo verificável:** Recepção/financeiro abre o caixa → dá baixa (parcial/total, várias formas) nas parcelas nascidas na S5 → gera recibo (não NFS-e) e o valor **aparece no fluxo de caixa**; dono vê inadimplência com aging e produção por profissional. Marco **M4** no [docs/13](../../13-roadmap-estimativas.md): orçamento aprovado gera parcelas e o recebimento entra no fluxo de caixa.

**Escopo:** Must de E7 (AR + baixa/estorno + crédito + AP + caixa + fluxo + overdue job + recibo + WA do recibo + produção). Should: título manual (RF-E7-17) e “cobrar por WhatsApp” manual (RF-E7-18). Sem inbox E8b. Sem dashboard E9 completo / export assíncrono. Sem billing SaaS (E10). Sem NFS-e / Pix cobrança / boleto / maquininha / conciliação (RF-E7-23). Sem comissão automática (RF-E7-22). Sem régua automática de cobrança (RF-E7-21).  
**Pontos (roadmap):** ~45 · Épico E7 · Marco M4 · [docs/13](../../13-roadmap-estimativas.md)

**Pré-requisito:** S5 código Must (quote → decisão atômica → `receivable`/`installment`/`production_entry` + `billing_public` + execute no atendimento). Aceite M3 (uso real S4) **não** bloqueia S6. Carry-over S5 (`appointment.treatment_item_id` → `SCHEDULED`) **não** entra como bloco de produto desta sprint.

**Estado (2026-08-17):** Sprint 6 **fechada** (código + aceite local). Próxima: [S7](./S7-inbox-relatorios-billing-saas.md) (inbox E8b + dashboard/export E9 + billing SaaS E10). Marco **M4** demonstrado em demo local (baixa PIX+CASH → fluxo CASH). M3 uso real S4 permanece pendente.

---

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — HTTP E7 no módulo `billing` + fatia de relatórios E7 (Blocos 1–5) | `backend/` |
| **Frontend** | Sim — package `financeiro` (AR, caixa, AP, fluxo, inadimplência, produção) (Blocos 6–7) | `frontend/` |

Não misturar: um bloco é **só backend** ou **só frontend**, salvo contrato (`contracts/` / `docs/08`). Cruzar BC só por `*_public.ts` + outbox (nunca import direto `billing` ↔ `treatments` / `patients` / `clinical_records` / `messaging`).

### Backend (Blocos 1–5)

- DDL + RLS `payment` (+ splits), `payable`, `cash_session`, `cash_movement`, `patient_credit_ledger`, `receipt_number_counter`
- HTTP AR: list/get receivables e installments; baixa; estorno; recibo PDF
- Caixa: abrir / current / sangria-suprimento / fechar com contagem (`423` se fechado)
- AP: categorias + CRUD payable + pagar (recorrência simples)
- Job `mark-overdue-installments` (TZ do tenant)
- Relatórios E7: `GET /reports/cash-flow` · `/overdue` · `/production` (rotas docs/08; **sem** módulo `reporting` nesta sprint)
- Recibo: job PDF + template `payment_receipt`; send WA/e-mail/COPY
- **Não inclui** telas Next.js
- **Não inclui** `POST /reports/:report/export` job (E9 → S7)
- **Não inclui** dashboard `GET /reports/dashboard`, no-shows, procedures list (S7)
- **Não inclui** Stripe / trial / limites de plano (E10)

### Frontend (Blocos 6–7)

- Package `financeiro`: Index AR + FormDialog de baixa; caixa do dia; AP; fluxo de caixa; inadimplentes; produção
- Nav: itens Financeiro se `finance.read`; Fluxo de caixa se `reports.financial`
- Copy explícita: recibo **≠** nota fiscal / NFS-e
- **Não inclui** novos endpoints de domínio — consome Blocos 1–5
- **Não inclui** inbox; dashboard E9; tela de comissão
- **Não inclui** package `clinico` / `operacional` importando `financeiro` (ficha pode listar débitos via Data próprio no Bloco 6 se `finance.read`)

---

## Estado atual do código (herança S0–S5)

Usar; **não** reimplementar.

| Já existe | Onde | Uso na S6 |
| --- | --- | --- |
| `receivable` + `installment` (OPEN, `paid_cents`, totais) | billing S5 | Listar AR; alvo da baixa |
| `createReceivableFromApprovedQuote` (sync na TX da decisão) | `billing_public` | Não duplicar; S6 **não** reage a `quote_approved` por outbox |
| `splitInstallments` + teste de propriedade | `helpers/split_installments.helper.ts` | Título manual (Should) reusa o helper |
| `production_entry` na execute | S5 `createProductionEntry` | Relatório de produção (leitura) |
| Categoria seed “Procedimentos” (`REVENUE`) | signup/`db:seed` | Completar seed de categorias E7 |
| `Idempotency-Key` em appointment / quote decision | scheduling + treatments | Mesmo contrato HTTP na baixa / estorno / caixa / pay AP |
| Outbox + worker + BullMQ | S3 | PDF recibo, `payment_registered`, overdue, WA |
| ObjectStorage presign PUT/GET | S4 | PDF do recibo no bucket |
| Send-link COPY/WA/e-mail | S4/S5 | Copiar padrão para `POST /payments/:id/send-receipt` |
| Templates messaging | E8a + `quote_sent` | Acrescentar `payment_receipt` + `payment_overdue` (utility; **sem** diagnóstico) |
| Permissões `finance.*` / `reports.financial` | identity S1 | Só **passar a usar**; DENTIST sem `finance.*`; ASB sem financeiro |
| Package `financeiro` (AR/caixa/AP/fluxo/inadimplência/produção) | frontend S6 | Preenchido; não criar package novo |
| Money = `bigint` cents | docs/07 | Todo cálculo S6 no mesmo helper-style; **proibido** float |
| E2E Playwright workers=1 | `e2e/` | Specs: payments + cash-session + cash-flow (M4) |
| Aceite HTTP reutilizável | `backend/tests/` | Scripts por módulo/função + `Invoke-Acceptance.ps1` |

**Entregar nesta sprint:** HTTP E7 no `billing`; tabelas payment/caixa/AP/crédito + RLS; baixa idempotente + estorno; caixa imutável; overdue job; recibo; relatórios cash-flow/overdue/production; UI `financeiro`.

**Pós-código (ainda aberto, não é aceite S6):** M3 uso real S4; inbox/dashboard/E10 (S7); `appointment.treatment_item_id` → `SCHEDULED` (carry-over S5); RF-E7-19 bloqueio de agenda (Could — port `patientHasOverdue` entregue, default desligado).

**Alinhar docs/07:** `payment.receipt_number` **não** usar `IDENTITY` global — counter por tenant (lição S2 `patient_code` / S5 `quote.number`). `installment.status` inclui `PARTIALLY_PAID` (módulo §3; DDL §7 hoje omite). Formas de pagamento = enum do módulo (não o `OTHER` genérico do DDL). Splits de um recebimento = tabela `payment_split` (DDL hoje tem `method` único em `payment`). Crédito = `patient_credit_ledger` (não saldo editável). `cash_movement.kind` = vocabulário do módulo.

---

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E7](../../requisitos/funcionais/07-financeiro.md) | Must RF-E7-01..16, 20; Should 17–18; Could 19 |
| [Módulo billing](../../modulos/07-financeiro.md) | Agregados, caixa, testes §13; port já usado na S5 |
| [API v1 §2.7 + §2.9 fatia + matriz](../../08-api-v1.md) | Contratos HTTP; preencher payloads §3.x billing |
| [Modelo §7](../../07-modelo-de-dados.md) | DDL payment/payable/caixa; alinhar cortes desta sprint |
| [Frontend §4.5 + rotas](../../09-frontend.md) | AR, baixa modal, caixa, fluxo competência/caixa |
| [Pastas](../../16-estrutura-de-pastas.md) | `billing/`, `financeiro/`, `*_public.ts`, jobs |
| [Identidade — matriz](../../modulos/01-identidade-acesso.md) | `finance.read/write/close_cash`; `reports.financial` |
| [Qualidade §2.5](../../12-qualidade-testes.md) | Propriedade: dinheiro em cents; soma parcelas |
| [Messaging templates](../../modulos/08-whatsapp-comunicacao.md) | `payment_receipt` / `payment_overdue` |
| [Filas](../../11-infra-devops.md) | Job `mark-overdue-installments` |
| [S5](./S5-orcamentos-tratamentos.md) | Título/parcelas/produção já persistidos; sem HTTP E7 |
| [Pacientes](../../modulos/03-pacientes-crm.md) | Flag inadimplência via evento (visível a papéis financeiros) |

---

## Decisões de corte (fechadas no planejamento)

1. **Must E7 nesta sprint:** RF-E7-01..16, 20. Should: RF-E7-17 (título manual — **entra**, barato, reusa `splitInstallments`). RF-E7-18 (cobrar WA na lista de inadimplentes — envio **manual** de `payment_overdue`). Se estourar tempo, **último** a escorregar = RF-E7-18 e RF-E7-19 (bloqueio de agenda para devedor, Could, default desligado) — só com reclassificação explícita neste checklist. Projeção 30/60/90 no cash-flow (módulo §6) é Should; se escorregar, o GET ainda devolve realizado do período.
2. **Relatórios E9 (dashboard, no-shows, procedures, export job)** → **S7**. S6 entrega **somente** os três GETs que o Must E7 exige, nos paths já documentados em docs/08: `/reports/cash-flow`, `/reports/overdue`, `/reports/production`. **Não** criar módulo `reporting/` nesta sprint: as rotas são registradas em `billing.module.ts`. `POST /reports/:report/export` (CSV/XLSX assíncrono) fica na S7. UI de fluxo pode oferecer CSV **síncrono** do payload já carregado (opcional, não bloqueia M4).
3. **Título continua nascendo na S5:** `treatments.quote_approved` **não** ganha consumer outbox em billing. O port síncrono já cria o título. S6 só **lê** e **baixa**. `billing` **não** importa `treatments`. `treatments` **não** importa internals de billing (já vale). `arch:check` deve falhar se o ciclo aparecer.
4. **Baixa síncrona na TX:** `RegisterPaymentAction` em `uow.run`: payment + splits + atualiza `installment.paid_cents`/status + crédito se excedente + `cash_movement PAYMENT_IN` se houver sessão + outbox `payment_registered` + job recibo. Falha em qualquer passo → rollback (zero pagamento). Recibo PDF e WA **não** são críticos na TX (job/outbox após commit, igual PDF do orçamento).
5. **Idempotência da baixa (e irmãos):** header `Idempotency-Key` **obrigatório** em `POST .../payments`, `POST .../reverse`, `POST /cash-sessions`, `POST .../close`, `POST .../pay` (AP). Mesma chave + mesmo body → resposta original. Mesma chave + body diferente → `409 IDEMPOTENCY_KEY_REUSED`. Persistência: tabela `idempotency_record` do módulo billing **ou** unique parcial em `payment.idempotency_key` (padrão quote/appointment). Duplo POST = **um** pagamento e **um** recibo.
6. **Múltiplas formas (RF-E7-03):** um recebimento = 1 `payment` (cabeçalho: total, recibo, sessão, ator) + N `payment_split` (`method`, `amount_cents`, `card_brand?`, `installmentsQty?`). `Σ split.amount_cents = payment.amount_cents`. UI: linhas +/remover no FormDialog. Um split `PATIENT_CREDIT` consome o ledger (FIFO, mais antigo primeiro).
7. **Crédito do paciente (RF-E7-04):** tabela `patient_credit_ledger` (lançamentos com sinal; **proibido** campo saldo editável). Excedente (`pago − saldo da parcela`) gera `CREDIT`. Uso em baixa futura: split `PATIENT_CREDIT` gera `DEBIT`. Estorno do pagamento que gerou crédito estorna o crédito (`REVERSE`). Saldo exibido = `SUM(amount_cents)` do paciente. Não aplicar crédito automaticamente — o operador escolhe a forma.
8. **Parcela parcial:** `paid_cents` acumula. `paid_cents > 0` e `< amount_cents` → `PARTIALLY_PAID`. `paid_cents ≥ amount_cents` → `PAID` (excedente não fica na parcela; vai ao ledger). Título: todos PAID → `PAID`; algum pago e algum aberto → `PARTIALLY_PAID`. Alinhar enum Prisma (`INSTALLMENT_STATUSES` hoje sem `PARTIALLY_PAID`).
9. **Estorno (RF-E7-05/06):** `POST /payments/:id/reverse` com `reason` ≥10. Pagamento original permanece (`reversed_at`, `reversal_reason`, `reversed_by`). Não DELETE. Se `cash_session` vinculada estiver `CLOSED` → `423 RECORD_IMMUTABLE`. Sem sessão (ex. transferência lançada sem caixa — corte #11) → estorno permitido com motivo. Estorno reabre parcela (`OPEN` ou `PARTIALLY_PAID`) e reverte crédito gerado por aquele payment.
10. **Caixa obrigatório vs opcional:** uma sessão `OPEN` por `(tenant, unit, opened_by)` (índice único já no DDL). `POST /payments` com qualquer split `CASH` **exige** sessão aberta do ator na `unitId` do título → senão `422 CASH_SESSION_REQUIRED`. Demais formas: se houver sessão aberta do ator na unidade, vincula; se não houver, grava payment sem `cash_session_id` (Pix/transferência “pelo financeiro” sem caixa da recepção). Sangria/suprimento só com sessão OPEN. Fechar exige `finance.close_cash`. Sessão >24h: campo/alerta no `GET current` (não auto-fecha).
11. **Fechamento (RF-E7-08/09):** body com `countedByMethod[]` (`method` + `countedCents`). Servidor calcula `expectedByMethod` a partir de `PAYMENT_IN`/`OUT`/`SUPPLY`/`WITHDRAWAL` + `openingCents`. `differenceCents = counted − expected` (total e por forma). Diferença ≠ 0 sem `differenceReason` ≥10 → `422`. Após `CLOSED`: qualquer movement/payment tentando usar essa sessão → `423`. Ajuste = lançamento na **próxima** sessão.
12. **Aging (RF-E7-12 / US-7.5):** faixas **1–15, 16–30, 31–60, 60+** dias (RF e jornada). O módulo §8 lista 1–30/31–60/61–90/90+ — **desvio**: seguir RF/US e alinhar o módulo no PR do Bloco 5. Dias = `today(tenant TZ) − due_date` para status `OVERDUE` (e `OPEN` já vencido se o job ainda não rodou: o GET overdue trata como overdue para não depender do cron na demo).
13. **Overdue job (RF-E7-13):** cron diário por tenant TZ (`mark-overdue-installments`, fila `billing` — docs/11). `OPEN`/`PARTIALLY_PAID` com `due_date < hoje TZ` → `OVERDUE`; outbox `billing.installment_overdue`. **Não** dispara WA automático (régua = fase 2). Consumer `patients`: flag `has_overdue` (ou equivalente) **somente** para papéis com `finance.read` na API de paciente/timeline — dentista/ASB não veem valor em atraso.
14. **Recibo (RF-E7-15/16):** numeração `receipt_number_counter` por tenant (não IDENTITY global). Conteúdo: clínica (nome, CNPJ, endereço), paciente (nome + código), valor em número **e** por extenso (pt-BR, cents), formas, referência título/parcela, data, emissor, número. **Zero** texto clínico / dente / diagnóstico. Lib Node (pdfkit ou a mesma do quote) — **sem** Chromium. Storage `tenants/{tenantId}/receipts/{paymentId}.pdf`. `GET /payments/:id/receipt` → URL assinada 15 min (`finance.read`). UI + PDF: faixa “Este documento **não** é nota fiscal”. Send: `POST /payments/:id/send-receipt` `{ channel }` — template `payment_receipt` (primeiro nome, clínica, valor, número do recibo). Clínica sem WA não bloqueia (COPY/e-mail).
15. **AP (RF-E7-07):** `payable` com categoria `EXPENSE`, `due_date`, `amount_cents`. Recorrência `{ frequency: MONTHLY, until?: date }` no jsonb. **Corte:** não gerar 12 meses à frente; ao **pagar** um payable recorrente vigente, cria o próximo `OPEN` com `due_date + 1 mês civil` se `until` ainda não passou. `POST /payables/:id/pay` idempotente; gera `cash_movement PAYMENT_OUT` se sessão aberta (mesmo critério do #10 para `CASH`).
16. **Categorias:** seed no signup/seed além de “Procedimentos”: Entradas — Convênios, Outras receitas. Saídas — Folha e pró-labore, Laboratório/prótese, Material de consumo, Aluguel e condomínio, Energia/água/internet, Marketing, Impostos e taxas, Equipamento e manutenção, Software e serviços, Taxas de cartão, Outras despesas. `GET|POST /financial-categories`. Sem árvore obrigatória no MVP (`parent_id` nullable, UI flat).
17. **Formas de pagamento (MVP):** `CASH`, `DEBIT_CARD`, `CREDIT_CARD`, `PIX`, `BANK_TRANSFER`, `CHECK`, `INSURANCE`, `PATIENT_CREDIT`. Alinhar docs/07 (hoje `DEBIT|CREDIT|TRANSFER|OTHER`). Cartão: `cardBrand` + `installmentsQty` opcionais; **sem** taxa/conciliação de adquirente.
18. **Produção (RF-E7-14):** só leitura de `production_entry` já gravado na S5. `GET /reports/production?from&to&professionalId`. OWNER/FINANCE: qualquer profissional. DENTIST: **somente** o próprio (`reports.read` sem `reports.financial`) — 403 se `professionalId` de outro. Sem cálculo de comissão. `executedCents` no período; `receivedCents` = soma de payments (não estornados) das parcelas cujos títulos ligam ao plano daqueles itens **se** a query for barata; se acoplar demais, **corte:** relatório MVP = executado + data + procedimento + paciente código; “recebido” vira Should no mesmo GET (`receivedCents` por profissional) — preferir entregar os dois no Bloco 5.
19. **M4:** cenário de aceite = parcela da Maria (seed S5) + baixa PIX (ou PIX+CASH) **com** caixa aberto → linha de inflow no `GET /reports/cash-flow?basis=CASH` no dia do pagamento. `basis=ACCRUAL` no mesmo dataset (parcela futura ainda OPEN) **difere** do CASH — teste obrigatório.
20. **Regime (RF-E7-11):** `basis=CASH` usa `payment.received_at` (não estornados) e `payable.paid_at`. `basis=ACCRUAL` usa `installment.due_date` (competência a receber) e `payable.due_date` (a pagar). `openingBalanceCents` no período = saldo CASH acumulado **antes** de `from` (pagamentos − pagamentos AP), inteiro. Sem misturar os dois no mesmo total.
21. **Eventos:** billing publica `payment_registered`, `payment_reversed`, `installment_overdue`, `cash_session_opened`, `cash_session_closed`, `payable_paid`, `receivable_cancelled`. `receivable_created` já pode existir na S5 (emit-only). Messaging consome `payment_registered` → job recibo/send se canal pedido; `installment_overdue` **não** envia sozinho (RF-E7-18 é POST explícito).
22. **Pasta / rotas FE:** `backend/src/modules/billing/` ganha routes (hoje `buildBillingRouter()` retorna `null`). FE: `/app/financeiro/receber`, `/app/financeiro/caixa`, `/app/financeiro/pagar`, `/app/financeiro/fluxo`, `/app/financeiro/inadimplencia`, `/app/financeiro/producao` (ou Index com tabs — preferir rotas, mais simples para permissão). Nav: Receber/Caixa/Pagar se `finance.read`; Fluxo/Inadimplência se `reports.financial` (recepção **não** vê fluxo — tem `reports.read` mas não `reports.financial`; corte: inadimplência operacional via lista `GET /installments?status=OVERDUE` com `finance.read` em `/app/financeiro/receber` filtro “em atraso”; página `/inadimplencia` com aging consolidado = `reports.financial`).
23. **Money / logs:** centavos `bigint`; logs **sem** dump de PDF; recibo number ok no audit; **sem** CPF completo no payload de send. Token/WA payload só primeiro nome + valor + nº recibo.
24. **Papéis:** RECEPTION baixa + fecha caixa; **não** vê prontuário (já S4/S5) e **não** vê cash-flow. FINANCE: AR/AP/caixa/relatórios financeiros; `patients.read` sem clínico. DENTIST: produção própria; 403 em payments/caixa/cash-flow. ASB: 403 em todas as rotas `finance*` / reports financeiros. OWNER: tudo.
25. **Cancelar título:** `POST /receivables/:id/cancel` `{ reason }` só se **zero** payments não estornados; senão `422 RECEIVABLE_HAS_PAYMENTS`. Parcelas → `CANCELLED`. Não entra estorno em cascata.
26. **Cobrança de falta (`appointment_no_show`)** → **não** nesta sprint (módulo menciona; default já é não cobrar).
27. **RF-E7-19 (Could):** se couber no Bloco 4, flag de clínica `blockSchedulingIfOverdue` default `false`; `scheduling` consulta `billing_public.patientHasOverdue` no create. Se não couber, fica explícito neste checklist como escorregado — **não** improvisar bloqueio ligado por padrão.

---

## Fora desta sprint

- Inbox WhatsApp / SSE (S7 / E8b)
- Dashboard E9, no-shows, procedures report, export job CSV/XLSX (S7)
- Billing SaaS / Stripe / trial (E10)
- Contratos jurídicos do orçamento (RF-E6-19)
- CRM de orçamentos recusados (RF-E6-20)
- Régua automática de cobrança (RF-E7-21)
- Comissionamento automático (RF-E7-22)
- NFS-e, Pix cobrança, boleto, maquininha, conciliação (RF-E7-23)
- `appointment.treatment_item_id` → `SCHEDULED` (carry-over S5, não é E7)
- Badge alerta na agenda (carry-over S4)
- Exportação LGPD (S8)
- Cobrança automática de no-show

---

## Arquitetura técnica

```
HTTP autenticado (finance.* / reports.financial)
  → authenticate → tenantContext → authorize
  → billing (receivables / payments / cash / payables / reports E7)

RegisterPayment
  → Service → Action → uow.run
       payment + payment_split
       installment.paid_cents / status
       patient_credit_ledger se excedente ou PATIENT_CREDIT
       cash_movement PAYMENT_IN (se sessão)
       outbox payment_registered
  → job generate-receipt-pdf (após commit)

ReversePayment
  → Action → uow.run
       se sessão CLOSED → 423
       marca reversed_*; reabre parcela; estorna crédito
       outbox payment_reversed

CloseCashSession
  → expected por forma vs counted; difference exige motivo
  → status CLOSED → 423 daí em diante

MarkOverdue
  → cron TZ tenant → OVERDUE + outbox installment_overdue
  → patients_public / subscriber marca flag (sem valor na UI clínica)

PDF recibo
  → job generate-receipt-pdf → PUT storage → GET signed URL
```

### Pastas-alvo (docs/16 + snake do repo)

```
backend/src/
  modules/billing/
    models/                    # Receivable, Installment, Payment, CashSession, Payable, CreditLedger
    jobs/   mark_overdue_installments.job.ts
            generate_receipt_pdf.job.ts
    helpers/  money already split_installments; + receipt_amount_in_words.helper.ts
    billing_public.ts          # + patientHasOverdue, getProductionForProfessional? (mínimo)
    billing.module.ts          # passa a registrar rotas E7 + /reports fatia
  modules/patients/
    subscribers/               # installment_overdue → flag (sem import profundo de billing)
  modules/messaging/
    enum/template/template.enum.ts   # + payment_receipt, payment_overdue
  modules/scheduling/          # só se RF-E7-19 couber: billing_public.patientHasOverdue

frontend/src/
  app/(app)/app/financeiro/receber/page.tsx
  app/(app)/app/financeiro/caixa/page.tsx
  app/(app)/app/financeiro/pagar/page.tsx
  app/(app)/app/financeiro/fluxo/page.tsx
  app/(app)/app/financeiro/inadimplencia/page.tsx
  app/(app)/app/financeiro/producao/page.tsx
  packages/financeiro/…/Receivable
  packages/financeiro/…/Payment
  packages/financeiro/…/CashSession
  packages/financeiro/…/Payable
  packages/financeiro/…/CashFlow
  packages/financeiro/…/Overdue
  packages/financeiro/…/Production
```

Action **somente** quando há efeito além do repositório (outbox, caixa, crédito, PDF). `GET` list de receivables: `Service → Repository`.

### RLS / ator

- Todas as tabelas E7 novas: `tenant_id` + `platform.enable_tenant_rls`.
- Payment/caixa de outro tenant → `404`.
- DENTIST / ASB → `403` em escrita financeira e em cash-flow.
- FINANCE sem rotas clínicas (já 403).
- Sem ator público nesta sprint (recibo não tem link token).

---

## Contratos HTTP (S6) — payloads

Envelope `{ data }` / `{ error }`; camelCase; datas ISO com offset; UUID v7; dinheiro `*Cents` inteiro. Atualizar `docs/08` no mesmo PR do Bloco correspondente.

### Autenticado (`finance.read` / `.write` / `.close_cash`)

```
GET    /api/v1/receivables                      ?patientId=&status=&from=&to=&cursor=&limit=
POST   /api/v1/receivables                      título manual (quotes não)
GET    /api/v1/receivables/:id                  inclui installments[] + payments[]
POST   /api/v1/receivables/:id/cancel           { reason }  só sem pagamentos

GET    /api/v1/installments                     ?patientId=&status=&dueFrom=&dueTo=&cursor=&limit=
POST   /api/v1/installments/:id/payments        Idempotency-Key
POST   /api/v1/payments/:id/reverse             Idempotency-Key { reason }
GET    /api/v1/payments/:id/receipt
POST   /api/v1/payments/:id/send-receipt        { channel: WHATSAPP|EMAIL|COPY }

GET    /api/v1/payables                         ?status=&dueFrom=&dueTo=
POST   /api/v1/payables
PATCH  /api/v1/payables/:id                     só OPEN
POST   /api/v1/payables/:id/pay                 Idempotency-Key

GET    /api/v1/cash-sessions/current            ?unitId=
POST   /api/v1/cash-sessions                    Idempotency-Key  abrir
GET    /api/v1/cash-sessions/:id
POST   /api/v1/cash-sessions/:id/close          Idempotency-Key  { countedByMethod, differenceReason? }
POST   /api/v1/cash-sessions/:id/movements      { kind: SUPPLY|WITHDRAWAL, amountCents, method, reason }

GET    /api/v1/financial-categories             ?kind=REVENUE|EXPENSE
POST   /api/v1/financial-categories

GET    /api/v1/patients/:id/credit              saldo derivado (finance.read)

GET    /api/v1/reports/cash-flow                ?from=&to=&basis=CASH|ACCRUAL&unitId=   reports.financial
GET    /api/v1/reports/overdue                  ?unitId=&professionalId=                 reports.financial
GET    /api/v1/reports/production               ?from=&to=&professionalId=               reports.read (escopo por papel)
```

**POST payment:**

```json
{
  "amountCents": 30000,
  "receivedAt": null,
  "notes": null,
  "splits": [
    { "method": "PIX", "amountCents": 20000 },
    { "method": "CASH", "amountCents": 10000 }
  ]
}
```

`amountCents` deve igualar `Σ splits`. Pode ser menor que o saldo da parcela (parcial) ou maior (excedente → crédito). Resposta: `{ paymentId, receiptNumber, installmentStatus, creditCentsGranted, cashSessionId }`.

**POST reverse:** `{ "reason": "lançado na parcela errada" }` (≥10).

**POST cash-sessions:** `{ "unitId", "openingCents", "openingByMethod"? }`.

**POST close:**

```json
{
  "countedByMethod": [
    { "method": "CASH", "countedCents": 150000 },
    { "method": "PIX", "countedCents": 80000 }
  ],
  "differenceReason": null
}
```

**GET cash-flow:** shape do [módulo §6](../../modulos/07-financeiro.md) (`basis`, `openingBalanceCents`, `inflowsCents`, `outflowsCents`, `closingBalanceCents`, `byDay`, `byCategory`, `byPaymentMethod`). Query `basis` obrigatória.

**GET overdue:** `{ buckets: [{ band: "1_15"|"16_30"|"31_60"|"60_plus", count, totalCents, items: [...] }] }`.

**GET production:** `{ items: [{ professionalId, professionalName, executedCents, receivedCents, proceduresCount }], rows: [...] }`.

Erros estáveis: `403 FORBIDDEN`, `404 NOT_FOUND`, `409 IDEMPOTENCY_KEY_REUSED`, `422 BUSINESS_RULE_VIOLATION` / `CASH_SESSION_REQUIRED` / `DISCOUNT…` (não se aplica) / `RECEIVABLE_HAS_PAYMENTS`, `423 RECORD_IMMUTABLE` (caixa fechado / estorno em sessão fechada).

---

## DDL (migração S6) + RLS

Todas com `tenant_id` + `platform.enable_tenant_rls`.

| Tabela / alteração | Notas |
| --- | --- |
| `receipt_number_counter` | `(tenant_id, last_number)` — **não** IDENTITY global |
| `payment` | total, sessão opcional, `received_by`, `reversed_at`, `receipt_number` (counter), `idempotency_key` unique parcial |
| `payment_split` | `method` enum módulo; `amount_cents`; `card_brand`; `installments_qty` |
| `patient_credit_ledger` | `patient_id`, `amount_cents` com sinal, `kind` `CREDIT\|DEBIT\|REVERSE`, `payment_id` |
| `payable` | categoria EXPENSE; `recurrence` jsonb; status `OPEN\|PAID\|OVERDUE\|CANCELLED` |
| `cash_session` | unique parcial OPEN por `(tenant, unit, opened_by)`; contagem / expected / difference |
| `cash_movement` | `OPENING` não precisa se opening está na sessão; kinds `SUPPLY\|WITHDRAWAL\|PAYMENT_IN\|PAYMENT_OUT` |
| `installment.status` | + `PARTIALLY_PAID` (migração / check) |
| `financial_category` | seed categorias E7 (idempotente) |
| `patient` | flag `has_overdue` boolean default false **ou** derivado só no GET — preferir coluna atualizada pelo subscriber (simples de filtrar) |
| Seed | parcelas OPEN da Maria (orçamento S5); 1 payable aluguel OPEN; categorias |

`enable_tenant_rls` + `test:rls` nas tabelas novas (payment cross-tenant = 0 rows / 404).

---

## Jobs e eventos

| Fila | Job | Idempotência | Quando |
| --- | --- | --- | --- |
| `platform` | `dispatch-outbox` | (já S3) | contínuo |
| `billing` | `mark-overdue-installments` | por dia/tenant | cron diário TZ (docs/11: 03:00 + TZ) |
| `platform` ou `billing` | `generate-receipt-pdf` | `paymentId` | após payment commit |
| `messaging` | send template (já S3) | | `payment_registered` se send pedido; RF-E7-18 manual |

Eventos de domínio (outbox `name`):

| Publicado por | Nome | Consumidor S6 |
| --- | --- | --- |
| billing | `billing.payment_registered` | messaging (recibo se canal); reporting emit-only |
| billing | `billing.payment_reversed` | patients (recalcula flag se quitou) |
| billing | `billing.installment_overdue` | patients (flag); **não** WA auto |
| billing | `billing.cash_session_closed` | nenhum |
| billing | `billing.payable_paid` | nenhum |
| billing | `billing.receivable_created` | já S5 emit-only |

---

## Fluxos (domínio + UX)

### A. Baixa no contas a receber (RF-E7-01..06, 15–16, 20)

**Backend:** list parcelas → POST payment (splits + idempotency) → recibo job → send opcional.

**Frontend financeiro:** Index `/app/financeiro/receber` (filtros: vencendo hoje, em atraso, paciente). FormDialog baixa **sem sair da lista**; linhas de forma de pagamento; mostra crédito disponível do paciente. Sucesso: nº recibo + toast “recibo não é NFS-e”. Download PDF quando storage pronto (polling curto). Duplo clique não duplica (uuid no cliente).

### B. Caixa do dia (RF-E7-08..10)

**Frontend:** `/app/financeiro/caixa` — abrir (valor inicial) → esperado por forma ao vivo → sangria/suprimento com motivo → fechar com contagem. Divergência destacada (a11y, não só cor). Sessão fechada = somente leitura. Alerta se aberta >24h.

### C. Contas a pagar (RF-E7-07)

Index `/app/financeiro/pagar` + FormDialog criar (categoria, vencimento, recorrência mensal opcional) + pagar.

### D. Fluxo / inadimplência / produção (RF-E7-11, 12, 14) — M4

Dono: `/app/financeiro/fluxo` toggle `CASH` \| `ACCRUAL`. `/app/financeiro/inadimplencia` aging 4 faixas + ação Should “Cobrar no WhatsApp”. `/app/financeiro/producao` período + profissional. Dentista: só produção própria (nav Produção se `reports.read` e rota scoped).

### E. Ficha do paciente (opcional Bloco 6)

Se `finance.read`: bloco “Financeiro” com saldo em aberto + crédito (sem importar `clinico`). Sem `finance.read`: oculto (dentista não vê dívidas).

---

## Blocos de entrega

### Bloco 1 — Backend: fundação (DDL, RLS, counters, enums)

- [x] Migração payment/split/credit/payable/cash_session/cash_movement + receipt counter + RLS + `PARTIALLY_PAID`
- [x] Enums método / movement / credit kind / payable status
- [x] Seed categorias E7 (signup + `db:seed`)
- [x] `billing.module.ts` deixa de retornar `null` (router vazio autenticado ok)
- [x] Alinhar docs/07 (counter, splits, crédito, métodos, PARTIALLY_PAID) + docs/08 esqueleto §2.7 / §3 billing
- [x] `test:rls` nas novas tabelas
- [x] Helper valor por extenso (pt-BR) + testes de tabela (ex.: 180000 → “mil e oitocentos reais”)

### Bloco 2 — Backend: AR, baixa, crédito, estorno, título manual

- [x] `GET` receivables / installments / receivable:id
- [x] `POST /installments/:id/payments` + splits; parcial / total / excedente
- [x] Stub/sessão: CASH sem caixa → 422
- [x] Duplo POST mesma key → um payment / um recibo
- [x] `POST /payments/:id/reverse` + 423 se caixa fechado
- [x] `POST /receivables` manual (Should) reusa `splitInstallments`
- [x] `POST /receivables/:id/cancel` só sem pagamentos
- [x] `GET /patients/:id/credit`
- [x] Smoke `test:billing-payments`

### Bloco 3 — Backend: caixa

- [x] `POST /cash-sessions` + `GET current` (uma OPEN por operador/unidade)
- [x] Movements SUPPLY/WITHDRAWAL com motivo ≥10
- [x] `POST close` com expected vs counted; diferença exige justificativa
- [x] Caixa CLOSED → 423 em movement e em payment vinculado
- [x] Alerta `openForHours` > 24 no current
- [x] Smoke `test:billing-cash`

### Bloco 4 — Backend: AP, categorias, overdue job, flag paciente

- [x] `GET|POST /financial-categories`
- [x] CRUD payable + `POST pay` + spawn próximo se MONTHLY
- [x] Job `mark-overdue-installments` (TZ tenant); decisão/listagem trata vencido
- [x] Subscriber/patients flag `has_overdue`
- [x] RF-E7-19 só se couber (`billing_public.patientHasOverdue`) — port entregue; bloqueio de agenda **escorregado** (Could, default desligado)
- [x] Smoke `test:billing-payables`

### Bloco 5 — Backend: recibo PDF, send, relatórios E7

- [x] Job `generate-receipt-pdf`; `GET /payments/:id/receipt` URL 15 min; PDF sem clínico + disclaimer NFS-e
- [x] Template `payment_receipt` + `POST send-receipt` (WA se CONNECTED; senão e-mail; COPY)
- [x] `GET /reports/cash-flow` CASH ≠ ACCRUAL no mesmo fixture
- [x] `GET /reports/overdue` faixas RF
- [x] `GET /reports/production` + escopo dentista
- [x] RF-E7-18: `POST /installments/:id/charge` ou send template na lista (manual)
- [x] Smoke `test:billing-reports` (+ pdf fake storage)

### Bloco 6 — Frontend: AR + baixa + recibo (+ débito na ficha)

- [x] `/app/financeiro/receber` — Page → Component → Hook → Service → Data
- [x] FormDialog baixa (splits, crédito, Idempotency-Key); PDF; send COPY
- [x] Ficha: bloco financeiro se `finance.read`
- [x] Nav Receber/Caixa/Pagar se `finance.read`; FINANCE/ASB/DENTIST conforme matriz
- [x] E2E `e2e/billing-payments.spec.ts` (Maria; PIX+CASH; recibo visível; sem Meta)

### Bloco 7 — Frontend: caixa, AP, fluxo, inadimplência, produção

- [x] `/app/financeiro/caixa` abrir/fechar/sangria; 423 refletido na UI
- [x] `/app/financeiro/pagar`
- [x] `/app/financeiro/fluxo` toggle regime (OWNER/FINANCE)
- [x] `/app/financeiro/inadimplencia` aging (reports.financial) + cobrar WA Should
- [x] `/app/financeiro/producao` (dentista = próprio)
- [x] E2E `e2e/billing-cash.spec.ts` + `e2e/billing-cash-flow.spec.ts` (M4: baixa aparece no fluxo CASH)

---

## Endpoints-alvo (resumo)

```
GET|POST        /api/v1/receivables[/:id]
POST            /api/v1/receivables/:id/cancel
GET             /api/v1/installments
POST            /api/v1/installments/:id/payments
POST            /api/v1/installments/:id/charge
POST            /api/v1/payments/:id/reverse
GET             /api/v1/payments/:id/receipt
POST            /api/v1/payments/:id/send-receipt

GET|POST        /api/v1/payables
PATCH           /api/v1/payables/:id
POST            /api/v1/payables/:id/pay

GET             /api/v1/cash-sessions/current
POST            /api/v1/cash-sessions
GET             /api/v1/cash-sessions/:id
POST            /api/v1/cash-sessions/:id/close
POST            /api/v1/cash-sessions/:id/movements

GET|POST        /api/v1/financial-categories
GET             /api/v1/patients/:id/credit

GET             /api/v1/reports/cash-flow
GET             /api/v1/reports/overdue
GET             /api/v1/reports/production
```

**Backend — aceite de código**

- [x] Duplo POST payment mesma key = 1 payment + 1 receipt_number
- [x] Parcial → `PARTIALLY_PAID`; excedente → ledger; PATIENT_CREDIT consome ledger
- [x] CASH sem sessão 422; estorno com caixa CLOSED 423
- [x] Close com diferença sem motivo 422; sessão CLOSED imutável
- [x] Overdue no TZ do tenant (não UTC do servidor)
- [x] Aging classifica 1–15 / 16–30 / 31–60 / 60+
- [x] Cash-flow CASH ≠ ACCRUAL no mesmo dataset; cents inteiros; Σ splits = payment
- [x] Recibo PDF sem dente/diagnóstico; UI/PDF dizem que não é NFS-e
- [x] DENTIST 403 em payments/caixa/cash-flow; produção só própria
- [x] Recepção 403 em cash-flow; ASB 403 em finance*
- [x] Cross-tenant payment/caixa → 404
- [x] Título manual soma parcelas = total (helper)

**Frontend — aceite de código**

- [x] Fluxo Index AR → baixa 2 formas → recibo na UI → send COPY
- [x] Caixa: abrir → receber CASH → fechar com divergência exige texto
- [x] Dono: fluxo CASH mostra o recebimento do dia (M4)
- [x] FINANCE vê nav financeiro; DENTIST não vê Receber/Caixa/Fluxo; ASB sem nav financeiro
- [x] Copy “recibo ≠ NFS-e” visível no dialog de sucesso

---

## Qualidade

- CI: lint, typecheck, arch:check, migrate, `test:rls` (novas tabelas), smokes `test:billing-payments` / `test:billing-cash` / `test:billing-payables` / `test:billing-reports`
- Domínio: baixa em 1 TX; caixa fechado 423; nenhum `number` float em cálculo
- Integração: 2 tenants → payment B invisível; R$ 100,00 pago 30+70 PIX+CASH; excedente 1,00 vira crédito; 3×100,00 já coberto S5
- Resiliência: MinIO down → payment 200, GET receipt `409 PDF_PENDING` até job (corte igual orçamento); Redis down → HTTP 200 (outbox acumula)
- E2E Playwright: payments + cash + cash-flow; **não** exigir WABA/S3 reais (fake)
- Envelope `{ data }` / `{ error }`; camelCase; UTC no banco; cents inteiros
- arch:check: `billing` ↛ internals de `treatments`/`patients`/`messaging`; inverso sem internals de billing
- Logs: **zero** dump de PDF / DEK; recibo sem payload clínico

Testes obrigatórios extra ([módulo billing §13](../../modulos/07-financeiro.md)): soma parcelas; idempotency; parcial + crédito; estorno caixa fechado; caixa imutável; diferença registrada; CASH ≠ ACCRUAL; overdue no TZ; aging; estático sem float.

---

## Aceite de produto (código + demo local) — M4

- [x] Orçamento da Maria (S5) aprovado já tem parcelas; recepção abre caixa, dá baixa (ex.: PIX + dinheiro); recibo numerado; **não** se comunica “nota fiscal”
- [x] Dono abre fluxo de caixa (`basis=CASH`) no dia e vê o inflow; `ACCRUAL` no mês mostra a parcela pelo vencimento (números diferentes se pagar atrasado/antecipado)
- [x] Financeiro lança um aluguel (AP) e paga; saída aparece no fluxo
- [x] Parcela vencida (seed ou clock de teste) cai na faixa de aging correta; job não depende de WABA
- [x] Dra. Ana **não** acessa contas a receber; vê só a própria produção
- [x] Estorno depois de fechar o caixa é recusado; correção na sessão seguinte

Marco **M4** fecha com o segundo item (recebimento visível no fluxo) — **demonstrado localmente** (Playwright + smokes). Uso real em clínica-piloto **não** é M4 (M5 é S8).

---

## Bloqueios

| Risco | Mitigação |
| --- | --- |
| Escopo explode com dashboard E9 / NFS-e / comissão | Cortes #2 e “Fora desta sprint” |
| Saldo de crédito materializado e editável | Corte #7: só ledger |
| Recibo IDENTITY global | Counter por tenant (S2/S5); alinhar docs/07 no Bloco 1 |
| Aging RF ≠ módulo | Corte #12: RF/US; atualizar módulo no Bloco 5 |
| Caixa × Pix “pelo financeiro” | Corte #10: CASH exige sessão; resto opcional |
| Duplo clique na baixa | Idempotency-Key no Bloco 2; E2E duplo submit |
| PDF com dado clínico | Renderer só DTO comercial (paciente código + valores) |
| Relatório no módulo reporting inexistente | Corte #2: rotas no `billing.module` |
| WABA `payment_receipt` | Fallback e-mail/COPY; não bloqueia aceite |
| M4 ambíguo (competência vs caixa) | Aceite pede os dois regimes no mesmo dataset |

## Notas

- Seed e2e: reaproveitar Maria + Dra. Ana + parcelas OPEN; `pnpm db:seed` idempotente deve **repor** ao menos 1 parcela OPEN se a demo a consumir.
- Package `financeiro` **não** importa `operacional`/`clinico`: ficha lista débitos via Data próprio no package da ficha **ou** componente em `shared/` se for o mesmo widget — preferir Data em `operacional` chamando as rotas billing (padrão S5: operacional não importa clinico).
- Carry-over pós-S6: S7 inbox + dashboard + export + E10; RF-E7-19 bloqueio de agenda (Could); M3 S4; SCHEDULED S5.
- Playwright: `workers: 1`; payments usam **reception** (caixa + finance.write); cash-flow usa **owner** ou **finance**.
- Aceite HTTP reutilizável: `backend/tests/` (`Invoke-Acceptance.ps1`, `billing/Run-S6.ps1`); MinIO bucket `odonto-dev` via `minio-init` no Compose.
- Em dúvida de produto/DDL/contrato **não** listada acima → perguntar antes de implementar (não improvisar NFS-e, boleto, comissão, débito automático de no-show ou régua de cobrança).
