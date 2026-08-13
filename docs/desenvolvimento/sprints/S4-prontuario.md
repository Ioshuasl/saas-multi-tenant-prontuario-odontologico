# Sprint 4 — Prontuário clínico (E5 Must)

**Objetivo verificável:** Dentista abre atendimento a partir da agenda → vê alertas CRITICAL fixos + odontograma FDI + registra evolução assinada (imutável) + anexa imagem/PDF; paciente responde anamnese por `/anamnese/{token}` antes da consulta. Marco **M3:** dentista registra 10 atendimentos consecutivos só no sistema (sem papel).

**Escopo:** Must de E5 (anamnese + alertas + odontograma + evolução append-only + anexos + tela de atendimento). Sem orçamento/plano (E6 → S5). Sem inbox E8b.  
**Pontos (roadmap):** ~50 · Épico E5 · Marco M3 · [docs/13](../../13-roadmap-estimativas.md)

**Pré-requisito:** S3 código Must (patients + appointments + status `IN_SERVICE`/`COMPLETED` + outbox/worker + `public_booking_token` + KMS + MinIO no Compose). Aceite E2E fake / M2 (WABA real) **não** bloqueiam S4.

**Estado (2026-08-13):** Blocos 1–7 + aceite de código (smokes + E2E locais). CI ainda sem smokes S4. Marco **M3** (uso real) pendente explícito.

---

## Camadas (obrigatório em toda sprint)

| Camada | Nesta sprint | Onde |
| --- | --- | --- |
| **Backend** | Sim — `clinical_records`, envelope crypto, storage presign, anamnese pública (Blocos 1–5) | `backend/` |
| **Frontend** | Sim — `public` anamnese + `admin` formulário + `clinico` atendimento (Blocos 6–7) | `frontend/` |

Não misturar: um bloco é **só backend** ou **só frontend**, salvo contrato (`contracts/` / `docs/08`). Cruzar BC só por `*_public.ts` + outbox (nunca import direto `clinical_records` ↔ `scheduling` / `patients` / `treatments`).

### Backend (Blocos 1–5)

- DDL + RLS `medical_record`, `anamnesis_*`, `clinical_alert`, `tooth_state(+history)`, `clinical_note`, `attachment`
- Envelope AES-256-GCM nos campos clínicos (docs/07 §14 + ADR-0007)
- Trigger imutável em `clinical_note`; `PATCH`/`DELETE` → `423 RECORD_IMMUTABLE`
- Anamnese pública por token (`purpose=ANAMNESIS`, 7 dias, one-shot)
- Upload anexo via URL pré-assinada (MinIO/S3); cota fake até E10
- **Não inclui** telas Next.js
- **Não inclui** `treatments` / quotes / execução de item de plano (S5)
- **Não inclui** assinatura ICP-Brasil / NGS2 (fase 2)

### Frontend (Blocos 6–7)

- Package `public`: `/anamnese/[token]` (mobile-first, sem AppShell)
- Package `admin`: CRUD versões do formulário de anamnese
- Package `clinico`: tela de atendimento (alertas + odontograma + evolução + anexos)
- Package `operacional`: aba Prontuário na ficha (só com `clinical_records.read`); agenda “Iniciar atendimento”
- **Não inclui** novos endpoints de domínio — consome Blocos 1–5
- **Não inclui** painel de orçamento/plano (placeholder S5); comparação DICOM; receituário

---

## Estado atual do código (herança S0–S3)

Usar; **não** reimplementar.

| Já existe | Onde | Uso na S4 |
| --- | --- | --- |
| Paciente + timeline (só agenda) | `patients/` | Timeline ganha seção CLINICAL real; `patient_created` → `medical_record` |
| Status `IN_SERVICE` / `COMPLETED` | `status_machine.ts` | Atendimento abre no `IN_SERVICE`; evolução vincula `appointmentId` |
| `Professional.croNumber` / `croState` | clinic | Gate RF-E5-09 / RF-E2-12: sem CRO não assina |
| Permissões `clinical_records.read/write` | identity S1 | Recepção **sem** read (403 + audit); ASB só read; dentista write |
| `audit_log` esqueleto (`patient_id`) | Prisma S0 | `auditRead` em GET clínico |
| `tenant_crypto_key` + `KeyManagementPort` | shared/crypto | Envelope: encrypt/decrypt com DEK do tenant + AAD |
| `public_booking_token` | S3 | Estender `purpose` com `ANAMNESIS` (TTL 7 d) |
| Outbox + worker + BullMQ | S3 Bloco 1 | `patients.patient_created` → cria prontuário; thumbnail anexo |
| MinIO no Compose + env `STORAGE_*` | S0 / ADR-0008 | Port `ObjectStorage` (presign PUT/GET) |
| Package FE `clinico` stub | `frontend/src/packages/clinico/index.ts` | Estender; não criar package novo |
| Ficha paciente (tabs) | `operacional` PatientDetail | Nova tab **Prontuário** com `Can permission` |
| Rate limit + `publicTenantContext` | S3 | Reusar em `/public/anamnesis/:token` |
| Template messaging `anamnesis_request` (doc) | módulo E8 | Seed + send-link (WA se WABA; senão e-mail) |
| E2E Playwright workers=1 | `e2e/` | Specs: anamnesis + attendance (fake storage) |

