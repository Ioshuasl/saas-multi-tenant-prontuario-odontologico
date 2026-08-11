# ADR-0002 — Multi-tenancy com banco compartilhado e Row Level Security

- **Status:** Aceito
- **Data:** 2026-08-11

## Contexto

Cada clínica é um tenant e seus dados são dados pessoais **sensíveis** de saúde. Vazamento entre tenants é o pior incidente possível para este produto: destrói a confiança, expõe a clínica e nos expõe legalmente.

Alternativas: banco por tenant, schema por tenant, ou tabelas compartilhadas com coluna `tenant_id`. E, no caso das tabelas compartilhadas, filtro na aplicação ou filtro no banco.

O ponto crítico: filtrar por `tenant_id` na aplicação depende de **todo** desenvolvedor, em **toda** query, para **sempre**. Uma query esquecida em um relatório novo às 23h de uma sexta-feira vaza o prontuário de outra clínica. Isso não é um risco aceitável para dado de saúde.

## Decisão

**Banco compartilhado + schema compartilhado + `tenant_id` em toda tabela operacional + PostgreSQL Row Level Security como mecanismo de isolamento.**

1. Toda tabela de dado de tenant tem `tenant_id uuid NOT NULL` e políticas RLS para `SELECT`, `INSERT`, `UPDATE` e `DELETE`.
2. As tabelas usam `ENABLE ROW LEVEL SECURITY` **e** `FORCE ROW LEVEL SECURITY` (para valer também para o dono da tabela).
3. A aplicação conecta com uma role **sem** `BYPASSRLS` e **sem** ser dona das tabelas. Migrações usam uma role separada (`app_migrator`).
4. Todo acesso passa por uma transação que define o contexto:

```ts
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT set_config('app.tenant_id', ${ctx.tenantId}, true)`;
  await tx.$executeRaw`SELECT set_config('app.user_id',   ${ctx.userId},   true)`;
  return fn(tx);
});
```

`set_config(..., true)` é local à transação — não há vazamento de contexto entre requisições que reutilizam a mesma conexão do pool.

5. Sem contexto definido, `current_setting('app.tenant_id', true)` é nulo e a policy **não retorna nada** (falha fechada, nunca aberta).
6. Índices sempre com `tenant_id` como primeira coluna.
7. Recurso de outro tenant responde `404`, não `403` — não confirmamos a existência do dado alheio.

## Consequências

**Positivas**

- Isolamento garantido pelo banco: mesmo com bug na aplicação, o dado não sai. É defesa em profundidade real, não convenção.
- Uma migração, um pool de conexões, um backup, um custo — viável para centenas de tenants com time pequeno.
- Onboarding de tenant é um `INSERT`, não provisionamento de infraestrutura (essencial para trial self-service).
- Consultas administrativas agregadas (nossas métricas) são simples.

**Negativas / custos aceitos**

- Todo acesso ao banco precisa passar pelo wrapper de contexto. Mitigação: um único ponto de acesso (`TenantPrisma`), lint proibindo uso direto do client e teste que falha se houver tabela com `tenant_id` sem RLS.
- Overhead de uma transação por requisição (aceitável; medido em benchmark).
- Noisy neighbor: um tenant grande pode afetar os demais. Mitigação: `statement_timeout`, rate limit por tenant, limite de período em relatório, e possibilidade de mover um tenant muito grande para banco dedicado no futuro (o modelo permite).
- Erro de policy é catastrófico. Mitigação: migração que cria tabela sem policy falha no CI; suíte de testes de isolamento roda em todo PR.

## Alternativas rejeitadas

**Banco por tenant:** melhor isolamento possível, mas migrar 500 bancos a cada release, gerenciar 500 conjuntos de credenciais e provisionar banco a cada trial é inviável para o nosso time. Fica disponível como oferta enterprise futura.

**Schema por tenant:** isolamento razoável, porém o Postgres degrada com milhares de schemas (catálogo, planejamento de query), migrações continuam multiplicadas e o pool de conexões fica complexo (`search_path` por conexão é fonte clássica de bug).

**Filtro apenas na aplicação:** rejeitado. A segurança do dado de saúde não pode depender de ninguém lembrar de um `WHERE`.

## Verificação

```sql
-- Teste que roda no CI: nenhuma tabela com tenant_id sem RLS
SELECT c.relname
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN information_schema.columns col
  ON col.table_name = c.relname AND col.column_name = 'tenant_id'
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;
-- deve retornar 0 linhas
```

Mais: leitura cruzada entre tenants retorna vazio; `INSERT` com `tenant_id` divergente do contexto falha; consulta sem contexto retorna vazio; acesso a ID de outro tenant responde 404.

## Referências

- [docs/06-multi-tenancy.md](../06-multi-tenancy.md)
- PostgreSQL: *Row Security Policies*
