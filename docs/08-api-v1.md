# 08 — API v1

## 1. Convenções

| Tema | Regra |
| --- | --- |
| Base | `https://api.{dominio}/api/v1` |
| Versionamento | Prefixo de URL (`/api/v1`) — ver [ADR-0003](./adr/0003-versionamento-api.md) |
| Formato | JSON `application/json; charset=utf-8`; `snake_case` nunca — usamos `camelCase` no payload |
| Datas | ISO 8601 com offset (`2026-08-14T13:30:00-03:00`); servidor persiste em UTC |
| Dinheiro | Inteiro em centavos, sufixo `Cents` (`totalCents: 25000`) |
| IDs | UUID v7 em string |
| Envelope | Sucesso: `{ "data": ... }` (+ `"meta"` em listas). Erro: `{ "error": { ... } }` |
| Paginação | Cursor: `?limit=50&cursor=<opaco>`; `limit` máx. 100; resposta traz `meta.nextCursor` |
| Ordenação | `?sort=startsAt:asc,createdAt:desc` (campos permitidos por endpoint) |
| Filtros | Query params explícitos e tipados por Zod; nada de filtro genérico tipo `?where=` |
| Idempotência | `Idempotency-Key` obrigatório em POST que gera efeito financeiro ou envia mensagem |
| Autenticação | `Authorization: Bearer <accessToken>`; refresh por cookie httpOnly |
| Tenant | Derivado do token; `X-Tenant-Id` apenas para trocar entre memberships válidos |
| Correlação | `X-Request-Id` aceito e devolvido; propagado nos logs |
| Rate limit | Cabeçalhos `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` |
| Depreciação | Cabeçalhos `Deprecation` e `Sunset` + aviso em `meta.warnings` |
| Documentação | OpenAPI 3.1 gerado dos schemas Zod, servido em `/api/v1/docs` |

### Estrutura da resposta

```json
{
  "data": { "id": "018f...", "status": "SCHEDULED" },
  "meta": { "requestId": "req_01J...", "nextCursor": null }
}
```

### Estrutura do erro

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "Este horário já está ocupado para o profissional selecionado.",
    "details": [
      { "field": "startsAt", "issue": "conflict", "conflictingAppointmentId": "018f..." }
    ],
    "requestId": "req_01J..."
  }
}
```

`code` é estável e é o contrato para o frontend; `message` é texto para humano em pt-BR e pode mudar.

### Catálogo de códigos de erro

| HTTP | `code` | Quando |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Falha de schema (Zod) |
| 401 | `UNAUTHENTICATED` | Token ausente/expirado/inválido |
| 403 | `FORBIDDEN` | Papel sem permissão para o recurso |
| 403 | `TENANT_NOT_ALLOWED` | `X-Tenant-Id` fora dos memberships |
| 404 | `NOT_FOUND` | Recurso inexistente **ou** de outro tenant (não revelamos existência) |
| 409 | `SLOT_UNAVAILABLE` | Conflito de agenda |
| 409 | `DUPLICATE_RESOURCE` | Unicidade violada (CPF, código de procedimento) |
| 409 | `INVALID_STATE_TRANSITION` | Ex.: confirmar consulta cancelada |
| 422 | `BUSINESS_RULE_VIOLATION` | Regra de domínio (ex.: parcelas ≠ total) |
| 402 | `SUBSCRIPTION_REQUIRED` | Assinatura expirada/suspensa |
| 402 | `PLAN_LIMIT_EXCEEDED` | Limite do plano (profissionais, storage, mensagens) |
| 423 | `RECORD_IMMUTABLE` | Tentativa de alterar evolução/caixa fechado |
| 429 | `RATE_LIMITED` | Excesso de requisições |
| 500 | `INTERNAL_ERROR` | Falha inesperada (sem detalhes vazados) |
| 503 | `PROVIDER_UNAVAILABLE` | WhatsApp/storage/e-mail indisponível |

## 2. Mapa de endpoints do MVP

### 2.1 Autenticação e identidade (`identity`)

```
POST   /api/v1/auth/signup                 cria tenant + owner
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh                rotação de refresh token (cookie)
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
POST   /api/v1/auth/password/forgot
POST   /api/v1/auth/password/reset
GET    /api/v1/auth/me                     usuário + memberships + permissões efetivas
POST   /api/v1/auth/switch-tenant