**Entregue nesta sprint:** módulo `clinical_records/`; tabelas E5 + RLS; envelope nos 3 campos; `auditRead`; `ObjectStorage` port; rotas §2.5 + público anamnese; UI `clinico` + `/anamnese/[token]`; tab Prontuário; agenda “Iniciar atendimento”.

**Pós-código (ainda aberto):** plugar smokes S4 no `ci.yml`; Marco M3 uso real.

**Alinhar docs/07:** `attachment.category` no módulo lista `PHOTO_INTRAORAL` / `PHOTO_FACIAL` / `CONSENT_FORM` (DDL §5 só `PHOTO` genérico) — migração usa a lista do **módulo**. `attachment` ganha `deleted_reason` + `deleted_by` (RF-E5-15). `public_booking_token.purpose` inclui `ANAMNESIS`.

---

## Fontes

| Doc | Uso |
| --- | --- |
| [RF E5](../../requisitos/funcionais/05-prontuario.md) | Must RF-E5-01..16, 20; Should 17–19 |
| [RF E1-12 / E2-12](../../requisitos/funcionais/01-identidade-acesso.md) | Recepção sem prontuário; CRO para assinar |
| [Módulo clinical-records](../../modulos/05-prontuario.md) | Domínio, anamnese JSON, odontograma, note, anexos, testes §10 |
| [API v1 §2.5 + §3.6 + público](../../08-api-v1.md) | Contratos HTTP + presign |
| [Modelo §5 + §14 + trigger](../../07-modelo-de-dados.md) | DDL + envelope + imutabilidade |
| [Frontend §4.2](../../09-frontend.md) | Tela atendimento 3 áreas; package `clinico` |
| [Pastas](../../16-estrutura-de-pastas.md) | `clinical_records/`, `*_public.ts`, jobs |
| [Segurança / LGPD](../../10-seguranca-lgpd-compliance.md) | CFO: autor+CRO+timestamp; audit de leitura |
| [Baseline crypto](../../17-seguranca-baseline.md) | O que cifrar; decrypt só após RLS+RBAC |
| [ADR-0007](../../adr/0007-criptografia-envelope-tenant.md) · [ADR-0013](../../adr/0013-kms-local-vps.md) | Envelope + KEK local |
| [ADR-0008](../../adr/0008-hospedagem-vps-hostinger-s3.md) | S3/MinIO presign |
| [Infra §7](../../11-infra-devops.md) | Filas; job thumbnail em `platform` |
| [Identidade — matriz](../../modulos/01-identidade-acesso.md) | Papel × permissão |
| [S2](./S2-pacientes-agenda.md) / [S3](./S3-canal-paciente.md) | Pacientes, agenda, token público, outbox |

---

## Decisões de corte (fechadas no planejamento)

