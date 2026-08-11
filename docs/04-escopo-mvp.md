# 04 — Escopo do MVP

## 1. Objetivo do MVP

> Permitir que uma clínica odontológica de 1 a 5 cadeiras **substitua completamente** papel, planilha e WhatsApp pessoal no ciclo: agendar → confirmar → atender → registrar → orçar → receber → cobrar.

Critério de "MVP pronto": uma clínica-piloto opera **um mês inteiro** exclusivamente no sistema, sem voltar a planilha, e o dono consegue fechar o mês pelo relatório de fluxo de caixa.

## 2. Dentro do escopo (fase 1)

| # | Épico | Entregáveis essenciais |
| --- | --- | --- |
| E1 | **Identidade e acesso** | Cadastro de clínica (signup), login com e-mail/senha, refresh token, recuperação de senha, convite de usuário por e-mail, perfis (Owner, Dentista, Recepção, Auxiliar, Financeiro), permissões por recurso, logout de todas as sessões |
| E2 | **Tenant, clínica e configurações** | Tenant + unidade, dados da clínica (razão social, CNPJ, CRO responsável, endereço, fuso horário), horários de funcionamento, cadeiras/salas, catálogo de procedimentos com preços, formas de pagamento aceitas |
| E3 | **Pacientes** | CRUD, busca por nome/CPF/telefone, dados de contato e responsável legal (menores), endereço, consentimentos (LGPD/comunicação), timeline do paciente, deduplicação por CPF/telefone |
| E4 | **Agenda** | Visão dia/semana por profissional e por cadeira, criação/edição/arrasto de agendamento, duração vinda do procedimento, status coloridos (Solicitado, Agendado, Confirmado, Atendendo, Atendido, Faltou, Cancelado), bloqueio de horário, compromisso recorrente, prevenção de conflito, fila de espera + reencaixe, link público de autoagendamento |
| E5 | **Prontuário clínico** | Anamnese (questionário configurável + resposta pelo paciente via link), alertas clínicos (alergias, condições), odontograma digital (permanente e decíduo, por dente e face), plano de tratamento, evolução clínica append-only com autoria/assinatura simples, anexos (imagens/PDF) com cota por plano, histórico completo por paciente |
| E6 | **Orçamentos e tratamentos** | Montagem de orçamento a partir do catálogo + dentes/faces, descontos, validade, PDF, envio ao paciente, aprovação (presencial ou por link), geração automática do plano de tratamento e das parcelas, execução de procedimento com baixa no plano |
| E7 | **Financeiro** | Contas a receber (parcelamento, baixa, estorno), contas a pagar (categorias, recorrência), caixa diário (abertura/fechamento por operador), fluxo de caixa (competência e caixa), inadimplência, recibo, relatório de produção por profissional |
| E8 | **WhatsApp e comunicação** | Conexão de número via WhatsApp Cloud API, templates transacionais (confirmação, lembrete, recibo, anamnese, orçamento), automações agendadas (D-1, H-3), webhook de status e de resposta com botões, caixa de entrada compartilhada com histórico por paciente, controle de créditos e log de envio auditável, kill switch por automação |
| E9 | **Relatórios essenciais** | Painel inicial (agenda do dia, a receber hoje, faltas do mês, produção do mês), faltas/cancelamentos, receita por período, inadimplência, procedimentos executados, produção por profissional, exportação CSV/Excel |
| E10 | **Billing do SaaS** | Planos, trial de 14 dias, status da assinatura, limites por plano (nº de profissionais/agendas, GB de anexo, créditos de mensagem), bloqueio suave ao expirar, tela de assinatura |
| E11 | **Plataforma e não-funcionais** | API v1 versionada, RLS multi-tenant, auditoria, jobs/filas, observabilidade, backup, LGPD (exportação e solicitação do titular), CI com lint/typecheck/testes |

## 3. Fora do escopo do MVP (com fase-alvo)