GET    /api/v1/users                       membros do tenant
POST   /api/v1/users/invitations           convidar membro
GET    /api/v1/users/invitations
DELETE /api/v1/users/invitations/:id
POST   /api/v1/users/invitations/accept    público (token)
PATCH  /api/v1/users/:id                   papel, unidade padrão, ativo/inativo
```

### 2.2 Clínica e configurações (`clinic`)

```
GET    /api/v1/clinic                      dados do tenant
PATCH  /api/v1/clinic
GET    /api/v1/clinic/units
POST   /api/v1/clinic/units
PATCH  /api/v1/clinic/units/:id
GET    /api/v1/clinic/units/:id/chairs
POST   /api/v1/clinic/units/:id/chairs
PATCH  /api/v1/clinic/units/:id/chairs/:chairId
GET    /api/v1/clinic/business-hours       ?unitId=&professionalId=
PUT    /api/v1/clinic/business-hours       substitui a grade semanal
POST   /api/v1/clinic/business-hours/exceptions
GET    /api/v1/clinic/professionals
POST   /api/v1/clinic/professionals
PATCH  /api/v1/clinic/professionals/:id
GET    /api/v1/procedures                  ?search=&specialty=&active=
POST   /api/v1/procedures
PATCH  /api/v1/procedures/:id
POST   /api/v1/procedures/import-catalog   importa catálogo sugerido
```

### 2.3 Pacientes (`patients`)

```
GET    /api/v1/patients                    ?search=&cursor=&limit=&active=
POST   /api/v1/patients
GET    /api/v1/patients/:id
PATCH  /api/v1/patients/:id
DELETE /api/v1/patients/:id                inativação (soft delete)
GET    /api/v1/patients/:id/timeline       consultas, evoluções, orçamentos, pagamentos, mensagens
GET    /api/v1/patients/:id/consents
POST   /api/v1/patients/:id/consents
POST   /api/v1/patients/:id/guardians
GET    /api/v1/patients/check-duplicate    ?cpf=&phone=
```

### 2.4 Agenda (`scheduling`)

```
GET    /api/v1/appointments                ?unitId=&from=&to=&professionalId=&status=
POST   /api/v1/appointments
GET    /api/v1/appointments/:id
PATCH  /api/v1/appointments/:id            reagendar / trocar profissional / notas
POST   /api/v1/appointments/:id/status     { status, reason? }
DELETE /api/v1/appointments/:id            cancelamento (com motivo)
GET    /api/v1/appointments/:id/history

GET    /api/v1/availability                ?professionalId=&date=&procedureId=  slots livres
POST   /api/v1/schedule-blocks
DELETE /api/v1/schedule-blocks/:id
POST   /api/v1/appointment-series           compromisso recorrente
DELETE /api/v1/appointment-series/:id       ?scope=THIS|FUTURE|ALL