1. **Must E5 nesta sprint:** RF-E5-01..16 e RF-E5-20. Should: RF-E5-17 (templates locais no editor), RF-E5-18 (flag “anamnese desatualizada” >12 meses no GET record), RF-E5-19 (comparação lado a lado de fotos). Se estourar tempo, **último** a escorregar = RF-E5-19 — só com reclassificação explícita neste checklist.
2. **Orçamento / plano / executar item (E6, RF-E5-08, RF-E5-16 “plano”)** → **S5**. Tela de atendimento **não** lista itens de tratamento; painel direito = evolução (+ aviso “plano na S5”). Enum `tooth_state_history.source` já inclui `PROCEDURE_EXECUTION` (reservado); sem consumer `treatments.item_executed`.
3. **Assinatura:** eletrônica **simples** (`signature.type = SIMPLE`: userId, CRO, UF, IP, timestamp servidor). **Não** afirmar eliminação do papel (doc 10). ICP-Brasil / NGS2 → fase 2 (RF-E5-21).
4. **Envelope (RNF-CRYPTO-01):** obrigatório nos 3 campos (`clinical_note.content`, `anamnesis_response.answers`, `clinical_alert.description`). `content_hash` = SHA-256 do plaintext canônico **antes** de cifrar. Decrypt só em `repositories/` após RLS + RBAC. Helper novo em `shared/crypto/` (`encryptField` / `decryptField`) usando DEK unwrap do `KeyManagementPort` + AAD `tenantId|table|column|rowId`.
5. **MedicalRecord 1:1:** criar na **mesma UoW** do `patient` create via Action (`patients` chama `clinical_records_public.ensureRecord` **ou** outbox `patients.patient_created` consumido no dispatcher). Backfill no seed + script/migração para pacientes S2 já existentes. Unique `(tenant_id, patient_id)`.
6. **Token anamnese:** reusa `public_booking_token` com `purpose=ANAMNESIS`, TTL **7 dias**, one-shot (`used_at`). Sem PII na URL. Rate limit público (IP). Slug da clínica **não** autoriza — tenant vem do token/`publicTenantContext` se o path incluir slug; path canônico docs/08: `GET|POST /api/v1/public/anamnesis/:token` (sem slug).
7. **Send-link:** `POST .../anamnesis/send-link` gera token + tenta template `anamnesis_request` (utility) se WABA `CONNECTED`; fallback **e-mail** (Mailpit/Resend). Sem SMS. Clínica sem WA **não** bloqueia o link (copia URL absoluta `APP_PUBLIC_URL/anamnese/{token}`).
8. **Alertas:** `alertWhen` satisfeito na resposta → `ClinicalAlert` automático (`source=ANAMNESIS`). `CRITICAL` = fixo no topo, **não dispensável** (sem `dismiss`). `POST /alerts` manual (`source=MANUAL`) para WARNING/CRITICAL/INFO. `active=false` só para não-CRITICAL (Owner/Dentista). CRITICAL nunca `active=false`.
9. **Odontograma:** FDI permanente 11–48 + decídua 51–85; faces `M|D|V|L|O|C` ou `null` = dente inteiro. Condições: `HEALTHY|CARIES|RESTORED|ABSENT|EXTRACTED|IMPLANT|CROWN|ROOT_CANAL|SEALANT|FRACTURE`. PUT grava estado atual **e** linha em `tooth_state_history` (`source=MANUAL`). Coerência: `ABSENT`/`EXTRACTED` + restauração → `422` com código `TOOTH_STATE_CONFLICT` + campo `justification` opcional (≥10 chars) para forçar. Reconstrução histórica: `GET odontogram?at=ISO` aplica history até a data (Must dos testes §10).
10. **Evolução:** `content.trim().length >= 10`; profissional com `croNumber`; `appointmentId` opcional (atendimento sem consulta avulsa permitido). Sem use case update/delete. `amend`: motivo ≥10 chars → nova linha `version+1`, `supersedes_id`, `amend_reason`. Trigger PG bloqueia `UPDATE`/`DELETE` na tabela. API `PATCH`/`DELETE /notes/:id` → `423 RECORD_IMMUTABLE` + hint `/amend`.
11. **ASB (RF-E5-20):** matriz S1 **não muda** (`ASSISTANT` = `clinical_records.read` apenas). Anexar (presign + confirm) autoriza com **`clinical_records.read`**. Evolução / amend / odontograma write / alertas manuais / forms → **`clinical_records.write`**. DELETE anexo → `clinical_records.write` (ASB não apaga). Recepção/Financeiro → 403 em **todas** as rotas do módulo + `audit_log PERMISSION_DENIED`.
12. **Anexos:** allowlist MIME `image/jpeg|image/png|image/webp|application/pdf`; máx. **20 MB**/arquivo; cota tenant **1 GB** (`ATTACHMENT_QUOTA_BYTES`, default) até E10. Validar **antes** do presign (`402 PLAN_LIMIT_EXCEEDED` se estourar). Download URL 15 min. Exclusão lógica: `deleted_at` + `deleted_reason` (≥10) + `deleted_by`. Miniatura: job `generate-attachment-thumbnail` (só JPEG/PNG/WEBP); original intocado. DICOM → fase 3.
13. **Categorias anexo (corte DDL):** `XRAY | PHOTO_INTRAORAL | PHOTO_FACIAL | DOCUMENT | EXAM | CONSENT_FORM | OTHER`. Alinhar docs/07 §5 na migração (substitui `PHOTO` genérico).
14. **Criptografia vs busca:** alertas listáveis por `severity`/`category`/`active` (plaintext); `description` cifrado. Odontograma **não** cifra (`condition` é enum operacional).
15. **Audit de leitura (RF-E5-12):** middleware `auditRead` em GET record / notes / anamnesis / alerts / attachments / download. Grava `audit_log` com `patient_id`, `resourceType`, `action=READ`. Volume anômalo = fora desta sprint (só log).
16. **Pasta do módulo:** `backend/src/modules/clinical_records/` (snake, igual `patients`/`scheduling`) + `clinical_records_public.ts`. Desvio consciente vs hyphen `clinical-records` no docs/16.
17. **Rotas FE:** atendimento `/app/atendimento/[appointmentId]` (`clinico`); ficha `/app/pacientes/[id]` tab Prontuário; forms `/app/configuracoes/anamnese` (`admin`, `settings.write`); público `/anamnese/[token]` (`(public)`). Agenda: ação “Iniciar atendimento” → `IN_SERVICE` + navega.
18. **Rascunho de evolução (RF-E5-17):** **somente** `localStorage` no browser até assinar. **Proibido** persistir rascunho no servidor como `clinical_note`.
19. **Eventos:** `clinical_records` **publica** via outbox (`note_created`, `note_amended`, `odontogram_updated`, `critical_alert_created`, `attachment_created`). Consumers `treatments`/`billing`/`reporting` **não** existem ainda — só persistir outbox. Consumer `scheduling` para badge no card do agendamento = **Should** (não bloqueia aceite). Payload de job = IDs.
20. **Owner dentista:** OWNER com `clinical_records.write` só assina se o membership tiver `Professional.croNumber` (mesmo gate do DENTIST). OWNER sem CRO configura forms/anexos, não assina evolução.

