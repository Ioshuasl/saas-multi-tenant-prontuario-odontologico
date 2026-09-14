# WAHA / WhatsApp indisponível

Sessão caiu, WAHA fora do ar, ou risco de ban. Agenda **não** bloqueia.

## Sintomas

- Conta `ERROR` / desconectada no painel Messaging
- Jobs `send-whatsapp-message` com `SKIPPED_DISCONNECTED` ou falha do provedor
- `/ready` pode permanecer 200 (WhatsApp **não** entra no probe)

## Ações imediatas

1. **Kill switch** (Owner, `messaging.configure`) — pausa envios sem derrubar a API:

```http
PATCH /api/v1/messaging/account
{ "killSwitch": true }
```

Automações D-1/H-3 não disparam. Agendamento segue.

2. Não reenviar campanha nem disparar teste em massa.
3. Avisar a clínica: confirmações/lembretes pausados; e-mail continua se o paciente tiver e-mail.
4. Quando WAHA voltar: reconectar (`POST /messaging/account` / QR), `killSwitch: false`, enviar **um** teste (`POST /messaging/account/test`).

## Não fazer

- Não desligar Redis/Postgres para “parar a fila”
- Não apagar `message` / outbox
- Não logar body clínico nem token WAHA
