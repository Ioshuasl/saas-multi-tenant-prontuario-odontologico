# 10 — Segurança, LGPD e Compliance

> **Aviso.** Este documento é um plano técnico, não parecer jurídico. Dado de saúde é dado pessoal sensível e prontuário odontológico tem regras próprias de guarda e de sistema. Antes do lançamento comercial, o conteúdo aqui deve ser revisado por advogado(a) especializado(a) em saúde/proteção de dados e as normas citadas reconferidas nas fontes oficiais (as referências foram consultadas em agosto de 2026).

## 1. Base normativa que o produto precisa respeitar

| Norma | O que exige (em linhas gerais) | Impacto no produto |
| --- | --- | --- |
| **LGPD — Lei 13.709/2018** | Base legal para tratamento; dado de saúde é **sensível** (art. 11); direitos do titular; segurança e prevenção de incidentes; registro das operações | Consentimento versionado, controle de acesso, auditoria, exportação, resposta ao titular, contrato de operador |
| **Lei 13.787/2018** | Dispõe sobre digitalização, guarda, armazenamento e manuseio de prontuário do paciente por meio de sistemas informatizados | Nosso sistema é o meio de guarda: precisa de integridade, rastreabilidade e disponibilidade |
| **Resolução CFO-SEC-91/2009** | Autoriza a eliminação do papel e o uso de sistema informatizado para guarda/manuseio do prontuário **desde que** atendidos integralmente os requisitos do **NGS2** do Manual de Certificação para Sistemas de Registro Eletrônico em Saúde; o NGS2 exige uso de **assinatura digital** | Se quisermos afirmar "elimine o papel", precisamos de assinatura digital com certificado (ICP-Brasil) e aderência aos requisitos NGS2 |
| **Manual do Prontuário do CFO** | Registro claro e preciso, por atendimento, em ordem cronológica, com data, hora, nome, assinatura do profissional e nº de inscrição no CRO; prontuário individualizado; acesso livre e gratuito do paciente aos seus dados; informar quem teve acesso | Todo registro clínico carrega autor + CRO + timestamp; relatório de acessos por paciente; exportação gratuita para o titular |
| **Código de Ética Odontológica / sigilo profissional** | Sigilo sobre informações do paciente | Segregação de acesso por papel; suporte sem acesso padrão |
| **Marco Civil da Internet** | Guarda de registros de acesso | Log de acesso da aplicação com retenção definida |
| **WhatsApp Business Policy (Meta)** | Opt-in para mensagens, templates aprovados por categoria, restrições de conteúdo de saúde | Consentimento registrado antes de qualquer mensagem de marketing; templates transacionais sem dado clínico |

**Consequência prática de posicionamento:** no MVP usamos **assinatura eletrônica simples** (usuário autenticado + timestamp + hash do conteúdo + trilha de auditoria), o que dá excelente rastreabilidade, mas **não** afirmamos ao cliente que ele pode descartar o papel. A comunicação de "prontuário 100% digital / eliminação do papel" só é feita depois de implementarmos **assinatura digital com certificado** e verificarmos os requisitos NGS2 (fase 2 — ver [Roadmap](./13-roadmap-estimativas.md)). Prometer conformidade que não temos é risco jurídico para nós e para a clínica.

## 2. Papéis LGPD

| Papel | Quem | Responsabilidade |
| --- | --- | --- |
| **Controlador** | A clínica (tenant) | Define finalidade do tratamento dos dados dos pacientes |
| **Operador** | Nós (plataforma) | Tratamos em nome da clínica, seguindo instruções contratuais |
| **Titular** | Paciente (e também os usuários da clínica) | Exerce direitos de acesso, correção, portabilidade, eliminação |
| **Encarregado (DPO)** | Indicado por nós; recomendação de que a clínica também indique | Canal de comunicação com titulares e ANPD |

Documentos necessários no lançamento: Termos de Uso, Política de Privacidade, **Contrato/Anexo de Operador de Dados (DPA)** com cláusulas de subprocessadores (nuvem, storage, e-mail, Meta/WhatsApp, provedor de IA quando aplicável), Política de Retenção, Plano de Resposta a Incidentes.

