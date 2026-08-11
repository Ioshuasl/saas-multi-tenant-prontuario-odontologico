# 15 — Glossário (Ubiquitous Language)

Este vocabulário é obrigatório em código, banco, API e conversas. Se um termo do negócio não estiver aqui, ele deve ser adicionado antes de virar nome de classe ou coluna.

## 1. Domínio odontológico

| Termo (pt-BR) | Termo no código | Definição |
| --- | --- | --- |
| Anamnese | `Anamnesis` | Questionário de histórico de saúde respondido pelo paciente (ou pelo profissional) antes/na consulta; origem dos alertas clínicos |
| Odontograma | `Odontogram` | Representação gráfica da arcada dentária com o estado de cada dente/face |
| Notação FDI | `fdi` | Padrão de numeração dos dentes por quadrante (11–48 permanentes; 51–85 decíduos) |
| Dentição permanente / decídua | `PERMANENT` / `DECIDUOUS` | Dentes definitivos / dentes de leite |
| Face dental | `face` | Superfície do dente: mesial (M), distal (D), vestibular (V), lingual/palatina (L), oclusal (O), cervical (C) |
| Evolução clínica | `ClinicalNote` | Registro cronológico e assinado do que foi feito no atendimento; imutável |
| Prontuário | `MedicalRecord` | Conjunto de todos os registros clínicos do paciente na clínica |
| Plano de tratamento | `TreatmentPlan` | Conjunto de procedimentos planejados e aprovados para um paciente |
| Orçamento | `Quote` | Proposta de valores dos procedimentos, com validade; pode ser aprovada parcialmente |
| Procedimento | `Procedure` | Item do catálogo de serviços (ex.: restauração, profilaxia), com preço e duração |
| Procedimento executado | `ExecutedProcedure` / `TreatmentItem` com `status = EXECUTED` | Procedimento efetivamente realizado; gera evolução, atualiza odontograma e produção |
| Cadeira / consultório | `Chair` | Recurso físico que limita atendimentos simultâneos |
| CRO | `croNumber` / `croState` | Registro do cirurgião-dentista no Conselho Regional de Odontologia |
| Cirurgião-dentista (CD) | `Professional` com papel `DENTIST` | Profissional habilitado a registrar evolução |
| ASB / auxiliar | `Professional`/`Membership` com papel `ASSISTANT` | Auxiliar em saúde bucal; leitura clínica sem registro de evolução |
| Especialidade | `specialty` | Área de atuação (ortodontia, endodontia, implantodontia, periodontia, HOF...) |
| Recall / retorno | `Recall` (fase 2) | Convite ao paciente para retorno periódico (ex.: profilaxia semestral) |
| Falta / no-show | `NO_SHOW` | Paciente não compareceu à consulta agendada |
| Encaixe / reencaixe | `WaitlistOffer` | Ocupar um horário que vagou com paciente da fila de espera |
| Convênio | `InsurancePlan` (fase 2) | Plano odontológico com tabela de preços própria |
| HOF | — | Harmonização Orofacial (fase 3) |
| Alinhadores | — | Tratamento ortodôntico com placas transparentes (fase 3) |

## 2. Domínio de negócio (SaaS e gestão)

| Termo | Código | Definição |
| --- | --- | --- |
| Tenant | `Tenant` | A clínica assinante; fronteira de isolamento, cobrança e exportação |
| Unidade | `Unit` | Filial/endereço da clínica; fronteira operacional de agenda e caixa |
| Membership | `Membership` | Vínculo entre um usuário global e um tenant, com papel |
| Papel | `Role` | `OWNER`, `DENTIST`, `RECEPTION`, `ASSISTANT`, `FINANCE` |
| Assinatura | `Subscription` | Contrato do SaaS entre nós e a clínica (não confundir com assinatura de documento) |
| Assinatura eletrônica simples | `signature.type = SIMPLE` | Autoria comprovada por usuário autenticado + timestamp + hash |
| Assinatura digital | `signature.type = ICP` (fase 2) | Assinatura com certificado (A1/A3) e validade jurídica reforçada |
| Título a receber | `Receivable` | Direito de crédito contra o paciente, dividido em parcelas |
| Parcela | `Installment` | Fração do título, com vencimento e status |
| Recebimento / baixa | `Payment` | Registro do valor efetivamente recebido, com forma de pagamento |
| Estorno | `reverse` | Anulação de um recebimento, com motivo e rastro |
| Conta a pagar | `Payable` | Despesa da clínica |
| Caixa (sessão) | `CashSession` | Abertura/fechamento do caixa por operador e unidade |
| Sangria / suprimento | `CashMovement` (`WITHDRAWAL` / `SUPPLY`) | Retirada / aporte de dinheiro no caixa |
| Fluxo de caixa | `CashFlow` | Entradas e saídas por período; visão caixa ou competência |
| Inadimplência | `Overdue` | Parcelas vencidas e não pagas |
| Produção | `ProductionEntry` | Valor dos procedimentos executados por profissional (base de comissão) |
| Comissão | `Commission` (fase 2) | Parte da produção devida ao profissional |
| Régua de cobrança | `DunningRule` (fase 2) | Sequência automática de lembretes de pagamento |

