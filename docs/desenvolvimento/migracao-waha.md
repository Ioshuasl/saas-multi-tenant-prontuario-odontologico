# Migração Cloud API → WAHA

**Status:** documentação aceita ([ADR-0016](../adr/0016-waha-default-messaging.md)). **Código ainda não** — só quando pedido.

**Instância já no ar:** `https://waha.ioshuavps.com.br` (engine alvo: **GOWS**).

## 1. Decisões travadas (não reabrir sozinho)

| Tema | Decisão |
| --- | --- |
| Provedor | WAHA, não Evolution nem OpenWA |
| Engine | GOWS (ajustar a VPS se estiver outro) |
| Onboarding | QR / pairing code **no nosso SaaS**; clínica não usa o dashboard do WAHA |
| Aviso | Checkbox **obrigatório** (ToS Meta, risco de ban, número dedicado — não o WhatsApp principal) |
| Créditos Meta | Não debitar. Kill switch + anti-spam. Usage = volume e falhas |
| Confirmação D-1 | Botões Confirmar / Cancelar; fallback texto se o engine falhar |
| Port | `MessagingProvider`; default WAHA; Cloud só por env |
| Dashboard WAHA | Não expor ao cliente |
| Ocultação / IP residencial | Fora de escopo |

## 2. Fluxo de conexão (alvo)

```
Owner aceita risco → POST connect
  → API cria sessão WAHA (nome estável tenant_<uuid>)
  → devolve QR (e pairing code se o WAHA expuser)
  → UI faz poll até CONNECTED | ERROR
  → webhooks de session.status WORKING confirmam
Envios e botões só com status CONNECTED e kill_switch = false
Disconnect / DELETE → logout da sessão no WAHA
```

Frontend nunca chama `waha.ioshuavps.com.br`. Só a API, com `WAHA_API_KEY`.

## 3. Ops (quando for código)

- `WAHA_BASE_URL` — público `https://waha.ioshuavps.com.br` **ou** hostname interno Docker na mesma VPS (**perguntar na implementação**).
- `WAHA_API_KEY` — só backend / env da VPS.
- `MESSAGING_PROVIDER` — default `waha`; `cloud` reserva o adapter antigo; `fake` em test/dev.
- Um WAHA, N sessões (uma por tenant no MVP).
- Webhook WAHA → `POST /api/v1/webhooks/whatsapp` (HMAC do WAHA, não `X-Hub-Signature-256` / `hub.challenge` da Meta). Resolver tenant pelo campo `session`.

## 4. Port e templates

`sendTemplate` no domínio = “automação com variáveis”. O adapter WAHA **renderiza** o `body` de `message_template` e chama send text / send buttons. Não há aprovação Meta. Fake permanece em `NODE_ENV=test|development`.

Payloads de botão iguais aos de hoje: `CONFIRM_<appointmentId>`, `CANCEL_<appointmentId>`, `WAITLIST_<offerId>`. Idempotência por `provider_message_id` (id do WAHA).

Se na VPS o GOWS **não** mandar botão estável: **perguntar** antes de cair no fallback só-texto.

## 5. Billing de mensagem

Não debitar `message_credit_ledger` no caminho WAHA. Relatório = contagem / falhas. Se o texto comercial do plano ainda falar “créditos WhatsApp”: **perguntar** na implementação.

## 6. Fora desta leva

- Adapter, Prisma, frontend, jobs.
- Inbox (S7).
- Playbook anti-detecção / IP residencial.

## 7. Na implementação, perguntar de novo

1. Hostname público vs rede Docker interna.
2. Janela 24 h: só UX de “conversa recente” ou some.
3. GOWS + botões: evidência real na VPS.
4. Copy final do checkbox (pode redigir).
5. `message_template.status`: `ACTIVE` nosso vs leftover `APPROVED` da Meta.
