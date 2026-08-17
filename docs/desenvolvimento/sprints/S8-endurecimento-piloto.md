# Sprint 8 — Endurecimento, LGPD e piloto (E11 restante + M5)

**Objetivo verificável:** Owner consulta a **trilha de auditoria** (incluindo quem leu o prontuário); solicita **exportação completa do tenant** (ZIP JSON + CSV + anexos) e registra **solicitações do titular** (DSR) com prazo; suporte **não** vê dado de clínica sem break-glass de 4 olhos; API expõe `/ready`; k6 cobre agenda/busca/dashboard; 1 clínica-piloto consegue operar o ciclo completo sem bloqueio de software. Marco **M5** no [docs/13](../../13-roadmap-estimativas.md): prontidão de piloto (mês inteiro e NPS fecham *depois* do kickoff).

**Escopo:** Must restante de E11 (RF-E11-03..08, 13..14) + `/ready` (RF-E11-09) + carga representativa (RNF-PERF-01..03) + runbooks mínimos + buffer de correção do piloto. Should: RF-E11-12 (feature flags), anomalias (docs/17 §6), ZAP baseline. Sem MFA/SSO. Sem API pública para terceiros. Sem importador. Sem NGS2 / assinatura ICP. Sem Stripe. Sem BI.  
**Pontos (roadmap):** ~35 · Épico E11 (restante) · Marco M5 (prontidão) · [docs/13](../../13-roadmap-estimativas.md)

**Pré-requisito:** S7 código Must (inbox + reporting + export CSV + subscription/guards + UI). Aceite residual S7 (trial expiry forçado, alguns smokes de isolamento) **não** bloqueia o Bloco 1; fechar antes do kickoff do piloto. Aceite M3 (uso real S4) **não** bloqueia S8 — o piloto pode absorvê-lo. Carry-overs S5 (`SCHEDULED`) e RF-E7-19 (Could) **não** entram como blocos de produto desta sprint.

**Estado (2026-08-17):** Sprint 8 **código frontend Must fechado** (Blocos 1–7). S7 código Must fechado. M3 uso real S4 permanece pendente. M4 demo local já fechado na S6.

---

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — consulta de `audit_log`, export LGPD, DSR, anonimização, break-glass, `/ready` (Blocos 1–5) | `backend/` |
| **Frontend** | Sim — `/app/auditoria` + `/app/privacidade` (OWNER) (Blocos 6–7) | `frontend/` |

Não misturar: um bloco é **só backend** ou **só frontend**, salvo contrato (`contracts/` / `docs/08`). Cruzar BC só por `*_public.ts` + outbox (nunca import direto `platform` ↔ `patients` / `clinical_records` / `billing` / `messaging` por internals). Capacidades transversais de **gravação** de audit continuam em `shared/database/write_audit.ts`.

### Backend (Blocos 1–5)

- `GET /audit-logs` consultável pelo Owner; `audit_log` append-only de verdade (trigger)
- Completar eventos Must que ainda não gravam (evolução, mensagem, export LGPD, DSR, break-glass)
- Job de exportação completa do tenant (ZIP) + URL assinada 7 dias
- DSR: registrar / listar / concluir; pacote do paciente (PDF + JSON) para `ACCESS`
- Anonimização de identificadores **não** sujeitos a guarda; prontuário permanece com justificativa
- Break-glass: motivo + 2º aprovador + ≤ 4 h + audit + e-mail ao Owner
- `GET /ready` (db, redis, storage)
- **Não inclui** telas Next.js
- **Não inclui** MFA TOTP, SSO, pentest externo, WAF custom
- **Não inclui** UI interna de “painel de suporte” (ops script + HTTP interno mínimo)

### Frontend (Blocos 6–7)

- Package `admin`: Index de auditoria + Index/FormDialog de DSR + UX de export do tenant
- Nav Configurações: Auditoria (`audit.read`) e Privacidade (`data.export`)
- Relatório de acessos na ficha do paciente (OWNER)
- **Não inclui** novos endpoints de domínio — consome Blocos 1–5
- **Não inclui** tela de break-glass para a clínica (Owner só vê o rastro na auditoria + e-mail)
- **Não inclui** NPS automático no produto (fase 2) — piloto usa pesquisa manual

---

## Estado atual do código (herança S0–S7)

Usar; **não** reimplementar.