## 3. Domínio técnico

| Termo | Definição |
| --- | --- |
| Agregado (Aggregate) | Conjunto de entidades com uma raiz que garante invariantes e é a unidade de transação |
| Raiz de agregado | Entidade pela qual todo acesso ao agregado passa (ex.: `Appointment`) |
| Entidade | Objeto com identidade própria e ciclo de vida |
| Value Object | Objeto imutável definido por seus valores (ex.: `TimeSlot`, `Money`) |
| Bounded context | Fronteira de significado; aqui, um módulo do monólito |
| Evento de domínio | Fato ocorrido no domínio, em passado (`AppointmentScheduled`) |
| Outbox | Tabela que grava eventos na mesma transação do agregado, garantindo entrega |
| Use case (caso de uso) | Operação de aplicação que orquestra domínio e ports; no código vive em `services/<entidade>/` com classe curta (`CreateService`, `ListService`) — a entidade está no path do arquivo |
| Port | Dependência externa definida pela aplicação; no código vive em `types/ports/` |
| Adapter | Implementação concreta de um port (`repositories/<entidade>/`, `shared/integrations/`) |
| Repositório | Port/adapter de persistência; 1 operação = 1 arquivo (`patient_create.repository.ts` → `CreateRepository`) |
| Action | Orquestra persistência + efeitos além do repositório (outbox, outro módulo); ausente no CRUD puro |
| Unit of Work | Abstração de transação que agrupa escritas + publicação de eventos |
| RLS (Row Level Security) | Filtro de linhas aplicado pelo PostgreSQL por política |
| Idempotência | Propriedade de uma operação que, repetida, não muda o resultado |
| Janela de atendimento (WhatsApp) | Período de 24h aberto por mensagem do paciente, em que mensagens livres são gratuitas |
| Template (WhatsApp) | Mensagem pré-aprovada pela Meta, categorizada em marketing / utility / authentication |
| WABA | WhatsApp Business Account |
| `wamid` | Identificador único de mensagem do WhatsApp, usado para idempotência |
| Break-glass | Acesso emergencial de suporte a dado de tenant, aprovado e auditado |
| Fitness function | Teste automatizado que valida uma característica arquitetural |
| Expand/contract | Estratégia de migração em duas etapas para evitar downtime |

## 4. Segurança, privacidade e compliance

Vocabulário alinhado a [10 — LGPD](./10-seguranca-lgpd-compliance.md), [17 — Baseline de Segurança](./17-seguranca-baseline.md) e [ADR-0007](./adr/0007-criptografia-envelope-tenant.md). Usar estes nomes em código, ADRs e conversas — não inventar sinônimos.