| Item | Fase | Motivo |
| --- | --- | --- |
| Comissionamento automático com regras complexas | 2 | Depende de produção consolidada; no MVP entregamos o **relatório de produção** que serve de base |
| Régua de cobrança automatizada | 2 | Requer módulo de mensagens maduro e política antinadimplência |
| CRM/funil de orçamentos não aprovados | 2 | Alto valor comercial, porém não bloqueia a operação diária |
| Contratos, termos de consentimento e assinatura eletrônica com validade jurídica | 2 | Exige integração com prestador de assinatura/ICP-Brasil |
| Receituário e atestado com assinatura digital (certificado A1/A3) | 2 | Idem |
| Convênios e tabelas por convênio / TISS | 2–3 | Complexidade regulatória e de integração |
| Estoque e controle protético | 2 | Não bloqueia o ciclo principal |
| Multi-unidade com consolidação e ranking | 2 | **Modelado** no MVP (coluna/entidade unidade existe), interface na fase 2 |
| Metas e dashboard analítico avançado | 2 | Após termos base de dados histórica |
| Pesquisa de satisfação (NPS) automática | 2 | Barato de fazer depois do módulo de mensagens |
| Importador de dados de concorrentes | 2 | Crítico para vendas, mas exige mapeamento por origem |
| NFS-e, boleto, Pix cobrança, maquininha, conta digital | 3 | Integrações financeiras reguladas; alto esforço |
| App nativo (dentista e paciente) | 3 | PWA responsivo cobre o MVP |
| IA (transcrição de evolução por voz, agente no WhatsApp) | 3 | Diferencial futuro; exige custo por uso e validação clínica |
| Site da clínica / campanhas de marketing | 3 | Fora do núcleo |
| Ortodontia/alinhadores, faceograma/HOF, fichas por especialidade | 3 | Especializações verticais |
| Integração com câmera intraoral / RX / DICOM | 3 | Alto esforço, hardware dependente |
| SSO corporativo, API pública para terceiros | 3 | Demanda de rede/enterprise |

## 4. User stories com critérios de aceite

Formato: `Como <persona>, quero <ação>, para <valor>`. Critérios em Gherkin resumido. Estimativa em pontos relativos (Fibonacci).

### E1 — Identidade e acesso

**US-1.1 (5)** Como visitante, quero criar minha clínica com e-mail e senha para começar a usar sem falar com vendedor.
- Dado um e-mail não cadastrado, quando eu submeto nome da clínica, meu nome, e-mail e senha forte, então são criados Tenant + Unidade + usuário Owner e recebo tokens de acesso.
- E-mail já usado → 409 sem revelar se pertence a outro tenant.
- Senha: mínimo 10 caracteres, verificada contra lista de senhas vazadas comuns; hash com Argon2id.

**US-1.2 (3)** Como usuário, quero fazer login e manter a sessão.
- Access token JWT curto (15 min) + refresh token rotativo em cookie httpOnly/SameSite=Lax; reuso de refresh revoga a família de tokens.
- 5 tentativas falhas em 10 min → bloqueio temporário progressivo.

**US-1.3 (3)** Como Owner, quero convidar minha equipe com um perfil definido.
- Convite por e-mail com token de uso único válido por 7 dias; ao aceitar, o usuário define senha e entra no tenant com o perfil atribuído.
- Convite pendente pode ser reenviado/revogado.

**US-1.4 (5)** Como Owner, quero que a recepção não veja o prontuário clínico.
- Perfil Recepção acessando endpoint de prontuário → 403 + evento de auditoria.
- A UI não exibe o menu/aba de prontuário para esse perfil (defesa em profundidade, não substituto do 403).

### E2 — Clínica e configurações

**US-2.1 (3)** Como Owner, quero cadastrar os dados da clínica (inclusive CRO do responsável técnico) para constar nos documentos.
**US-2.2 (5)** Como Owner, quero definir horário de funcionamento por dia da semana e por profissional, para a agenda só oferecer horários válidos.
- Suporte a intervalos (almoço), exceções por data (feriado/férias) e fuso horário do tenant.
**US-2.3 (5)** Como Owner, quero um catálogo de procedimentos com preço e duração padrão, partindo de um catálogo sugerido.
- Procedimento tem código, nome, especialidade, duração, preço, exige seleção de dente/face (sim/não).

### E3 — Pacientes

**US-3.1 (5)** Como recepção, quero cadastrar paciente rapidamente com o mínimo (nome + telefone) e completar depois.
- Validação de CPF quando informado; CPF duplicado no tenant → aviso de possível duplicata com link para o existente.
**US-3.2 (3)** Como recepção, quero buscar paciente por nome parcial, telefone ou CPF com resultado em < 300 ms para 50k pacientes.
**US-3.3 (3)** Como recepção, quero registrar responsável legal para pacientes menores de 18 anos.
- Menor sem responsável → aviso não bloqueante no cadastro e bloqueante na assinatura de documentos.
**US-3.4 (3)** Como Owner, quero registrar consentimentos (uso de dados, comunicação por WhatsApp, uso de imagem) com data e versão do termo.
- Sem consentimento de comunicação, o sistema não envia mensagem de marketing (transacional segue permitido).

### E4 — Agenda

