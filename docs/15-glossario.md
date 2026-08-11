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
| Use case | Operação de aplicação que orquestra domínio e ports (`ScheduleAppointmentUseCase`) |
| Port | Interface de dependência externa definida pelo domínio/aplicação |
| Adapter | Implementação concreta de um port em `infrastructure` |
| Repositório | Port de persistência de um agregado |
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

## 4. Convenções de nomenclatura

| Contexto | Convenção | Exemplo |
| --- | --- | --- |
| Tabelas e colunas | `snake_case`, singular | `clinical_note`, `starts_at` |
| Payload de API | `camelCase` | `startsAt`, `totalCents` |
| Classes | `PascalCase` | `ScheduleAppointmentUseCase` |
| Arquivos | `kebab-case` com sufixo de papel | `appointment.repository.ts`, `schedule-appointment.usecase.ts` |
| Eventos | `<modulo>.<entidade>_<verbo_passado>` | `scheduling.appointment_scheduled` |
| Códigos de erro | `SCREAMING_SNAKE_CASE` estável | `SLOT_UNAVAILABLE` |
| Jobs/filas | `kebab-case` verbal | `send-whatsapp-message` |
| Enums no banco | `SCREAMING_SNAKE_CASE` em `text` com `CHECK` ou tipo enum | `CONFIRMED` |
| Dinheiro | inteiro em centavos, sufixo `Cents` / `_cents` | `amountCents` |
| Datas | `*_at` para instante, `*_date` para data civil | `paid_at`, `due_date` |
| Booleanos | prefixo `is_`/`has_`/`requires_` quando ajudar leitura | `requires_tooth` |
| Rotas | substantivo plural, `kebab-case` | `/api/v1/treatment-plans` |

## 5. Termos que **não** usamos (para evitar ambiguidade)

| Evitar | Usar | Motivo |
| --- | --- | --- |
| "Cliente" para paciente | `Patient` | "Cliente" é a clínica (nosso cliente); paciente é do domínio clínico |
| "Empresa"/"Company" | `Tenant` (ou "clínica" na UI) | Consistência com multi-tenancy |
| "Consulta" como tabela | `Appointment` (agendamento) | Consulta é o ato; agendamento é o registro |
| "Ficha" | `MedicalRecord` | "Ficha" remete ao papel |
| "Assinatura" sem qualificar | `Subscription` (SaaS) vs `Signature` (documento) | Ambiguidade grave em código |
| "Serviço" para procedimento | `Procedure` | `Service` é termo técnico de camada |
| "Cancelado" para falta | `NO_SHOW` | Falta e cancelamento têm consequências diferentes |
| "Deletar" dado clínico | `amend` / `anonymize` / `inactivate` | Dado clínico não se apaga |
