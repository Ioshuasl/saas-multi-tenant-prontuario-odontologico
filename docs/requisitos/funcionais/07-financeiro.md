# RF — Financeiro da Clínica (E7)

**Módulo:** `billing` · **Detalhe:** [modulos/07-financeiro.md](../../modulos/07-financeiro.md)

> Dinheiro **paciente → clínica**. A assinatura SaaS é o épico E10.

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E7-01 | Sistema gerencia contas a receber (títulos) com parcelas, status e vínculo a orçamento/paciente | Must | US-7.1, J7 |
| RF-E7-02 | Financeiro/recepção registra baixa (parcial ou total) com forma(s) de pagamento; `Idempotency-Key` obrigatório | Must | US-7.1 |
| RF-E7-03 | Um recebimento pode combinar múltiplas formas (ex.: Pix + dinheiro) | Must | módulo billing |
| RF-E7-04 | Excedente de pagamento gera crédito do paciente para parcelas futuras | Must | módulo billing |
| RF-E7-05 | Estorno de pagamento exige motivo e autor; registro original permanece | Must | US-7.1 |
| RF-E7-06 | Estorno bloqueado se a sessão de caixa vinculada estiver fechada | Must | módulo billing |
| RF-E7-07 | Financeiro lança contas a pagar por categoria, com recorrência simples | Must | US-7.2 |
| RF-E7-08 | Recepção abre e fecha caixa do dia por operador/unidade, com contagem por forma de pagamento | Must | US-7.3 |
| RF-E7-09 | Fechamento com divergência exige justificativa; caixa fechado é imutável (`423`) | Must | US-7.3 |
| RF-E7-10 | Sangria e suprimento exigem motivo e ficam registrados na sessão | Must | módulo billing |
| RF-E7-11 | Dono visualiza fluxo de caixa do período com regime explícito caixa ou competência | Must | US-7.4, J8 |
| RF-E7-12 | Dono visualiza inadimplência com aging (1–15, 16–30, 31–60, 60+) | Must | US-7.5 |
| RF-E7-13 | Job diário marca parcelas vencidas no fuso do tenant e publica evento de inadimplência | Must | módulo billing |
| RF-E7-14 | Dono consulta relatório de produção por profissional no período (base de comissão futura) | Must | US-7.6 |
| RF-E7-15 | Sistema gera recibo (não documento fiscal) no recebimento, com numeração sequencial por tenant | Must | J7 |
| RF-E7-16 | Recibo pode ser enviado ao paciente por WhatsApp | Must | E8 |
| RF-E7-17 | Título manual (sem orçamento) pode ser criado quando necessário | Should | módulo billing |
| RF-E7-18 | Ação rápida “cobrar por WhatsApp” (envio manual de template utility) na lista de inadimplentes | Should | E7 + E8 |
| RF-E7-19 | Bloqueio configurável de novo agendamento para devedor (default desligado) | Could (MVP opcional) | módulo billing |
| RF-E7-20 | Valores monetários são inteiros em centavos em toda a cadeia (sem ponto flutuante) | Must | RNF + domínio |

## Critérios de aceite transversais (E7)

- Duplo POST de pagamento com mesma chave → um pagamento.
- Parcelamento soma exatamente o total aprovado.
- Fluxo de caixa por caixa ≠ por competência no mesmo cenário com atraso (ambos corretos no seu regime).
- UI deixa claro que recibo ≠ NFS-e.

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E7-21 | Régua de cobrança automática | Could (fase 2) |
| RF-E7-22 | Comissionamento automático com regras | Could (fase 2) |
| RF-E7-23 | NFS-e, Pix cobrança, boleto, maquininha, conciliação | Won't (fase 3) |
