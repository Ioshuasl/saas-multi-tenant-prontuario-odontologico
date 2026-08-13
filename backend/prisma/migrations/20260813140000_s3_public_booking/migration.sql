-- Sprint 3 Bloco 2: autoagendamento público (E4b)

ALTER TABLE "procedure"
  ADD COLUMN "publicly_bookable" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "tenant"
  ADD COLUMN "booking_settings" JSONB NOT NULL DEFAULT '{"minLeadMinutes":120,"maxLeadDays":60,"publicStatus":"REQUESTED","courtesyTransactionalMessages":50}'::jsonb;

ALTER TABLE "patient"
  ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'INTERNAL';

CREATE TABLE "public_booking_token" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "purpose" TEXT NOT NULL,
  "target_id" UUID,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "used_at" TIMESTAMPTZ,
  "meta" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "public_booking_token_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "public_booking_token_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_booking_token_hash" ON "public_booking_token" ("token_hash");
CREATE INDEX "idx_public_booking_token_tenant"
  ON "public_booking_token" ("tenant_id", "purpose", "expires_at");

SELECT platform.enable_tenant_rls('public_booking_token');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public_booking_token" TO app_user;

CREATE OR REPLACE FUNCTION platform.resolve_tenant_by_slug(p_slug text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM tenant WHERE slug = p_slug::citext LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION platform.resolve_public_booking_token(p_token_hash text)
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  purpose text,
  target_id uuid,
  expires_at timestamptz,
  used_at timestamptz,
  meta jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.tenant_id, t.purpose, t.target_id, t.expires_at, t.used_at, t.meta
  FROM public_booking_token t
  WHERE t.token_hash = p_token_hash
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION platform.resolve_tenant_by_slug(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION platform.resolve_public_booking_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.resolve_tenant_by_slug(text) TO app_user;
GRANT EXECUTE ON FUNCTION platform.resolve_public_booking_token(text) TO app_user;