---

## Fora desta sprint

- Orçamentos, plano de tratamento, `POST /treatment-items/:id/execute` (E6 → S5)
- Atualização automática do odontograma por execução de procedimento (RF-E5-08 → S5)
- Inbox WhatsApp / SSE agenda (S7 / RF-E4-20)
- Assinatura digital ICP-Brasil, receituário/atestado A1/A3 (RF-E5-21..22)
- Fichas por especialidade / ortodontia / HOF / IA (RF-E5-23..24)
- Billing real de cota / Stripe (E10); quota fake basta
- DICOM viewer; customer-managed key no bucket (fase 2)
- Exportação LGPD completa do prontuário (E11 / S8)
- Templates Meta além de `anamnesis_request` (orçamento/recibo continuam S5+)

---

## Arquitetura técnica

```
HTTP autenticado
  → authenticate → tenantContext → authorize(clinical_records.*)
  → [auditRead em GET clínico]
  → clinical_records (record / odontogram / notes / anamnesis / alerts / attachments)

HTTP público (sem JWT)
  → rateLimit(IP) → resolve token ANAMNESIS → RLS app.tenant_id
  → GET form+perguntas da versão | POST answers → alertas + used_at

Use case com efeito extra
  → Service → Action → UoW (agregado + outbox_event)   // NUNCA queue.add aqui

Evolução
  → domain ClinicalNote.create / amend (sem mutate content)
  → repo cifra content; grava content_hash plaintext
  → trigger PG recusa UPDATE/DELETE

Anexo
  → presign (valida tipo/tamanho/cota) → PUT direto no storage → confirm metadados
  → download: URL GET assinada 15 min + audit
```

### Pastas-alvo (docs/16 + snake do repo)

```
backend/src/
  shared/
    crypto/                    # encryptField / decryptField + KeyManagementPort (já existe wrap/unwrap)
    storage/                   # ObjectStorage port + MinIO/S3 adapter (presign PUT/GET)
  modules/clinical_records/
    models/                    # MedicalRecord, ClinicalNote, AnamnesisResponse, ToothState, Attachment
    jobs/   generate_attachment_thumbnail.job.ts
    clinical_records_public.ts # ensureRecord, getCriticalAlertsForAppointment (leitura p/ outros BC)
    clinical_records.module.ts
  modules/patients/
    actions/patient/patient_create.action.ts   # se ainda for Service puro: passar a Action + outbox/ensureRecord
  modules/scheduling/
    enum/.../public_booking_token_purpose.enum.ts  # + ANAMNESIS
    scheduling_public.ts       # getAppointmentForAttendance (IDs; sem clínico)

frontend/src/
  app/(public)/anamnese/[token]/page.tsx
  app/(app)/app/atendimento/[appointmentId]/page.tsx
  app/(app)/app/configuracoes/anamnese/page.tsx
  packages/public/…/Anamnesis
  packages/admin/…/AnamnesisForm
  packages/clinico/…/Attendance|Odontogram|ClinicalNote|Attachment|Alert
```

Action **somente** quando há efeito além do repositório (outbox, crypto+hash, outro BC, token consume). CRUD list de notes/alerts: `Service → Repository`.

### RLS / ator

- Todas as tabelas E5: `tenant_id` + `platform.enable_tenant_rls`.
- Anexo de outro tenant → `404` (não `403`).
- Ator público anamnese: sem `app.user_id`; `answered_by=PATIENT`; signature SIMPLE `{ ip, userAgent, hash }`.
- `appointment_history.actor_type`: dentista = `USER`; sistema = `SYSTEM` (já S2). Evolução não grava history de agenda salvo transição `IN_SERVICE`/`COMPLETED` na agenda.
- Slug/token inválido → `404 NOT_FOUND`.

---

## Contratos HTTP (S4) — payloads

Envelope `{ data }` / `{ error }`; camelCase; datas ISO com offset; UUID v7. Atualizar `docs/08` no mesmo PR do Bloco correspondente.

### Público (rate limit)

```
GET  /api/v1/public/anamnesis/:token
POST /api/v1/public/anamnesis/:token
```

| Chave | Janela | Max |
| --- | --- | --- |
| `public:anamnesis:ip:{ip}` | 1 h | 30 |

**GET token válido:**

```json
{
  "data": {
    "clinicName": "Clínica Teste",
    "patientFirstName": "Maria",
    "form": {
      "name": "Anamnese Geral",
      "version": 1,
      "questions": [{ "id": "allergy_meds", "label": "…", "type": "BOOLEAN_WITH_TEXT", "required": false }]
    },
    "expiresAt": "2026-08-20T15:00:00-03:00"
  }
}
```

Sem CPF, telefone completo, CRO, alertas, odontograma. Token usado/expirado/inexistente → `404` (mesmo shape).

**POST answers:** `{ "answers": { "allergy_meds": { "value": true, "text": "Dipirona" }, "main_complaint": "Dor no 26" } }`  
→ `{ "data": { "accepted": true } }` (200). Idempotente se `used_at` já setado. Validação: required + tipos da **versão do form no token**. Gera alertas + `medical_record` (já existe).

