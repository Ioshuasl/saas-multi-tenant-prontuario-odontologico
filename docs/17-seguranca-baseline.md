# 17 — Baseline de Segurança Enterprise

Documento operacional de segurança do MVP. Complementa (não substitui) o [10 — Segurança, LGPD e Compliance](./10-seguranca-lgpd-compliance.md). Decisão de criptografia: [ADR-0007](./adr/0007-criptografia-envelope-tenant.md). Requisitos: [RNF-SEC](./requisitos/nao-funcionais/requisitos-nao-funcionais.md) e [checklist OWASP](./requisitos/nao-funcionais/RNF-seguranca-owasp.md).

> **Modelo adotado:** enterprise (TLS + criptografia em repouso + envelope encryption por tenant). **Não** é E2EE no cliente — o servidor descriptografa em memória no request autorizado. Ver ADR-0007.

---

## 1. Princípios

1. **Defesa em profundidade:** UI ≪ RBAC ≪ RLS ≪ criptografia ≪ auditoria ≪ anomalias.
2. **Falha fechada:** sem contexto de tenant → zero linhas; sem permissão → 403; recurso alheio → 404.
3. **Minimização:** não coletar, não logar, não enviar (WhatsApp) dado clínico desnecessário.
4. **Confiança zero na borda:** todo input validado (Zod); toda autorização no servidor.
5. **Segredos nunca no código** nem em log; apenas gerenciador de segredos / KMS.
6. **Auditabilidade:** ação sensível deixa rastro append-only correlacionável por `requestId`.
7. **Não prometer o que não temos:** assinatura simples ≠ eliminação do papel (doc 10).

---

## 2. Modelo de ameaças (STRIDE resumido)

| Ameaça | Exemplos no produto | Controles principais |
| --- | --- | --- |
| **S**poofing | Roubo de sessão, impersonação de webhook Meta | JWT curto + refresh rotativo; HMAC webhook; MFA (fase 2) |
| **T**ampering | Alterar evolução, manipular parcela, trocar `tenant_id` | Append-only + hash; RLS WITH CHECK; idempotência; envelope |
| **R**epudiation | Negar leitura de prontuário ou envio de mensagem | `audit_log` append-only; leitura clínica auditada |
| **I**nformation disclosure | Vazamento entre tenants, log com evolução, IDOR | RLS; 404 cross-tenant; redaction de logs; envelope; CSP |
| **D**enial of service | Flood em login/autoagendamento/webhook | Rate limit por IP/tenant/rota; body limit; filas |
| **E**levation of privilege | Recepção lendo prontuário; suporte sem break-glass | RBAC; deny-by-default; break-glass com 4 olhos |

Atores considerados: recepção maliciosa, dentista curiosidade excessiva, atacante externo, insider da plataforma, tenant vizinho (noisy/malicious neighbor), provedor comprometido (mitigar com menor privilégio e auditoria).

---

## 3. Arquitetura de criptografia

```mermaid
flowchart LR
  Browser -->|"TLS"| Edge
  Edge -->|"TLS"| Api
  Api -->|"TLS + RLS"| Pg[(Postgres)]
  Api -->|"TLS"| Redis
  Api -->|"TLS_presigned"| S3[ObjectStorage]
  Api -->|"wrap_unwrap_DEK"| Kms[KMS_KEK]
  MetaWebhook -->|"TLS_HMAC"| Api
```

### 3.1 Camadas

| Camada | Mecanismo | Escopo |
| --- | --- | --- |
| Trânsito externo | TLS 1.2+ (preferir 1.3), HSTS, redirect HTTP→HTTPS | Browser ↔ CDN/Edge ↔ API; webhooks |
| Trânsito interno | TLS para Postgres, Redis, S3 | API/worker ↔ infra |
| Repouso (infra) | Volume encryption + backups cifrados; SSE no object storage | Disco e anexos |
| Repouso (aplicação) | Envelope AES-256-GCM por tenant (DEK); **KEK local na VPS** (MVP); Vault self-hosted depois | Campos clínicos definidos — [ADR-0013](./adr/0013-kms-local-vps.md) |
| Segredos | Env/arquivo na VPS (MVP); Vault depois; `access_token_ref` para WhatsApp | Tokens, JWT keys, DB URLs |