| Termo (pt-BR / uso) | Termo no código | Definição |
| --- | --- | --- |
| Controlador | — (papel LGPD) | A clínica (tenant): decide a finalidade do tratamento dos dados dos pacientes |
| Operador | — (papel LGPD) | A plataforma (nós): trata dados em nome da clínica, conforme DPA |
| Titular | data subject / `Patient` (quando paciente) | Pessoa a quem se referem os dados pessoais |
| Encarregado (DPO) | — | Canal com titulares e ANPD; indicado pela plataforma (e recomendado na clínica) |
| DPA | — | Contrato/anexo de operador de dados (Data Processing Agreement) entre plataforma e clínica |
| Dado sensível | — | Dado de saúde (LGPD art. 11); exige base legal específica e controles reforçados |
| Consentimento | `Consent` | Registro versionado de aceite/revogação (ex.: marketing WhatsApp, uso de imagem) |
| Opt-in / opt-out | — | Consentimento prévio / revogação; marketing exige opt-in verificado em runtime |
| Minimização | — | Coletar e expor só o necessário à finalidade |
| Anonimização | `anonymize` | Eliminação irreversível de identificadores; usada em DSR de eliminação quando há dever de guarda do prontuário |
| Portabilidade | `EXPORT` / DSR `PORTABILITY` | Entrega dos dados do titular/tenant em formato estruturado (JSON/CSV + anexos) |
| DSR / solicitação do titular | `DataSubjectRequest` | Pedido LGPD (acesso, correção, eliminação, portabilidade, revogar consentimento) com `due_at` |
| ROPA | — | Registro das operações de tratamento (documento de compliance) |
| TLS | — | Criptografia em trânsito (cliente↔API e API↔serviços); obrigatório 1.2+ |
| Criptografia em repouso | at-rest / SSE | Cifrado no disco/volume/backup/object storage pelo provedor |
| Envelope encryption | `TenantCrypto` / envelope | DEK cifra o dado; KEK (KMS) cifra a DEK; modelo enterprise do MVP ([ADR-0007](./adr/0007-criptografia-envelope-tenant.md)) |
| DEK | `DataEncryptionKey` | Chave de dados por tenant (AES-256-GCM); plaintext só em memória |
| KEK | `KeyEncryptionKey` | Chave no KMS que envolve (wrap) a DEK; não exportável |
| Wrap / Unwrap | `KeyManagementPort.wrap/unwrap` | Cifrar/decifrar a DEK com a KEK |
| AAD | `aad` (Additional Authenticated Data) | Dados autenticados no GCM (ex.: `tenantId` + tabela + coluna + rowId) que amarram o ciphertext ao contexto |
| Ciphertext | — | Conteúdo cifrado persistido; oposto de plaintext |
| KMS | `KeyManagementPort` | Gestão de KEK/wrap DEK — MVP: local na VPS; futuro: Vault self-hosted ([ADR-0013](./adr/0013-kms-local-vps.md)) |
| Secret manager | — | Guarda segredos de runtime (JWT, tokens); distinto do KMS de DEK |
| E2EE (ponta a ponta no cliente) | — | Servidor só vê ciphertext; **não adotado** no MVP (ver ADR-0007) |
| Modelo enterprise (crypto) | — | TLS + at-rest + envelope por tenant; servidor descriptografa em memória no request autorizado |
| RBAC | `authorize(permission)` / `Role` | Controle de acesso baseado em papel (+ overrides em `membership.permissions`) |
| BOLA | — | Broken Object Level Authorization (OWASP API); mitigado por RLS + 404 cross-tenant |
| BFLA | — | Broken Function Level Authorization; mitigado por permissão por rota |
| IDOR | — | Acesso a recurso de outro usuário/tenant por manipulação de ID; resposta 404 |
| Argon2id | — | Algoritmo de hash de senha adotado |
| Refresh token rotativo | `RefreshTokenFamily` | Cada uso emite novo refresh; reuso revoga a família (detecção de roubo) |
| Trilha de auditoria | `AuditLog` / `audit_log` | Registro append-only de quem fez o quê, quando, em qual recurso/paciente |
| Append-only | — | Sem UPDATE/DELETE destrutivo (evolução clínica, auditoria) |
| `content_hash` | `contentHash` | SHA-256 do conteúdo canônico da evolução (integridade) |
| Amend | `amend` / `ClinicalNote.amend` | Correção que cria nova versão com motivo, preservando a anterior |
| Detecção de anomalia | `anomaly.*` / `ANOMALY_TRIGGERED` | Regras determinísticas (ex.: rajada de leitura de prontuário) que geram alerta |
| Rate limit | — | Limite de requisições por IP, tenant e/ou rota |
| CSP | Content-Security-Policy | Header que restringe origens de script/recurso no browser |
| HSTS | Strict-Transport-Security | Força uso de HTTPS no cliente |
| mTLS | — | TLS mútuo (cliente e servidor autenticam certificado); API↔worker na fase 2 |
| WAF | — | Web Application Firewall na borda (CDN) |
| SSRF | — | Server-Side Request Forgery; proibido fetch de URL fornecida pelo usuário |
| OWASP Top 10 | — | Lista de riscos web mais críticos; controles em [RNF-seguranca-owasp](./requisitos/nao-funcionais/RNF-seguranca-owasp.md) |
| OWASP API Top 10 | — | Riscos específicos de API (BOLA, BFLA, etc.) |
| Secure SDLC | — | Práticas de segurança no ciclo de desenvolvimento (checklist de PR, CI, threat model) |
| Threat model / STRIDE | — | Análise de ameaças (Spoofing, Tampering, Repudiation, Information disclosure, DoS, Elevation) |
| NGS2 | — | Nível do Manual de Certificação de Registro Eletrônico em Saúde; exigido para “eliminar o papel” (fase 2 + ICP) |
| ICP-Brasil | `signature.type = ICP` (fase 2) | Infraestrutura de chaves públicas brasileira para assinatura digital com certificado |

