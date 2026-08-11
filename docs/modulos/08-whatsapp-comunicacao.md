# Módulo — WhatsApp e Comunicação (`messaging`)

## 1. Responsabilidade

Todo contato com o paciente: WhatsApp (canal principal), e-mail e, como contingência, SMS. Inclui automações transacionais, caixa de entrada compartilhada, templates, medição de consumo e custo.

## 2. Decisão central: Cloud API oficial

Boa parte dos concorrentes integra WhatsApp via **extensão de navegador sobre o WhatsApp Web** (o próprio material público de Simples Dental e Codental descreve integração via WhatsApp Web). Isso é frágil: depende do computador da recepção ligado, do navegador aberto e da sessão logada; não envia nada com o consultório fechado; e não sobrevive a mudanças da interface do WhatsApp.

Nossa escolha é a **WhatsApp Business Cloud API oficial** (ver [ADR-0005](../adr/0005-whatsapp-cloud-api.md)): envio server-side, funciona 24/7 sem computador ligado, entrega e status confiáveis, múltiplos atendentes na mesma conversa, e conformidade com a política da Meta.

Custo: desde 1º de julho de 2025, a Meta cobra **por mensagem de template entregue** (não mais por conversa de 24 h), com preço por categoria — marketing, utility, authentication e service — e mensagens fora de template dentro de uma janela de atendimento aberta não são cobradas ([referência oficial de preços](https://developers.facebook.com/docs/whatsapp/pricing/)). Isso muda o desenho do produto: precisamos modelar **categoria de template**, **janela de atendimento** e **consumo por tenant** desde o MVP.

## 3. Conceitos que o domínio precisa representar

| Conceito | Significado | Consequência no produto |
| --- | --- | --- |
| Janela de atendimento (24 h) | Aberta por mensagem do paciente | Enquanto aberta, respostas livres (não-template) são gratuitas → a UI mostra o tempo restante |
| Template aprovado | Mensagem pré-aprovada pela Meta, com variáveis | Envio proativo só por template |
| Categoria | `MARKETING`, `UTILITY`, `AUTHENTICATION`, `SERVICE` | Preço e regra de consentimento diferentes |
| Opt-in | Consentimento do paciente | Obrigatório para marketing; verificado em `patients` |
| `wamid` | ID único da mensagem | Chave de idempotência de webhook |
| Status de entrega | `sent`, `delivered`, `read`, `failed` | Exibido na inbox e usado em métrica |

## 4. Templates do MVP

| Chave | Categoria | Uso | Botões |
| --- | --- | --- | --- |
| `appointment_created` | utility | Confirmação do agendamento | — |
| `appointment_confirmation` | utility | D-1 às 12:00 | Confirmar / Cancelar |
| `appointment_reminder` | utility | H-3 | — |
| `appointment_cancelled` | utility | Cancelamento | — |
| `waitlist_offer` | utility | Vaga disponível | Quero este horário |
| `quote_sent` | utility | Orçamento pronto | Ver orçamento |
| `payment_receipt` | utility | Recibo de pagamento | — |
| `payment_overdue` | utility | Parcela em atraso | — |
| `anamnesis_request` | utility | Link da anamnese | Responder |
| `birthday` | marketing | Aniversário (exige opt-in) | — |
| `recall` | marketing | Retorno periódico (fase 2) | — |

Regras de conteúdo: **nunca** diagnóstico, procedimento ou informação clínica no template; variáveis mínimas (nome, clínica, data, hora, valor); links sempre com token de uso único e sem dado sensível na URL; texto em pt-BR revisado; identificação clara da clínica remetente.

## 5. Automações

```ts
interface Automation {
  key: 'APPOINTMENT_CONFIRMATION' | 'APPOINTMENT_REMINDER' | 'BIRTHDAY' | 'PAYMENT_OVERDUE' | 'WAITLIST_OFFER' | 'POST_VISIT';
  enabled: boolean;
  config: { offsetHours?: number; sendAtLocalTime?: string; onlyForStatuses?: AppointmentStatus[]; maxPerPatientPerMonth?: number };
}
```

Princípios (um dos nossos diferenciais de confiança):

1. **Transparência total:** o tenant vê exatamente o que será enviado, para quem e quando (fila de envios agendados visível e cancelável).
2. **Janela de silêncio:** nada entre 21:00 e 08:00 no fuso do tenant.
3. **Anti-spam:** limite por paciente/mês por automação; nunca duas mensagens da mesma automação para o mesmo alvo (unique key em `automation_run`).
4. **Idempotência:** `automation_run` com chave única `(tenant, automation, target_type, target_id, scheduled_for)`.
5. **Cancelamento em cascata:** cancelar/mover o agendamento cancela os envios pendentes correspondentes.
6. **Falha visível:** falha de envio aparece no app com motivo e ação sugerida (não falha em silêncio).
7. **Opt-out honrado:** paciente que pede para parar é marcado e não recebe mais marketing; transacional segue conforme base legal.

## 6. Caixa de entrada compartilhada

- Conversa **vinculada ao paciente** por telefone E.164 (paciente desconhecido → sugestão de cadastro em um clique).
- Atribuição de conversa a atendente, marcação de resolvida, filtros por status/responsável, busca por texto.
- Painel lateral com contexto: próximos agendamentos, parcelas em aberto, último atendimento, alertas administrativos (nunca conteúdo clínico para quem não tem permissão).
- Indicador explícito da janela de 24 h (aberta até HH:MM / fechada → só template).
- Ações rápidas: agendar, enviar orçamento, enviar link de anamnese, enviar recibo, cobrar.
- Notas internas na conversa (não enviadas ao paciente).

## 7. Webhook (entrada)

```ts
export class WhatsAppWebhookController {
  async handle(req: Request, res: Response) {
    if (!verifySignature(req.rawBody, req.header('X-Hub-Signature-256'), env.WHATSAPP_APP_SECRET)) {
      return res.sendStatus(401);
    }
    res.sendStatus(200);                                   // responder rápido: a Meta reenvia em caso de timeout
    await this.queue.add('process-whatsapp-webhook', req.body, {
      jobId: extractIdempotencyKey(req.body),              // wamid ou id do status
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
}
```

Processamento assíncrono:

1. Resolver tenant pelo `phone_number_id`.
2. Idempotência por `provider_message_id` (unique index).
3. Mensagem de entrada: abrir/reabrir conversa, registrar mensagem, abrir janela de 24 h, vincular paciente, notificar UI (SSE).
4. Resposta de botão: `CONFIRM_<appointmentId>` publica `messaging.confirmation_received`; `CANCEL_<appointmentId>` publica `cancellation_received`; `WAITLIST_<offerId>` aciona o reencaixe. Payload desconhecido → mensagem comum na inbox.
5. Status de entrega: atualiza a mensagem e as métricas.
6. Falha permanente (número inválido, bloqueio): marca o contato, alerta a clínica e interrompe automações para aquele número.

## 8. Créditos e controle de custo

```
message_credit_ledger: { balance_before, delta, reason: TOPUP|CONSUMPTION|ADJUSTMENT|PLAN_GRANT, cost_cents, balance_after }
```

- Cada plano inclui uma franquia mensal de mensagens; consumo além disso usa créditos pré-pagos.
- Saldo insuficiente: mensagens **transacionais críticas** (confirmação de agendamento) continuam por uma margem de cortesia configurável; marketing é bloqueado imediatamente. Falhar em confirmar consulta prejudica o paciente e a clínica — não é o lugar de ser rígido.
- Avisos em 80%, 95% e 100% da franquia; painel de consumo por categoria, com custo estimado.
- Como o custo real é por mensagem entregue e por categoria, o consumo é registrado no **callback de entrega**, não no envio.

## 9. Contingência

Falha ou indisponibilidade do WhatsApp → e-mail com o mesmo conteúdo (quando houver e-mail); SMS reservado para confirmação crítica (fase 2, por custo). Toda mensagem tem `channel` e `fallback_of` para rastrear o caminho. Se o provedor cair, as mensagens ficam na fila e a UI avisa "envios pausados — aguardando WhatsApp".

## 10. Eventos

| Publicados | Consumidores |
| --- | --- |
| `messaging.message_sent` · `message_failed` · `message_received` | `reporting`, UI (SSE) |
| `messaging.confirmation_received` · `cancellation_received` | `scheduling` |
| `messaging.waitlist_offer_accepted` | `scheduling` |
| `messaging.credits_low` · `credits_exhausted` | `subscription`, UI |

| Consumidos | Efeito |
| --- | --- |
| `scheduling.appointment_scheduled/rescheduled/cancelled` | Agenda/cancela notificações |
| `treatments.quote_sent` | Envia template com link |
| `billing.payment_registered` | Envia recibo |
| `billing.installment_overdue` | Prepara cobrança (envio conforme automação) |
| `patients.consent_revoked` | Interrompe marketing imediatamente |

## 11. Endpoints

Ver [API v1 §2.8](../08-api-v1.md#28-mensageria-messaging).

## 12. Testes obrigatórios

- Mesmo `wamid` processado duas vezes → uma mensagem, um efeito.
- Webhook com assinatura inválida → 401 e nada enfileirado.
- Confirmação por botão muda o agendamento para `CONFIRMED`; botão de agendamento já cancelado não quebra o fluxo.
- Cancelar agendamento cancela os envios pendentes (nenhum lembrete do horário antigo).
- Janela de silêncio reagenda o envio para 08:00 local.
- Marketing sem consentimento é bloqueado e registrado como `BLOCKED_NO_CONSENT`.
- Saldo zerado bloqueia marketing e mantém confirmação dentro da margem de cortesia.
- Consumo é debitado no callback de entrega, não no envio (mensagem não entregue não consome).
- Limite por paciente/mês impede repetição da mesma automação.
- Duas automações concorrentes para o mesmo alvo criam apenas uma execução (unique key).