GET    /api/v1/waitlist
POST   /api/v1/waitlist
DELETE /api/v1/waitlist/:id
POST   /api/v1/waitlist/:id/offer           oferta manual de vaga
```

Rotas públicas (sem autenticação de usuário, com rate limit agressivo):

```
GET    /api/v1/public/clinics/:slug                    dados públicos + serviços
GET    /api/v1/public/clinics/:slug/availability       ?serviceId=&from=&to=
POST   /api/v1/public/clinics/:slug/bookings           solicita OTP
POST   /api/v1/public/clinics/:slug/bookings/verify    confirma com OTP → cria agendamento
GET    /api/v1/public/anamnesis/:token
POST   /api/v1/public/anamnesis/:token
GET    /api/v1/public/quotes/:token
POST   /api/v1/public/quotes/:token/decision
GET    /api/v1/public/appointments/:token/confirm      confirmação por link
```

### 2.5 Prontuário (`clinical-records`)

```
GET    /api/v1/patients/:patientId/record              cabeçalho + alertas
GET    /api/v1/patients/:patientId/record/odontogram   ?dentition=PERMANENT
PUT    /api/v1/patients/:patientId/record/odontogram/teeth/:toothCode
GET    /api/v1/patients/:patientId/record/notes        ?cursor=
POST   /api/v1/patients/:patientId/record/notes        cria evolução (imutável)
POST   /api/v1/patients/:patientId/record/notes/:id/amend   nova versão com motivo
GET    /api/v1/patients/:patientId/record/anamnesis
POST   /api/v1/patients/:patientId/record/anamnesis
POST   /api/v1/patients/:patientId/record/anamnesis/send-link
GET    /api/v1/patients/:patientId/record/alerts
POST   /api/v1/patients/:patientId/record/alerts
GET    /api/v1/patients/:patientId/attachments
POST   /api/v1/patients/:patientId/attachments/presign  → URL de upload direto
POST   /api/v1/patients/:patientId/attachments          confirma upload (metadados)
GET    /api/v1/attachments/:id/download                 URL assinada de leitura
DELETE /api/v1/attachments/:id
GET    /api/v1/anamnesis-forms
POST   /api/v1/anamnesis-forms
```

### 2.6 Orçamentos e tratamentos (`treatments`)

```
GET    /api/v1/quotes                      ?patientId=&status=&from=&to=
POST   /api/v1/quotes
GET    /api/v1/quotes/:id
PATCH  /api/v1/quotes/:id                  só em DRAFT
POST   /api/v1/quotes/:id/items
DELETE /api/v1/quotes/:id/items/:itemId
POST   /api/v1/quotes/:id/send              e-mail/WhatsApp + link
POST   /api/v1/quotes/:id/decision          { decision, approvedItemIds?, installments? }
GET    /api/v1/quotes/:id/pdf

GET    /api/v1/treatment-plans              ?patientId=&status=
GET    /api/v1/treatment-plans/:id
POST   /api/v1/treatment-items/:id/execute  { appointmentId?, note, toothState? }
POST   /api/v1/treatment-items/:id/cancel
```

### 2.7 Financeiro (`billing`)

```
GET    /api/v1/receivables                 ?patientId=&status=&from=&to=
POST   /api/v1/receivables                 título manual
GET    /api/v1/receivables/:id
GET    /api/v1/installments                ?status=OVERDUE&dueFrom=&dueTo=
POST   /api/v1/installments/:id/payments    baixa (Idempotency-Key obrigatório)
POST   /api/v1/payments/:id/reverse         estorno com motivo
GET    /api/v1/payments/:id/receipt         PDF

GET    /api/v1/payables
POST   /api/v1/payables
PATCH  /api/v1/payables/:id
POST   /api/v1/payables/:id/pay

GET    /api/v1/cash-sessions/current
POST   /api/v1/cash-sessions               abrir caixa
POST   /api/v1/cash-sessions/:id/close     fechar (com contagem)
POST   /api/v1/cash-sessions/:id/movements suprimento/sangria
GET    /api/v1/financial-categories
POST   /api/v1/financial-categories
```

### 2.8 Mensageria (`messaging`)

```
GET    /api/v1/messaging/account
POST   /api/v1/messaging/account            conecta WABA/número
POST   /api/v1/messaging/account/test
DELETE /api/v1/messaging/account

GET    /api/v1/messaging/conversations      ?status=&assignedTo=&search=
GET    /api/v1/messaging/conversations/:id/messages
POST   /api/v1/messaging/conversations/:id/messages     (Idempotency-Key)
POST   /api/v1/messaging/conversations/:id/assign
POST   /api/v1/messaging/conversations/:id/close
POST   /api/v1/messaging/conversations/:id/link-patient