## 3. Bases legais por finalidade

| Finalidade | Base legal (proposta) | Observação |
| --- | --- | --- |
| Registro clínico/prontuário | Tutela da saúde por profissional de saúde (art. 11, II, "f") + cumprimento de obrigação legal/regulatória | Não depende de consentimento; **não pode ser apagado** a pedido enquanto houver dever de guarda |
| Agendamento e comunicação transacional (confirmação, lembrete, recibo) | Execução de contrato / legítimo interesse do controlador | Mensagem transacional, sem conteúdo clínico |
| Comunicação de marketing (campanhas, aniversário, reativação) | **Consentimento** específico e revogável | Registrado com data, versão do texto e canal; revogação imediata |
| Cobrança e financeiro | Execução de contrato / obrigação legal (fiscal) | Retenção conforme prazo fiscal |
| Uso de imagem (fotos clínicas em divulgação) | Consentimento específico | Separado do consentimento de tratamento |
| Métricas de uso do SaaS (nós) | Legítimo interesse | Dados agregados/pseudonimizados; **nunca** conteúdo clínico |

## 4. Princípio de minimização aplicado ao produto

- Não coletamos dado que não usamos. Ex.: no autoagendamento pedimos nome + telefone (CPF opcional); nada de RG, filiação, renda.
- Templates de WhatsApp **nunca** contêm diagnóstico, procedimento ou qualquer dado clínico: "Olá {{nome}}, sua consulta na {{clínica}} é dia {{data}} às {{hora}}". Confirmar consulta não é revelar tratamento.
- Anexos e imagens ficam em bucket privado, acessíveis somente por URL assinada de curta duração.
- Logs de aplicação não registram corpo de requisição de rotas clínicas; campos sensíveis são redigidos por allowlist no logger.

## 5. Controles de segurança

### 5.1 Autenticação e sessão

- Senha com **Argon2id** (parâmetros calibrados: ~64 MB, 3 iterações, paralelismo 1–4), mínimo 10 caracteres, verificação contra listas de senhas vazadas.
- Access token JWT de 15 min (assinado com chave rotativa) + refresh token opaco de 30 dias, **rotativo**, em cookie `httpOnly; Secure; SameSite=Lax`.
- Detecção de reuso de refresh token → revogação de toda a família de tokens + alerta ao usuário.
- Bloqueio progressivo após tentativas falhas; log de login com IP/agente.
- MFA (TOTP) opcional na fase 2, obrigatório para papel OWNER na fase 3.

### 5.2 Autorização

- RBAC por papel + permissões pontuais em `membership.permissions`.
- Checagem no servidor em **toda** rota (`authorize('clinical_records.write')`), nunca só na UI.
- Isolamento de tenant garantido por RLS no banco ([doc 06](./06-multi-tenancy.md)).
- Regra específica: papel RECEPTION não lê conteúdo clínico; ASSISTANT lê mas não escreve evolução; FINANCE não acessa prontuário.

### 5.3 Criptografia

Modelo **enterprise** (não E2EE no cliente): detalhe operacional em [17 — Baseline de Segurança](./17-seguranca-baseline.md) e [ADR-0007](./adr/0007-criptografia-envelope-tenant.md).

| Onde | Como |
| --- | --- |
| Trânsito | TLS 1.2+ obrigatório, HSTS, redirect 301 de HTTP; TLS também para Postgres/Redis/S3/KMS em produção |
| Repouso (banco) | Criptografia de volume do provedor + backups criptografados |
| Repouso (anexos) | SSE no object storage; bucket privado, sem acesso público; URL pré-assinada de curta duração |
| Segredos | Env/arquivo na VPS (MVP); Vault depois; **nunca** no repositório; token do WhatsApp por referência (`access_token_ref`) |
| Campos clínicos (MVP) | **Envelope encryption por tenant** (AES-256-GCM): `clinical_note.content`, `anamnesis_response.answers`, `clinical_alert.description`; DEK wrapped por KEK **local na VPS** ([ADR-0013](./adr/0013-kms-local-vps.md)); intenção futura Vault self-hosted; decrypt só após RLS + RBAC |
| Expansão | Fase 2: mais campos, CMEK/SSE-C em anexos, rotação de DEK com re-cifra assíncrona |

