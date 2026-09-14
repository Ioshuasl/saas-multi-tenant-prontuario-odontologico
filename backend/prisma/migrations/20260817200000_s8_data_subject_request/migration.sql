-- S8 Bloco 3: solicitações do titular (RF-E11-06) + pacote ACCESS (RF-E11-07).

CREATE TABLE "data_subject_request" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "due_at" TIMESTAMPTZ NOT NULL,
  "completed_at" TIMESTAMPTZ,
  "handled_by" UUID,
  "resolution" TEXT,
  "export_key" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "data_subject_request_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "data_subject_request_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "data_subject_request_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "data_subject_request_handled_by_fkey"
    FOREIGN KEY ("handled_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "data_subject_request_type_check"
    CHECK ("type" IN ('ACCESS', 'CORRECTION', 'DELETION', 'PORTABILITY', 'REVOKE_CONSENT')),
  CONSTRAINT "data_subject_request_status_check"
    CHECK ("status" IN ('RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'))
);

CREATE INDEX "idx_dsr_tenant_requested"
  ON "data_subject_request" ("tenant_id", "requested_at" DESC);

CREATE INDEX "idx_dsr_tenant_due"
  ON "data_subject_request" ("tenant_id", "due_at")
  WHERE "status" IN ('RECEIVED', 'IN_PROGRESS');

SELECT platform.enable_tenant_rls('data_subject_request');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "data_subject_request" TO app_user;