### Autenticado — prontuário (`clinical_records.read` / `.write`)

```
GET    /api/v1/patients/:patientId/record
GET    /api/v1/patients/:patientId/record/odontogram   ?dentition=PERMANENT|DECIDUOUS&at=
PUT    /api/v1/patients/:patientId/record/odontogram/teeth/:toothCode
GET    /api/v1/patients/:patientId/record/notes        ?cursor=&limit=
POST   /api/v1/patients/:patientId/record/notes
POST   /api/v1/patients/:patientId/record/notes/:id/amend
PATCH  /api/v1/patients/:patientId/record/notes/:id     → 423 RECORD_IMMUTABLE
DELETE /api/v1/patients/:patientId/record/notes/:id     → 423 RECORD_IMMUTABLE
GET    /api/v1/patients/:patientId/record/anamnesis
POST   /api/v1/patients/:patientId/record/anamnesis
POST   /api/v1/patients/:patientId/record/anamnesis/send-link
GET    /api/v1/patients/:patientId/record/alerts
POST   /api/v1/patients/:patientId/record/alerts
PATCH  /api/v1/patients/:patientId/record/alerts/:id    { active }  // não-CRITICAL
GET    /api/v1/patients/:patientId/attachments          ?category=
POST   /api/v1/patients/:patientId/attachments/presign
POST   /api/v1/patients/:patientId/attachments
GET    /api/v1/attachments/:id/download
DELETE /api/v1/attachments/:id                          { reason }
GET    /api/v1/anamnesis-forms
POST   /api/v1/anamnesis-forms                          // settings.write (nova versão)
```

**GET record (cabeçalho + alertas):**

```json
{
  "data": {
    "patientId": "…",
    "medicalRecordId": "…",
    "openedAt": "…",
    "anamnesisStale": false,
    "lastAnamnesisAt": "2026-08-01T10:00:00-03:00",
    "alerts": [
      { "id": "…", "severity": "CRITICAL", "category": "ALLERGY", "description": "Alergia a dipirona", "source": "ANAMNESIS", "active": true }
    ]
  }
}
```

`anamnesisStale=true` se última resposta > 12 meses ou inexistente (RF-E5-18).

**PUT dente:** `{ "dentition": "PERMANENT", "face": "O", "condition": "CARIES", "notes": null, "justification": null }`  
`toothCode` no path (`26`). Sem `face` = dente inteiro.

**POST note:** `{ "content": "…", "appointmentId": "…", "procedures": [{ "procedureId": "…", "tooth": "26", "face": "O" }] }`  
Resposta inclui `id`, `version`, `contentHash`, `signedAt`, `signature` (sem plaintext duplicado além de `content` decrypt na leitura).

**POST amend:** `{ "content": "…", "reason": "correção de face do 26" }`

**POST anamnesis (profissional):** mesmo shape de answers do público; `answered_by=PROFESSIONAL`.

**POST send-link:** `{ "channel": "WHATSAPP"|"EMAIL"|"COPY" }` → `{ "data": { "expiresAt", "sentVia", "publicUrl"? } }`. `COPY` só devolve URL (Owner/Dentista); não logar token plaintext no `audit_log` (só hash / last4).

**Presign / confirm:** docs/08 §3.6. Confirm: `{ "storageKey", "checksumSha256", "fileName", "mimeType", "sizeBytes", "category", "clinicalNoteId"? }`.

Erros estáveis: `403 FORBIDDEN`, `404 NOT_FOUND`, `409 INVALID_STATE_TRANSITION`, `422 BUSINESS_RULE_VIOLATION` (CRO ausente, note curta, amend sem motivo, dente conflito), `402 PLAN_LIMIT_EXCEEDED`, `423 RECORD_IMMUTABLE`, `415`/`422` tipo/tamanho inválido no presign.

---

## DDL (migração S4) + RLS

Todas com `tenant_id` + `platform.enable_tenant_rls`.

| Tabela / alteração | Notas |
| --- | --- |
| `medical_record` | unique `(tenant_id, patient_id)` |
| `anamnesis_form` | unique `(tenant_id, name, version)`; `questions` jsonb |
| `anamnesis_response` | `answers` text ciphertext; `form_version`; `signature` jsonb |
| `clinical_alert` | `description` ciphertext; `severity`/`category` plaintext |
| `tooth_state` | unique `(tenant_id, medical_record_id, dentition, tooth_code, face)` |
| `tooth_state_history` | append-only (sem trigger obrigatório; sem UPDATE na app) |
| `clinical_note` | trigger `BEFORE UPDATE OR DELETE`; `content` ciphertext; `content_hash`; CHECK version/amend |
| `attachment` | + `deleted_reason`, `deleted_by`; category enum S4; `thumbnail_key` opcional |
| `public_booking_token.purpose` | aceitar `ANAMNESIS` (check/docs; sem rewrite destrutivo) |
| Seed | 1 form “Anamnese Geral” v1 = JSON do [módulo §3](../../modulos/05-prontuario.md); backfill `medical_record` p/ pacientes existentes; DEK ACTIVE já no signup S1 |

