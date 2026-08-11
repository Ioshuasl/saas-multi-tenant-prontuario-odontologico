# ADR-0004 — Prisma como ORM, com repositórios e SQL onde necessário

- **Status:** Aceito
- **Data:** 2026-08-11

## Contexto

O backend é Node.js + TypeScript e o banco é PostgreSQL. Precisamos de acesso a dados tipado, migrações versionadas e suporte a recursos específicos do Postgres que a arquitetura depende: Row Level Security, constraints de exclusão com `tstzrange` (anti double-booking), `gin_trgm_ops` para busca de paciente, triggers de imutabilidade e views de relatório.

Candidatos: Prisma, Drizzle, TypeORM, Kysely e `pg` puro com SQL escrito à mão.

## Decisão

**Prisma** como ORM principal, com três regras que limitam seu alcance:

1. Prisma existe **apenas** em `modules/<dominio>/repositories/prisma-*.ts` e em `shared/database/`. Nenhum tipo gerado pelo Prisma cruza para `models/` ou `services/` — os repositórios mapeiam para entidades de domínio (lint proíbe o import).
2. Todo acesso passa pelo wrapper `TenantPrisma` (contexto de tenant por transação, ADR-0002). Uso direto do `PrismaClient` fora do wrapper é erro de lint.
3. O que o Prisma não expressa bem é escrito em **SQL** dentro de migrações ou em `$queryRaw` parametrizado, encapsulado em métodos de repositório: RLS/policies, `EXCLUDE USING gist`, índices GIN/parciais, triggers, views e consultas analíticas com CTE/window functions.

Migrações: `prisma migrate` com SQL editado à mão quando necessário (o Prisma preserva o SQL da migração), executadas com a role `app_migrator`.

## Consequências

**Positivas**

- Tipagem excelente com inferência automática do schema; poucos erros de mapeamento em tempo de execução.
- Migrações versionadas, revisáveis em PR e editáveis para incluir SQL específico do Postgres.
- Produtividade alta em CRUD, que é a maior parte do volume de código (pacientes, procedimentos, categorias).
- `$transaction` com callback é exatamente o que precisamos para o `set_config` de RLS.
- Prisma Studio ajuda no desenvolvimento local.
- Comunidade grande: problemas comuns já têm resposta.

**Negativas / custos aceitos**

- Prisma não modela RLS nem constraints de exclusão no schema: precisamos manter SQL manual nas migrações e testes que verifiquem que as policies existem (já previstos no CI).
- Consultas complexas (relatórios) ficam melhores em SQL puro do que na API do Prisma — aceito, ficam em `$queryRaw` tipado com Zod validando o resultado.
- O engine adiciona overhead e tamanho ao artefato; irrelevante na nossa escala.
- Risco de acoplamento se o time usar tipos do Prisma no domínio. Mitigado por lint + revisão.
- N+1 é fácil de introduzir. Mitigado com `include`/`select` explícitos, revisão e teste de volume.

## Alternativas rejeitadas

**Drizzle:** mais próximo do SQL, artefato menor, ótima ergonomia para quem quer SQL tipado. Rejeitado por maturidade menor no momento da decisão e por ecossistema de migração menos consolidado; é a alternativa mais forte para reavaliar caso o Prisma se torne limitante.

**TypeORM:** histórico de inconsistência entre versões, dois estilos de API concorrentes e comportamento de migração menos previsível.

**Kysely:** excelente query builder tipado, porém sem migrações/schema declarativo integrados — teríamos que montar essa camada, sem ganho relevante para o nosso caso.

**SQL puro com `pg`:** máximo controle e desempenho, custo alto de mapeamento manual e de manutenção com time pequeno; o risco de erro de mapeamento em código financeiro não compensa.

## Padrão de repositório adotado

```ts
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly db: TenantPrisma) {}

  async save(ctx: RequestContext, appointment: Appointment): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      const data = AppointmentMapper.toPersistence(appointment);   // entidade → row
      await tx.appointment.upsert({ where: { id: data.id }, create: data, update: data });
    });
  }

  async findOverlapping(ctx: RequestContext, professionalId: string, slot: TimeSlot): Promise<Appointment[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.$queryRaw<AppointmentRow[]>`
        SELECT * FROM appointment
        WHERE professional_id = ${professionalId}::uuid
          AND status NOT IN ('CANCELLED', 'NO_SHOW')
          AND period && tstzrange(${slot.start}, ${slot.end}, '[)')
      `;
      return rows.map(AppointmentMapper.toDomain);
    });
  }
}
```

## Verificação

- Lint: `@prisma/client` importável apenas em `repositories/prisma-*.ts` e `shared/database/`.
- Teste de integração (Testcontainers) para cada repositório, cobrindo mapeamento e constraints.
- Teste que verifica que toda tabela com `tenant_id` tem RLS habilitada.
- Migração que não pode ser aplicada em banco limpo falha no CI.

## Referências

- [docs/07-modelo-de-dados.md](../07-modelo-de-dados.md)
- [ADR-0002](./0002-multi-tenancy-rls.md)