**US-4.1 (8)** Como recepção, quero ver a agenda do dia por profissional em colunas, com status colorido.
- Grade configurável (10/15/20/30/60 min), visão dia e semana, filtro por profissional e cadeira, indicação de horário fora do expediente.
**US-4.2 (5)** Como recepção, quero criar agendamento em 3 interações a partir de um slot livre.
**US-4.3 (5)** Como recepção, quero mover/redimensionar um agendamento arrastando.
- Conflito de horário → rejeição com mensagem clara; movimentação registra histórico (quem, quando, de/para).
**US-4.4 (5)** Como sistema, devo impedir dois agendamentos no mesmo recurso e horário.
- Constraint de exclusão no banco (`tstzrange` + `EXCLUDE USING gist`) — não apenas validação na aplicação.
**US-4.5 (3)** Como recepção, quero bloquear horários (reunião, manutenção, férias).
**US-4.6 (5)** Como recepção, quero criar compromisso recorrente (ex.: manutenção ortodôntica mensal).
**US-4.7 (8)** Como paciente, quero agendar pelo link público da clínica.
- Só mostra horários realmente disponíveis; OTP por WhatsApp/SMS antes de confirmar; rate limit; política do tenant define se cai como SOLICITADO ou AGENDADO.
**US-4.8 (8)** Como recepção, quero uma fila de espera que ofereça automaticamente vagas canceladas.
- Ao liberar slot, ofertar aos compatíveis; primeiro aceite ocupa; demais notificados; log da oferta.

### E5 — Prontuário clínico

**US-5.1 (8)** Como dentista, quero um odontograma clicável (dentição permanente e decídua) para registrar achados e procedimentos por dente/face.
- Notação FDI; estados por dente/face (sadio, cariado, restaurado, ausente, implante, coroa, canal, extraído...); histórico por dente.
**US-5.2 (8)** Como paciente, quero responder a anamnese pelo celular antes da consulta.
- Link com token de uso único e expiração; respostas entram no prontuário; alergias/condições viram alertas destacados.
**US-5.3 (8)** Como dentista, quero registrar evolução clínica assinada e imutável.
- Após salvar, não há edição destrutiva: correção cria nova versão com motivo, mantendo a anterior visível; toda leitura/escrita é auditada.
**US-5.4 (5)** Como dentista, quero anexar imagens e PDFs ao prontuário.
- Upload direto para object storage via URL pré-assinada; tipos permitidos e limite por arquivo; cota por plano; nome original preservado.
**US-5.5 (3)** Como dentista, quero ver toda a história do paciente em uma timeline (consultas, evoluções, orçamentos, pagamentos, mensagens).

### E6 — Orçamentos e tratamentos

**US-6.1 (8)** Como dentista, quero montar orçamento com procedimentos, dentes/faces, quantidade, desconto e validade.
**US-6.2 (5)** Como recepção, quero enviar o orçamento em PDF por WhatsApp/e-mail com link de visualização.
**US-6.3 (8)** Como sistema, ao aprovar um orçamento devo criar o plano de tratamento e as parcelas a receber.
- Soma das parcelas = total do orçamento (arredondamento na primeira parcela); operação transacional; idempotente.
**US-6.4 (5)** Como dentista, quero marcar um item do plano como executado durante o atendimento.
- Executar atualiza odontograma, cria evolução vinculada e libera o item para faturamento/comissão.

### E7 — Financeiro

**US-7.1 (8)** Como financeiro, quero gerenciar contas a receber com baixa parcial/total, forma de pagamento e estorno.
**US-7.2 (5)** Como financeiro, quero lançar contas a pagar por categoria, com recorrência.
**US-7.3 (5)** Como recepção, quero abrir e fechar o caixa do dia conferindo os valores por forma de pagamento.
- Fechamento com divergência exige justificativa; caixa fechado é imutável.
**US-7.4 (8)** Como dono, quero ver o fluxo de caixa do mês (entradas, saídas, saldo) e o previsto vs. realizado.
**US-7.5 (5)** Como dono, quero a lista de inadimplentes por faixa de atraso (1–15, 16–30, 31–60, 60+).
**US-7.6 (5)** Como dono, quero o relatório de produção por profissional no período (base de comissão futura).

### E8 — WhatsApp e comunicação

