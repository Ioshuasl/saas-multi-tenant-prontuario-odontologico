# Credencial vazada

JWT, senha de usuário, `.env`, chave JWT, `KEK_LOCAL_BASE64`, token WAHA ou `STORAGE_SECRET_KEY`.

## Imediato (conta de usuário)

1. Owner/usuário: `POST /api/v1/auth/logout-all` — revoga a família de refresh.
2. Trocar a senha (`forgot`/`reset` ou fluxo autenticado).
3. Não reutilizar a senha vazada.

## Segredo de plataforma (`.env` / VPS)

1. Rotacionar o segredo **no provedor** (DB, Redis, S3, WAHA, Resend, JWT keys, KEK).
2. Atualizar env na VPS; **reiniciar API e worker**.
3. JWT keys novas invalidam access tokens já emitidos; refresh antigo falha — usuários relogam.
4. KEK nova exige rewrap das DEKs (runbook de KMS / ADR-0013) — **não** apagar `tenant_crypto_key`.
5. Revogar chaves antigas no provedor depois da troca.

## Comunicação

- Avisar a clínica só se dado dela puder ter sido lido.
- Registrar incidente interno (sem colar o segredo no ticket).
- Conferir `audit_log` no intervalo suspeito (`CLINICAL_READ`, `EXPORT_*`, `SUPPORT_ACCESS_*`).
