# Suspeita de acesso cross-tenant

Um ator tenta ler clínica vizinha (IDOR, `X-Tenant-Id` trocado, enumeração).

## Comportamento esperado (não é bug)

- Recurso de outro tenant → **404** (não 403 enumerável)
- Membership ausente no tenant do header → `403 TENANT_NOT_ALLOWED`
- RLS: `app_user` sem `BYPASSRLS`; `SET LOCAL app.tenant_id`
- Operador de plataforma **sem** grant break-glass → 404 nos dados da clínica

## Verificar

1. Logs da API: `requestId` + path + status 404 em rajada.
2. `GET /api/v1/audit-logs` **no tenant da vítima** (Owner): `CLINICAL_READ`, `EXPORT_*`, `SUPPORT_ACCESS_USED`. Linha no tenant B **não** deve aparecer no A.
3. Grant de suporte: `ops-support-access.ts get` — sem grant `APPROVED` vigente, operador não lê.
4. Não “testar” IDs de paciente de outro tenant em produção além do smoke de isolamento.

## Resposta

1. Se houver leitura real no audit da vítima: tratar como vazamento — [credencial-vazada.md](./credencial-vazada.md) + aviso à clínica.
2. Rate limit de login/OTP já existe; rajada de 404 por ID → endurecer limite na borda se persistir.
3. Não desligar RLS “para investigar”.
4. Job `anomaly-clinical-read` alerta burst de leitura **dentro** do tenant; não substitui este runbook.