**US-8.1 (8)** Como Owner, quero conectar o número da clínica ao sistema.
- Fluxo guiado (WABA/número/token); teste de envio; estado da conexão visível; erros com instrução acionável.
**US-8.2 (8)** Como sistema, devo enviar confirmação em D-1 e lembrete em H-3 por template de utilidade.
- Envio via fila com retry exponencial; respeita fuso do tenant e janela de silêncio (não enviar 21h–8h); não envia para agendamento cancelado.
**US-8.3 (5)** Como paciente, quero confirmar ou pedir remarcação por botão na mensagem.
- Webhook idempotente por `message_id`; "Confirmar" muda status; "Remarcar" abre conversa marcada para atendimento humano.
**US-8.4 (13)** Como recepção, quero uma caixa de entrada compartilhada vinculada ao paciente.
- Lista de conversas com não lidas, atribuição a um atendente, envio de texto/anexo dentro da janela de 24h, indicação visível de janela fechada (só template), histórico persistido no paciente.
**US-8.5 (5)** Como Owner, quero ver o consumo/custo de mensagens e desligar qualquer automação.

### E9 — Relatórios

**US-9.1 (5)** Painel inicial com agenda do dia, a receber do dia, faltas do mês, produção do mês.
**US-9.2 (5)** Relatórios: faltas/cancelamentos, receita por período, inadimplência, procedimentos executados, produção por profissional.
**US-9.3 (3)** Exportação CSV/Excel de qualquer relatório listado.

### E10 — Billing SaaS

**US-10.1 (5)** Trial de 14 dias sem cartão, com contador visível e avisos em D-3 e D-1.
**US-10.2 (5)** Limites por plano aplicados no servidor (profissionais ativos, GB de anexos, créditos de mensagem) com mensagem clara de upgrade.
**US-10.3 (3)** Assinatura expirada → modo somente-leitura (nunca perda de dados nem bloqueio de exportação).

### E11 — Plataforma

**US-11.1 (8)** Isolamento por tenant garantido no banco via RLS, com testes automatizados de vazamento entre tenants.
**US-11.2 (5)** Trilha de auditoria de acessos e alterações em dados sensíveis, consultável pelo Owner.
**US-11.3 (5)** Exportação completa dos dados do tenant (JSON + CSV + anexos) sob demanda do Owner.
**US-11.4 (3)** Health/readiness, logs estruturados com `requestId`/`tenantId`, métricas e rastreamento de erro.

## 5. Requisitos não funcionais do MVP

| Categoria | Requisito |
| --- | --- |
| Desempenho | p95 < 400 ms para leituras principais; agenda do dia < 1 s com 200 agendamentos; busca de paciente < 300 ms com 50k registros |
| Disponibilidade | Meta 99,5% no MVP (janela de manutenção comunicada) |
| Escala inicial | 500 tenants, 5k usuários ativos, 2M agendamentos, 50 GB de anexos |
| Segurança | TLS em trânsito, criptografia em repouso, RLS por tenant, senha com Argon2id, rate limit, auditoria, secrets fora do repositório |
| Privacidade | LGPD: base legal registrada, consentimento versionado, exportação e resposta ao titular, minimização de dados, retenção do prontuário conforme norma aplicável |
| Acessibilidade | Navegação por teclado nas telas de agenda e prontuário; contraste AA |
| i18n / l10n | pt-BR no MVP; textos externalizados e datas/moeda com `Intl`; timezone por tenant |
| Compatibilidade | Chrome/Edge/Firefox/Safari atuais; responsivo ≥ 360 px (PWA) |
| Observabilidade | Log estruturado, métricas de fila e de envio de mensagem, alertas de erro |
| Backup | Backup diário com PITR e teste de restauração documentado |

## 6. Definition of Ready / Done

**Ready:** história com valor claro, critérios de aceite testáveis, contrato de API definido em [08](./08-api-v1.md), impacto de dados mapeado, evento de domínio identificado (se houver) e telemetria definida.

**Done:** código com testes (unitário de domínio + integração de caso de uso + e2e do fluxo crítico), lint e typecheck limpos, migração aplicada, RLS validada, documento atualizado, revisado em PR e observável (log/métrica).

## 7. Ordem de execução sugerida

```
Sprint 0  Plataforma: monorepo, CI, Docker, Prisma, RLS, auth base, layout
Sprint 1  E1 + E2 (identidade, tenant, clínica, catálogo de procedimentos)
Sprint 2  E3 + E4a (pacientes, agenda interna)
Sprint 3  E4b (autoagendamento, fila de espera) + E8a (conexão WhatsApp + confirmação)
Sprint 4  E5 (prontuário, odontograma, anamnese, evolução, anexos)
Sprint 5  E6 (orçamentos → plano de tratamento → parcelas)
Sprint 6  E7 (financeiro completo, caixa, fluxo de caixa)
Sprint 7  E8b (inbox WhatsApp) + E9 (relatórios) + E10 (billing)
Sprint 8  Endurecimento: performance, segurança, LGPD, piloto com clínica real
```

Detalhes de esforço e riscos por fase em [Roadmap](./13-roadmap-estimativas.md).