### 5.4 Auditoria

`audit_log` registra: quem (usuário/paciente/sistema/suporte), o que (ação + recurso + `patient_id`), quando, de onde (IP/agente) e metadados.

Eventos obrigatoriamente auditados:

- Login, logout, falha de login, troca de senha.
- **Leitura** de prontuário, evolução, anexo, anamnese (exigência prática do "informar quem acessou").
- Criação/alteração/versão de evolução clínica.
- Exportação de dados e download de anexo.
- Alteração de permissão, convite e remoção de usuário.
- Acesso de suporte da plataforma (break-glass), com notificação ao Owner.
- Envio de mensagem ao paciente (quem/qual template/quando).

Retenção: 12 meses em tabela particionada + arquivamento frio por 5 anos. Auditoria é **append-only**; nem o Owner pode apagar.

Detecção de anomalias (rajada de leitura clínica, reuso de refresh, exportação em massa, etc.): regras e alertas em [doc 17 §6](./17-seguranca-baseline.md).

### 5.5 Integridade do registro clínico

1. `clinical_note` é append-only (trigger bloqueia `UPDATE`/`DELETE`).
2. Correção cria nova versão (`supersedes_id`) com `amend_reason` obrigatório; a versão anterior permanece legível.
3. `content_hash` (SHA-256) em cada versão permite provar que o conteúdo não foi alterado.
4. Assinatura registra usuário, CRO e timestamp do servidor (NTP).
5. Fase 2: encadeamento de hash por prontuário (cada nota referencia o hash da anterior) + assinatura digital com certificado ICP-Brasil e carimbo do tempo.

### 5.6 Proteções de aplicação

| Ameaça | Controle |
| --- | --- |
| Injeção SQL | ORM parametrizado; `$queryRaw` sempre com placeholders; proibido concatenar SQL |
| XSS | React escapa por padrão; `dangerouslySetInnerHTML` proibido; CSP restritiva |
| CSRF | Tokens em `Authorization` + cookie `SameSite=Lax` só para refresh; refresh exige header customizado |
| IDOR | RLS + resposta 404 (não 403) para recurso de outro tenant |
| Enumeração de usuário | Mensagens genéricas em login/recuperação; tempo de resposta constante |
| Brute force / abuso | Rate limit por IP, por tenant e por rota; OTP com limite de tentativas e expiração de 5 min |
| Upload malicioso | Validação de MIME e extensão por allowlist, limite de tamanho, verificação de checksum, `Content-Disposition: attachment`, servir sempre por domínio separado; varredura antivírus na fase 2 |
| SSRF | Sem fetch de URL fornecida por usuário; webhooks só de origens conhecidas com assinatura |
| Dependências vulneráveis | `npm audit`/Dependabot no CI; preferir versões publicadas há ≥ 7 dias; lockfile com versões fixas |
| Segredo vazado | Scanner de segredo no CI (gitleaks); rotação documentada |
| Webhook forjado | Verificação de `X-Hub-Signature-256` com o app secret antes de qualquer processamento |

## 6. Direitos do titular — implementação

| Direito | Implementação |
| --- | --- |
| Confirmação e acesso | `POST /privacy/data-subject-requests` (tipo `ACCESS`) → gera pacote PDF + JSON com todos os dados do paciente; prazo controlado pelo sistema |
| Correção | Edição de cadastro pelo próprio fluxo; correção de registro clínico via **amend** (a versão original permanece, como exige a natureza do prontuário) |
| Portabilidade | Exportação em JSON + CSV (dados estruturados) e anexos originais |
| Eliminação | Anonimização de dados **não** sujeitos a guarda obrigatória; o prontuário é retido sob obrigação legal/regulatória, com justificativa registrada e informada ao titular |
| Revogação de consentimento | Desliga imediatamente comunicação de marketing; transacional segue por base contratual |
| Informação sobre compartilhamento | Política de Privacidade lista subprocessadores; relatório de acessos por paciente disponível ao Owner |
| Oposição | Registro da oposição + análise pela clínica com apoio do nosso material |

