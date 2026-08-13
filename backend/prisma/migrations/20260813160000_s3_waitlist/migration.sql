-- Sprint 3 Bloco 3: fila de espera (E4b)

CREATE TABLE "waitlist_entry" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "professional_id" UUID,
  "procedure_id" UUID,
  "preferred_periods" JSONB NOT NULL DEFAULT '[]',
  "priority" SMALLINT NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'WAITING',
  "offered_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "waitlist_entry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "waitlist_entry_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "waitlist_entry_unit_id_fkey"
    FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "waitlist_entry_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "waitlist_entry_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "waitlist_entry_procedure_id_fkey"
    FOREIGN KEY ("procedure_id") REFERENCES "procedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "idx_waitlist_active"
  ON "waitlist_entry" ("tenant_id", "status", "priority" DESC, "created_at");

SELECT platform.enable_tenant_rls('waitlist_entry');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "waitlist_entry" TO app_user;