| Já existe | Onde | Uso na S8 |
| --- | --- | --- |
| Tabela `audit_log` + RLS | Prisma S0 | Base da consulta; falta trigger append-only + índice por paciente |
| `writeAuditLog` / `writeAuditLogSafe` | `shared/database/write_audit.ts` | Estender ações; **não** fork |
| `auditRead` middleware | `shared/middlewares/audit_read.middleware.ts` | Já cobre GET clínico (action `READ`) |
| Eventos auth / convite / permissão | identity S1 | LOGIN, LOGOUT, ROLE_CHANGED, etc. |
| `REPORT_EXPORTED` | reporting S7 | Padrão de audit de export |
| `GET /health` (liveness) | `app.ts` + `health.routes.ts` | Completar com `/ready` |
| Outbox + BullMQ | S3+ | Job export tenant; e-mail DSR/break-glass |
| ObjectStorage presign | S4 | ZIP / pacote do paciente |
| Export assíncrono de **relatório** | `reporting` S7 (`report_export`, 15 min) | **Não** reusar tabela; export LGPD é outro agregado (7 dias) |
| Permissões `audit.read` / `data.export` | identity S1 | Só passar a usar |
| Envelope AES-GCM clínico | S4 | Decrypt **só** no job de export autorizado (Owner) |
| `subscriptionGuard` | S7 | Export LGPD permanece permitido em SUSPENDED/EXPIRED |
| FE package `admin` (Dashboard, Report, Subscription) | frontend S7 | Auditoria + Privacidade = novas entidades no mesmo package |
| Aceite HTTP `backend/tests/` | S6/S7 | Novos scripts `platform/` |
| Schema `platform` (helper RLS) | S0 | Tabelas de suporte (`support_access`) **sem** RLS de tenant |

**Entregar nesta sprint:** HTTP auditoria + DSR + export tenant; pacote do paciente; anonimização; break-glass; `/ready`; UI Owner; k6 representativo; runbooks; kickoff de 1 piloto.

**Pós-código (ainda aberto, não é aceite S8 de software):** mês inteiro do piloto e NPS ≥ 50 (M5 completo); revisão jurídica ToS/DPA (dependência externa); M3 se a clínica-piloto ainda não usou prontuário de verdade; gateway de cobrança (ADR futuro).

**Alinhar docs/08:** preencher §2.10 `audit-logs`, `privacy/*`, `/ready` (hoje só o esqueleto das rotas). Alinhar docs/09 com rotas `/app/auditoria` e `/app/privacidade`. Alinhar docs/16: listar superfície HTTP `platform` (ver corte #3).

---

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E11](../../requisitos/funcionais/11-plataforma-lgpd.md) | Must 03..08, 13..14, 09; Should 12 |
| [Jornada J10](../../03-personas-jornadas.md) | DSR + pacote + anonimização com guarda |
| [Módulo platform](../../modulos/10-billing-saas.md) | §7 auditoria / export / DSR / break-glass / flags |
| [Segurança/LGPD](../../10-seguranca-lgpd-compliance.md) | §5.4 eventos; §6 direitos; §7 retenção; checklist §10 |
| [Baseline segurança](../../17-seguranca-baseline.md) | §5 audit; §6 anomalias; `/ready` |
| [Multi-tenancy §9](../../06-multi-tenancy.md) | Break-glass 4 olhos; `platform_audit_log` |
| [API v1 §2.10](../../08-api-v1.md) | Contratos; preencher payloads no PR do bloco |
| [Modelo § audit / DSR](../../07-modelo-de-dados.md) | `audit_log`, `data_subject_request` |
| [Frontend](../../09-frontend.md) | Rotas Owner; package `admin` |
| [Pastas](../../16-estrutura-de-pastas.md) | `platform` transversal; `write_audit` em `shared/` |
| [Identidade — matriz](../../modulos/01-identidade-acesso.md) | `audit.read`, `data.export` (só OWNER) |
| [Qualidade §6](../../12-qualidade-testes.md) | k6; volume; ZAP |
| [Infra §9 / §11](../../11-infra-devops.md) | Backup/PITR; runbooks |
| [RNF-PERF / RNF-PRIV](../../requisitos/nao-funcionais/requisitos-nao-funcionais.md) | p95; direitos do titular |
| [S7](./S7-inbox-relatorios-billing-saas.md) | Export de relatório ≠ export LGPD; subscriptionGuard |
| [S0](./S0-fundacao.md) | Esqueleto `audit_log` + RLS + `/health` |
| [S4](./S4-prontuario.md) | `auditRead`; envelope; append-only de evolução |

---

## Decisões de corte (fechadas no planejamento)