`enable_tenant_rls` + `test:rls` nas tabelas novas (anexo cross-tenant = 0 rows / 404).

---

## Jobs e eventos

| Fila | Job | Idempotência | Quando |
| --- | --- | --- | --- |
| `platform` | `dispatch-outbox` | (já S3) | contínuo |
| `platform` | `generate-attachment-thumbnail` | `attachmentId` | após confirm image |

Eventos de domínio (outbox `name`):

| Publicado por | Nome | Consumidor S4 |
| --- | --- | --- |
| patients | `patients.patient_created` | clinical_records → `ensureRecord` |
| clinical_records | `clinical_records.note_created` / `_amended` | nenhum (S5+); audit reforçada no amend |
| clinical_records | `clinical_records.odontogram_updated` | nenhum (reporting depois) |
| clinical_records | `clinical_records.critical_alert_created` | scheduling badge = Should |
| clinical_records | `clinical_records.attachment_created` | thumbnail job; subscription.storage_bytes depois |

`scheduling.appointment_started` (se ainda não publicado no status `IN_SERVICE`): **publicar** no Bloco 4 para o FE só precisar do appointmentId. Sem isso, o FE chama `GET /appointments/:id` + `GET /record`.

---

## Fluxos (domínio + UX)

### A. Anamnese (RF-E5-02..04, 03 link)

**Backend:** form versionado; alterar = `INSERT` v+1 (`active` só na última). Resposta guarda `form_id`+`form_version`. `alertWhen` → alertas. Link: token 7 d.

**Frontend público:** 1 página mobile-first (sem AppShell): identificação mínima (nome da clínica + primeiro nome) → perguntas (BOOLEAN / BOOLEAN_WITH_TEXT / SINGLE_CHOICE / TEXT; `showWhen.patientGender`) → enviar → sucesso. Estados: skeleton, 404 token, expirado, já respondido, 429.

**Admin:** Index + FormDialog nova versão (JSON editor simples ou builder mínimo: lista de perguntas). Não editar versão antiga.

**Ficha (operacional, tab Prontuário):** botão “Enviar anamnese” (send-link) + histórico de respostas (perguntas da versão respondida — RF teste §10).

### B. Atendimento (RF-E5-16, 05, 06, 09–11, 20)

**Agenda (`operacional`):** no card `SCHEDULED`/`CONFIRMED`, ação “Iniciar atendimento” → status `IN_SERVICE` → `/app/atendimento/:appointmentId`. Recepção **não** vê a ação (sem `clinical_records.read`).

**Tela (`clinico`, 3 áreas — docs/09 §4.2):**

```
Topo: paciente · idade · alertas CRITICAL (vermelho, não dispensáveis)
Esq: odontograma SVG (permanente/decídua, dente/face, popover histórico)
Dir: evolução (editor + templates locais + “Salvar e assinar”)
     [S5] placeholder plano
Baixo: histórico notes anteriores · anexos (upload + grid; opcional antes/depois)
```

Ao assinar: banner de imutabilidade. Amend = FormDialog motivo + novo texto → nova versão; anterior consultável.

ASB: vê record + anexa; botão assinar **oculto** + API 403 se forçar.

### C. Odontograma (RF-E5-06..07)

Clique no dente → seleciona faces → condição. Legenda. Histórico no popover. Teclado: foco visível, Enter confirma (a11y docs/09).

### D. Anexos (RF-E5-13..15, 19)

Presign → PUT storage → confirm. Lista por categoria. Download abre URL assinada (não proxy binário na API). Excluir: Dialog motivo. Comparação: dois `<img>` lado a lado filtrando `PHOTO_*` por data (Should/Must-lite).

---

## Blocos de entrega

### Bloco 1 — Backend: fundação (DDL, RLS, crypto, MedicalRecord, audit)

- [x] Migração tabelas E5 + RLS + trigger `clinical_note_immutable` + purpose `ANAMNESIS`
- [x] `encryptField` / `decryptField` (AES-256-GCM, AAD docs/07 §14) sobre DEK ACTIVE
- [x] Módulo `clinical_records/` + `clinical_records_public.ensureRecord`
- [x] Patient create → record 1:1 (Action/outbox) + backfill seed
- [x] Middleware `auditRead` + 403 recepção com `PERMISSION_DENIED` auditado
- [x] Alinhar docs/07 (attachment category/delete) + docs/08 esqueleto §2.5
- [x] `test:rls` nas novas tabelas; smoke crypto roundtrip (`test:kms` estendido ou `test:clinical-crypto`)

### Bloco 2 — Backend: anamnese + alertas + link público

- [x] `GET|POST /anamnesis-forms` (`settings.write` no POST; read clínico ou settings)
- [x] Seed form “Anamnese Geral” v1 (JSON módulo §3); nova versão no POST
- [x] `GET|POST /patients/:id/record/anamnesis` + geração de `ClinicalAlert`
- [x] `POST .../anamnesis/send-link` (token 7 d + WA `anamnesis_request` ou e-mail)
- [x] `GET|POST /public/anamnesis/:token` + rate limit; respostas antigas legíveis após v2 do form
- [x] `GET|POST|PATCH /alerts` (CRITICAL não dispensável)
- [x] GET record: cabeçalho + alertas + `anamnesisStale`
- [x] Smoke `test:anamnesis`

