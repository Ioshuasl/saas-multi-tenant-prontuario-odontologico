# Módulo — Financeiro (`billing`)

## 1. Responsabilidade

Contas a receber, contas a pagar, caixa e fluxo de caixa da clínica. Responde três perguntas que o dono faz todos os dias: **quanto entrou hoje**, **quanto vou receber** e **quem está me devendo**.

> Atenção ao vocabulário: este módulo trata do dinheiro **da clínica** (paciente → clínica). A cobrança da nossa assinatura SaaS é do módulo [`subscription`](./10-billing-saas.md).

## 2. Regras invioláveis

1. **Dinheiro é `bigint` em centavos.** Nunca `float`, nunca `number` de ponto flutuante em cálculo. Formatação só na borda.
2. **Nada de saldo materializado sem origem.** Todo valor exibido é derivado de lançamentos (`payment`, `cash_movement`); não há campo "saldo" editável.
3. **Estorno em vez de exclusão.** Pagamento errado é estornado com motivo, autor e data; o registro original permanece.
4. **Caixa fechado é imutável.** Após o fechamento, nenhum lançamento entra ou sai daquela sessão (`423 RECORD_IMMUTABLE`); ajuste é feito por lançamento na sessão seguinte.
5. **Toda escrita financeira é idempotente** (`Idempotency-Key`): duplo clique não cobra duas vezes.
6. **Regime explícito:** relatórios declaram se são por **caixa** (data do pagamento) ou por **competência** (data de vencimento/execução). Misturar os dois é o erro clássico que destrói a confiança no número.

## 3. Modelo conceitual

```
Quote (aprovado)
   └─► Receivable (título)  total_cents, origin = QUOTE|MANUAL
          ├─► Installment #1  due_date, amount_cents, status
          │      └─► Payment  paid_at, method, amount_cents, cash_session_id
          ├─► Installment #2
          └─► ...

Payable (despesa)  ──► pagamento (data, forma, categoria)

CashSession (por operador/unidade/dia)
   ├─► CashMovement  OPENING | SUPPLY | WITHDRAWAL | PAYMENT_IN | PAYMENT_OUT | CLOSING
   └─► fechamento com contagem por forma de pagamento
```

### Status de parcela

`OPEN` → `PAID` (total) · `PARTIALLY_PAID` · `OVERDUE` (job diário, após o vencimento no fuso do tenant) · `CANCELLED` (só com título cancelado)

Pagamento parcial: a parcela acumula `paid_cents`; vira `PAID` quando `paid_cents ≥ amount_cents`. Excedente entra como **crédito do paciente** (usado em parcelas futuras), nunca como valor perdido.

## 4. Formas de pagamento (MVP)

`CASH`, `DEBIT_CARD`, `CREDIT_CARD`, `PIX`, `BANK_TRANSFER`, `CHECK`, `INSURANCE`, `PATIENT_CREDIT`.

Um recebimento pode ter **múltiplas formas** (ex.: R$ 200 em Pix + R$ 100 em dinheiro) — comum na clínica e frequentemente mal suportado pelos concorrentes. Cartão de crédito registra bandeira, número de parcelas da operadora e taxa estimada (a conciliação automática com adquirente é fase 3).

## 5. Caixa diário

Abertura com valor inicial informado; todo recebimento em dinheiro/cartão/Pix na recepção vincula-se à sessão aberta do operador na unidade; sangria e suprimento são lançamentos com motivo obrigatório.

Fechamento: o sistema mostra o **esperado por forma de pagamento**, o operador informa o **contado**, e a diferença é registrada (nunca escondida) exigindo justificativa quando ≠ 0. Após o fechamento, o relatório da sessão é somente leitura.

Regras: uma sessão aberta por operador/unidade; sessão aberta há mais de 24h gera alerta; fechar exige `finance.close_cash`.

## 6. Fluxo de caixa

```
GET /api/v1/reports/cash-flow?from=2026-08-01&to=2026-08-31&basis=CASH
```

```json
{
  "data": {
    "basis": "CASH",
    "openingBalanceCents": 250000,
    "inflowsCents": 4820000,
    "outflowsCents": 2130000,
    "closingBalanceCents": 2940000,
    "byDay": [{ "date": "2026-08-01", "inflowsCents": 180000, "outflowsCents": 45000, "balanceCents": 385000 }],
    "byCategory": {
      "inflows":  [{ "category": "Procedimentos", "amountCents": 4620000 }, { "category": "Outros", "amountCents": 200000 }],
      "outflows": [{ "category": "Folha", "amountCents": 1200000 }, { "category": "Laboratório", "amountCents": 430000 },
                   { "category": "Aluguel", "amountCents": 350000 }, { "category": "Material", "amountCents": 150000 }]
    },
    "byPaymentMethod": [{ "method": "PIX", "amountCents": 2100000 }, { "method": "CREDIT_CARD", "amountCents": 1620000 }]
  }
}
```