1. **Must nesta sprint:** RF-E11-03 (audit consultável), RF-E11-04 (eventos obrigatórios que ainda faltam), RF-E11-05 (export tenant), RF-E11-06 (DSR com `due_at`), RF-E11-07 (pacote ACCESS), RF-E11-08 (anonimização com guarda), RF-E11-09 (`/ready`), RF-E11-13/14 (break-glass). Should: RF-E11-12, anomalias §6, ZAP. Se estourar tempo, **ordem de escorrega** (último → primeiro a cair): RF-E11-12 → ZAP no CI → anomalias → particionamento de `audit_log` → job automático de anonimização (DSR `DELETION` ainda **registra** e conclui com resolução manual). **Não** escorregar `GET /audit-logs`, export tenant, DSR `ACCESS` com pacote, recusa de break-glass sem 2º aprovador, `/ready`.
2. **M5 nesta sprint = prontidão, não o mês inteiro:** aceite de software = 1 clínica opera o ciclo (agendar → confirmar → atender → orçar → receber) em ambiente de piloto **sem bloqueio conhecido**. “1–3 clínicas o mês inteiro + NPS” começa no kickoff e fecha **após** a S8. NPS do piloto = pesquisa manual (planilha/form); **não** construir produto de NPS (fase 2).
3. **Onde vive o HTTP de platform:** `writeAuditLog` permanece em `shared/database/` (já tem N consumidores). Superfície HTTP + jobs + DDL de DSR/export/break-glass → módulo `backend/src/modules/platform/` (`platform.module.ts` + `platform_public.ts`) no mesmo padrão Orius das outras rotas. Não é BC de negócio; é transversal com HTTP. Atualizar [docs/16](../../16-estrutura-de-pastas.md) no PR do Bloco 1 (listar `platform` na superfície HTTP; gravação de audit continua shared). `platform` **não** importa internals de `patients` / `clinical_records` / `billing` / `messaging` — lê via `*_public` mínimo ou queries read-only no próprio repositório de export.
4. **Export LGPD ≠ export de relatório:** **proibido** reusar `report_export` / rotas `POST /reports/:report/export`. Nova tabela `tenant_export` (ou nome do módulo §7.3) com status `PENDING|RUNNING|READY|FAILED`, `storage_key`, URL assinada **7 dias** (módulo 7.3 — não 15 min). `POST /privacy/exports` → `202` + `exportId`; `GET /privacy/exports/:id`. Audit `EXPORT_REQUESTED` / `EXPORT_COMPLETED`. ZIP: JSON estruturado + CSVs + anexos originais do **próprio** tenant. Cross-tenant → `404`. SUSPENDED/EXPIRED: export **liberado** (`subscriptionGuard` já permite).
5. **Decrypt no export:** o job roda em contexto do tenant + ator OWNER (`data.export`). Campos em envelope (evolução, anamnese, alerta) saem em plaintext **dentro do ZIP**. DEK/KEK nunca no arquivo nem no log. Falha de decrypt de uma linha → marca o item e segue (não derruba o ZIP inteiro); `FAILED` só se a geração quebrar de ponta a ponta.
6. **Contrato auditoria:** `GET /api/v1/audit-logs?patientId=&actorId=&action=&from=&to=&cursor=&limit=` (`audit.read`, OWNER). Paginação cursor; teto `limit` 100; período máximo 366 dias → `422 PERIOD_TOO_LONG`. Payload **sem** corpo clínico, senha, token, DEK, CPF completo (corte docs/17 §5.3). Relatório “quem acessou o paciente X” = o mesmo endpoint com `patientId`. `audit_log` ganha trigger PG bloqueando `UPDATE`/`DELETE` (como `clinical_note`); `GRANT` de `app_user` vira `SELECT, INSERT` apenas. Índice `(tenant_id, patient_id, created_at DESC)` onde `patient_id IS NOT NULL`.
7. **Eventos Must a completar (não reescrever os que já existem):** hoje há `READ` (auditRead), auth/convite, `REPORT_EXPORTED`, download de anexo. Faltam no mínimo: `NOTE_CREATED` / `NOTE_AMENDED`, `MESSAGE_SENT` (template + destinatário mascarado, sem corpo), `EXPORT_*`, `DSR_*`, `SUPPORT_ACCESS_*`. Mapear `READ` clínico → documentar como `CLINICAL_READ` no contrato (alias no GET ou gravar action `CLINICAL_READ` daqui pra frente + filtro aceita os dois). **Não** backfill histórico.
8. **DSR:** tabela `data_subject_request` (docs/07). Tipos `ACCESS|CORRECTION|DELETION|PORTABILITY|REVOKE_CONSENT`. Status `RECEIVED|IN_PROGRESS|COMPLETED|REJECTED`. `due_at` = `requested_at` + **15 dias** (doc 10; constante de env `DSR_DUE_DAYS` default 15). `ACCESS` e `PORTABILITY` disparam job de pacote do paciente (PDF + JSON). `REVOKE_CONSENT` chama `patients_public` (revoga marketing; transacional segue). `CORRECTION` = registro + link para a ficha (clínica edita cadastro; clínico via amend — **não** editar evolução aqui). `DELETION` → Bloco 4. Job `dsr-due-reminder` (D-3 / D-0) e-mail ao Owner. Só OWNER (`data.export`).
9. **Pacote do paciente (RF-E11-07):** um paciente, não o tenant. PDF legível (capa + dados cadastrais + agenda + financeiro resumido + evoluções + lista de anexos) + JSON espelhado. Sem dado de outro paciente. Sem diagnóstico em nome de arquivo. Presign 7 dias. Ligado ao DSR (`export_key`).
10. **Anonimização (RF-E11-08):** **não** é `DELETE` de prontuário. Substitui nome/telefone/e-mail/CPF/endereço por tokens irreversíveis; remove anexos **não** clínicos se houver política; revoga consents de marketing; mantém `clinical_note` / odontograma / anamnese / anexos clínicos com justificativa em `resolution` (“obrigação legal de guarda”). Agregados financeiros (`*_cents`, status) permanecem. Idempotente. Audit `TENANT_ANONYMIZED` só em job de tenant cancelado 90 d (Should/ops); no DSR do paciente o evento é `DSR_COMPLETED` tipo `DELETION`. Se o job automático escorregar: DSR fica `IN_PROGRESS` até o Owner concluir com texto — ainda Must registrar.
11. **Break-glass (RF-E11-13/14):** suporte **não** tem membership no tenant. Grant em schema `platform` (`support_access`: requester, approver ≠ requester, tenant_id, reason ≥ 20 chars, `expires_at` ≤ now+4h, scope mínimo). Sem 2º ator → recusa. HTTP interno ` /api/v1/internal/support-access` **ou** script `backend/scripts/ops-support-access.ts` (mesmo padrão de `ops-subscription-status.ts`). Ator autenticado com `user.platformRole = OPERATOR` (coluna nova, default null) **ou** allowlist `PLATFORM_OPERATOR_EMAILS`. Com grant ativo: header `X-Support-Grant-Id` + `X-Tenant-Id` assume contexto; cada request grava `SUPPORT_ACCESS_USED`. E-mail Resend ao Owner no `GRANTED`. **Sem UI** de suporte nesta sprint. Owner vê o rastro em `/app/auditoria`.
12. **`/ready`:** `GET /api/v1/ready` (e opcionalmente `/ready` na raiz, como `/health`). Checa Postgres (`SELECT 1`), Redis (`PING`), storage (head de bucket ou equivalente barato). `200` se todos ok; `503` com `{ db, redis, storage }` booleanos **sem** connection string. Liveness `/health` permanece burro (processo no ar). Worker já tem `/health` — não precisa de ready no worker neste sprint.
13. **Carga (RNF-PERF):** **não** seedar 500 tenants nesta sprint. Corte representativo: **1 tenant** com ≥ 10k pacientes e ≥ 5k agendamentos (meta 50k pacientes fica como teto do script, não do gate). k6 em `k6/` (ou `backend/tests/load/`): busca de paciente, agenda do dia, dashboard. Gate local: p95 busca < 300 ms; agenda do dia < 1 s com 200 itens no dia; dashboard p95 < 400 ms a 20 VUs. 50 req/s × 500 tenants = teste de escala **pós-piloto**, não aceite S8.
14. **Backup:** ensaio de restore documentado (runbook) contra dump local/staging — **não** automatizar PITR na Hostinger neste bloco se já existir snapshot da VPS. Registrar RTO medido. Sem isso o checklist §10 do doc 10 não fecha.
15. **Feature flags (Should):** tabela `feature_flag` (global + override tenant) **só** se sobrar tempo no Bloco 5. Kill switch de WhatsApp **já existe** (S3) — não duplicar. Sem SDK de terceiro.
16. **Anomalias (Should):** job que conta `READ`/`CLINICAL_READ` por ator em 5 min; acima de N=40 grava `ANOMALY_TRIGGERED` + log/Sentry. **Não** bloqueia o usuário. Sem ML.
17. **Particionamento mensal de `audit_log`:** Could. Índice + append-only bastam no MVP; particionar depois se o piloto encher a tabela.
18. **Jurídico (ToS / Política / DPA):** dependência externa (docs/13 §5). Checklist de produto aponta “pendente jurídico”; **não** inventar textos legais no código. Checkbox de ciência WhatsApp já existe (S3).
19. **Carry-overs explícitos fora dos blocos:** M3 S4; `appointment.treatment_item_id` → `SCHEDULED`; RF-E7-19; Stripe; NPS in-app; MFA.
20. **Papéis:** só OWNER tem `audit.read` e `data.export`. DENTIST/RECEPTION/ASB/FINANCE → `403` nas rotas S8 + sem itens de nav. Relatório de acesso na ficha: `Can audit.read`.
21. **arch:check:** `platform` ↛ internals dos BCs; BCs continuam podendo chamar `writeAuditLog` em shared (gravação). Export lê via `*_public` / SQL read-only.
22. **PII / logs:** zero dump de ZIP, PDF, evolução, DEK. Telefone/CPF mascarados em audit metadata. Money em cents inteiros nos CSVs financeiros do ZIP.

