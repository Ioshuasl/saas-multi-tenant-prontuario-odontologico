# Módulo — Assinatura SaaS (`subscription`) e Plataforma (`platform`)

## 1. Responsabilidade

`subscription`: o contrato entre **nós e a clínica** — trial, planos, limites, cobrança, upgrade/downgrade, suspensão e cancelamento.

`platform`: capacidades transversais — auditoria, outbox, exportação/LGPD, feature flags, health e ferramentas de suporte.

> Não confundir com [`billing`](./07-financeiro.md), que trata do dinheiro entre paciente e clínica.

## 2. Planos e limites (proposta inicial)

| Recurso | Essencial | Clínica | Rede |
| --- | --- | --- | --- |
| Preço mensal (referência) | R$ 99 | R$ 199 | R$ 399 |
| Profissionais (com agenda) | 1 | até 5 | ilimitado* |
| Usuários administrativos | 2 | 6 | ilimitado* |
| Unidades | 1 | 1 | até 5 |
| Prontuário, agenda, financeiro completos | ✔ | ✔ | ✔ |
| Autoagendamento público | ✔ | ✔ | ✔ |
| WhatsApp (WAHA, QR no app) | ✔ | ✔ | ✔ |
| Franquia de mensagens Meta | — | — | — |
| Storage de anexos | 5 GB | 25 GB | 100 GB |
| Inbox compartilhada | ✔ | ✔ | ✔ |
| Relatórios | essenciais | completos | completos + consolidado |
| Exportação de dados | ✔ | ✔ | ✔ |
| Suporte | e-mail/chat | prioritário | prioritário + onboarding assistido |

\* "ilimitado" com política de uso aceitável documentada.

Decisões de posicionamento (baseadas no [benchmark](../02-benchmark-mercado.md)): **preço público**, **sem taxa de implantação obrigatória**, **prontuário e financeiro completos já no plano de entrada** (não usamos o prontuário como recurso premium), **anual com desconto** (2 meses), **sem contrato de fidelidade** no MVP.

## 3. Trial e ciclo de vida

```
TRIAL (14 dias, sem cartão)
  ├─ converte ──► ACTIVE ──► PAST_DUE ──► SUSPENDED ──► CANCELLED ──► (dados anonimizados após 90 d)
  └─ expira ───► EXPIRED (somente leitura + exportação)
```

| Estado | O que a clínica pode fazer |
| --- | --- |
| `TRIAL` | Tudo, com limites do plano escolhido; banner com dias restantes |
| `ACTIVE` | Tudo |
| `PAST_DUE` (até 7 dias após falha de cobrança) | Tudo, com aviso persistente e novas tentativas de cobrança |
| `SUSPENDED` | **Somente leitura** + exportação de dados; nada de escrita; automações desligadas |
| `EXPIRED` | Igual a `SUSPENDED` |
| `CANCELLED` | Login e exportação por 90 dias; depois, anonimização conforme retenção |

Princípio ético e prático: **nunca sequestrar dado de paciente**. Mesmo sem pagamento, a clínica sempre pode ler e exportar tudo — não só é o correto do ponto de vista de dado de saúde, como remove a objeção de lock-in na venda.

## 4. Aplicação de limites

```ts
export class PlanLimitGuard {
  async assertCanAdd(ctx: RequestContext, metric: UsageMetric, amount = 1): Promise<void> {
    const { limit, current } = await this.usage.get(ctx, metric);
    if (limit !== null && current + amount > limit) {
      throw new PlanLimitExceededError(metric, limit, current);   // → 402 PLAN_LIMIT_EXCEEDED
    }
  }
}
```

Métricas medidas em `usage_counter` (recalculadas por job horário e incrementadas em tempo real): `professionals`, `admin_users`, `units`, `messages_month`, `storage_bytes`, `patients` (sem limite no MVP, apenas observado).

Comportamento ao estourar: erro claro **com o caminho de resolução** ("seu plano permite 5 profissionais — ver planos"), nunca falha genérica. Storage no limite bloqueia novo upload, mas nunca a leitura. Mensagens no limite seguem a regra de cortesia do [módulo de mensageria](./08-whatsapp-comunicacao.md).

Downgrade com uso acima do novo limite: bloqueado até a clínica ajustar (com lista do que precisa ser reduzido).

## 5. Cobrança

**MVP (agora):** cobrança da assinatura **manual** — sem checkout automatizado no app. O módulo mantém trial, planos, limites e mudança de status por operação. Detalhe: [ADR-0010](../adr/0010-billing-saas-manual-mvp.md).

**Candidatos quando automatizar** (um será escolhido em ADR futuro), sempre atrás de port, checkout hospedado, **sem** armazenar cartão na aplicação:

| Candidato | Notas |
| --- | --- |
| **Stripe** | Billing/Checkout; webhooks maduros |
| **Mercado Pago** | Forte no BR; Pix / assinaturas |
| **Asaas** | Assinaturas, boleto, Pix; ecossistema BR |

Campos `external_customer_id` / `external_subscription_id` já previstos em `subscription`. Cobrança em BRL, ciclo mensal ou anual, quando houver gateway.

Créditos/franquia Meta de mensagem: **não** no default WAHA ([ADR-0016](../adr/0016-waha-default-messaging.md)). Texto comercial do plano: perguntar na implementação se ainda citar “pacote de mensagens”.

