# Módulo — Orçamentos e Planos de Tratamento (`treatments`)

## 1. Responsabilidade

Transformar diagnóstico em proposta comercial, a proposta em plano de tratamento e a execução do plano em produção e receita. É a ponte entre o clínico e o financeiro — e o lugar onde a maioria das clínicas perde dinheiro por falta de acompanhamento.

## 2. Agregados

| Agregado | Responsabilidade | Invariantes |
| --- | --- | --- |
| `Quote` | Proposta com itens, descontos e validade | Total = Σ itens − desconto; editável só em `DRAFT`; desconto ≤ limite do papel |
| `TreatmentPlan` | Itens aprovados a executar | Criado somente por aprovação de orçamento; conclui quando todos os itens estão `EXECUTED`/`CANCELLED` |

## 3. Ciclo de vida

```
Quote:  DRAFT ──► SENT ──► APPROVED | PARTIALLY_APPROVED | REJECTED | EXPIRED
                    │                    │
                    └── EXPIRED          └──► cria TreatmentPlan + Receivable

TreatmentPlan: ACTIVE ──► COMPLETED | CANCELLED
TreatmentItem: PLANNED ──► SCHEDULED ──► EXECUTED
                   └──► CANCELLED
```

## 4. Regras de negócio

1. **Preço congelado na emissão:** `quote_item` copia `unit_price_cents` do catálogo. Mudança posterior de preço nunca altera orçamento existente.
2. **Desconto com governança:** percentual ou valor, com limite por papel (`DENTIST` até 10%, `OWNER` ilimitado — configurável). Desconto acima do limite exige aprovação do Owner e fica auditado com autor e motivo.
3. **Aprovação parcial é primeira classe:** o paciente aprova itens específicos; o plano nasce só com os aprovados e o restante permanece como oportunidade (base do CRM da fase 2).
4. **Validade:** default 30 dias configurável; job diário marca `EXPIRED`. Orçamento expirado pode ser **duplicado** com preços atualizados (nunca reaberto).
5. **Aprovação é operação transacional única:** cria `TreatmentPlan`, `TreatmentItem`s e o título a receber com parcelas em uma transação; `Idempotency-Key` obrigatório para evitar plano/título duplicado por duplo clique.
6. **Invariante financeira:** `Σ parcelas + entrada = total aprovado`. O resíduo do arredondamento vai para a **primeira** parcela (regra fixa, testada por propriedade).
7. **Item com dente:** procedimento marcado como `requires_tooth` exige `tooth_code` (e face quando aplicável) no item — é o que permite ligar orçamento ao odontograma.
8. **Execução do item** só acontece via `clinical-records` (evolução assinada). Não existe "marcar como executado" sem registro clínico — isso protege a clínica em auditoria e evita cobrança sem prontuário.
9. **Cancelar item executado é proibido:** apenas itens `PLANNED`/`SCHEDULED` podem ser cancelados; item executado com cobrança indevida se resolve por estorno no financeiro.
10. **Rejeição pede motivo** (preço, prazo, vai pensar, foi para outra clínica) — insumo direto para o funil de conversão.

## 5. Fluxo de aprovação pelo paciente

```
[Clínica] cria orçamento ──► envia por WhatsApp/e-mail (template utility + link)
                                        │
                        ┌───────────────┴────────────────┐
                        ▼                                ▼
        [Paciente] abre /public/quotes/:token     [Recepção] registra decisão presencial
                        │                                │
                        ├─ seleciona itens               │
                        ├─ aceita termos (consentimento) │
                        └─ confirma ─────────────────────┘
                                        │
                                        ▼
                        Transação: TreatmentPlan + Receivable + parcelas
                                        │
                        ┌───────────────┴───────────────┐
                        ▼                               ▼
              Evento quote_approved            WhatsApp de confirmação
              (billing, reporting)             + PDF do plano
```

Token de link: uso único por decisão, expira com a validade do orçamento, sem dado clínico na URL. Menor de idade → decisão apenas pelo responsável legal cadastrado.

## 6. PDF do orçamento

Conteúdo: dados da clínica (nome, CNPJ, endereço, telefone, CRO do responsável técnico), dados do paciente, itens com dente/face quando aplicável, valores unitários e total, desconto destacado, condições de pagamento propostas, validade, campo de assinatura e data. Gerado em job assíncrono, armazenado com URL assinada, versionado por reemissão. **Sem** conteúdo diagnóstico detalhado (o orçamento circula por canais menos protegidos).

