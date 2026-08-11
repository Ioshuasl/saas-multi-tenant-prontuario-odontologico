# Módulo — Relatórios e Dashboard (`reporting`)

## 1. Responsabilidade

Transformar os dados operacionais em decisão. É um módulo **somente leitura**: não cria nem altera nada do domínio, apenas consulta (views/queries otimizadas) e exporta.

Princípio: no MVP, **sem data warehouse**. Consultas SQL sobre o banco transacional com índices adequados e views são suficientes para o volume esperado (500 tenants). Réplica de leitura entra quando a carga de relatório atrapalhar a operação — não antes.

## 2. Relatórios do MVP

| Relatório | Pergunta que responde | Permissão |
| --- | --- | --- |
| Dashboard do dia | O que acontece hoje? | `reports.read` |
| Faturamento | Quanto entrou/entrará por período? | `reports.financial` |
| Contas a receber e aging | Quem me deve e há quanto tempo? | `reports.financial` |
| Fluxo de caixa | Como está o dinheiro no tempo? | `reports.financial` |
| Faltas e cancelamentos | Quanto estou perdendo com cadeira vazia? | `reports.read` |
| Produção por profissional | Quem produziu quanto? | `reports.read` (própria) / `reports.financial` (todos) |
| Procedimentos mais realizados | Qual meu mix de serviços? | `reports.read` |
| Conversão de orçamentos | Quanto do que orço eu fecho? | `reports.read` |
| Novos pacientes e origem | De onde vêm meus pacientes? | `reports.read` |
| Ocupação da agenda | Quanto da minha capacidade uso? | `reports.read` |
| Consumo de mensagens | Quanto gasto em WhatsApp? | `reports.read` |
| Auditoria de acesso ao prontuário | Quem viu os dados de quem? | `audit.read` (Owner) |

Regra de escopo: `DENTIST` vê a própria produção e agenda; nunca o faturamento consolidado da clínica.

## 3. Dashboard do dia

```
┌─ Hoje, 20/08 ───────────────────────────────────────────────┐
│  12 consultas   9 confirmadas   1 falta   2 encaixes livres  │
│  A receber hoje R$ 2.340   Recebido R$ 1.180                 │
│  3 pacientes aguardando na fila de espera                    │
│  5 orçamentos aguardando resposta (R$ 12.400)                │
├─ Este mês ──────────────────────────────────────────────────┤
│  Recebido R$ 38.200 (+12% vs. jul)                           │
│  A receber R$ 21.900  ·  Em atraso R$ 4.300 (11 parcelas)    │
│  Taxa de falta 8,2% (-3,1 p.p.)                              │
│  Novos pacientes 27  ·  Conversão de orçamento 61%           │
└──────────────────────────────────────────────────────────────┘
```

Cada número é clicável e leva à lista que o originou — número sem drill-down gera desconfiança e ticket de suporte.

## 4. Exemplos de consulta

### Ocupação da agenda

```sql
WITH capacity AS (
  SELECT bh.professional_id,
         SUM(EXTRACT(EPOCH FROM (bh.ends_at - bh.starts_at)) / 60) AS capacity_minutes
  FROM business_hours bh
  WHERE bh.tenant_id = current_setting('app.tenant_id')::uuid
    AND bh.weekday = EXTRACT(ISODOW FROM $1::date) - 1
  GROUP BY bh.professional_id
), booked AS (
  SELECT a.professional_id,
         SUM(EXTRACT(EPOCH FROM (a.ends_at - a.starts_at)) / 60) AS booked_minutes
  FROM appointment a
  WHERE a.tenant_id = current_setting('app.tenant_id')::uuid
    AND a.starts_at::date = $1::date
    AND a.status NOT IN ('CANCELLED')
  GROUP BY a.professional_id
)
SELECT c.professional_id,
       c.capacity_minutes,
       COALESCE(b.booked_minutes, 0) AS booked_minutes,
       ROUND(100.0 * COALESCE(b.booked_minutes, 0) / NULLIF(c.capacity_minutes, 0), 1) AS occupancy_pct
FROM capacity c LEFT JOIN booked b USING (professional_id);
```

### Conversão de orçamentos

```sql
SELECT date_trunc('month', q.created_at) AS month,
       COUNT(*) FILTER (WHERE q.status = 'SENT')                                    AS sent,
       COUNT(*) FILTER (WHERE q.status IN ('APPROVED', 'PARTIALLY_APPROVED'))        AS approved,
       COUNT(*) FILTER (WHERE q.status = 'REJECTED')                                 AS rejected,
       COUNT(*) FILTER (WHERE q.status = 'EXPIRED')                                  AS expired,
       SUM(q.total_cents) FILTER (WHERE q.status IN ('APPROVED', 'PARTIALLY_APPROVED')) AS approved_cents,
       ROUND(100.0 * COUNT(*) FILTER (WHERE q.status IN ('APPROVED', 'PARTIALLY_APPROVED'))
             / NULLIF(COUNT(*) FILTER (WHERE q.status <> 'DRAFT'), 0), 1)            AS conversion_pct
FROM quote q
WHERE q.tenant_id = current_setting('app.tenant_id')::uuid
  AND q.created_at >= $1 AND q.created_at < $2
GROUP BY 1 ORDER BY 1 DESC;
```

### Perda por falta

```sql
SELECT COUNT(*) AS no_shows,
       SUM(COALESCE(p.price_cents, 0)) AS estimated_loss_cents
FROM appointment a
LEFT JOIN procedure p ON p.id = a.procedure_id
WHERE a.tenant_id = current_setting('app.tenant_id')::uuid
  AND a.status = 'NO_SHOW'
  AND a.starts_at >= $1 AND a.starts_at < $2;
```

Esse número — "você perdeu R$ X com faltas neste mês" — é o argumento mais forte de valor do produto e justifica a automação de confirmação.

## 5. Arquitetura interna

- `reporting` **não** importa domínio de outros módulos nem escreve em tabelas alheias; usa views e consultas de leitura declaradas no próprio módulo (dependência de leitura documentada e testada).
- Toda consulta roda no contexto de tenant (RLS ativa) — relatório não é exceção de segurança.
- Nada de `SELECT *`: colunas explícitas e limite de período obrigatório (default 90 dias, máximo 24 meses por consulta).
- Cache curto (60 s) em Redis para dashboards, com chave por tenant + filtros; invalidação por tempo, não por evento (simplicidade).
- Consulta acima de 2 s vira exportação assíncrona automaticamente.

## 6. Exportação

`POST /reports/:report/export` → `202 { jobId }` → job gera CSV/XLSX no storage → `GET /exports/:id` devolve URL assinada (válida 1 h, expira em 7 dias).

Regras: exportação é auditada (`REPORT_EXPORTED` com filtros usados); CSV em UTF-8 com BOM e separador `;` (compatível com Excel pt-BR); valores monetários em formato numérico decimal (não string formatada); exportação de dados clínicos exige `clinical_records.read` e registra `patient_id` afetados.

## 7. Testes obrigatórios

- Relatório de um tenant nunca inclui linha de outro (teste com dois tenants populados).
- Dentista não acessa relatório financeiro consolidado (403).
- Fluxo de caixa por competência e por caixa divergem conforme esperado em cenário com pagamento atrasado.
- Ocupação com profissional sem horário cadastrado não divide por zero.
- Soma de faturamento do relatório é igual à soma dos pagamentos do período (conferência cruzada).
- Exportação grande não bloqueia a API (roda como job).
- Período acima do limite máximo é rejeitado com erro claro.