GET    /api/v1/messaging/templates
GET    /api/v1/messaging/automations
PATCH  /api/v1/messaging/automations/:key   { enabled, config }
GET    /api/v1/messaging/usage              consumo e custo do período
GET    /api/v1/messaging/logs               ?from=&to=&result=

POST   /api/v1/webhooks/whatsapp            público, validado por assinatura
GET    /api/v1/webhooks/whatsapp            handshake de verificação da Meta
```

### 2.9 Relatórios (`reporting`)

```
GET    /api/v1/reports/dashboard            ?unitId=&date=
GET    /api/v1/reports/no-shows              ?from=&to=&professionalId=
GET    /api/v1/reports/revenue               ?from=&to=&groupBy=day|month|professional
GET    /api/v1/reports/overdue
GET    /api/v1/reports/production            ?from=&to=&professionalId=
GET    /api/v1/reports/procedures            ?from=&to=
GET    /api/v1/reports/cash-flow             ?from=&to=&basis=CASH|ACCRUAL
POST   /api/v1/reports/:report/export        { format: CSV|XLSX } → job assíncrono
GET    /api/v1/exports/:id                   status + URL de download
```

### 2.10 Assinatura, auditoria e LGPD

```
GET    /api/v1/subscription
GET    /api/v1/subscription/plans
POST   /api/v1/subscription/checkout
GET    /api/v1/subscription/usage

GET    /api/v1/audit-logs                   ?patientId=&actorId=&action=&from=&to=
POST   /api/v1/privacy/data-subject-requests
GET    /api/v1/privacy/data-subject-requests
POST   /api/v1/privacy/exports              exportação completa do tenant
GET    /api/v1/health                        liveness
GET    /api/v1/ready                         readiness (db, redis, storage)
```

## 3. Contratos detalhados dos fluxos críticos

### 3.1 Criar agendamento

```http
POST /api/v1/appointments
Authorization: Bearer <token>
Idempotency-Key: 018f5d4a-...
Content-Type: application/json

{
  "patientId": "018f5c2b-...",
  "professionalId": "018f5c31-...",
  "chairId": "018f5c40-...",
  "procedureId": "018f5c55-...",
  "startsAt": "2026-08-20T14:00:00-03:00",
  "endsAt": "2026-08-20T14:40:00-03:00",
  "notes": "Paciente com sensibilidade no 26",
  "notifyPatient": true
}
```

```http
201 Created
{
  "data": {
    "id": "018f5d61-...",
    "status": "SCHEDULED",
    "startsAt": "2026-08-20T17:00:00Z",
    "endsAt": "2026-08-20T17:40:00Z",
    "patient": { "id": "018f5c2b-...", "name": "Ana Souza", "phonePrimary": "+5562999990000" },
    "professional": { "id": "018f5c31-...", "name": "Dra. Letícia" },
    "procedure": { "id": "018f5c55-...", "name": "Restauração em resina", "defaultMinutes": 40 },
    "scheduledNotifications": [
      { "key": "CONFIRMATION_D1", "sendAt": "2026-08-19T12:00:00Z" },
      { "key": "REMINDER_H3", "sendAt": "2026-08-20T14:00:00Z" }
    ]
  }
}
```

Conflito:

```http
409 Conflict
{ "error": { "code": "SLOT_UNAVAILABLE", "message": "Este horário já está ocupado.",
  "details": [{ "conflictingAppointmentId": "018f5d20-...", "suggestedSlots": ["2026-08-20T14:45:00-03:00"] }] } }
