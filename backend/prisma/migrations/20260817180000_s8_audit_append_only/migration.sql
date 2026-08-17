-- S8 Bloco 1: audit_log append-only de verdade + índice por paciente (RF-E11-03).

CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_no_update ON audit_log;
CREATE TRIGGER trg_audit_log_no_update
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

CREATE INDEX IF NOT EXISTS "idx_audit_patient"
  ON "audit_log" ("tenant_id", "patient_id", "created_at" DESC)
  WHERE "patient_id" IS NOT NULL;

REVOKE UPDATE, DELETE ON TABLE "audit_log" FROM app_user;
GRANT SELECT, INSERT ON TABLE "audit_log" TO app_user;