### Bloco 3 — Backend: odontograma

- [x] `GET odontogram?dentition=&at=` (estado atual ou reconstrução histórica)
- [x] `PUT .../teeth/:toothCode` + history `MANUAL` + conflito ABSENT/EXTRACTED
- [x] Outbox `clinical_records.odontogram_updated`
- [x] Smoke `test:odontogram` (histórico em data passada)

### Bloco 4 — Backend: evolução append-only

- [x] Domain `ClinicalNote.create` / `amend` (CRO, tamanho, hash)
- [x] `GET|POST /notes` + `POST /notes/:id/amend`
- [x] `PATCH`/`DELETE` → `423 RECORD_IMMUTABLE`; trigger recusa SQL direto (teste)
- [x] Cifrar `content`; `content_hash` plaintext
- [x] Publicar `IN_SERVICE`/`note_created`/`note_amended` via outbox
- [x] Dentista sem CRO → `422`; ASB → `403`
- [x] Smoke `test:clinical-notes`

### Bloco 5 — Backend: anexos + storage

- [x] Port `ObjectStorage` (MinIO dev / S3 prod) + presign PUT/GET
- [x] `POST .../attachments/presign` (valida MIME/size/cota **antes**)
- [x] `POST /attachments` confirm + checksum; `GET /download`; `DELETE` lógico
- [x] Cross-tenant download → 404; leitura audita `patient_id`
- [x] Job thumbnail (imagens) opcional mas previsto; original intacto
- [x] Smoke `test:attachments` (fake storage in-memory ok no CI)

### Bloco 6 — Frontend: anamnese (public + admin + ficha)

- [x] Rota `(public)/anamnese/[token]` — Page → Component → Hook → Service → Data
- [x] Admin `/app/configuracoes/anamnese` (Form + versões; `settings.write`)
- [x] Ficha paciente: tab **Prontuário** só com `clinical_records.read` (RF-E1-12)
- [x] Enviar link + copiar URL absoluta; histórico de respostas por versão
- [x] E2E `e2e/anamnesis.spec.ts` (token fake / debug ou e-mail Mailpit)

### Bloco 7 — Frontend: atendimento (`clinico`)

- [x] `/app/atendimento/[appointmentId]` — layout 3 áreas (docs/09 §4.2)
- [x] Alertas CRITICAL no topo (não dispensáveis); WARNING visíveis
- [x] Odontograma SVG FDI + faces + histórico popover + permanente/decídua
- [x] Evolução: editor, templates locais (Should), rascunho localStorage, assinar + banner imutável + amend FormDialog
- [x] Anexos: presign PUT + grid + download; exclusão com motivo; comparação lado a lado (RF-E5-19)
- [x] Agenda: “Iniciar atendimento” → `IN_SERVICE` + navegação; ASB sem assinar; recepção sem tab/ação
- [x] Placeholder plano “S5”
- [x] E2E `e2e/attendance.spec.ts` (dentist seed; recepção 403/UI oculta)

---

## Endpoints-alvo (resumo)

```
GET|POST        /api/v1/public/anamnesis/:token

GET             /api/v1/patients/:patientId/record
GET|PUT         /api/v1/patients/:patientId/record/odontogram[/teeth/:toothCode]
GET|POST        /api/v1/patients/:patientId/record/notes[/:id/amend]
GET|POST        /api/v1/patients/:patientId/record/anamnesis
POST            /api/v1/patients/:patientId/record/anamnesis/send-link
GET|POST|PATCH  /api/v1/patients/:patientId/record/alerts[/:id]
GET|POST        /api/v1/patients/:patientId/attachments[/presign]
GET|DELETE      /api/v1/attachments/:id[/download]
GET|POST        /api/v1/anamnesis-forms
```

**Backend — aceite de código** (smokes locais 2026-08-13: `test:rls` / `test:clinical-crypto` / `test:anamnesis` / `test:odontogram` / `test:clinical-notes` / `test:attachments`)

- [x] Record 1:1 no create + backfill; recepção 403 + audit em todas as rotas clínicas
- [x] Envelope: roundtrip + AAD; plaintext nunca no log
- [x] Anamnese pública one-shot 7 d; v2 do form não quebra resposta v1; alertas CRITICAL automáticos
- [x] Odontograma reconstruível em `?at=`; conflito ABSENT+RESTORED
- [x] Note: sem CRO 422; amend cria v2; PATCH/DELETE 423; trigger SQL falha
- [x] Presign recusa tipo/cota antes da URL; download 15 min + audit; anexo outro tenant 404

**Frontend — aceite de código** (E2E locais 2026-08-13: `e2e/anamnesis.spec.ts` + `e2e/attendance.spec.ts`)

