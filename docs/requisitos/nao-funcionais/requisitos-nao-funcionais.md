# Requisitos Não Funcionais (RNF) — MVP

Derivados de [04 §5](../../04-escopo-mvp.md), [10](../../10-seguranca-lgpd-compliance.md), [17](../../17-seguranca-baseline.md), [11](../../11-infra-devops.md) e [12](../../12-qualidade-testes.md). Aplicam-se a todo o sistema, salvo indicação. Segurança OWASP detalhada em [RNF-seguranca-owasp.md](./RNF-seguranca-owasp.md).

---

## 1. Desempenho (`RNF-PERF`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-PERF-01 | Leituras principais da API com latência p95 &lt; 400 ms | Must | k6 / APM em staging com carga representativa |
| RNF-PERF-02 | Agenda do dia carrega em &lt; 1 s com até 200 agendamentos | Must | US-4.1, teste de volume |
| RNF-PERF-03 | Busca de paciente &lt; 300 ms com até 50k pacientes no tenant | Must | US-3.2 |
| RNF-PERF-04 | LCP das páginas públicas (autoagendamento) &lt; 2,5 s em 4G | Must | doc 09 |
| RNF-PERF-05 | TTI da agenda autenticada &lt; 3 s | Should | doc 09 |
| RNF-PERF-06 | Bundle inicial da área autenticada &lt; 250 KB gzip (code splitting de odontograma/gráficos/editor) | Should | doc 09 |
| RNF-PERF-07 | Evolução clínica registrável em &lt; 60 s de interação do dentista (meta de UX) | Should | J6 |
| RNF-PERF-08 | Agendamento pela recepção em ≤ 3 interações | Must | J2, princípio de produto |
| RNF-PERF-09 | Relatório que exceda ~2 s de consulta vira exportação assíncrona | Must | módulo reporting |
| RNF-PERF-10 | Grade da agenda mantém ~60 fps com 200 itens (virtualização) | Should | doc 09 |

---

## 2. Disponibilidade e continuidade (`RNF-AVL`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-AVL-01 | Disponibilidade mensal ≥ 99,5% no MVP (janela de manutenção comunicada) | Must | uptime externo em `/health` |
| RNF-AVL-02 | Processos API e worker são stateless e escalam horizontalmente | Must | doc 11 |
| RNF-AVL-03 | Indisponibilidade do WhatsApp não impede agendar; mensagens acumulam na fila e a UI avisa | Must | doc 11, messaging |
| RNF-AVL-04 | Indisponibilidade do storage bloqueia upload novo, não a operação de agenda | Must | doc 11 |
| RNF-AVL-05 | Deploys preferencialmente fora de 08:00–19:00 (horário comercial da clínica) | Should | doc 11 |
| RNF-AVL-06 | Rolling update com health/readiness (DB, Redis, storage) antes de receber tráfego | Must | doc 11 |

---

## 3. Escalabilidade (`RNF-SCALE`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-SCALE-01 | Arquitetura dimensionada para ~500 tenants, ~5k usuários ativos, ~2M agendamentos, ~50–200 GB de anexos no ano 1 | Must | doc 04 §5 |
| RNF-SCALE-02 | Listagens paginadas com `limit` máximo 100 e cursor | Must | doc 08 |
| RNF-SCALE-03 | Rate limit por tenant (além de por IP) para conter noisy neighbor | Must | doc 06 |
| RNF-SCALE-04 | Índices compostos com `tenant_id` como primeira coluna nas buscas operacionais | Must | doc 06/07 |
| RNF-SCALE-05 | Relatórios pesados e exportações rodam em fila, não no request HTTP | Must | ADR-0006 |

---