Prazos: o sistema calcula `due_at` (15 dias para acesso/confirmação como parâmetro configurável) e alerta o Owner com antecedência.

## 7. Retenção e eliminação

| Dado | Retenção proposta | Base |
| --- | --- | --- |
| Prontuário e anexos clínicos | Guarda mínima conforme norma aplicável (**a confirmar com assessoria jurídica**; o mercado pratica prazos longos, com referência frequente a 20 anos após o último registro) — o sistema deve permitir configurar o prazo por tenant | Lei 13.787/2018 e normas do CFO |
| Documentos fiscais/financeiros | 5 anos | Legislação fiscal |
| Registros de acesso da aplicação | 6 meses (mínimo legal) a 12 meses | Marco Civil |
| `audit_log` | 12 meses quente + 5 anos arquivado | Boa prática/compliance |
| Mensagens de WhatsApp | 24 meses (configurável) | Necessidade operacional |
| Dados de tenant cancelado | 90 dias para exportação → anonimização (exceto o que houver dever de guarda) | LGPD + contrato |
| Backups | 30 dias (PITR 7 dias) | Recuperação |

Eliminação é **anonimização irreversível** (substituição de identificadores diretos, remoção de contatos e anexos), não `DELETE` silencioso — mantendo integridade estatística e histórico financeiro agregado.

## 8. Resposta a incidentes

1. **Detecção:** alertas de erro, anomalia de acesso (volume atípico de leitura de prontuários), falha de autenticação em massa, alerta do provedor.
2. **Classificação:** severidade S1–S4; S1 = possível exposição de dado pessoal sensível.
3. **Contenção:** revogar tokens/chaves, isolar recurso, bloquear conta comprometida.
4. **Investigação:** timeline por `audit_log` + logs correlacionados por `requestId`.
5. **Comunicação:** notificar as clínicas afetadas (controladores) em prazo definido no DPA; apoiar a comunicação à ANPD e aos titulares quando houver risco relevante.
6. **Post-mortem** sem culpabilização, com ações corretivas rastreadas.

Runbooks a escrever antes do lançamento: vazamento de credencial, acesso indevido entre tenants, perda de dado, indisponibilidade prolongada, comprometimento de token do WhatsApp.

## 9. Segurança no ciclo de desenvolvimento

- Revisão de PR obrigatória; nenhum push direto em `main`.
- CI: lint, typecheck, testes, `npm audit`, gitleaks, testes de isolamento multi-tenant.
- Ambientes separados (dev/staging/prod) com credenciais distintas; **proibido** dado real de paciente em dev/staging (usar dados sintéticos/anonimizados).
- Acesso a produção por perfil mínimo, com MFA e registro.
- Checklist de segurança por feature: onde entra input, quem pode acessar, o que é auditado, o que é logado.
- Fase 2: pentest externo antes de escalar a base de clientes.

## 10. Checklist antes do primeiro cliente pagante

- [ ] Termos de Uso, Política de Privacidade e DPA revisados por advogado(a)
- [ ] Encarregado (DPO) indicado e canal de contato publicado
- [ ] Registro de operações de tratamento (ROPA) preenchido
- [ ] RLS ativa em 100% das tabelas de tenant, com teste automatizado no CI
- [ ] Auditoria de leitura de prontuário funcionando e consultável pelo Owner
- [ ] Exportação completa dos dados do tenant testada de ponta a ponta
- [ ] Backup com restauração testada (não basta ter backup: é preciso ter restaurado)
- [ ] Rate limit e proteção de rotas públicas validados
- [ ] Sem segredo no repositório (scanner limpo)
- [ ] Comunicação de marketing bloqueada sem consentimento registrado
- [ ] Nenhuma afirmação de marketing sobre "eliminação do papel"/certificação enquanto não houver assinatura digital com certificado e verificação dos requisitos NGS2
- [ ] Plano de resposta a incidentes escrito e com responsáveis nomeados