---

## Fora desta sprint

- MFA TOTP (fase 2) e SSO (fase 3)
- API pública para terceiros / webhooks de saída (RF-E11-17)
- Importador de concorrentes (RF-E11-19 / fase 2)
- Assinatura digital ICP-Brasil / NGS2 / “elimine o papel”
- Pentest externo, mTLS API↔worker, WAF custom
- Checkout Stripe / MP / Asaas
- Campanhas, chatbot IA, BI, NFS-e, comissão, régua de cobrança
- `SCHEDULED` treatment item (carry-over S5)
- RF-E7-19 bloqueio agenda inadimplente (Could)
- NPS automático no produto
- UI de painel interno de suporte / operadores
- Particionamento de `audit_log` e arquivo frio 5 anos (ops posterior)

---

## Arquitetura técnica

```
HTTP autenticado
  → authenticate → tenantContext → subscriptionGuard → authorize
  → GET  /audit-logs                 (E11-03)
  → POST/GET /privacy/data-subject-requests
  → POST /privacy/exports  → 202
  → GET  /privacy/exports/:id
  → GET  /ready                      (sem auth)

Ops / interno
  → POST /internal/support-access    (2 atores)
  → requests com X-Support-Grant-Id  → tenantContext assume tenant
  → audit SUPPORT_ACCESS_USED

Job tenant-export
  → tenant_export PENDING
  → ZIP (JSON + CSV + anexos) → storage → READY
  → GET signed URL 7d

Job patient-package (DSR ACCESS)
  → PDF + JSON → storage → DSR.export_key

DSR DELETION
  → Action anonimiza identificadores
  → prontuário permanece + resolution

Trial/cancel 90d (ops)
  → anonimização de tenant (Should/script)
```