### 3.2 Envelope encryption por tenant

```
provisionamento do tenant
  → gera DEK (32 bytes)
  → Wrap(DEK, KEK_local) via KeyManagementPort → armazena wrapped_dek em tenant_crypto_key
  → DEK em plaintext só em memória / cache curto com TTL

leitura/escrita de campo cifrado
  → Unwrap DEK via KeyManagementPort (ou cache)
  → AES-256-GCM encrypt/decrypt com AAD = tenantId|table|column|rowId
  → persiste coluna text = Base64( version(1) || nonce(12) || ciphertext || tag(16) )
```

Formato canônico e DDL: [docs/07 §14](./07-modelo-de-dados.md#14-envelope-encryption--tenant_crypto_key-e-formato-de-ciphertext).

#### Como funciona (linguagem simples)

Imagine um **cofre dentro de um cofre**:

1. **Texto clínico** (evolução, anamnese, alerta) é o “papel” que queremos esconder.
2. A **DEK** (chave da clínica) é a chave do cofre pequeno: cada clínica tem a sua. Com ela o sistema tranca/destranca o papel.
3. A **KEK** (chave mestra na VPS) tranca a DEK. No banco **não** fica a chave da clínica aberta — só a DEK já trancada (`wrapped_dek` em `tenant_crypto_key`).
4. O que grava no Postgres é **ciphertext**: um pacote ilegível (versão + “sal” aleatório + texto embaralhado + selo de integridade), em Base64. Quem abrir o dump do banco sem a KEK vê só “lixo”.
5. Quando um dentista autorizado abre o prontuário: a API prova identidade → entra no contexto da clínica (RLS) → destranca a DEK com a KEK → lê o pacote → devolve o texto **só na memória daquele request** → a tela mostra o plaintext. Logs e erros **não** devem carregar esse texto.
6. O **AAD** amarra o pacote à clínica e à linha certa: se alguém copiar o ciphertext de um paciente para outro registro, a abertura **falha** (selo GCM).

Isso **não** é “só o celular do paciente consegue ler” (E2EE). O servidor ainda vê o texto quando um usuário autorizado pede — necessário para busca, WhatsApp, PDF e suporte controlado. Ver [ADR-0007](./adr/0007-criptografia-envelope-tenant.md).

Regras:

1. Decrypt **somente** após `TenantPrisma.runInTenantContext` + `authorize(...)`.
2. DEK nunca vai para log, Sentry, analytics ou resposta de erro.
3. Rotação de KEK: rewrap de todas as DEK (sem re-cifrar payloads).
4. Rotação de DEK (fase 2): re-cifrar campos em job assíncrono por tenant.
5. Port `KeyManagementPort` isola o provedor — **MVP: adapter local na VPS**; intenção futura: Vault self-hosted ([ADR-0013](./adr/0013-kms-local-vps.md)).

### 3.3 O que cifrar no MVP (envelope)

| Cifrar (ciphertext) | Manter plaintext (+ RLS) | Motivo |
| --- | --- | --- |
| `clinical_note.content` | — | Dado clínico nuclear |
| `anamnesis_response.answers` (JSON sensível) | metadados de formulário/versão | Histórico de saúde |
| `clinical_alert.description` | `severity`, `category` | Pode conter alergia/condição |
| Campos de texto livre clínico futuros no prontuário | — | Mesma política |
| — | `patient.name`, `phone`, `cpf` | Busca operacional &lt; 300 ms |
| — | Agenda (horários, status, IDs) | Operação da recepção |
| — | Valores financeiros (`*_cents`) | Relatórios e aritmética |
| — | Status, enums, FKs, timestamps | Índices e máquinas de estado |
| Anexos | Object storage privado + URL pré-assinada + checksum | SSE do provedor no MVP; customer-managed key na fase 2 |

`content_hash` da evolução é calculado sobre o **plaintext canônico** antes de cifrar, e armazenado em plaintext para verificação de integridade sem decrypt em lote.

### 3.4 O que NÃO é E2EE

- A plataforma (operador LGPD) processa plaintext em memória para cumprir o contrato com a clínica.
- WhatsApp, PDF de orçamento, busca e relatórios exigem dados legíveis no servidor.
- Break-glass auditado continua possível (e obrigatório para suporte controlado).

---

## 4. Gestão de chaves e segredos

| Item | Política (MVP) | Futuro |
| --- | --- | --- |
| KEK | Arquivo/env na VPS; permissão restrita; nunca no Git ([ADR-0013](./adr/0013-kms-local-vps.md)) | Vault (ou equivalente) self-hosted |
| DEK | Uma ativa por tenant; wrapped no banco; plaintext só em memória | Idem |
| JWT | Par RS256 com `kid`; rotação com duas chaves ativas | Idem / Vault |
| WhatsApp | Token por referência (`access_token_ref`) | Idem |
| `.env` local | Nunca commitado; gitleaks no CI | Segredos no Vault |
| Acesso VPS | SSH por chave; MFA no painel Hostinger quando disponível | Idem |
| Dev/staging | KEK distinta da produção; **zero** dado real de paciente | Idem |

Implementação alvo: `shared/crypto/` + `LocalKeyManagementAdapter` → depois `VaultKeyManagementAdapter`; uso só em `repositories/` (borda), nunca em `models/`.

---

## 5. Auditoria reforçada

### 5.1 Propriedades

- Tabela `audit_log` **append-only** (trigger bloqueia UPDATE/DELETE).
- Particionamento mensal; 12 meses quente + 5 anos arquivo frio.
- Correlação: `requestId`, `tenantId`, `actorId`, `patientId` (quando aplicável).
- Owner consulta via API; suporte só via break-glass.

### 5.2 Eventos obrigatórios (além do doc 10)

| Categoria | Eventos |
| --- | --- |
| Auth | `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_RESET`, `REFRESH_REUSE_DETECTED`, `SESSION_REVOKED` |
| Clínico | `CLINICAL_READ`, `NOTE_CREATED`, `NOTE_AMENDED`, `ANAMNESIS_READ/WRITE`, `ATTACHMENT_UPLOAD/DOWNLOAD` |
| Admin | `ROLE_CHANGED`, `MEMBER_INVITED`, `MEMBER_DEACTIVATED`, `PERMISSION_DENIED` |
| Dados | `EXPORT_REQUESTED`, `EXPORT_COMPLETED`, `DSR_*`, `TENANT_ANONYMIZED` |
| Mensagens | `MESSAGE_SENT`, `MESSAGE_FAILED`, `AUTOMATION_DISABLED` |
| Plataforma | `SUPPORT_ACCESS_GRANTED`, `SUPPORT_ACCESS_USED`, `CRYPTO_DEK_ROTATED`, `ANOMALY_TRIGGERED` |
| Segurança | `CROSS_TENANT_DENY` (404 contabilizado), `RATE_LIMITED` (amostrado) |

### 5.3 O que nunca vai no audit payload

Conteúdo de evolução, respostas completas de anamnese, corpo de mensagem WhatsApp, senha, tokens, DEK, CPF completo (usar últimos 4 ou hash truncado se necessário para investigação).

---

## 6. Detecção de anomalias (MVP — regras, não ML)

Job periódico + contadores em Redis; alerta para canal interno e, quando afetar a clínica, notificação ao Owner.

| Regra | Sinal | Ação |
| --- | --- | --- |
| `anomaly.clinical_read_burst` | Leituras de prontuário &gt; N por usuário em 5 min (N configurável, default 40) | Alerta S2; registrar `ANOMALY_TRIGGERED` |
| `anomaly.login_bruteforce` | Falhas de login por IP/e-mail acima do limiar | Bloqueio já existente + alerta |
| `anomaly.refresh_reuse` | Reuso de refresh | Revogar família + alerta S1 ao usuário |
| `anomaly.mass_export` | &gt; 1 exportação completa ou &gt; K downloads de anexo / hora | Alerta; throttle opcional |
| `anomaly.cross_tenant` | Rajada de 404 em recursos por ID (possível enumeração) | Rate limit endurecido + alerta |
| `anomaly.support_access` | Qualquer break-glass | Sempre notifica Owner (não é anomalia — é controle) |
| `anomaly.role_escalation` | Mudança para OWNER ou grant de `clinical_records.*` | Alerta + audit |
| `anomaly.off_hours_clinical` | Pico de leitura clínica 00:00–05:00 no fuso do tenant | Alerta informativo |

Falsos positivos são aceitáveis no MVP; tuning após piloto. Sem bloqueio automático destrutivo (exceto auth já definido).

---

## 7. Segurança entre endpoints

| Hop | Controle |
| --- | --- |
| Browser → API | TLS, CORS allowlist por ambiente, CSP, `helmet`, cookies `Secure` |
| API → Postgres | TLS + role `app_user` sem BYPASSRLS; migrações com `app_migrator` |
| API → Redis | TLS (prod); sem comando perigoso exposto; filas com payload mínimo (IDs) |
| API → Object storage | TLS; bucket privado; URL pré-assinada curta; upload não passa pela API |
| API → KMS | TLS + IAM/role da runtime |
| Meta → API | TLS + `X-Hub-Signature-256`; resposta 200 rápida; processamento em fila |
| API ↔ Worker | Mesmo artefato; confiança via rede privada; **mTLS opcional na fase 2** |
| Frontend → APIs de terceiros | Proibido chamar KMS/DB; só nossa API |

Headers mínimos na API (via `helmet` + config):

- `Strict-Transport-Security`
- `Content-Security-Policy` (frontend Next.js + API docs)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer` (ou `strict-origin-when-cross-origin`)
- `Permissions-Policy` restritiva
- `Cache-Control: no-store` em respostas autenticadas com dado sensível

---

## 8. OWASP Top 10 (2021) → controles do stack

| # | Risco | Controle no projeto |
| --- | --- | --- |
| A01 Broken Access Control | RBAC em toda rota; RLS; 404 cross-tenant; testes de isolamento no CI |
| A02 Cryptographic Failures | TLS; Argon2id; envelope AES-GCM; sem segredo em repo; KMS |
| A03 Injection | Prisma parametrizado; `$queryRaw` só com placeholders; Zod na borda |
| A04 Insecure Design | Threat model por épico; append-only clínico; outbox; deny-by-default |
| A05 Security Misconfiguration | `helmet`, CORS, env validado (Zod), sem stack em prod, headers |
| A06 Vulnerable Components | `pnpm audit`, Dependabot/Renovação, lockfile, CI falha em high+ |
| A07 Identification & Auth Failures | JWT curto, refresh rotativo, lockout, reset seguro, rate limit auth |
| A08 Software/Data Integrity | Hash de evolução; checksum de anexo; OpenAPI diff; lockfile; signed webhooks |
| A09 Security Logging & Monitoring | audit_log; Pino; anomalias; alertas S1/S2; Sentry com scrubbing |
| A10 SSRF | Sem fetch de URL de usuário; allowlist de webhooks; storage só por key interna |

Checklist detalhado com IDs: [RNF-seguranca-owasp.md](./requisitos/nao-funcionais/RNF-seguranca-owasp.md).

---

## 9. OWASP API Security Top 10 → middlewares

Ordem canônica (ver [08 — API v1](./08-api-v1.md)):

`helmet` → `cors` → `requestId` → `bodyLimit` → `rateLimit` → `authenticate` → `tenantContext` → `authorize` → `subscriptionGuard` → `validate(schema)` → `auditRead?` → handler → `errorHandler`

| API Risk | Controle |
| --- | --- |
| API1 BOLA / Object-level | RLS + IDs opacos; nunca confiar em `tenantId` do body |
| API2 Broken Auth | Fluxo identity (doc módulo 01); refresh reuse detection |
| API3 BOPLA / Property-level | Schemas Zod de response; não retornar campos internos; papéis |
| API4 Resource consumption | Rate limit; paginação max 100; export async; body 1 MB |
| API5 BFLA / Function-level | `authorize(permission)` por rota; matriz papel × endpoint |
| API6 Business flow | Idempotency-Key; máquina de estados; OTP limits |
| API7 SSRF | Ver A10 |
| API8 Misconfiguration | Headers, CORS, OpenAPI sem rotas internas públicas |
| API9 Inventory | OpenAPI gerado; rotas `/internal/*` fora do docs público |
| API10 Unsafe consumption | Validar payloads de webhook/gateway; timeout; circuit breaker |

---

## 10. Secure SDLC

### 10.1 Por feature / PR

Checklist obrigatório (além do DoD de [doc 12](./12-qualidade-testes.md)):

- [ ] Onde entra input? Schema Zod definido?
- [ ] Quem pode acessar? Permissão + teste por papel?
- [ ] Dado de outro tenant? RLS / teste de isolamento?
- [ ] Campo clínico novo? Entra no envelope? Audit de leitura?
- [ ] O que é logado? Redaction ok?
- [ ] Job/fila: idempotente + `tenantId` + sem plaintext clínico no payload?
- [ ] Segredo novo? Só no secret manager?

### 10.2 CI (segurança)

| Gate | Ferramenta |
| --- | --- |
| Segredos | gitleaks |
| Deps | `pnpm audit --audit-level=high` |
| Fronteiras | dependency-cruiser + eslint boundaries |
| Isolamento | testes RLS (Testcontainers) |
| Contrato | OpenAPI diff |
| Baseline dinâmico | OWASP ZAP baseline (staging/preview) |
| Tipos | `tsc --noEmit` strict |

### 10.3 Threat model leve por épico

Antes de fechar o épico: listar 3–5 abusos possíveis e o controle correspondente. Armazenar no PR ou em nota curta no módulo — sem cerimônia pesada.

---

## 11. Matriz MVP × Fase 2+

| Controle | MVP | Fase 2+ |
| --- | --- | --- |
| TLS + HSTS + helmet/CSP | ✔ | ✔ |
| RLS + testes CI | ✔ | ✔ |
| Envelope nos campos clínicos definidos | ✔ | Expandir campos / anexos CMEK |
| Audit append-only + leitura clínica | ✔ | Encadeamento de hash do prontuário |
| Anomalias por regra | ✔ | ML / UEBA se escala justificar |
| MFA TOTP | opcional | Obrigatório para OWNER |
| mTLS API↔worker | — | Avaliar |
| WAF ruleset custom | CDN básico | Regras por rota auth/public |
| Pentest externo | — | Antes de escalar base |
| Assinatura digital ICP / NGS2 | — | Fase 2 (doc 10) |
| E2EE no cliente | **Não** | Só se produto decidir explicitamente (ADR novo) |

---

## 12. Fundação na Sprint 0

Incluir na S0 (sem mudar pontos dos épicos de produto):

1. Secrets + validação de `env` (Zod) — app não sobe inválido
2. Middlewares de segurança esqueleto (`helmet`, CORS, rate limit, requestId, errorHandler)
3. Prisma + RLS na primeira tabela + testes de isolamento
4. Port `KeyManagementPort` + implementação stub/local; desenho de `tenant_crypto_key`
5. Esqueleto de `audit_log` + helper `platform.audit.record`
6. CI: lint, typecheck, arch, gitleaks, audit
7. Documentação de runbook mínimo: vazamento de credencial, suspeita de cross-tenant

Detalhe de implementação de código fica para quando a implementação começar — este doc é a política.

---

## Referências

- [10 — Segurança, LGPD e Compliance](./10-seguranca-lgpd-compliance.md)
- [15 — Glossário](./15-glossario.md) §4 (segurança, privacidade e compliance)
- [06 — Multi-Tenancy](./06-multi-tenancy.md)
- [08 — API v1](./08-api-v1.md)
- [ADR-0002 — RLS](./adr/0002-multi-tenancy-rls.md)
- [ADR-0007 — Envelope por tenant](./adr/0007-criptografia-envelope-tenant.md)
- [RNF segurança / OWASP](./requisitos/nao-funcionais/RNF-seguranca-owasp.md)
- OWASP Top 10 (2021); OWASP API Security Top 10; LGPD Lei 13.709/2018
