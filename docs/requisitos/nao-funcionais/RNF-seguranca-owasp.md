# RNF — Checklist OWASP (MVP)

Status padrão: **Planejado**. Atualizar para `Em implementação` / `Atendido` durante o desenvolvimento.

Fontes: [17 — Baseline de Segurança](../../17-seguranca-baseline.md), [10 — LGPD](../../10-seguranca-lgpd-compliance.md), [ADR-0007](../../adr/0007-criptografia-envelope-tenant.md).

---

## 1. OWASP Top 10 (2021)

| ID | Item OWASP | Requisito | Prioridade | Status |
| --- | --- | --- | --- | --- |
| RNF-OWASP-A01 | A01 Broken Access Control | RBAC em toda rota; RLS; recurso de outro tenant → 404; testes de isolamento no CI | Must | Planejado |
| RNF-OWASP-A02 | A02 Cryptographic Failures | TLS 1.2+; Argon2id; envelope AES-256-GCM por tenant (ADR-0007); segredos no secret manager/KMS | Must | Planejado |
| RNF-OWASP-A03 | A03 Injection | Prisma parametrizado; `$queryRaw` só com placeholders; Zod em body/query/params | Must | Planejado |
| RNF-OWASP-A04 | A04 Insecure Design | Threat model leve por épico; deny-by-default; append-only clínico; outbox; idempotência financeira | Must | Planejado |
| RNF-OWASP-A05 | A05 Security Misconfiguration | `helmet`, CORS allowlist, CSP, env Zod (app não sobe inválido), sem stack trace em prod | Must | Planejado |
| RNF-OWASP-A06 | A06 Vulnerable Components | `pnpm audit` high+ falha CI; lockfile; Dependabot/Renovação | Must | Planejado |
| RNF-OWASP-A07 | A07 Auth Failures | JWT 15 min; refresh rotativo + detecção de reuso; lockout; rate limit auth; reset sem enumeração | Must | Planejado |
| RNF-OWASP-A08 | A08 Integrity Failures | `content_hash` evolução; checksum anexo; webhook HMAC; OpenAPI diff; lockfile | Must | Planejado |
| RNF-OWASP-A09 | A09 Logging & Monitoring | `audit_log` append-only; Pino com redaction; anomalias (doc 17 §6); alertas S1/S2 | Must | Planejado |
| RNF-OWASP-A10 | A10 SSRF | Sem fetch de URL fornecida por usuário; webhooks de origens conhecidas com assinatura | Must | Planejado |

---

## 2. OWASP API Security Top 10

| ID | Item API | Requisito | Prioridade | Status |
| --- | --- | --- | --- | --- |
| RNF-API-01 | API1 BOLA | Autorização por objeto via RLS + membership; nunca `tenantId` do body como fonte de verdade | Must | Planejado |
| RNF-API-02 | API2 Broken Auth | Fluxos de [RF E1](../funcionais/01-identidade-acesso.md); cookie refresh httpOnly | Must | Planejado |
| RNF-API-03 | API3 BOPLA | Response schemas; omitir campos internos; filtrar por papel (ex.: recepção sem clínico) | Must | Planejado |
| RNF-API-04 | API4 Resource Consumption | Rate limit IP/tenant/rota; `limit` ≤ 100; body 1 MB; export/relatório pesado em fila | Must | Planejado |
| RNF-API-05 | API5 BFLA | `authorize(permission)` por endpoint; matriz papel × rota testada | Must | Planejado |
| RNF-API-06 | API6 Business Flow | `Idempotency-Key` em pagamento/mensagem/aprovação; máquina de estados; OTP com TTL/tentativas | Must | Planejado |
| RNF-API-07 | API7 SSRF | Igual RNF-OWASP-A10; presign valida tipo/tamanho/cota antes da URL | Must | Planejado |
| RNF-API-08 | API8 Misconfiguration | Headers de segurança; CORS; `/internal/*` fora do OpenAPI público | Must | Planejado |
| RNF-API-09 | API9 Inventory | OpenAPI gerado dos Zod; CI falha em rota não versionada / quebra sem bump | Must | Planejado |
| RNF-API-10 | API10 Unsafe Consumption | Validar webhooks Meta/gateway; timeout; erros de provedor → 503 sem vazar detalhe interno | Must | Planejado |

---

## 3. Controles de criptografia e endpoints (complemento)

| ID | Requisito | Prioridade | Status |
| --- | --- | --- | --- |
| RNF-CRYPTO-01 | Envelope encryption nos campos clínicos do MVP (`clinical_note.content`, `anamnesis_response.answers`, `clinical_alert.description`) | Must | Planejado |
| RNF-CRYPTO-02 | DEK por tenant wrapped por KEK no KMS; plaintext DEK só em memória/cache curto | Must | Planejado |
| RNF-CRYPTO-03 | AAD (tenantId + recurso) na autenticação GCM; decrypt com AAD errado falha | Must | Planejado |
| RNF-CRYPTO-04 | Ciphertext e DEK nunca em log, Sentry, analytics ou mensagem de erro | Must | Planejado |
| RNF-CRYPTO-05 | TLS em hops API↔Postgres, API↔Redis, API↔ObjectStorage, API↔KMS em produção | Must | Planejado |
| RNF-CRYPTO-06 | Webhook WhatsApp com `X-Hub-Signature-256` verificado antes de enfileirar | Must | Planejado |
| RNF-CRYPTO-07 | Respostas autenticadas com dado sensível usam `Cache-Control: no-store` | Must | Planejado |
| RNF-CRYPTO-08 | mTLS entre API e worker | Could (fase 2) | Planejado |

---

## 4. Detecção de anomalias

| ID | Requisito | Prioridade | Status |
| --- | --- | --- | --- |
| RNF-ANOM-01 | Regra de rajada de leitura clínica por usuário (janela 5 min) gera alerta + `ANOMALY_TRIGGERED` | Must | Planejado |
| RNF-ANOM-02 | Reuso de refresh revoga família e alerta usuário | Must | Planejado |
| RNF-ANOM-03 | Exportação em massa / downloads excessivos de anexo geram alerta | Must | Planejado |
| RNF-ANOM-04 | Rajada de 404 cross-tenant endurece rate limit e alerta | Should | Planejado |
| RNF-ANOM-05 | Break-glass sempre notifica Owner | Must | Planejado |
| RNF-ANOM-06 | Mudança de papel para OWNER ou grant clínico gera alerta | Should | Planejado |

---

## 5. Verificação sugerida (quando implementar)

- Testes RLS + BOLA (dois tenants)
- Teste de ciphertext no banco ≠ plaintext
- Teste de redaction no logger
- ZAP baseline em preview/staging
- gitleaks + audit no CI
- Simulação de `anomaly.clinical_read_burst` em staging
