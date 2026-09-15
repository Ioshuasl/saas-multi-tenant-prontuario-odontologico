-- Alinha o banco após migrations S7 duplicadas (20260817 + 20260906)
-- terem sido marcadas como applied sem o DDL completo.

ALTER TABLE "plan"
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "report_export"
  ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "idx_subscription_status_trial"
  ON "subscription" ("status", "trial_ends_at")
  WHERE "status" = 'TRIAL';

CREATE INDEX IF NOT EXISTS "idx_usage_counter_tenant"
  ON "usage_counter" ("tenant_id", "metric");

CREATE INDEX IF NOT EXISTS "idx_report_export_tenant_status"
  ON "report_export" ("tenant_id", "status");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_usage_counter_metric_period'
      AND conrelid = '"usage_counter"'::regclass
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usage_counter_tenant_metric_period_key'
      AND conrelid = '"usage_counter"'::regclass
  ) THEN
    ALTER TABLE "usage_counter"
      RENAME CONSTRAINT "uq_usage_counter_metric_period"
      TO "usage_counter_tenant_metric_period_key";
  END IF;
END $$;
