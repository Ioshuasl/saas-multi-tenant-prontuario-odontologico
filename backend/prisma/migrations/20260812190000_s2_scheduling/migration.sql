-- Sprint 2 Bloco 2: scheduling core (appointment + EXCLUDE + history + blocks/series DDL)

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE "appointment_series" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "professional_id" UUID NOT NULL,
  "chair_id" UUID,
  "procedure_id" UUID,
  "rrule" TEXT NOT NULL,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "duration_minutes" SMALLINT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "appointment_series_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "appointment_series_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointment_series_unit_id_fkey"
    FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointment_series_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointment_series_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointment_series_chair_id_fkey"
    FOREIGN KEY ("chair_id") REFERENCES "chair"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "appointment_series_procedure_id_fkey"
    FOREIGN KEY ("procedure_id") REFERENCES "procedure"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "appointment" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "professional_id" UUID NOT NULL,
  "chair_id" UUID,
  "procedure_id" UUID,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "ends_at" TIMESTAMPTZ NOT NULL,
  "period" TSTZRANGE GENERATED ALWAYS AS (tstzrange("starts_at", "ends_at", '[)')) STORED,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "origin" TEXT NOT NULL DEFAULT 'INTERNAL',
  "confirmed_at" TIMESTAMPTZ,
  "arrived_at" TIMESTAMPTZ,
  "cancelled_at" TIMESTAMPTZ,
  "cancel_reason" TEXT,
  "recurrence_id" UUID,
  "notes" TEXT,
  "idempotency_key" TEXT,
  "created_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "appointment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "appointment_range_check" CHECK ("ends_at" > "starts_at"),
  CONSTRAINT "appointment_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointment_unit_id_fkey"
    FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointment_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointment_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointment_chair_id_fkey"
    FOREIGN KEY ("chair_id") REFERENCES "chair"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "appointment_procedure_id_fkey"
    FOREIGN KEY ("procedure_id") REFERENCES "procedure"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "appointment_recurrence_id_fkey"
    FOREIGN KEY ("recurrence_id") REFERENCES "appointment_series"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE "appointment" ADD CONSTRAINT "appointment_professional_no_overlap"
  EXCLUDE USING gist (
    "tenant_id" WITH =,
    "professional_id" WITH =,
    "period" WITH &&
  ) WHERE ("status" NOT IN ('CANCELLED', 'NO_SHOW'));

ALTER TABLE "appointment" ADD CONSTRAINT "appointment_chair_no_overlap"
  EXCLUDE USING gist (
    "tenant_id" WITH =,
    "chair_id" WITH =,
    "period" WITH &&
  ) WHERE ("chair_id" IS NOT NULL AND "status" NOT IN ('CANCELLED', 'NO_SHOW'));

CREATE UNIQUE INDEX "uq_appointment_idempotency"
  ON "appointment" ("tenant_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;

CREATE INDEX "idx_appointment_agenda" ON "appointment" ("tenant_id", "unit_id", "starts_at");
CREATE INDEX "idx_appointment_patient" ON "appointment" ("tenant_id", "patient_id", "starts_at" DESC);
CREATE INDEX "idx_appointment_professional"
  ON "appointment" ("tenant_id", "professional_id", "starts_at");

CREATE TABLE "appointment_history" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "appointment_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "from_value" JSONB,
  "to_value" JSONB,
  "actor_id" UUID,
  "actor_type" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "appointment_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "appointment_history_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointment_history_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "idx_appointment_history"
  ON "appointment_history" ("tenant_id", "appointment_id", "created_at");

CREATE TABLE "schedule_block" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "professional_id" UUID,
  "chair_id" UUID,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "ends_at" TIMESTAMPTZ NOT NULL,
  "period" TSTZRANGE GENERATED ALWAYS AS (tstzrange("starts_at", "ends_at", '[)')) STORED,
  "reason" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "schedule_block_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "schedule_block_range_check" CHECK ("ends_at" > "starts_at"),
  CONSTRAINT "schedule_block_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "schedule_block_unit_id_fkey"
    FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "schedule_block_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "schedule_block_chair_id_fkey"
    FOREIGN KEY ("chair_id") REFERENCES "chair"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "idx_schedule_block_unit"
  ON "schedule_block" ("tenant_id", "unit_id", "starts_at");

SELECT platform.enable_tenant_rls('appointment_series');
SELECT platform.enable_tenant_rls('appointment');
SELECT platform.enable_tenant_rls('appointment_history');
SELECT platform.enable_tenant_rls('schedule_block');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "appointment_series",
  "appointment",
  "appointment_history",
  "schedule_block"
TO app_user;