## 4. Segurança (`RNF-SEC`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-SEC-01 | TLS 1.2+ em trânsito; HSTS; redirect HTTP→HTTPS | Must | doc 10 |
| RNF-SEC-02 | Criptografia em repouso no banco e no object storage (bucket privado) | Must | doc 10 |
| RNF-SEC-03 | Senhas com Argon2id; mínimos e checagem de senhas vazadas | Must | RF-E1-03 |
| RNF-SEC-04 | Access JWT curto + refresh opaco rotativo em cookie `httpOnly; Secure; SameSite=Lax` | Must | doc 10 |
| RNF-SEC-05 | Autorização revalidada no servidor em toda rota; UI não é controle de segurança | Must | doc 08/09 |
| RNF-SEC-06 | Isolamento por RLS; role da app sem `BYPASSRLS`; `SET LOCAL` por transação | Must | ADR-0002 |
| RNF-SEC-07 | Segredos fora do repositório; token WhatsApp por referência; scanner gitleaks no CI | Must | doc 10/11 |
| RNF-SEC-08 | Rate limit em auth, rotas públicas e global; OTP com limite de tentativas e TTL | Must | doc 08/10 |
| RNF-SEC-09 | Proteções OWASP Top 10 + API Top 10 (checklist dedicado) | Must | [RNF-seguranca-owasp.md](./RNF-seguranca-owasp.md), doc 17 |
| RNF-SEC-10 | Webhook WhatsApp com verificação `X-Hub-Signature-256` | Must | RF-E8-18 |
| RNF-SEC-11 | Dependências: audit de vulnerabilidades altas no CI; lockfile fixo | Must | doc 12 |
| RNF-SEC-12 | Ambientes dev/staging **sem** dado real de paciente | Must | doc 10 |
| RNF-SEC-13 | Suíte automatizada de isolamento multi-tenant em todo PR | Must | US-11.1, doc 12 |
| RNF-SEC-14 | Resposta a incidente documentada (runbooks S1) | Must | doc 10 |
| RNF-SEC-15 | Envelope encryption (AES-256-GCM) por tenant nos campos clínicos do MVP; KEK no KMS | Must | ADR-0007, doc 17 |
| RNF-SEC-16 | DEK plaintext só em memória/cache curto; nunca em log, Sentry ou resposta de erro | Must | ADR-0007 |
| RNF-SEC-17 | Headers: HSTS, CSP, `nosniff`, Referrer-Policy, Permissions-Policy; `Cache-Control: no-store` em respostas sensíveis | Must | doc 17 §7 |
| RNF-SEC-18 | TLS nos hops API↔Postgres, API↔Redis, API↔ObjectStorage, API↔KMS em produção | Must | doc 17 §7 |
| RNF-SEC-19 | Detecção de anomalias por regras (leitura clínica, refresh reuse, exportação em massa, cross-tenant) | Must | doc 17 §6, RNF-ANOM-* |
| RNF-SEC-20 | Checklist de segurança em todo PR que toca auth, clínico, tenant ou crypto | Must | doc 17 §10 |
| RNF-SEC-21 | ZAP baseline no pipeline de preview/staging | Should | doc 12/17 |
| RNF-SEC-22 | MFA TOTP (obrigatório para OWNER na fase 3) | Could (fase 2/3) | doc 10 |

> Checklist itemizado OWASP: [RNF-seguranca-owasp.md](./RNF-seguranca-owasp.md).

---

## 5. Privacidade e compliance (`RNF-PRIV`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-PRIV-01 | Dado de saúde tratado como sensível (LGPD art. 11); bases legais registradas por finalidade | Must | doc 10 |
| RNF-PRIV-02 | Minimização: autoagendamento pede só o necessário; templates sem dado clínico | Must | doc 10 |
| RNF-PRIV-03 | Consentimento de marketing versionado e revogável com efeito imediato | Must | RF-E3-07/08 |
| RNF-PRIV-04 | Direitos do titular: acesso, correção (via amend no clínico), portabilidade, eliminação/anonimização, informação de acessos | Must | RF-E11, J10 |
| RNF-PRIV-05 | Retenção de prontuário configurável conforme norma; não apagar por inadimplência SaaS | Must | doc 10 |
| RNF-PRIV-06 | Logs sem PII/clínico desnecessário; scrubbing em ferramenta de erro | Must | doc 10/11 |
| RNF-PRIV-07 | Comunicação de marketing do produto **não** afirma “eliminação do papel” até assinatura digital ICP + NGS2 | Must | doc 10, R10 |
| RNF-PRIV-08 | DPA, Termos e Política revisados por assessoria antes do primeiro cliente pagante | Must | checklist doc 10 |
| RNF-PRIV-09 | Dados preferencialmente hospedados em região Brasil quando disponível | Should | doc 11 |
| RNF-PRIV-10 | Modelo de criptografia é enterprise (operador processa plaintext em memória), não E2EE — comunicado internamente e alinhado ao DPA | Must | ADR-0007 |
| RNF-PRIV-11 | Payload de `audit_log` não contém conteúdo clínico, tokens nem DEK | Must | doc 17 §5.3 |
| RNF-PRIV-12 | Jobs/filas carregam IDs, nunca plaintext de evolução/anamnese | Must | ADR-0006, doc 17 |