## 5. Convenções de nomenclatura

| Contexto | Convenção | Exemplo |
| --- | --- | --- |
| Tabelas e colunas | `snake_case`, singular | `clinical_note`, `starts_at` |
| Payload de API | `camelCase` | `startsAt`, `totalCents` |
| Classes de operação (backend) | `PascalCase` **curto**, sem entidade | `CreateService`, `ListRepository`, `CreateAction` |
| Tipagens TS (DTO, ports, I/O) | pasta `types/` (sem `interfaces/`) | `patient_create.types.ts`, `types/ports/*.port.ts` |
| Enums TypeScript | pasta `enum/` | `patient_origin.enum.ts` → `PatientOrigin` |
| Arquivos backend | `snake_case` + sufixo de papel | `patient_create.service.ts` → `class CreateService` |
| Arquivos frontend | `PascalCase` + papel | `PatientCreateData.ts`, `usePatientCreateHook.ts` |
| Eventos | `<modulo>.<entidade>_<verbo_passado>` | `scheduling.appointment_scheduled` |
| Códigos de erro | `SCREAMING_SNAKE_CASE` estável | `SLOT_UNAVAILABLE` |
| Jobs/filas | `kebab-case` verbal | `send-whatsapp-message` |
| Enums no banco | `SCREAMING_SNAKE_CASE` em `text` com `CHECK` ou tipo enum | `CONFIRMED` |
| Dinheiro | inteiro em centavos, sufixo `Cents` / `_cents` | `amountCents` |
| Datas | `*_at` para instante, `*_date` para data civil | `paid_at`, `due_date` |
| Booleanos | prefixo `is_`/`has_`/`requires_` quando ajudar leitura | `requires_tooth` |
| Rotas | substantivo plural, `kebab-case` | `/api/v1/treatment-plans` |
| Operações CRUD | `list` / `get` / `create` / `update` / `delete` | alinhado à API REST |

Detalhe da estrutura Orius (1 arquivo por ação, `Data → Service → Hook`) em [16 — Estrutura de Pastas](./16-estrutura-de-pastas.md).

## 6. Termos que **não** usamos (para evitar ambiguidade)

| Evitar | Usar | Motivo |
| --- | --- | --- |
| "Cliente" para paciente | `Patient` | "Cliente" é a clínica (nosso cliente); paciente é do domínio clínico |
| "Empresa"/"Company" | `Tenant` (ou "clínica" na UI) | Consistência com multi-tenancy |
| "Consulta" como tabela | `Appointment` (agendamento) | Consulta é o ato; agendamento é o registro |
| "Ficha" | `MedicalRecord` | "Ficha" remete ao papel |
| "Assinatura" sem qualificar | `Subscription` (SaaS) vs `Signature` (documento) | Ambiguidade grave em código |
| "Serviço" para procedimento | `Procedure` | `Service` é termo técnico: caso de uso em `services/` |
| "Cancelado" para falta | `NO_SHOW` | Falta e cancelamento têm consequências diferentes |
| "Deletar" dado clínico | `amend` / `anonymize` / `inactivate` | Dado clínico não se apaga |
| "Criptografia de ponta a ponta" / E2EE para o modelo atual | TLS + at-rest + **envelope por tenant** | E2EE no cliente **não** foi adotado (ADR-0007); não usar o termo em marketing nem em código |
| "Criptografado" sem dizer onde | Qualificar: *em trânsito* (TLS), *em repouso* (volume/SSE), *envelope* (campo) | Evita falsa sensação de E2EE |
| "Apagar prontuário" a pedido do titular | `anonymize` + retenção por obrigação legal | Prontuário tem dever de guarda; eliminação plena nem sempre é lícita |
| "Log de auditoria" editável pelo Owner | `audit_log` append-only | Nem o Owner apaga trilha de auditoria |
| "Chave no `.env` da app" para DEK/KEK | KMS + secret manager | DEK wrapped; KEK nunca no repositório nem no env da aplicação |