E-mail transacional: **Resend** ([ADR-0009](../adr/0009-email-resend.md)).

Fase 2+: nota fiscal da nossa assinatura, cupons, indicação com bônus, planos anuais com parcelamento — após gateway escolhido.

## 6. Onboarding self-service (wizard)

Meta: **do signup ao primeiro agendamento em menos de 15 minutos**, sem contato humano — diferencial direto frente a concorrentes que exigem implantação paga.

| Passo | Conteúdo | Pode pular? |
| --- | --- | --- |
| 1 | Dados da clínica (nome, CNPJ opcional, telefone, timezone) | não |
| 2 | Horário de funcionamento | não |
| 3 | Profissionais e CRO | não (ao menos um) |
| 4 | Procedimentos (catálogo sugerido pré-marcado, só ajustar preços) | sim |
| 5 | Convidar equipe | sim |
| 6 | Conectar WhatsApp | sim (mas com forte incentivo) |
| 7 | Primeiro paciente e primeiro agendamento (guiado) | sim |

Progresso persistido (retomável), dados de demonstração descartáveis com um clique, checklist de ativação sempre acessível.

## 7. Módulo `platform`

### 7.1 Auditoria

Serviço central usado por todos os módulos (`platform.audit.record(...)`), tabela `audit_log` append-only e particionada por mês. Consulta pelo Owner com filtro por paciente, ator, ação e período. Ver detalhes e lista de eventos obrigatórios em [doc 10 §5.4](../10-seguranca-lgpd-compliance.md).

### 7.2 Outbox

```ts
// grava evento na MESMA transação do agregado; o dispatcher entrega depois
await tx.outboxEvent.create({ data: { tenantId, eventName, payload, availableAt: new Date() } });
```

Dispatcher roda a cada 5 s, entrega em ordem por tenant, marca `processed_at`, faz retry exponencial e envia para DLQ após 5 falhas (com alerta). Consumidores são idempotentes por `event_id` — garantia de entrega é *at-least-once*.

### 7.3 Exportação e LGPD

| Função | Descrição |
| --- | --- |
| Exportação do tenant | JSON estruturado + CSVs + anexos originais em ZIP; job assíncrono; URL assinada de 7 dias; auditada |
| Solicitação do titular | `data_subject_request` com tipo, prazo (`due_at`), responsável e resolução registrada |
| Pacote do paciente | PDF legível + JSON de todos os dados daquele paciente (atende o direito de acesso e a exigência de acesso gratuito ao prontuário) |
| Anonimização | Substitui identificadores diretos, remove contatos e anexos não sujeitos a guarda; mantém agregados financeiros |
| Relatório de acessos | Quem acessou os dados de um paciente e quando |

### 7.4 Suporte e break-glass

Acesso de suporte a dado de tenant exige: justificativa escrita, aprovação de um segundo membro da equipe, prazo máximo de 4 h, escopo mínimo, `audit_log` com marcação `SUPPORT_ACCESS` e **notificação automática ao Owner**. Não existe acesso silencioso — e isso é dito ao cliente no contrato, porque é um argumento de confiança.

### 7.5 Feature flags

Tabela `feature_flag` (global + override por tenant) com cache de 60 s. Usada para liberar recurso gradualmente (ex.: inbox para 5 clínicas antes de todas) e para desligar rapidamente algo problemático sem deploy.

## 8. Eventos

| Publicados | Consumidores |
| --- | --- |
| `subscription.trial_started` · `trial_ending` · `subscription_activated` · `payment_failed` · `subscription_suspended` · `subscription_cancelled` · `plan_changed` · `limit_reached` | UI (banners), `messaging` (e-mails de ciclo de vida), painel interno |
| `platform.data_export_completed` · `dsr_created` · `support_access_granted` | `messaging`, Owner |

| Consumidos | Efeito |
| --- | --- |
| `identity.tenant_created` | Inicia trial de 14 dias |
| `identity.member_joined` / `member_deactivated` | Atualiza contador de profissionais/usuários |
| `clinical_records.attachment_created` | Atualiza `storage_bytes` |
| `messaging.message_sent` (entregue) | Atualiza `messages_month` e custo |

## 9. Endpoints

Ver [API v1 §2.10](../08-api-v1.md#210-assinatura-auditoria-e-lgpd).

## 10. Testes obrigatórios

- Tenant `SUSPENDED`: toda escrita retorna `402 SUBSCRIPTION_REQUIRED`; leitura e exportação funcionam.
- Limite de profissionais bloqueia o convite com `402 PLAN_LIMIT_EXCEEDED` e mensagem acionável.
- Downgrade com uso acima do novo limite é bloqueado.
- Webhook do gateway processado duas vezes não duplica cobrança nem muda estado duas vezes.
- Trial expira exatamente após 14 dias no fuso do tenant.
- Contadores de uso recalculados batem com a realidade (teste de reconciliação).
- Exportação do tenant contém todos os pacientes, evoluções, anexos e registros financeiros do tenant — e nada de outro tenant.
- Break-glass sem aprovação é recusado; com aprovação, gera auditoria e notifica o Owner.
- Outbox: falha do consumidor mantém o evento pendente e o reentrega; após 5 falhas vai para DLQ com alerta.
- Anonimização remove identificadores mas preserva o histórico financeiro agregado.