---

## 6. Integridade de dados clínicos e financeiros (`RNF-INT`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-INT-01 | Evolução clínica append-only (domínio + API + trigger) | Must | RF-E5-10 |
| RNF-INT-02 | Hash SHA-256 do conteúdo da evolução por versão | Must | doc 10 |
| RNF-INT-03 | Dinheiro sempre em centavos inteiros; parcelamento com soma exata (teste de propriedade) | Must | RF-E7-20, A4 |
| RNF-INT-04 | Double-booking impedido por constraint `EXCLUDE` no Postgres | Must | RF-E4-06 |
| RNF-INT-05 | Operações financeiras e de envio de mensagem com idempotência | Must | doc 08 |
| RNF-INT-06 | Outbox transacional: agregado e evento commitam juntos | Must | ADR-0006 |
| RNF-INT-07 | Caixa fechado e evolução assinada são imutáveis | Must | RF-E5/E7 |

---

## 7. Usabilidade (`RNF-UX`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-UX-01 | Fluxo da recepção priorizado: agendar/confirmar/receber com poucos cliques | Must | doc 01 princípios |
| RNF-UX-02 | Onboarding self-service: primeiro agendamento em &lt; 15 minutos | Must | J1 |
| RNF-UX-03 | Telas leves e tolerantes a rede instável; mutação otimista na agenda com rollback | Must | doc 01/09 |
| RNF-UX-04 | Estados de lista: loading (skeleton), vazio com CTA, erro com retry, sem permissão | Must | doc 09 |
| RNF-UX-05 | Mensagens de erro em pt-BR acionáveis; `requestId` disponível em “detalhes” | Must | doc 08/09 |
| RNF-UX-06 | Status da agenda nunca comunicado só por cor (ícone + texto) | Must | a11y + UX |
| RNF-UX-07 | Indicadores de automação transparentes (o que será enviado / kill switch) | Must | D6 |

---

## 8. Acessibilidade (`RNF-A11Y`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-A11Y-01 | Navegação por teclado completa na agenda e no prontuário; foco visível | Must | doc 04/09 |
| RNF-A11Y-02 | Contraste mínimo WCAG AA | Must | doc 04 |
| RNF-A11Y-03 | Odontograma: cada dente/face como controle com `aria-label` descritivo | Must | doc 09 |
| RNF-A11Y-04 | `aria-live` em toasts e atualizações críticas | Should | doc 09 |
| RNF-A11Y-05 | Zero violações críticas axe-core nas telas principais (e2e) | Should | doc 12 |

---

## 9. Internacionalização e localização (`RNF-I18N`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-I18N-01 | Idioma do MVP: pt-BR; textos externalizados (não hardcoded espalhado) | Must | doc 04 |
| RNF-I18N-02 | Datas/moeda via `Intl`; timezone do tenant na borda; UTC no banco | Must | doc 05/09 |
| RNF-I18N-03 | Telefone em E.164; CPF/CNPJ com máscaras nacionais na UI | Must | domínio BR |

---

## 10. Compatibilidade (`RNF-COMPAT`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-COMPAT-01 | Chrome, Edge, Firefox e Safari nas versões atuais | Must | doc 04 |
| RNF-COMPAT-02 | Layout responsivo a partir de 360 px; PWA (shell) no MVP | Must | doc 04/09 |
| RNF-COMPAT-03 | Escrita offline de dado clínico fora do MVP (exige rede) | Won't (MVP) | doc 09 |

---

## 11. Observabilidade (`RNF-OBS`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-OBS-01 | Logs JSON (Pino) com `requestId`, `tenantId`, `userId`, rota, duração, status | Must | US-11.4 |
| RNF-OBS-02 | Erros agregados (ex.: Sentry) com scrubbing de PII | Must | doc 11 |
| RNF-OBS-03 | Métricas: latência p50/p95/p99, 5xx, tamanho/idade de fila, falhas WhatsApp, lag do outbox | Must | doc 11/14 |
| RNF-OBS-04 | Alertas com dono: 5xx &gt; 1% / 5 min; p95 &gt; 1 s / 10 min; fila &gt; 10 min; WhatsApp falha &gt; 10%; backup; pico de leitura clínica | Must | doc 11 |
| RNF-OBS-05 | Tracing distribuído (OpenTelemetry) | Could (fase 2) | doc 11 |
| RNF-OBS-06 | Eventos de anomalia (`ANOMALY_TRIGGERED`) correlacionados por `requestId`/`tenantId`/`actorId` | Must | doc 17 §6 |
| RNF-OBS-07 | Métricas de crypto: latência de unwrap DEK, falhas GCM, cache hit de DEK (sem expor chave) | Should | ADR-0007 |

