# 14 — Métricas e KPIs

## 1. North star metric

> **Atendimentos concluídos e registrados no sistema por semana** (agregado em toda a base).

Racional: essa métrica só cresce se a clínica realmente agenda, atende, registra a evolução e confia no sistema. Ela captura simultaneamente adoção, valor entregue e substituição do papel — diferente de "usuários cadastrados", que cresce com marketing sem provar valor.

## 2. Métricas de produto (por tenant)

| Categoria | Métrica | Definição | Meta piloto |
| --- | --- | --- | --- |
| Ativação | Tempo até o 1º agendamento | signup → primeiro agendamento criado | < 15 min |
| Ativação | Tenants que completam o onboarding | % que finaliza o wizard | ≥ 80% |
| Ativação | Tempo até a 1ª evolução clínica | signup → primeira `clinical_note` | < 3 dias |
| Adoção | DAU/MAU por tenant | usuários ativos diários / mensais | ≥ 0,6 (uso diário) |
| Adoção | % de atendimentos com evolução no mesmo dia | `clinical_note` no dia do `COMPLETED` | ≥ 90% |
| Adoção | % de agendamentos criados no sistema (não em papel) | auditoria de origem | 100% |
| Adoção | % de clínicas com WhatsApp conectado | `whatsapp_account.status = CONNECTED` | ≥ 70% |
| Valor | Taxa de no-show | `NO_SHOW / (COMPLETED + NO_SHOW)` | queda ≥ 20% pós-adoção |
| Valor | Taxa de confirmação | consultas confirmadas / consultas notificadas | ≥ 60% |
| Valor | Slots recuperados pela fila de espera | agendamentos com `origin = WAITLIST` | ≥ 5% dos cancelamentos |
| Valor | Taxa de aprovação de orçamento | `APPROVED / SENT` | referência inicial; melhorar com CRM |
| Valor | Inadimplência | parcelas vencidas > 30 d / total a receber | acompanhar tendência |
| Eficiência | Cliques para agendar | telemetria de UI | ≤ 3 interações |
| Eficiência | Tempo médio para registrar evolução | abrir editor → assinar | < 60 s |
| Retenção | Retenção de tenant mês a mês | tenants ativos que seguem ativos | ≥ 95% |
| Qualidade | Erros por sessão | erros 5xx + exceções de UI | < 0,01 |

## 3. Métricas de negócio SaaS

| Métrica | Definição | Meta ano 1 |
| --- | --- | --- |
| MRR | Receita recorrente mensal | crescimento composto ≥ 10%/mês na fase inicial |
| ARPA | MRR / tenants pagantes | ≥ R$ 130 |
| Conversão trial → pago | pagantes / trials iniciados | ≥ 25% |
| CAC | custo de aquisição por cliente | ≤ 3× ARPA |
| LTV/CAC | — | ≥ 3 |
| Churn de receita | receita perdida / MRR inicial | ≤ 3%/mês |
| Payback de CAC | meses para recuperar o CAC | ≤ 6 meses |
| Margem bruta | (receita − custo de infra − custo de mensagem) / receita | ≥ 80% |
| Custo variável por tenant | infra + mensagens + storage | ≤ R$ 25/mês |
| NPS | pesquisa trimestral | ≥ 50 |
| CSAT do suporte | pós-atendimento | ≥ 90% |

### Unit economics de referência (hipótese a validar)

```
Preço médio (ARPA)                 R$ 130/mês
Custo de infra por tenant          R$   6/mês   (doc 11: ~US$ 1 no cenário de 500 tenants)
Custo de storage por tenant        R$   3/mês   (cota do plano)
Mensagens (repassadas)             R$   0       (créditos pré-pagos, margem neutra a positiva)
Suporte (rateio)                   R$  12/mês
──────────────────────────────────────────────
Margem de contribuição             R$ 109/mês   (~84%)
```

Se o CAC ficar em R$ 390 (3× ARPA), o payback é de ~3,6 meses — saudável para SMB, desde que o churn fique abaixo de 3%/mês.

## 4. Métricas operacionais e de saúde técnica