### Pastas-alvo (docs/16 + snake do repo)

```
backend/src/
  modules/platform/                         # NOVO (HTTP transversal)
    platform.module.ts
    platform_public.ts
    routes/v1/audit.routes.ts
    routes/v1/privacy.routes.ts
    routes/v1/ready.routes.ts               # ou estender health.routes
    routes/v1/internal_support.routes.ts
    controllers/…
    services/audit|dsr|tenant_export|support_access/…
    repositories/…
    jobs/tenant_export.job.ts
    jobs/patient_package.job.ts
    jobs/dsr_due_reminder.job.ts
  shared/database/write_audit.ts            # estender ações
  shared/middlewares/
    audit_read.middleware.ts                # já
    support_grant.middleware.ts             # novo, opcional
  scripts/ops-support-access.ts

frontend/src/
  app/(app)/app/auditoria/page.tsx
  app/(app)/app/privacidade/page.tsx
  packages/admin/…/AuditLog
  packages/admin/…/DataSubjectRequest
  packages/admin/…/TenantExport
  packages/operacional/… ficha: seção acessos se audit.read
```

Preferência FE: tudo no package `admin` (como Subscription/Report na S7). Ficha do paciente pode mostrar “Acessos” via Data próprio em `operacional` **sem** importar `admin` — ou link para `/app/auditoria?patientId=`. **Corte:** link com query na auditoria; não duplicar Index na ficha. Se a ficha precisar da lista embutida, Data em `operacional` chamando o mesmo endpoint.

Action **somente** quando há efeito além do repositório (ZIP, PDF, outbox, e-mail, anonimização multi-tabela, grant de suporte).

### RLS / ator

