# Restore de backup (Postgres)

Escopo S8: dump/restore **local ou staging**. Não automatizar PITR da Hostinger neste bloco.

## O que restaurar

- Banco da API (`odonto_dev` em local). Object storage (MinIO/S3) é backup **separado** — este runbook não recobra anexos.
- Sempre restaurar em um banco **novo**. Nunca `pg_restore` em cima de `odonto_dev` em uso.

## Dump

Usar `DATABASE_MIGRATION_URL` (role de migração / superuser local). Não logar a URL.

```bash
pg_dump --format=custom --file=odonto_dev.dump "$DATABASE_MIGRATION_URL"
```

## Restore (ensaio)

1. Criar banco vazio, por exemplo `odonto_restore_essay`.
2. `pg_restore --no-owner --dbname=... odonto_dev.dump`
3. Conferir `SELECT COUNT(*) FROM tenant;` e um login smoke.
4. Dropar `odonto_restore_essay`.

```bash
psql "$DATABASE_MIGRATION_URL" -c "CREATE DATABASE odonto_restore_essay;"
pg_restore --no-owner --dbname="<url do banco novo>" odonto_dev.dump
psql "<url do banco novo>" -c "SELECT COUNT(*) FROM tenant;"
psql "$DATABASE_MIGRATION_URL" -c "DROP DATABASE odonto_restore_essay;"
```

## Ensaio medido (2026-08-17, local)

Ambiente: Docker Compose `postgres:16-alpine`; dump custom de `odonto_dev` para `/tmp` no container; restore em `odonto_restore_essay`; `SELECT COUNT(*) FROM tenant`; drop ao final. Script: `pnpm --filter @repo/backend essay:restore`.

| Etapa | Duração |
| --- | --- |
| `pg_dump` (custom) | 5,2 s |
| `createdb` + `pg_restore` | 11,8 s |
| **RTO ensaiado (dump → restore utilizável)** | **17 s** |

117 tenants no dump de desenvolvimento. RTO de snapshot da VPS Hostinger **não** foi medido neste bloco.

## Produção (Hostinger)

Snapshot da VPS / PITR do provedor permanece o caminho de desastre real. Este ensaio valida o **procedimento** e um RTO de dump lógico, não o RTO de snapshot da VPS.