## 7. Casos de uso

| Use case | Notas |
| --- | --- |
| `CreateQuoteUseCase` | Valida procedimentos ativos, exige dente quando aplicável, calcula total |
| `UpdateQuoteUseCase` | Só em `DRAFT`; recalcula total |
| `SendQuoteUseCase` | Gera PDF + token, dispara `messaging`, muda para `SENT` |
| `DecideQuoteUseCase` | Coração do módulo: aprovação total/parcial/rejeição; transação com `billing`; idempotente |
| `ExpireQuotesJob` | Cron diário por tenant (timezone) |
| `DuplicateQuoteUseCase` | Novo orçamento com preços atuais, referenciando o original |
| `ExecuteTreatmentItemUseCase` | Chamado no fluxo de evolução; atualiza odontograma e registra produção |
| `CancelTreatmentItemUseCase` | Bloqueia item executado; exige motivo |
| `GetTreatmentPlanProgressUseCase` | % concluído, valor executado x pendente, próximos itens |

## 8. Integração entre módulos (aprovação)

```ts
export class DecideQuoteUseCase {
  async execute(input: DecideQuoteInput): Promise<DecideQuoteOutput> {
    return this.uow.run(input.ctx, async () => {
      const quote = await this.quotes.findById(input.ctx, input.quoteId);
      if (!quote) throw new QuoteNotFoundError();

      if (input.decision === 'REJECTED') {
        quote.reject(input.reason, this.clock.now());
        await this.quotes.save(input.ctx, quote);
        return { status: quote.status };
      }

      const approved = quote.approve(input.approvedItemIds, this.clock.now());   // domínio valida
      const plan = TreatmentPlan.fromApprovedQuote(this.ids.next(), quote, approved);
      await this.quotes.save(input.ctx, quote);
      await this.plans.save(input.ctx, plan);

      // billing expõe port de aplicação; nada de INSERT direto em tabela alheia
      const receivable = await this.billingPort.createReceivableFromApprovedQuote({
        ctx: input.ctx,
        patientId: quote.patientId,
        origin: { type: 'QUOTE', id: quote.id },
        totalCents: approved.totalCents,
        payment: input.payment,
      });

      return { status: quote.status, treatmentPlanId: plan.id, receivableId: receivable.id };
    });
  }
}
```

Pontos de arquitetura: uma transação (`uow.run`) cobre orçamento, plano e financeiro; a comunicação com `billing` é **síncrona via port** porque o usuário precisa ver as parcelas imediatamente e o resultado deve ser atômico. Efeitos não críticos (WhatsApp, PDF, relatório) são assíncronos via outbox.

## 9. Eventos

| Publicados | Consumidores |
| --- | --- |
| `treatments.quote_created` · `quote_sent` · `quote_approved` · `quote_rejected` · `quote_expired` | `reporting`, `messaging`, CRM (fase 2) |
| `treatments.plan_created` · `item_executed` · `plan_completed` | `billing` (produção), `clinical-records`, `reporting` |

| Consumidos | Efeito |
| --- | --- |
| `clinical_records.note_created` | Marca itens vinculados como `EXECUTED` |
| `scheduling.appointment_scheduled` | Marca item como `SCHEDULED` quando vinculado ao agendamento |
| `clinic.procedure_price_changed` | Nada retroage; apenas novos orçamentos usam o preço novo |

## 10. Endpoints

Ver [API v1 §2.6](../08-api-v1.md#26-orçamentos-e-tratamentos-treatments).

## 11. Testes obrigatórios

- Aprovação parcial cria plano só com os itens escolhidos e título com o total correspondente.
- `Σ parcelas + entrada = total aprovado` para qualquer combinação de valor e número de parcelas (teste de propriedade).
- Duplo `POST /decision` com a mesma `Idempotency-Key` cria **um** plano e **um** título.
- Falha ao criar o título faz rollback do plano e da mudança de status do orçamento.
- Preço alterado no catálogo não altera orçamento emitido.
- Orçamento expirado não aceita decisão; duplicação usa preços atuais.
- Desconto acima do limite do papel é rejeitado.
- Item executado não pode ser cancelado.
- Procedimento `requires_tooth` sem dente é rejeitado.
- Item só vira `EXECUTED` com evolução clínica assinada.
