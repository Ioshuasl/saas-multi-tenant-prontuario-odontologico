# Módulo — WhatsApp e Comunicação (`messaging`)

## 1. Responsabilidade

Todo contato com o paciente: WhatsApp (canal principal), e-mail e, como contingência, SMS. Inclui automações transacionais, caixa de entrada compartilhada, textos de mensagem, volume/falhas e kill switch.

## 2. Decisão central: WAHA (GOWS), server-side

Boa parte dos concorrentes integra WhatsApp via **extensão de navegador sobre o WhatsApp Web**. Isso é frágil: depende do computador da recepção ligado e da sessão no browser.

Nossa escolha vigente é **WAHA self-hosted, engine GOWS** ([ADR-0016](../adr/0016-waha-default-messaging.md)): envio no servidor, 24/7 sem PC da recepção, QR no **nosso** app. A Cloud API oficial ([ADR-0005](../adr/0005-whatsapp-cloud-api.md)) ficou como adapter opcional por env, não o caminho feliz.

Consequências explícitas: viola ToS da Meta; risco de **ban** do número; a clínica aceita isso no checkbox e deve usar **número dedicado**. Não há tarifa Meta por mensagem; textos são nossos (sem aprovação de template). Instância: `waha.ioshuavps.com.br`. Plano de docs: [migracao-waha.md](../desenvolvimento/migracao-waha.md).

## 3. Conceitos que o domínio precisa representar

| Conceito | Significado | Consequência no produto |
| --- | --- | --- |
| Sessão WAHA | Uma sessão GOWS = um tenant (MVP) | `session_name` estável; webhook resolve pelo `session` |
| Ciência de risco | Checkbox antes do QR | `risk_accepted_at`; sem aceite, sem QR |
| Texto de automação | `message_template.body` com variáveis | Adapter renderiza e envia text/buttons — não é template Meta |
| Categoria | `MARKETING` vs `UTILITY` | Consentimento (não preço Meta) |
| Opt-in | Consentimento do paciente | Obrigatório para marketing |
| `provider_message_id` | ID da mensagem no WAHA | Chave de idempotência de webhook |
| Status de entrega | `sent`, `delivered`, `read`, `failed` (quando o engine informar) | Inbox e métrica de volume/falhas |
| Janela 24 h | Era regra de **preço** da Cloud API | **Não** cobra no WAHA. Se a UI mostrar “conversa recente”, decidir na implementação |

## 4. Textos do MVP (`message_template`)

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

Regras de conteúdo: **nunca** diagnóstico, procedimento ou informação clínica; variáveis mínimas (nome, clínica, data, hora, valor); links com token de uso único; pt-BR; identificação da clínica remetente.

## 5. Automações

```ts
interface Automation {
  key: 'APPOINTMENT_CONFIRMATION' | 'APPOINTMENT_REMINDER' | 'BIRTHDAY' | 'PAYMENT_OVERDUE' | 'WAITLIST_OFFER' | 'POST_VISIT';
  enabled: boolean;
  config: { offsetHours?: number; sendAtLocalTime?: string; onlyForStatuses?: AppointmentStatus[]; maxPerPatientPerMonth?: number };
}
```

Princípios:

1. **Transparência total:** o tenant vê o que será enviado, para quem e quando (fila cancelável).
2. **Janela de silêncio:** nada entre 21:00 e 08:00 no fuso do tenant.
3. **Anti-spam:** limite por paciente/mês; unique key em `automation_run`.
4. **Idempotência:** `(tenant, automation, target_type, target_id)`.
5. **Cancelamento em cascata** ao cancelar/mover agendamento.
6. **Falha visível** (sessão caída, ban, timeout).
7. **Opt-out** honrado para marketing.

## 6. Caixa de entrada compartilhada

- Conversa vinculada ao paciente por telefone E.164 (desconhecido → cadastro em um clique).
- Atribuição, resolvida, filtros, busca.
- Painel lateral operacional (sem clínico sem permissão).
- Sem restrição de “só template fora da janela 24 h” por preço Meta.
- Ações rápidas: agendar, orçamento, anamnese, recibo, cobrar.
- Notas internas (não enviadas).

## 7. Webhook (entrada)

HMAC do **WAHA** (não `X-Hub-Signature-256` da Meta). Sem GET `hub.challenge`.

```ts
export class WhatsAppWebhookController {
  async handle(req: Request, res: Response) {
    if (!verifyWahaSignature(req.rawBody, req.header(/* header HMAC do WAHA */), env.WAHA_WEBHOOK_SECRET)) {
      return res.sendStatus(401);
    }
    res.sendStatus(200);
    await this.queue.add('process-whatsapp-webhook', req.body, {
      jobId: extractIdempotencyKey(req.body),
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
}
```

Processamento assíncrono:

1. Resolver tenant pelo `session` (não `phone_number_id` da Meta).
2. Idempotência por `provider_message_id`.
3. Inbound: conversa, mensagem, vincular paciente, SSE.
4. Botão: `CONFIRM_<appointmentId>` → `messaging.confirmation_received`; `CANCEL_<appointmentId>` → cancelamento; `WAITLIST_<offerId>` → reencaixe. Desconhecido → inbox.
5. Status de entrega: atualiza mensagem e volume/falhas (**não** debita crédito).
6. Falha permanente / sessão logout: marca conta `ERROR`/`DISCONNECTED`, alerta a clínica.

## 8. Volume e controle (sem crédito Meta)

Não usar `message_credit_ledger` no caminho WAHA. Painel: enviadas, falhas, kill switch. Marketing bloqueado só por consentimento / kill switch / sessão down — não por saldo.

## 9. Contingência

WhatsApp indisponível → e-mail quando houver e-mail; SMS fase 2. Fila retém jobs; UI: "envios pausados — reconecte o WhatsApp".

## 10. Eventos

| Publicados | Consumidores |
| --- | --- |
| `messaging.message_sent` · `message_failed` · `message_received` | `reporting`, UI (SSE) |
| `messaging.confirmation_received` · `cancellation_received` | `scheduling` |
| `messaging.waitlist_offer_accepted` | `scheduling` |
| `messaging.session_disconnected` | UI |

| Consumidos | Efeito |
| --- | --- |
| `scheduling.appointment_scheduled/rescheduled/cancelled` | Agenda/cancela notificações |
| `treatments.quote_sent` | Envia texto/botão com link |
| `billing.payment_registered` | Envia recibo |
| `billing.installment_overdue` | Cobrança conforme automação |
| `patients.consent_revoked` | Interrompe marketing |

(`credits_low` / `credits_exhausted` não se aplicam ao default WAHA.)

## 11. Endpoints

Ver [API v1 §2.8](../08-api-v1.md#28-mensageria-messaging).

## 12. Testes obrigatórios

- Mesmo `provider_message_id` duas vezes → um efeito.
- HMAC inválido → 401.
- Confirmar por botão → `CONFIRMED`; agendamento já cancelado não quebra.
- Cancelar agendamento cancela envios pendentes.
- Janela de silêncio reagenda para 08:00 local.
- Marketing sem consentimento → `BLOCKED_NO_CONSENT`.
- Sem débito de crédito no delivery.
- Limite por paciente/mês.
- Unique key de `automation_run`.
- Connect sem checkbox → rejeitado.
