-- CreateSchema
CREATE SCHEMA IF NOT EXISTS platform;

-- Helper: RLS padrão em tabelas com coluna tenant_id (docs/06).
CREATE OR REPLACE FUNCTION platform.enable_tenant_rls(target regclass) RETURNS void AS $$
DECLARE
  t text := target::text;
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', t);
  EXECUTE format(
    'DROP POLICY IF EXISTS tenant_isolation ON %s',
    t
  );
  EXECUTE format(
    $f$CREATE POLICY tenant_isolation ON %s
         USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
         WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)$f$,
    t
  );
END;
$$ LANGUAGE plpgsql;

-- CreateTable
CREATE TABLE "tenant" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_slug_key" ON "tenant"("slug");

CREATE TABLE "tenant_crypto_key" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "algorithm" TEXT NOT NULL DEFAULT 'AES-256-GCM',
    "wrapped_dek" TEXT NOT NULL,
    "kek_provider" TEXT NOT NULL DEFAULT 'local_vps',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retired_at" TIMESTAMPTZ,
    CONSTRAINT "tenant_crypto_key_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_crypto_key_tenant_id_key_version_key"
  ON "tenant_crypto_key"("tenant_id", "key_version");

CREATE UNIQUE INDEX "uq_tenant_crypto_active"
  ON "tenant_crypto_key" ("tenant_id")
  WHERE status = 'ACTIVE';

CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID,
    "patient_id" UUID,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_audit_tenant_time" ON "audit_log"("tenant_id", "created_at" DESC);

ALTER TABLE "tenant_crypto_key"
  ADD CONSTRAINT "tenant_crypto_key_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_log"
  ADD CONSTRAINT "audit_log_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS: tenant (policy própria — docs/06 §6)
ALTER TABLE "tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_select ON "tenant"
  FOR SELECT
  USING (
    id = nullif(current_setting('app.tenant_id', true), '')::uuid
    OR current_setting('app.provisioning', true) = 'on'
  );

CREATE POLICY tenant_insert ON "tenant"
  FOR INSERT
  WITH CHECK (current_setting('app.provisioning', true) = 'on');

CREATE POLICY tenant_update ON "tenant"
  FOR UPDATE
  USING (id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_delete ON "tenant"
  FOR DELETE
  USING (id = nullif(current_setting('app.tenant_id', true), '')::uuid);

-- RLS: tabelas com tenant_id
SELECT platform.enable_tenant_rls('tenant_crypto_key');
SELECT platform.enable_tenant_rls('audit_log');

-- Grants para app_user (role sem BYPASSRLS)
GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE ON SCHEMA platform TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "tenant", "tenant_crypto_key", "audit_log" TO app_user;