- `audit_log`, `data_subject_request`, `tenant_export`: RLS tenant; cross-tenant → `404`.
- `platform.support_access` / `platform_audit_log`: **sem** RLS de tenant; role de plataforma; nunca exposto em `GET /audit-logs` de outro tenant — o Owner vê uma linha espelhada em `audit_log` do próprio tenant (`SUPPORT_ACCESS_GRANTED`).
- Grant expirado → middleware ignora; requests seguintes não assumem tenant.
- `audit_log`: INSERT+SELECT; trigger recusa UPDATE/DELETE.

---

## Contratos HTTP (S8) — esqueleto

Envelope `{ data }` / `{ error }`; camelCase; UUID v7. Preencher `docs/08` §2.10 no PR do bloco.

### Auditoria (`audit.read`)

```
GET    /api/v1/audit-logs     ?patientId=&actorId=&action=&from=&to=&cursor=&limit=
```

### Privacidade (`data.export`)

```
GET    /api/v1/privacy/data-subject-requests          ?status=&type=&cursor=
POST   /api/v1/privacy/data-subject-requests          { patientId, type, notes? }
PATCH  /api/v1/privacy/data-subject-requests/:id      { status?, resolution? }  # concluir/rejeitar
GET    /api/v1/privacy/data-subject-requests/:id

POST   /api/v1/privacy/exports                        → 202 { exportId, status }
GET    /api/v1/privacy/exports/:id                    { status, url?, expiresIn?, error? }
```

### Ready (público, sem PII)

```
GET    /api/v1/ready
GET    /ready                                         # opcional, espelho da raiz /health
```

### Interno — break-glass

```
POST   /api/v1/internal/support-access                { tenantId, reason, hours? }  # request
POST   /api/v1/internal/support-access/:id/approve    # 2º ator
GET    /api/v1/internal/support-access/:id
```

Erros estáveis: `403 FORBIDDEN`, `404 NOT_FOUND`, `409 IDEMPOTENCY_KEY_REUSED` (export), `409 APPROVAL_REQUIRED` / `SELF_APPROVAL_FORBIDDEN`, `422 PERIOD_TOO_LONG` / `REASON_TOO_SHORT` / `GRANT_WINDOW_INVALID`, `503 NOT_READY`.

---

## DDL (migração S8) + RLS

| Tabela / alteração | Notas |
| --- | --- |
| `audit_log` | Trigger append-only; `GRANT` só SELECT+INSERT; índice por paciente; `actor_type` inclui `SUPPORT` |
| `data_subject_request` | Nova; RLS tenant; FKs patient/handled_by |
| `tenant_export` | Nova; status; `storage_key`; RLS tenant |
| `platform.support_access` | Fora do tenant RLS; requester ≠ approver; `expires_at` |
| `platform.platform_audit_log` | Opcional se `support_access` + espelho em `audit_log` do tenant já cobrirem; **não** duplicar se o espelho bastar |
| `user.platform_role` | Nullable `OPERATOR`; default null. Sem isso, allowlist por e-mail no env |
| Views | Nenhuma obrigatória |

---

## Jobs e eventos

| Job / evento | Fila | Notas |
| --- | --- | --- |
| `tenant-export` | `platform` | ZIP; READY/FAILED; idempotente por `exportId` |
| `patient-package` | `platform` | PDF+JSON do DSR ACCESS/PORTABILITY |
| `dsr-due-reminder` | `platform` | D-3 e D-0; e-mail Owner |
| `anomaly-clinical-read` | `platform` | Should; N=40 / 5 min |
| `support_access_granted` (outbox) | já messaging/e-mail | Resend ao Owner |
| `platform.data_export_completed` | outbox | Audit + UI poll |

---

## Fluxos (domínio + UX)

### A. Auditoria (RF-E11-03/04)

**Backend:** list filtrável; append-only; eventos clínicos/mensagem/export.

**Frontend:** `/app/auditoria` Index (filtros + tabela). Query `?patientId=` a partir da ficha. Sem edição.

### B. Export do tenant (RF-E11-05)

**Frontend:** `/app/privacidade` botão “Exportar dados da clínica” → poll até READY → Baixar / copiar URL. Copy: arquivo contém dados de pacientes — tratar como confidencial.

### C. DSR + pacote (RF-E11-06/07)

**Frontend:** lista de solicitações + FormDialog (paciente, tipo). ACCESS mostra link do pacote quando READY. Banner se `due_at` < 3 dias.

### D. Break-glass (RF-E11-13/14)

**Ops:** script/HTTP interno. Clínica não solicita pelo app. Owner recebe e-mail e vê linha na auditoria.

---

## Blocos de entrega

### Bloco 1 — Backend: auditoria consultável + append-only