Projeção simples (30/60/90 dias) a partir de parcelas em aberto e contas a pagar previstas — sem previsão estatística no MVP; apenas o que já está contratado.

### Categorias padrão (seed)

Entradas: Procedimentos, Convênios, Outras receitas.
Saídas: Folha e pró-labore, Laboratório/prótese, Material de consumo, Aluguel e condomínio, Energia/água/internet, Marketing, Impostos e taxas, Equipamento e manutenção, Software e serviços, Taxas de cartão, Outras despesas.

## 7. Produção e comissão

Cada item de tratamento executado gera `production_entry` (profissional, procedimento, valor executado, data). No MVP: **relatório** de produção por profissional e período, com valor executado e recebido. O cálculo automático de comissão (regra por procedimento, por profissional, sobre executado ou sobre recebido, com dedução de custo de laboratório) é fase 2 — mas o dado já está registrado desde o MVP para que o histórico exista quando a regra chegar.

## 8. Inadimplência

Job diário por tenant marca parcelas vencidas e publica `billing.installment_overdue`. O MVP entrega: relatório de inadimplentes com aging (1–30, 31–60, 61–90, 90+ dias), filtro por profissional/período, ação rápida de "cobrar por WhatsApp" (template de utilidade, envio manual) e bloqueio configurável de novo agendamento para devedor (default desligado — decisão comercial da clínica). A **régua automática** de cobrança é fase 2.

## 9. Casos de uso

| Use case | Notas |
| --- | --- |
| `CreateReceivableFromApprovedQuoteUseCase` | Chamado por `treatments` via port; gera parcelas com resíduo na primeira |
| `CreateManualReceivableUseCase` | Título sem orçamento (ex.: venda de produto) |
| `RegisterPaymentUseCase` | Idempotente; múltiplas formas; vincula à sessão de caixa; gera crédito no excedente |
| `ReversePaymentUseCase` | Exige motivo; bloqueado se o caixa está fechado |
| `CancelReceivableUseCase` | Só sem pagamentos; exige motivo |
| `OpenCashSessionUseCase` / `CloseCashSessionUseCase` | Uma sessão por operador/unidade; fechamento com contagem |
| `RegisterCashMovementUseCase` | Sangria/suprimento com motivo |
| `CreatePayableUseCase` / `PayPayableUseCase` | Recorrência simples (mensal) para aluguel/folha |
| `MarkOverdueInstallmentsJob` | Cron diário respeitando timezone |
| `GetCashFlowUseCase` | Regime caixa/competência explícito |

## 10. Recibo

Gerado no recebimento: dados da clínica, paciente, valor em número e em palavras, forma de pagamento, referência do título/parcela, data, identificação do emissor e numeração sequencial por tenant. É **recibo**, não documento fiscal — NFS-e é fase 3, e isso deve estar claro na UI para não induzir a clínica a erro fiscal.

## 11. Eventos

| Publicados | Consumidores |
| --- | --- |
| `billing.receivable_created` · `payment_registered` · `payment_reversed` · `installment_overdue` · `cash_session_closed` | `reporting`, `messaging` (recibo/cobrança), `patients` (flag de inadimplência) |

| Consumidos | Efeito |
| --- | --- |
| `treatments.quote_approved` | Cria título e parcelas (via port, na mesma transação) |
| `treatments.item_executed` | Cria `production_entry` |
| `scheduling.appointment_no_show` | Registra cobrança de falta quando a política do tenant previr (default: não) |

## 12. Endpoints

Ver [API v1 §2.7](../08-api-v1.md#27-financeiro-billing).

## 13. Testes obrigatórios

- Parcelamento com resíduo (ex.: R$ 100,00 em 3×) soma exatamente o total; resíduo na primeira parcela.
- Duplo `POST /payments` com a mesma `Idempotency-Key` registra **um** pagamento.
- Pagamento parcial mantém `PARTIALLY_PAID`; excedente gera crédito.
- Estorno de pagamento em caixa fechado é rejeitado.
- Caixa fechado não aceita novo lançamento.
- Diferença no fechamento exige justificativa e fica registrada.
- Fluxo de caixa por caixa ≠ por competência nos mesmos dados (ambos conferidos manualmente no teste).
- Parcela vencida à meia-noite do fuso do tenant vira `OVERDUE` (não no fuso do servidor).
- Nenhum cálculo monetário usa ponto flutuante (teste estático + revisão).
- Aging de inadimplência classifica corretamente nas faixas.