| Métrica | Alvo | Alerta |
| --- | --- | --- |
| Disponibilidade mensal | ≥ 99,5% | < 99,5% |
| p95 de latência da API | < 400 ms | > 1 s por 10 min |
| Taxa de erro 5xx | < 0,1% | > 1% em 5 min |
| Idade máxima de job na fila | < 2 min | > 10 min |
| Taxa de falha de envio WhatsApp | < 2% | > 10% |
| Jobs em DLQ | 0 | > 0 |
| Lag de processamento do outbox | < 10 s | > 60 s |
| Incidentes S1/S2 | 0 por trimestre | qualquer |
| Tempo de restauração de backup (ensaio) | < 4 h | > 4 h |
| Falhas de build no CI | < 10% dos PRs | tendência crescente |
| Vulnerabilidades altas em dependências | 0 | qualquer |

## 5. Instrumentação — o que registrar

**Eventos de produto** (nome + propriedades, sem dado clínico):

```
tenant_created            { plan, source }
onboarding_step_completed { step, durationMs }
appointment_created       { origin, leadTimeHours, hasProcedure }
appointment_status_changed{ from, to, actorType }
waitlist_offer_sent       { position }
waitlist_offer_accepted    { responseMinutes }
clinical_note_created     { durationMs, hasProcedures, attachmentsCount }
odontogram_updated        { teethCount, source }
quote_created             { itemsCount, totalCentsBucket }
quote_decided             { decision, decisionHours, approvalRate }
payment_received          { method, installmentNumber }
cash_session_closed       { hasDifference }
message_sent              { templateKey, category, automated }
message_failed            { errorCode }
report_exported           { report, format }
plan_limit_hit            { metric }
```

Regras: **nunca** enviar nome de paciente, telefone, CPF, diagnóstico ou texto de evolução para ferramenta de analytics. Valores monetários vão em faixas (`bucket`), não valores exatos, quando enviados a terceiros.

**Fonte da verdade:** para métricas de negócio críticas (no-show, receita, retenção), o cálculo é feito por SQL sobre o nosso banco (views em [doc 07](./07-modelo-de-dados.md)), não por ferramenta de analytics — evita divergência de número em reunião.

## 6. Painéis

### 6.1 Painel do cliente (dentro do produto)

- Hoje: consultas do dia por status, a receber do dia, pacientes aguardando.
- Mês: faturamento recebido, a receber, faltas, produção por profissional, novos pacientes.
- Comparativo com o mês anterior e, quando houver dados, com a média das clínicas de porte similar (benchmark anonimizado — só com opt-in).

### 6.2 Painel interno (nosso)

- Crescimento: novos tenants, trials, conversão, MRR, churn.
- Saúde de uso: tenants por faixa de atividade (ativo diário / semanal / inativo 14 d = risco de churn).
- Funil de ativação por etapa do onboarding (onde a clínica desiste).
- Custo por tenant (infra + mensagens + storage) e margem por plano.
- Saúde técnica: latência, erros, filas, envios de WhatsApp.
- Sinais de risco de privacidade: volume anômalo de leitura de prontuário, exportações, acessos de suporte.

## 7. Alertas de negócio (não só técnicos)

| Sinal | Ação |
| --- | --- |
| Tenant sem login há 7 dias | Contato proativo do sucesso do cliente |
| Tenant com 0 agendamento na semana após onboarding | Ligação de ativação |
| Queda > 30% em agendamentos de um tenant | Investigar (churn iminente) |
| Trial em D-3 sem cartão | E-mail + WhatsApp de conversão |
| Taxa de confirmação < 30% em um tenant | Revisar template/horário de envio |
| Créditos de mensagem esgotados | Aviso no app + oferta de recarga |
| Cota de storage > 90% | Aviso e oferta de upgrade |

## 8. Cadência de revisão

| Frequência | O que |
| --- | --- |
| Diária | Saúde técnica (erros, filas, latência) |
| Semanal | North star, ativação, uso por tenant, bugs abertos |
| Mensal | MRR, churn, conversão, margem, custo por tenant |
| Trimestral | NPS, roadmap x realidade, unit economics, revisão de preço |
