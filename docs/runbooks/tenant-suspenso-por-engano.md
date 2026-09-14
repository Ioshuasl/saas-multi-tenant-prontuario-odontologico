# Tenant suspenso por engano

Escrita HTTP da clínica cai em `402 SUBSCRIPTION_REQUIRED`. Leitura e export LGPD permanecem.

## Confirmar

- `GET /api/v1/subscription` (Owner) — `status` `SUSPENDED` / `EXPIRED` / `CANCELLED`
- Não confundir com `402 PLAN_LIMIT_EXCEEDED` (cota do plano)

## Reativar

Script auditado (não há checkout Stripe no MVP):

```bash
pnpm --filter @repo/backend exec tsx scripts/ops-subscription-status.ts --tenant <uuid> --status ACTIVE
```

Opcional: `--plan ESSENCIAL|CLINICA|REDE`.

## Depois

1. Owner confirma login + uma escrita (ex.: criar paciente de teste ou remarcar).
2. Conferir `audit_log` da alteração de assinatura.
3. Se o trial deveria estar vigente, não usar `ACTIVE` sem alinhamento comercial — o script é a fonte de verdade operacional.