---

## 12. Backup e recuperação (`RNF-DR`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-DR-01 | Backup diário do banco + PITR (7 dias); retenção de snapshots 30 dias | Must | doc 11 |
| RNF-DR-02 | Object storage com versionamento; retenção de versão 30 dias | Must | doc 11 |
| RNF-DR-03 | RPO ≤ 15 min · RTO ≤ 4 h (MVP) | Must | doc 11 |
| RNF-DR-04 | Restauração ensaiada periodicamente (trimestral) com tempo registrado | Must | checklist doc 10 |
| RNF-DR-05 | Exportação do tenant pelo Owner como plano B de continuidade | Must | RF-E11-05 |

---

## 13. Manutenibilidade e qualidade (`RNF-QUAL`)

| ID | Requisito | Prioridade | Métrica / critério |
| --- | --- | --- | --- |
| RNF-QUAL-01 | TypeScript `strict` + lint de fronteiras (Clean Architecture / módulos) | Must | doc 05/12/16 |
| RNF-QUAL-02 | CI bloqueia merge sem lint, typecheck, arch check, unit, integration, e2e | Must | doc 11/12 |
| RNF-QUAL-03 | Cobertura mínima: `models/` ≥ 90%; `services/` ≥ 85%; global ≥ 80% | Must | doc 12 |
| RNF-QUAL-04 | Contrato OpenAPI gerado dos schemas; quebra sem bump de versão falha o build | Must | ADR-0003 |
| RNF-QUAL-05 | Migrações expand/contract; SQL manual para RLS, EXCLUDE, triggers, views | Must | doc 07 |
| RNF-QUAL-06 | Definition of Done por história (testes, RLS, permissões, auditoria, docs) | Must | doc 04/12 |
| RNF-QUAL-07 | Jobs idempotentes, com `tenantId`, retry limitado e DLQ com alerta | Must | ADR-0006 |
| RNF-QUAL-08 | Um artefato para API e worker; fronteiras de módulo verificadas automaticamente | Must | ADR-0001 |

---

## 14. Matriz rápida — categorias × prioridade MVP

| Categoria | Must (resumo) |
| --- | --- |
| Desempenho | p95 &lt; 400 ms; agenda &lt; 1 s; busca &lt; 300 ms |
| Disponibilidade | 99,5%; degradação graciosa sem WhatsApp/storage |
| Escala | 500 tenants; paginação; rate limit por tenant |
| Segurança | TLS, Argon2id, RLS, envelope por tenant, OWASP, anomalias, secrets/KMS |
| Privacidade | LGPD, consentimento, exportação, sem claim falso de “sem papel”, sem E2EE indevido |
| Integridade | Append-only clínico; centavos; anti double-booking; outbox |
| UX | ≤ 3 cliques agendar; onboarding &lt; 15 min; erros acionáveis |
| A11y | Teclado agenda/prontuário; contraste AA |
| i18n | pt-BR; timezone por tenant |
| Compat | Browsers atuais; ≥ 360 px |
| Observabilidade | Logs, métricas, alertas |
| DR | PITR, RPO/RTO, restore ensaiado |
| Qualidade | CI completo, cobertura, OpenAPI, DoD |

## Referências

- [04 — Escopo do MVP](../../04-escopo-mvp.md)
- [10 — Segurança, LGPD e Compliance](../../10-seguranca-lgpd-compliance.md)
- [17 — Baseline de Segurança Enterprise](../../17-seguranca-baseline.md)
- [ADR-0007 — Envelope por tenant](../../adr/0007-criptografia-envelope-tenant.md)
- [Checklist OWASP](./RNF-seguranca-owasp.md)
- [11 — Infraestrutura e DevOps](../../11-infra-devops.md)
- [12 — Qualidade e Testes](../../12-qualidade-testes.md)
- [14 — Métricas e KPIs](../../14-metricas-kpis.md)
- [Requisitos funcionais](../README.md)