- [x] `/anamnese/{token}` ponta a ponta (OTP/e-mail não se aplica; token seed/debug)
- [x] Atendimento usável pelo Dentista (alertas + odontograma + assinar + anexo)
- [x] Recepção não vê tab/rota clínica; ASB anexa e não assina

---

## Qualidade

**Gate local (2026-08-13):** smokes S4 + `test:rls` + E2E anamnesis/attendance OK. **CI:** `.github/workflows/ci.yml` ainda **não** inclui `test:clinical-crypto` / `test:anamnesis` / `test:odontogram` / `test:clinical-notes` / `test:attachments` (carry-over).

- CI: lint, typecheck, arch:check, migrate, `test:rls` (novas tabelas), smokes `test:anamnesis` / `test:odontogram` / `test:clinical-notes` / `test:attachments` (+ crypto)
- Domínio: note imutável em 4 camadas (model / app / HTTP 423 / trigger)
- Integração: 2 tenants → anexo B invisível; 2 amends sequenciais → versões 1,2,3 consultáveis; anamnese CRITICAL aparece no GET record do atendimento
- Resiliência: MinIO down → presign 503, agenda e evolução (sem anexo) seguem; Redis down → HTTP clínico 200 (thumbnail acumula outbox/job)
- E2E Playwright: anamnesis + attendance; **não** exigir S3 real no CI (fake/MinIO service)
- Envelope `{ data }` / `{ error }`; camelCase; UTC no banco
- arch:check: `clinical_records` ↛ `treatments`/`billing`; `patients`/`scheduling` só via `*_public` + eventos
- Logs: **zero** plaintext clínico / DEK / token anamnese

Testes obrigatórios extra ([módulo §10](../../modulos/05-prontuario.md)): silêncio não se aplica; recepção 403; dentista sem CRO; alerta CRITICAL; form versionado; odontograma `?at=`; leitura anexo com `patient_id`.

RF-E4-21 (concluído sem evolução → pendência): **Should**, fora do aceite Must S4 (pode badge simples na agenda se sobrar).

---

## Aceite M3 (manual + uso real)

- [ ] Dentista da clínica-piloto (ou seed local com CRO) registra **10 atendimentos consecutivos** só no sistema: iniciar → odontograma → evolução assinada → (anexo opcional)
- [ ] Alertas CRITICAL visíveis sem serem dispensados
- [ ] Paciente (ou operador) completa 1 anamnese pelo link público; alergia vira alerta no atendimento
- [ ] Recepção continua sem acesso ao prontuário (UI + API)
- [ ] Assinatura continua **simples** — não comunicar “elimine o papel” (doc 10)

M3 é validação de **uso**, não de Meta/WABA. Independente do M2. Seed + E2E cobrem código; **M3 fica pendente explícito**.

---

## Bloqueios

| Risco | Mitigação |
| --- | --- |
| Envelope crypto mal implementado (AAD/DEK) | Bloco 1 primeiro; smoke roundtrip + teste de tamper (tag GCM); decrypt só no repo |
| MinIO/S3 indisponível no dev | Fake `ObjectStorage` em `NODE_ENV=test`; Compose MinIO já S0 |
| CRO ausente no seed dentista | Seed S1 já tem Dra. Ana; recusar sign se vazio; UI clara |
| Escopo explode com “plano” na tela | Corte #2: placeholder S5; sem fake de quote |
| JSON builder de anamnese complexo | Admin: lista de perguntas tipadas (não editor JSON livre na v1 da UI); backend aceita schema do módulo |
| Dependência S3 incompleta (token/outbox/KMS) | Não iniciar Blocos 2–5 sem Bloco 1; S3 Must já no repo |
| Revisão jurídica Termos/DPA | Consentimento de anamnese reusa `DATA_PROCESSING` já gravado; copy pode iterar |
| M3 piloto | Não bloqueia merge de código (igual M2 na S3) |

## Notas

- `APP_PUBLIC_URL` + token → `https://…/anamnese/{token}` (nunca PII na query).
- Seed e2e: paciente Maria + João Pedro; dentista Dra. Ana (CRO); appointments seed `today-*` **reatualizam data/status** no `db:seed`; form “Anamnese Geral” v1; MinIO bucket.
- `GET /clinic`, `GET /clinic/professionals`, `GET /clinic/units/:id/chairs`: `settings.read` **ou** `agenda.read` (dentista/recepção veem a agenda). Escrita permanece `settings.write`.
- Carry-over pós-S4: plugar smokes S4 no CI; E6 orçamento/execução→odontograma; badge alerta no card da agenda; RF-E4-21 pendência sem note; cota real E10.
- Playwright: `workers: 1`; spec pública anamnese **não** usa fixture owner; attendance usa **dentist** (não só owner) para CRO; card João Pedro na agenda da Dra. Ana.
- Package `operacional` **não** importa `clinico`: ficha só mostra resumo/alertas via Data próprio ou link para `/app/atendimento/...`. Detalhe clínico pesado fica em `clinico`.
- Em dúvida de produto/DDL/contrato **não** listada acima → perguntar antes de implementar (não improvisar ICP, plano de tratamento ou DICOM).
