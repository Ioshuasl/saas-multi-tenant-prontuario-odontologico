-- Sprint 2 Bloco 1: patients DDL + RLS
-- Weekday already ISO 1–7. patient.code is per-tenant (not global IDENTITY).
-- patient_contact omitted (S2): address lives in patient.address jsonb.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE "patient_code_counter" (
  "tenant_id" UUID NOT NULL,
  "last_code" BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT "patient_code_counter_pkey" PRIMARY KEY ("tenant_id"),
  CONSTRAINT "patient_code_counter_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "patient" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "code" BIGINT NOT NULL,
  "name" TEXT NOT NULL,
  "social_name" TEXT,
  "cpf" CHAR(11),
  "birth_date" DATE,
  "sex" TEXT,
  "phone_primary" TEXT NOT NULL,
  "phone_secondary" TEXT,
  "email" citext,
  "address" JSONB,
  "how_found_us" TEXT,
  "notes" TEXT,
  "photo_key" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "deleted_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "patient_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "patient_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "patient_unit_id_fkey"
    FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_patient_tenant_code" ON "patient" ("tenant_id", "code");
CREATE UNIQUE INDEX "uq_patient_cpf" ON "patient" ("tenant_id", "cpf")
  WHERE "cpf" IS NOT NULL AND "deleted_at" IS NULL;
CREATE INDEX "idx_patient_name" ON "patient" ("tenant_id", "name");
CREATE INDEX "idx_patient_phone" ON "patient" ("tenant_id", "phone_primary");
CREATE INDEX "idx_patient_name_trgm" ON "patient" USING gin ("name" gin_trgm_ops);

CREATE TABLE "legal_guardian" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "cpf" CHAR(11),
  "relationship" TEXT,
  "phone" TEXT,
  "email" citext,
  CONSTRAINT "legal_guardian_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "legal_guardian_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "legal_guardian_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "idx_legal_guardian_patient" ON "legal_guardian" ("tenant_id", "patient_id");

CREATE TABLE "consent" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "granted" BOOLEAN NOT NULL,
  "document_version" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMPTZ,
  CONSTRAINT "consent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "consent_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "consent_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "idx_consent_patient" ON "consent" ("tenant_id", "patient_id", "type");

SELECT platform.enable_tenant_rls('patient_code_counter');
SELECT platform.enable_tenant_rls('patient');
SELECT platform.enable_tenant_rls('legal_guardian');
SELECT platform.enable_tenant_rls('consent');
