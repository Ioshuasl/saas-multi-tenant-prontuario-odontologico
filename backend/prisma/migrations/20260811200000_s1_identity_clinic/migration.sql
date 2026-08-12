-- Sprint 1 Bloco 1: identity + clinic DDL + RLS
-- invitation / refresh_token: DDL derivado de docs/modulos/01 (não detalhado em docs/07 §2)

CREATE EXTENSION IF NOT EXISTS citext;

-- Expand tenant profile fields
ALTER TABLE "tenant"
  ADD COLUMN IF NOT EXISTS "legal_name" TEXT,
  ADD COLUMN IF NOT EXISTS "tax_id" TEXT,
  ADD COLUMN IF NOT EXISTS "responsible_cro" TEXT,
  ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMPTZ;

-- Convert slug to citext (unique already exists)
ALTER TABLE "tenant" ALTER COLUMN "slug" TYPE citext USING "slug"::citext;

CREATE TABLE "user" (
  "id" UUID NOT NULL,
  "email" citext NOT NULL,
  "password_hash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email_verified_at" TIMESTAMPTZ,
  "last_login_at" TIMESTAMPTZ,
  "failed_attempts" SMALLINT NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

CREATE TABLE "unit" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "phone" TEXT,
  "address" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "unit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "unit_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_unit_default" ON "unit" ("tenant_id") WHERE "is_default";

CREATE TABLE "membership" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" TEXT NOT NULL,
  "default_unit_id" UUID,
  "permissions" JSONB NOT NULL DEFAULT '{}',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "membership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "membership_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "membership_default_unit_id_fkey" FOREIGN KEY ("default_unit_id") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "membership_tenant_id_user_id_key" ON "membership"("tenant_id", "user_id");

CREATE TABLE "invitation" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "email" citext NOT NULL,
  "role" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "invited_by_user_id" UUID NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "accepted_at" TIMESTAMPTZ,
  "revoked_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invitation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "invitation_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "invitation_token_hash_key" ON "invitation"("token_hash");
CREATE INDEX "invitation_tenant_id_email_idx" ON "invitation"("tenant_id", "email");

CREATE TABLE "refresh_token" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "family_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "revoked_at" TIMESTAMPTZ,
  "replaced_by_id" UUID,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");
CREATE INDEX "refresh_token_user_id_family_id_idx" ON "refresh_token"("user_id", "family_id");

CREATE TABLE "chair" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "chair_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chair_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "chair_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "professional" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "membership_id" UUID NOT NULL,
  "cro_number" TEXT,
  "cro_state" CHAR(2),
  "specialties" TEXT[] NOT NULL DEFAULT '{}',
  "color" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "professional_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "professional_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "professional_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "professional_tenant_id_membership_id_key" ON "professional"("tenant_id", "membership_id");
CREATE UNIQUE INDEX "professional_membership_id_key" ON "professional"("membership_id");

-- Tenant SELECT: dono do contexto OU membership ativo do app.user_id (login / me)
DROP POLICY IF EXISTS tenant_select ON "tenant";
CREATE POLICY tenant_select ON "tenant"
  FOR SELECT
  USING (
    id = nullif(current_setting('app.tenant_id', true), '')::uuid
    OR current_setting('app.provisioning', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM "membership" m
      WHERE m.tenant_id = "tenant".id
        AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid
        AND m.active = true
    )
  );

CREATE TABLE "business_hours" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "professional_id" UUID,
  "weekday" SMALLINT NOT NULL,
  "starts_at" TIME(0) NOT NULL,
  "ends_at" TIME(0) NOT NULL,
  CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "business_hours_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
  CONSTRAINT "business_hours_range_check" CHECK ("ends_at" > "starts_at"),
  CONSTRAINT "business_hours_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "business_hours_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "business_hours_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "business_hours_exception" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "professional_id" UUID,
  "date" DATE NOT NULL,
  "closed" BOOLEAN NOT NULL DEFAULT true,
  "starts_at" TIME(0),
  "ends_at" TIME(0),
  "reason" TEXT,
  CONSTRAINT "business_hours_exception_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "business_hours_exception_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "business_hours_exception_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "business_hours_exception_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "procedure" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "specialty" TEXT,
  "default_minutes" SMALLINT NOT NULL DEFAULT 30,
  "price_cents" BIGINT NOT NULL DEFAULT 0,
  "requires_tooth" BOOLEAN NOT NULL DEFAULT false,
  "requires_face" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "procedure_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "procedure_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "procedure_tenant_id_code_key" ON "procedure"("tenant_id", "code");

-- RLS: tabelas com tenant_id (user e refresh_token são globais — sem RLS de tenant)
SELECT platform.enable_tenant_rls('unit');
-- membership: SELECT também por app.user_id (login / listar clínicas do usuário)
ALTER TABLE "membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "membership" FORCE ROW LEVEL SECURITY;
CREATE POLICY membership_select ON "membership"
  FOR SELECT
  USING (
    tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    OR user_id = nullif(current_setting('app.user_id', true), '')::uuid
  );
CREATE POLICY membership_insert ON "membership"
  FOR INSERT
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY membership_update ON "membership"
  FOR UPDATE
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY membership_delete ON "membership"
  FOR DELETE
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

SELECT platform.enable_tenant_rls('invitation');
SELECT platform.enable_tenant_rls('chair');
SELECT platform.enable_tenant_rls('professional');
SELECT platform.enable_tenant_rls('business_hours');
SELECT platform.enable_tenant_rls('business_hours_exception');
SELECT platform.enable_tenant_rls('procedure');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "user",
  "unit",
  "membership",
  "invitation",
  "refresh_token",
  "chair",
  "professional",
  "business_hours",
  "business_hours_exception",
  "procedure"
TO app_user;
