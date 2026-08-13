-- Sprint 4 Bloco 1: prontuário (DDL E5 + RLS + trigger imutável + purpose ANAMNESIS)
-- docs/07 §5 · §14 · S4

ALTER TABLE "public_booking_token"
  DROP CONSTRAINT IF EXISTS "public_booking_token_purpose_check";

ALTER TABLE "public_booking_token"
  ADD CONSTRAINT "public_booking_token_purpose_check"
  CHECK ("purpose" IN ('BOOKING', 'CONFIRMATION', 'WAITLIST_OFFER', 'ANAMNESIS'));

CREATE TABLE "medical_record" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "opened_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "medical_record_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "medical_record_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "medical_record_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "medical_record_patient_id_key" ON "medical_record" ("patient_id");
CREATE UNIQUE INDEX "uq_medical_record_patient" ON "medical_record" ("tenant_id", "patient_id");

CREATE TABLE "anamnesis_form" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "questions" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "anamnesis_form_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "anamnesis_form_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_anamnesis_form_version" ON "anamnesis_form" ("tenant_id", "name", "version");

CREATE TABLE "anamnesis_response" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "medical_record_id" UUID NOT NULL,
  "form_id" UUID NOT NULL,
  "form_version" INTEGER NOT NULL,
  "answers" TEXT NOT NULL,
  "answered_by" TEXT NOT NULL,
  "answered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "signature" JSONB,
  CONSTRAINT "anamnesis_response_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "anamnesis_response_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "anamnesis_response_medical_record_id_fkey"
    FOREIGN KEY ("medical_record_id") REFERENCES "medical_record"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "anamnesis_response_form_id_fkey"
    FOREIGN KEY ("form_id") REFERENCES "anamnesis_form"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "idx_anamnesis_response_record"
  ON "anamnesis_response" ("tenant_id", "medical_record_id", "answered_at" DESC);

CREATE TABLE "clinical_alert" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "medical_record_id" UUID NOT NULL,
  "severity" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clinical_alert_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "clinical_alert_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "clinical_alert_medical_record_id_fkey"
    FOREIGN KEY ("medical_record_id") REFERENCES "medical_record"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "idx_clinical_alert_record"
  ON "clinical_alert" ("tenant_id", "medical_record_id", "active");

CREATE TABLE "tooth_state" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "medical_record_id" UUID NOT NULL,
  "dentition" TEXT NOT NULL,
  "tooth_code" TEXT NOT NULL,
  "face" TEXT,
  "condition" TEXT NOT NULL,
  "notes" TEXT,
  "recorded_by" UUID NOT NULL,
  "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tooth_state_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tooth_state_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "tooth_state_medical_record_id_fkey"
    FOREIGN KEY ("medical_record_id") REFERENCES "medical_record"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_tooth_state_current"
  ON "tooth_state" ("tenant_id", "medical_record_id", "dentition", "tooth_code", "face")
  NULLS NOT DISTINCT;

CREATE TABLE "tooth_state_history" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "tooth_state_id" UUID NOT NULL,
  "from_condition" TEXT,
  "to_condition" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "source_id" UUID,
  "actor_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tooth_state_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tooth_state_history_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "tooth_state_history_tooth_state_id_fkey"
    FOREIGN KEY ("tooth_state_id") REFERENCES "tooth_state"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "idx_tooth_state_history"
  ON "tooth_state_history" ("tenant_id", "tooth_state_id", "created_at");

CREATE TABLE "clinical_note" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "medical_record_id" UUID NOT NULL,
  "appointment_id" UUID,
  "professional_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "procedures" JSONB NOT NULL DEFAULT '[]',
  "version" INTEGER NOT NULL DEFAULT 1,
  "supersedes_id" UUID,
  "amend_reason" TEXT,
  "content_hash" TEXT NOT NULL,
  "signed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "signature" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clinical_note_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "clinical_note_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "clinical_note_medical_record_id_fkey"
    FOREIGN KEY ("medical_record_id") REFERENCES "medical_record"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "clinical_note_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "clinical_note_supersedes_id_fkey"
    FOREIGN KEY ("supersedes_id") REFERENCES "clinical_note"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "clinical_note_version_amend_check"
    CHECK ("version" = 1 OR "amend_reason" IS NOT NULL)
);

CREATE INDEX "idx_clinical_note_record"
  ON "clinical_note" ("tenant_id", "medical_record_id", "created_at" DESC);

CREATE OR REPLACE FUNCTION clinical_note_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'clinical_note is append-only; create a new version with supersedes_id';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinical_note_no_update
  BEFORE UPDATE OR DELETE ON clinical_note
  FOR EACH ROW EXECUTE FUNCTION clinical_note_immutable();

CREATE TABLE "attachment" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "medical_record_id" UUID,
  "patient_id" UUID NOT NULL,
  "clinical_note_id" UUID,
  "category" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size_bytes" BIGINT NOT NULL,
  "checksum_sha256" TEXT NOT NULL,
  "thumbnail_key" TEXT,
  "uploaded_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  "deleted_reason" TEXT,
  "deleted_by" UUID,
  CONSTRAINT "attachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "attachment_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "attachment_medical_record_id_fkey"
    FOREIGN KEY ("medical_record_id") REFERENCES "medical_record"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "attachment_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "attachment_clinical_note_id_fkey"
    FOREIGN KEY ("clinical_note_id") REFERENCES "clinical_note"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "attachment_category_check"
    CHECK ("category" IN (
      'XRAY',
      'PHOTO_INTRAORAL',
      'PHOTO_FACIAL',
      'DOCUMENT',
      'EXAM',
      'CONSENT_FORM',
      'OTHER'
    ))
);

CREATE INDEX "idx_attachment_patient"
  ON "attachment" ("tenant_id", "patient_id", "created_at" DESC);

SELECT platform.enable_tenant_rls('medical_record');
SELECT platform.enable_tenant_rls('anamnesis_form');
SELECT platform.enable_tenant_rls('anamnesis_response');
SELECT platform.enable_tenant_rls('clinical_alert');
SELECT platform.enable_tenant_rls('tooth_state');
SELECT platform.enable_tenant_rls('tooth_state_history');
SELECT platform.enable_tenant_rls('clinical_note');
SELECT platform.enable_tenant_rls('attachment');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "medical_record",
  "anamnesis_form",
  "anamnesis_response",
  "clinical_alert",
  "tooth_state",
  "tooth_state_history",
  "clinical_note",
  "attachment"
TO app_user;
