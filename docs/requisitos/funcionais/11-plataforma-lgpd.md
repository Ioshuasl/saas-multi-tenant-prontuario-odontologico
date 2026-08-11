# RF — Plataforma, Auditoria e LGPD (E11)

**Módulos:** `platform` / capacidades em `shared/` · **Detalhe:** [modulos/10-billing-saas.md §7](../../modulos/10-billing-saas.md), [10 — Segurança/LGPD](../../10-seguranca-lgpd-compliance.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E11-01 | Isolamento multi-tenant garantido no banco via RLS em toda tabela operacional com `tenant_id` | Must | US-11.1, ADR-0002, A5 |
| RF-E11-02 | Acesso a recurso de outro tenant responde `404` (não revela existência) | Must | A5, doc 06 |
| RF-E11-03 | Trilha de auditoria append-only de acessos e alterações sensíveis, consultável pelo Owner | Must | US-11.2, doc 10 |
| RF-E11-04 | Eventos obrigatoriamente auditados incluem: login/falha, leitura de prontuário/anexo, evolução, exportação, permissões, envio de mensagem, break-glass | Must | doc 10 §5.4 |
| RF-E11-05 | Owner solicita exportação completa do tenant (JSON + CSV + anexos) sob demanda; job assíncrono com URL assinada | Must | US-11.3, D4 |
| RF-E11-06 | Clínica registra solicitação do titular (acesso, correção, eliminação, portabilidade, revogação) com prazo (`due_at`) | Must | J10, doc 10 |
| RF-E11-07 | Sistema gera pacote do paciente (PDF + JSON) para direito de acesso | Must | J10 |
| RF-E11-08 | Eliminação anonimiza dados não sujeitos a guarda; prontuário permanece sob obrigação legal com justificativa registrada | Must | J10, doc 10 |
| RF-E11-09 | API expõe health (liveness) e ready (db, redis, storage) | Must | US-11.4 |
| RF-E11-10 | Logs estruturados com `requestId` / `tenantId` / `userId`, sem corpo clínico | Must | US-11.4, RNF-OBS |
| RF-E11-11 | Eventos de domínio são gravados em outbox na mesma transação do agregado e entregues de forma at-least-once | Must | ADR-0006 |
| RF-E11-12 | Feature flags por tenant permitem liberar/desligar funcionalidade sem deploy | Should | doc 11 |
| RF-E11-13 | Acesso de suporte (break-glass) exige motivo, aprovação de segunda pessoa, validade ≤ 4h, auditoria e notificação ao Owner | Must | P5, doc 06/10 |
| RF-E11-14 | Suporte não tem acesso a dado de tenant por padrão | Must | doc 06 |
| RF-E11-15 | API pública versionada em `/api/v1` com envelope de sucesso/erro e códigos estáveis | Must | US-11 / doc 08 |
| RF-E11-16 | Rotas públicas (autoagendamento, anamnese, orçamento) têm rate limit agressivo | Must | J3, RNF-SEC |

## Critérios de aceite transversais (E11)

- Testes automatizados de vazamento entre tenants no CI (ver RNF-SEC / doc 12).
- Toda tabela com `tenant_id` possui RLS habilitada (consulta de metadados = 0 faltantes).
- Exportação de um tenant não contém dados de outro.
- Break-glass sem aprovação é recusado.

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E11-17 | API pública para terceiros com webhooks de saída | Could (fase 3) |
| RF-E11-18 | SSO corporativo | Could (fase 3) |
| RF-E11-19 | Importador de dados de concorrentes | Could (fase 2) |