- [x] `GET /audit-logs` com filtros + cursor + teto de período
- [x] Trigger append-only + GRANT SELECT/INSERT + índice paciente
- [x] Estender `AuditAction` (NOTE_*, MESSAGE_SENT, CLINICAL_READ alias, EXPORT_*, DSR_*, SUPPORT_*)
- [x] Gravar NOTE_CREATED / NOTE_AMENDED e MESSAGE_SENT (sem corpo)
- [x] Smoke `test:platform-audit`
- [x] Atualizar docs/08 §2.10 + docs/16 (módulo `platform`)

### Bloco 2 — Backend: exportação completa do tenant

- [x] DDL `tenant_export` + RLS
- [x] `POST /privacy/exports` → 202; job ZIP (JSON + CSV + anexos); `GET /privacy/exports/:id` URL 7 dias
- [x] Decrypt clínico só no job; outro tenant 404; SUSPENDED ainda exporta
- [x] Audit `EXPORT_REQUESTED` / `EXPORT_COMPLETED`
- [x] Smoke `test:platform-export` (ZIP do tenant A sem linhas do B)
- [x] docs/08 §2.10

### Bloco 3 — Backend: DSR + pacote do paciente

- [x] DDL `data_subject_request` + RLS
- [x] CRUD DSR; `due_at`; job reminder
- [x] ACCESS/PORTABILITY → job PDF+JSON; `export_key`
- [x] REVOKE_CONSENT via `patients_public`
- [x] CORRECTION = registro (sem reescrever evolução)
- [x] Smoke `test:platform-dsr`
- [x] docs/08 §2.10

### Bloco 4 — Backend: anonimização + break-glass

- [x] Action de anonimização (identificadores; prontuário permanece; `resolution`)
- [x] DSR `DELETION` dispara a Action (ou conclusão manual se escorregar o job — explícito no aceite)
- [x] DDL `platform.support_access`; requester ≠ approver; ≤ 4 h
- [x] Script e/ou `POST /internal/support-access` + approve
- [x] Sem grant → suporte não lê tenant (404)
- [x] E-mail Owner + audit `SUPPORT_ACCESS_GRANTED` / `USED`
- [x] Smoke `test:platform-support` (sem 2º ator = recusa; grant expirado = 404)
- [x] docs/08 + docs/06 alinhados

### Bloco 5 — Backend: `/ready` + carga + endurecimento

- [x] `GET /ready` (db/redis/storage) → 200/503
- [x] Script k6 + seed de volume (10k pacientes / 5k appointments no tenant de carga)
- [x] Runbooks em `docs/runbooks/` (restore, WAHA down, tenant suspenso por engano, credencial vazada, suspeita cross-tenant)
- [x] Ensaio de restore documentado (tempo medido)
- [x] Should: job de anomalia de leitura clínica; feature_flag **não** entra se o bloco estourar
- [x] Smoke `test:ready`

### Bloco 6 — Frontend: auditoria

- [x] `/app/auditoria` Page → Component → Hook → Service → Data
- [x] Filtros paciente/ator/ação/período; empty/403
- [x] Nav Configurações se `audit.read`; DENTIST sem item
- [x] Deep-link `?patientId=` a partir da ficha (OWNER)
- [x] E2E `e2e/audit-logs.spec.ts` (owner vs recepção)

### Bloco 7 — Frontend: privacidade (DSR + export tenant)

- [x] `/app/privacidade` Index DSR + FormDialog + UX export tenant (poll + download)
- [x] Banner `due_at` próximo; copy de confidencialidade do ZIP
- [x] Nav se `data.export`
- [x] E2E `e2e/privacy.spec.ts` (owner)

---

## Endpoints-alvo (resumo)

```
GET             /api/v1/audit-logs
GET|POST|PATCH  /api/v1/privacy/data-subject-requests[/:id]
POST            /api/v1/privacy/exports
GET             /api/v1/privacy/exports/:id
GET             /api/v1/ready

POST            /api/v1/internal/support-access
POST            /api/v1/internal/support-access/:id/approve
```

**Backend — aceite de código**

- [ ] Owner lista audit do próprio tenant; outro tenant 404; recepção 403
- [ ] `UPDATE`/`DELETE` em `audit_log` falha no banco
- [ ] Leitura de prontuário aparece na lista (patientId preenchido)
- [ ] Export A não contém paciente/anexo de B; ZIP abre (JSON+CSV)
- [ ] SUSPENDED ainda exporta
- [ ] DSR ACCESS gera pacote de **um** paciente; due_at = +15 d
- [ ] DSR DELETION não apaga evolução; identificadores somem
- [ ] Break-glass sem 2º ator recusado; com grant ≤ 4 h + e-mail + audit
- [ ] Sem grant, operador não lê dado de tenant
- [x] `/ready` 200 com deps no ar; 503 se Redis down (API de liveness `/health` continua 200)

