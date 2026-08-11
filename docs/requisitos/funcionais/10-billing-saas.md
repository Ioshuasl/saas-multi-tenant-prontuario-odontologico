# RF — Billing SaaS / Assinatura (E10)

**Módulo:** `subscription` · **Detalhe:** [modulos/10-billing-saas.md](../../modulos/10-billing-saas.md)

> Cobrança **plataforma → clínica**. Não confundir com E7 (financeiro da clínica).

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E10-01 | Clínica inicia trial de 14 dias sem cartão, com contador visível e avisos em D-3 e D-1 | Must | US-10.1, J1 |
| RF-E10-02 | Sistema oferece planos com limites: profissionais/agendas, storage de anexos, franquia de mensagens | Must | US-10.2 |
| RF-E10-03 | Limites aplicados no servidor; estouro retorna `402 PLAN_LIMIT_EXCEEDED` com mensagem acionável de upgrade | Must | US-10.2 |
| RF-E10-04 | Prontuário, agenda e financeiro completos disponíveis no plano de entrada (sem paywall clínico) | Must | doc 01 D2 |
| RF-E10-05 | Assinatura expirada/suspensa entra em modo somente leitura; escrita bloqueada (`402 SUBSCRIPTION_REQUIRED`) | Must | US-10.3 |
| RF-E10-06 | Em suspensão/expiração, leitura e exportação de dados permanecem disponíveis (nunca sequestro de dado clínico) | Must | US-10.3, doc 10 |
| RF-E10-07 | Automações de mensagem são desligadas em tenant suspenso | Must | módulo subscription |
| RF-E10-08 | Owner visualiza plano atual, uso (profissionais, storage, mensagens) e histórico de status | Must | US-10.2 |
| RF-E10-09 | Operação da plataforma ativa/suspende assinatura manualmente (sem checkout no app no MVP); UI da clínica orienta contato para upgrade | Must | ADR-0010 |
| RF-E10-10 | Checkout automatizado + webhook de gateway (Stripe / Mercado Pago / Asaas) | Could (pós-MVP) | ADR-0010 |
| RF-E10-11 | Créditos de mensagem: crédito manual pela operação no MVP; compra avulsa automatizada com o gateway futuro | Must (manual) / Could (auto) | ADR-0010 |
| RF-E10-12 | Downgrade com uso acima do novo limite é bloqueado até a clínica ajustar | Must | módulo subscription |
| RF-E10-13 | Storage no limite bloqueia novo upload, nunca a leitura de anexos existentes | Must | US-10.2 |
| RF-E10-14 | Preço dos planos é público; não há implantação obrigatória para começar a usar | Must | D5, benchmark |
| RF-E10-15 | Dados de demonstração do trial podem ser descartados em um clique | Should | J1, doc 01 |

## Critérios de aceite transversais (E10)

- Trial expira após 14 dias no fuso do tenant.
- Contadores de uso reconciliam com a realidade (job + incremento em tempo real).
- Ciclo de vida: TRIAL → ACTIVE → PAST_DUE → SUSPENDED → CANCELLED (com retenção para exportação).

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E10-16 | NFS da assinatura, cupons, indicação com bônus | Could (fase 2) |
| RF-E10-17 | Plano Rede com consolidação multi-unidade na UI | Could (fase 2) |
| RF-E10-18 | Escolher e integrar um de: Stripe, Mercado Pago ou Asaas | Could (quando automatizar cobrança) |