```

### 3.2 Consultar disponibilidade

```http
GET /api/v1/availability?professionalId=018f5c31-...&date=2026-08-20&procedureId=018f5c55-...
```

```json
{
  "data": {
    "date": "2026-08-20",
    "timezone": "America/Sao_Paulo",
    "slotMinutes": 40,
    "slots": [
      { "startsAt": "2026-08-20T08:00:00-03:00", "endsAt": "2026-08-20T08:40:00-03:00", "available": true },
      { "startsAt": "2026-08-20T08:40:00-03:00", "endsAt": "2026-08-20T09:20:00-03:00", "available": false, "reason": "BOOKED" },
      { "startsAt": "2026-08-20T12:00:00-03:00", "endsAt": "2026-08-20T12:40:00-03:00", "available": false, "reason": "OUT_OF_HOURS" }
    ]
  }
}
```

### 3.3 Registrar evolução clínica

```http
POST /api/v1/patients/018f5c2b-.../record/notes
{
  "appointmentId": "018f5d61-...",
  "content": "Realizada restauração classe II em 26 com resina composta. Anestesia local com lidocaína 2%. Paciente tolerou bem.",
  "procedures": [{ "procedureId": "018f5c55-...", "toothCode": "26", "face": "O" }],
  "toothStates": [{ "toothCode": "26", "face": "O", "condition": "RESTORED" }],
  "treatmentItemIds": ["018f5c99-..."]
}
```

```http
201 Created
{
  "data": {
    "id": "018f5e10-...",
    "version": 1,
    "signedAt": "2026-08-20T17:35:12Z",
    "signature": { "type": "SIMPLE", "userId": "018f5c31-...", "croNumber": "GO-12345" },
    "contentHash": "sha256:9f2b...",
    "sideEffects": {
      "odontogramUpdated": ["26/O"],
      "treatmentItemsExecuted": ["018f5c99-..."],
      "productionEntriesCreated": 1
    }
  }
}
```

Tentativa de `PATCH` nessa evolução → `423 RECORD_IMMUTABLE`, com orientação de usar `/amend`.

### 3.4 Aprovar orçamento (gera plano + parcelas)

```http
POST /api/v1/quotes/018f5f00-.../decision
Idempotency-Key: 018f5f01-...
{
  "decision": "APPROVED",
  "approvedItemIds": ["018f5f10-...", "018f5f11-..."],
  "payment": {
    "installments": 6,
    "firstDueDate": "2026-09-05",
    "method": "PIX",
    "downPaymentCents": 20000
  }
}
```

```json
{
  "data": {
    "quoteId": "018f5f00-...",
    "status": "PARTIALLY_APPROVED",
    "treatmentPlanId": "018f5f30-...",
    "treatmentItems": 2,
    "receivable": {
      "id": "018f5f40-...",
      "totalCents": 180000,
      "installments": [
        { "number": 1, "dueDate": "2026-09-05", "amountCents": 30000 },
        { "number": 2, "dueDate": "2026-10-05", "amountCents": 30000 }
      ]
    }
  }
}
```

Invariante testada: `sum(installments.amountCents) + downPaymentCents == quote.approvedTotalCents`.

### 3.5 Webhook do WhatsApp

```http
POST /api/v1/webhooks/whatsapp
X-Hub-Signature-256: sha256=...
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "field": "messages",
      "value": {
        "metadata": { "phone_number_id": "PHONE_ID" },
        "messages": [{
          "from": "5562999990000",
          "id": "wamid.HBg...",
          "timestamp": "1755701234",
          "type": "button",
          "button": { "payload": "CONFIRM_018f5d61", "text": "Confirmar" }
        }]
      }
    }]
  }]
}
```

Processamento: verificar assinatura → responder `200` imediatamente → enfileirar. Idempotência por `messages[].id` (`wamid`). `CONFIRM_<appointmentId>` dispara transição para `CONFIRMED`; payload desconhecido cai na inbox como mensagem comum.

### 3.6 Upload de anexo (URL pré-assinada)

```http
POST /api/v1/patients/018f5c2b-.../attachments/presign
{ "fileName": "rx-panoramica.jpg", "mimeType": "image/jpeg", "sizeBytes": 2411233, "category": "XRAY" }
```

```json
{
  "data": {
    "uploadUrl": "https://storage.../tenant/018f.../abc?X-Amz-Signature=...",
    "method": "PUT",
    "headers": { "Content-Type": "image/jpeg" },
    "storageKey": "tenant/018f.../patients/018f5c2b/abc.jpg",
    "expiresIn": 900
  }
}
```

O cliente faz `PUT` direto no storage e depois confirma via `POST /attachments` com `storageKey` + `checksumSha256`. A API valida tamanho, tipo e cota do plano **antes** de emitir a URL.

## 4. Segurança dos endpoints

| Middleware (ordem) | Função |
| --- | --- |
| `helmet` | Cabeçalhos de segurança |
| `cors` | Origens permitidas por ambiente |
| `requestId` | Correlação |
| `bodyLimit` | 1 MB padrão (webhook 2 MB; upload não passa pela API) |
| `rateLimit` | Global por IP, por tenant e específico para rotas públicas/auth |
| `authenticate` | Valida JWT, popula `req.auth` |
| `tenantContext` | Resolve e valida tenant, popula `req.ctx` |
| `authorize(permission)` | Checagem por papel/permissão no recurso |
| `subscriptionGuard` | Bloqueia escrita em tenant suspenso (leitura e exportação liberadas) |
| `validate(schema)` | Zod em body/query/params |
| `auditRead` | Registra leitura de dado clínico sensível |
| `errorHandler` | `DomainError → HTTP`, log estruturado, resposta sem stack |

### Matriz permissão × endpoint (extrato)

| Endpoint | OWNER | DENTIST | RECEPTION | ASSISTANT | FINANCE |
| --- | :-: | :-: | :-: | :-: | :-: |
| `POST /appointments` | ✔ | ✔ | ✔ | ✔ | ✖ |
| `GET /patients/:id/record/*` | ✔ | ✔ | ✖ | ✔ (leitura) | ✖ |
| `POST /patients/:id/record/notes` | ✔ | ✔ | ✖ | ✖ | ✖ |
| `POST /quotes/:id/decision` | ✔ | ✔ | ✔ | ✖ | ✖ |
| `GET /reports/cash-flow` | ✔ | ✖ | ✖ | ✖ | ✔ |
| `POST /installments/:id/payments` | ✔ | ✖ | ✔ | ✖ | ✔ |
| `PATCH /clinic` | ✔ | ✖ | ✖ | ✖ | ✖ |
| `POST /privacy/exports` | ✔ | ✖ | ✖ | ✖ | ✖ |

## 5. Política de versionamento

- `v1` é estável: mudanças **aditivas** (novo campo opcional, novo endpoint) não geram nova versão.
- Quebra de contrato (remover/renomear campo, mudar tipo ou semântica) exige `v2`, com `v1` mantida por no mínimo 6 meses e cabeçalhos `Deprecation`/`Sunset`.
- Cada módulo registra suas rotas sob o router da versão; a implementação pode ser compartilhada entre versões desde que a **camada de interface** traduza (controllers/DTOs separados por versão, use cases reaproveitados).
- Endpoints internos/experimentais ficam sob `/api/v1/internal/*` e não têm garantia de estabilidade.
- Contrato verificado no CI por diff do OpenAPI: mudança incompatível sem bump de versão falha o build.

## 6. Padrões operacionais

**Idempotência:** `Idempotency-Key` armazenado por 24h com hash do corpo; repetição com mesmo corpo devolve a resposta original; corpo diferente com a mesma chave → `409 IDEMPOTENCY_KEY_REUSED`.

**Concorrência otimista:** recursos editáveis expõem `version`; `PATCH` aceita `If-Match: "<version>"` e devolve `412` em conflito (usado na agenda, onde duas recepcionistas podem editar ao mesmo tempo).

**Long-running:** exportações e relatórios grandes retornam `202` com `{ jobId }`; cliente consulta `GET /exports/:id`.

**Webhooks de saída (fase 2):** entrega assinada com HMAC, retry exponencial em 5 tentativas, log consultável pelo tenant.