**Frontend — aceite de código**

- [x] OWNER filtra auditoria por paciente e vê leitura clínica
- [x] OWNER pede export e baixa quando READY
- [x] OWNER registra DSR ACCESS e obtém o pacote
- [x] RECEPTION/DENTIST sem nav Auditoria/Privacidade
- [x] Ficha do paciente (OWNER) chega na auditoria filtrada

---

## Qualidade

- CI: lint, typecheck, arch:check, migrate, `test:rls` (novas tabelas), smokes platform-audit / export / dsr / support / ready
- Domínio: append-only audit; export at-least-once por `exportId`; anonimização idempotente
- Integração: 2 tenants → ZIP A sem B; DSR de paciente B invisível em A
- Resiliência: MinIO down → export FAILED sem corromper o `202`; Redis down → `/ready` 503, `/health` 200
- k6 local com seed de volume (corte #13); **não** exigir 500 tenants
- E2E Playwright workers=1; owner vs recepção
- Envelope `{ data }` / `{ error }`; camelCase; UTC no banco
- arch:check: `platform` sem cycles proibidos
- Logs: **zero** dump de ZIP / PDF / evolução / DEK / grant token

---

## Aceite de produto (código + demo local + prontidão de piloto)

- [ ] Owner abre `/app/auditoria`, filtra a paciente seed e vê quem leu o prontuário
- [ ] Owner exporta a clínica e o ZIP contém pacientes/agenda/financeiro **só** dela
- [ ] Owner registra um DSR de acesso e baixa o pacote PDF+JSON da Maria
- [ ] DSR de eliminação anonimiza contato e **mantém** a evolução
- [ ] Tentativa de break-glass sozinho falha; com 2º operador, Owner recebe e-mail e a linha aparece na auditoria
- [x] `/ready` verde com Compose no ar
- [ ] k6 do corte #13 passa no ambiente local/staging
- [x] Restore ensaiado e runbooks publicados em `docs/runbooks/`
- [ ] Lista de bloqueios de software do piloto = vazia (bugs P0/P1 do ciclo completo corrigidos neste buffer)
- [ ] 1 clínica-piloto consegue executar o ciclo completo (kickoff). Mês inteiro + NPS = acompanhamento pós-S8 (M5 completo)

Checklist doc 10 §10 que **depende de jurídico** (ToS/DPA/DPO/ROPA) permanece explícito como bloqueio externo — não impede o aceite de **código**.

Não reabrir M4 (já local). M3 pode coincidir com o piloto.

---

## Bloqueios

| Risco | Mitigação |
| --- | --- |
| ZIP LGPD vaza tenant vizinho | Smoke 2 tenants + RLS; decrypt só no contexto A |
| Anonimização apaga prontuário | Corte #10: guarda obrigatória; testes de nota sobrevivendo |
| Break-glass vira backdoor | 2 atores + 4 h + e-mail + sem UI; allowlist pequena |
| k6 500 tenants explode a sprint | Corte #13: 1 tenant representativo |
| M5 “mês inteiro” não cabe em 2 semanas | Corte #2: S8 = prontidão + kickoff |
| Módulo `platform` vs docs/16 “vive em shared” | Corte #3: HTTP no módulo; `write_audit` shared; atualizar docs/16 |
| Revisar ToS/DPA atrasa piloto | Checklist jurídico separado; não inventar texto legal |
| Escopo explode com flags/ZAP/anomalias | Ordem de escorrega #1 |
| Decrypt em lote no export é lento | Job async; falha pontual não derruba o ZIP (corte #5) |
| Ops ativar grant sem trilha | Mesmo padrão do script de subscription: audit obrigatório |

## Notas

- Seed e2e: OWNER + Maria com ao menos 1 `clinical_note` e 1 `audit_log` READ; segundo tenant para isolamento do ZIP.
- Package `admin` **não** importa `clinico`/`operacional`; ficha só navega por URL.
- Aceite HTTP: `backend/tests/platform/`.
- Playwright: auditoria e privacidade usam **owner**; recepção só o 403/nav oculta.
- k6 e seed de volume **não** rodam no CI de PR por padrão (tempo/custo); script documentado + job nightly opcional depois.
- Em dúvida de produto/DDL/contrato **não** fechada acima → **perguntar** antes de implementar (não improvisar MFA, painel de suporte, apagar prontuário, nem sequestrar dados na suspensão).
