# 06 — Multi-Tenancy

## 1. Decisão

**Banco único, schema único, isolamento por `tenant_id` com Row Level Security (RLS) do PostgreSQL.** Racional completo em [ADR-0002](./adr/0002-multi-tenancy-rls.md).

| Estratégia | Isolamento | Custo/manutenção | Migrações | Veredito |
| --- | --- | --- | --- | --- |
| Banco por tenant | Máximo | Alto (N bancos, N backups, N conexões) | Muito custoso | Rejeitado (só para enterprise futuro) |
| Schema por tenant | Alto | Médio-alto (migração em N schemas, pool inflado) | Custoso a partir de ~200 tenants | Rejeitado |
| **Linha compartilhada + RLS** | Alto (garantido pelo banco) | Baixo | Uma migração | **Escolhido** |
| Linha compartilhada sem RLS (só `WHERE`) | Frágil (um `WHERE` esquecido = vazamento) | Baixo | Uma migração | Rejeitado |

O ponto decisivo: com RLS, o isolamento **não depende de o desenvolvedor lembrar** de filtrar. Um bug de query vira "zero linhas", não "dados de outra clínica".

## 2. Hierarquia de tenancy

```
Tenant (a clínica/empresa assinante)  ── assinatura, plano, limites
  └── Unit (unidade/filial)           ── endereço, horários, cadeiras
        └── Chair (cadeira/consultório)
  └── User ↔ Membership (papel por tenant)
  └── Dados operacionais (paciente, agenda, prontuário, financeiro): sempre tenant_id, quase sempre unit_id
```

- **Tenant** é a fronteira de segurança, de cobrança e de exportação de dados.
- **Unit** é a fronteira operacional (agenda e caixa são por unidade). No MVP a clínica tem 1 unidade, mas todo dado nasce com `unit_id` — assim, multi-unidade na fase 2 é feature de UI, não migração de dados.
- Um mesmo `User` (pessoa física, ex.: dentista que atende em duas clínicas) pode ter `Membership` em vários tenants. **Login é global; contexto é por tenant.**

## 3. Resolução do tenant na requisição

Ordem de precedência:

1. **JWT** — o access token carrega `tenantId` e `memberships`; é a fonte da verdade para rotas autenticadas.
2. **Header `X-Tenant-Id`** — usado apenas para *trocar* de tenant quando o usuário tem múltiplos memberships; **sempre validado contra os memberships do token**.
3. **Subdomínio/slug** (`clinica-x.app.exemplo.com` ou `/t/clinica-x`) — usado para rotas públicas (autoagendamento, visualização de orçamento) e para UX de login. Nunca é fonte de autorização.

```ts
// shared/http/middlewares/tenant-context.middleware.ts
export function tenantContext(): RequestHandler {
  return (req, _res, next) => {
    const requested = req.header('X-Tenant-Id') ?? req.auth.tenantId;
    const membership = req.auth.memberships.find((m) => m.tenantId === requested);
    if (!membership) throw new ForbiddenError('tenant_not_allowed');

    req.ctx = {
      tenantId: TenantId.create(membership.tenantId),
      unitId: membership.defaultUnitId,
      userId: req.auth.userId,
      role: membership.role,
      requestId: req.id,
    };
    next();
  };
}
```

`req.ctx` é imutável e é a **única** origem de `tenantId` para toda a camada de aplicação. Nenhum use case aceita `tenantId` vindo do body.

## 4. Ativação da RLS por transação

```ts
// modules/platform/infrastructure/tenant-prisma.ts
export class TenantPrisma {
  constructor(private readonly prisma: PrismaClient) {}

  async runInTenantContext<T>(ctx: RequestContext, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      // SET LOCAL vale só até o fim desta transação — seguro com pool de conexões
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${ctx.tenantId.value}, true)`;
      await tx.$executeRaw`SELECT set_config('app.user_id', ${ctx.userId}, true)`;
      return fn(tx);
    });
  }
}
```

Pontos críticos:

- `set_config(..., true)` = `SET LOCAL`: escopo de transação. Com pooler (PgBouncer em *transaction mode*) isso continua correto; `SET` sem `LOCAL` **vazaria** para a próxima requisição que reusar a conexão — proibido.
- A aplicação conecta com um **role sem `BYPASSRLS`** (`app_user`). Migrações usam outro role (`app_migrator`) que é dono das tabelas.
- Toda operação de escrita passa por `runInTenantContext`. Jobs de fila reconstroem o contexto a partir do payload (`tenantId` obrigatório em todo job).

## 5. Políticas RLS

Padrão aplicado a **toda** tabela com dado de tenant:

```sql
-- Executado em cada migração que cria tabela de tenant
ALTER TABLE patient ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient FORCE ROW LEVEL SECURITY;   -- vale até para o owner da tabela

CREATE POLICY tenant_isolation_select ON patient
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_insert ON patient
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON patient
  FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
          WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON patient
  FOR DELETE USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

Helper para não repetir isso em 40 tabelas:

```sql
CREATE OR REPLACE FUNCTION platform.enable_tenant_rls(target regclass) RETURNS void AS $$
DECLARE
  t text := target::text;
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', t);
  EXECUTE format($f$CREATE POLICY tenant_isolation ON %s USING (tenant_id = current_setting('app.tenant_id', true)::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)$f$, t);
END;
$$ LANGUAGE plpgsql;
```

Como o Prisma não gerencia RLS, cada migração que cria tabela de tenant recebe um bloco SQL manual chamando `platform.enable_tenant_rls('nova_tabela')`. Um teste de arquitetura falha o CI se existir tabela com coluna `tenant_id` sem policy:

```sql
-- usado pelo teste automatizado
SELECT c.relname
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN information_schema.columns col
  ON col.table_name = c.relname AND col.column_name = 'tenant_id'
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;
-- deve retornar 0 linhas
```

## 6. Tabelas globais (sem `tenant_id`)

| Tabela | Conteúdo | RLS |
| --- | --- | --- |
| `tenant` | Tenants | Policy própria: linha visível se `id = app.tenant_id` (ou acesso por role de plataforma) |
| `user` | Identidade global (e-mail, senha) | Acesso apenas via casos de uso de identidade; sem `tenant_id` por design (usuário multi-clínica) |
| `membership` | Vínculo user↔tenant↔papel | RLS por `tenant_id` |
| `plan` | Catálogo de planos do SaaS | Leitura pública autenticada |
| `procedure_catalog_template` | Catálogo padrão de procedimentos (semente) | Leitura pública autenticada |
| `outbox_event` | Eventos de domínio | RLS por `tenant_id` (o dispatcher usa role próprio com bypass controlado) |
| `platform_audit_log` | Auditoria de acesso de suporte (break-glass) | Somente role de plataforma |

`user.email` é único globalmente. Consequência: a mesma pessoa usa uma conta e escolhe a clínica ao entrar — melhor UX para o dentista associado e evita senha duplicada.

## 7. Índices e desempenho em ambiente compartilhado

Regras:

1. **`tenant_id` é a primeira coluna de todo índice composto** — a seletividade por tenant é o filtro dominante.
2. Chave primária permanece `id` (UUID v7), mas as buscas usam índices `(tenant_id, …)`.
3. Unicidade de negócio é sempre por tenant: `UNIQUE (tenant_id, cpf)`, `UNIQUE (tenant_id, code)`.

```sql
CREATE INDEX idx_patient_tenant_name       ON patient (tenant_id, name);
CREATE UNIQUE INDEX uq_patient_tenant_cpf  ON patient (tenant_id, cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_appointment_tenant_range  ON appointment (tenant_id, unit_id, starts_at);
CREATE INDEX idx_receivable_tenant_due     ON receivable (tenant_id, due_date) WHERE status <> 'PAID';
```

Prevenção de double-booking direto no banco (mais confiável que checagem na aplicação):

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointment
  ADD COLUMN period tstzrange
  GENERATED ALWAYS AS (tstzrange(starts_at, ends_at, '[)')) STORED;

ALTER TABLE appointment ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (
    tenant_id WITH =,
    professional_id WITH =,
    period WITH &&
  ) WHERE (status NOT IN ('CANCELLED', 'NO_SHOW'));
```

Uma restrição equivalente é aplicada por `chair_id` (quando informado). A aplicação traduz o erro `23P01` para `409 SLOT_UNAVAILABLE`.

### "Tenants gordos" (noisy neighbor)

- Todo endpoint de lista é paginado com limite máximo (100) e cursor.
- Rate limit por tenant, não só por IP.
- Relatórios pesados vão para fila e retornam por download assíncrono quando passam de um limite de linhas.
- Monitoramos p95 por tenant; um tenant grande demais é candidato a instância dedicada (a arquitetura permite: mesmo código, banco separado).

## 8. Provisionamento e ciclo de vida do tenant

```
signup → CreateTenantUseCase (transação única):
  1. cria tenant (status TRIAL, trial_ends_at = now + 14d)
  2. cria unidade padrão com fuso horário
  3. cria user (Argon2id) + membership OWNER
  4. copia catálogo padrão de procedimentos para o tenant
  5. cria horários de funcionamento padrão (seg–sex 08:00–18:00)
  6. registra consentimento de termos de uso (versão)
  7. emite evento tenant.created (onboarding por e-mail, telemetria)
```

Estados do tenant: `TRIAL → ACTIVE → PAST_DUE → SUSPENDED → CANCELLED`, com `DELETED` (anonimizado) ao final da retenção.

- `PAST_DUE`: banner de aviso, tudo funcionando.
- `SUSPENDED`: **somente leitura** + exportação sempre liberada. Nunca apagamos dado clínico por inadimplência.
- `CANCELLED`: 90 dias de retenção para exportação; depois, eliminação/anonimização conforme política em [10 — LGPD](./10-seguranca-lgpd-compliance.md).

## 9. Acesso de suporte da plataforma (break-glass)

Requisito de compliance: nosso time **não** navega no prontuário de clínicas por conveniência.

1. Suporte não tem acesso a dado de tenant por padrão.
2. Acesso exige solicitação com motivo + ticket, aprovada por segunda pessoa, com validade máxima de 4 horas.
3. O acesso é feito por um role que assume `app.tenant_id` explicitamente e grava em `platform_audit_log` (quem, quando, qual tenant, quais recursos).
4. O Owner do tenant recebe notificação de que houve acesso de suporte e pode consultar o registro.

## 10. Testes obrigatórios de isolamento

| Teste | Expectativa |
| --- | --- |
| Consultar entidade do tenant B com contexto do tenant A | 0 linhas / 404 |
| `INSERT` com `tenant_id` diferente do contexto | erro de policy (`WITH CHECK`) |
| Executar caso de uso sem `app.tenant_id` definido | erro, nunca "todas as linhas" |
| `UPDATE` cruzando tenant via ID direto | 0 linhas afetadas |
| Job de fila sem `tenantId` no payload | falha na validação do job |
| Toda tabela com `tenant_id` possui RLS habilitada | consulta de metadados retorna 0 |
| Conexão da aplicação não tem `BYPASSRLS` | `pg_roles` confirma |

Esses testes rodam contra Postgres real (Testcontainers) em cada PR. Isolamento sem teste automatizado é isolamento imaginário.
