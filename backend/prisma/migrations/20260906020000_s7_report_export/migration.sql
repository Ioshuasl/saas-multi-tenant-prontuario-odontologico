-- S7 Bloco 4: export assíncrono de relatórios (report_export + RLS)
CREATE TABLE "report_export" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "report" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "filters" JSONB NOT NULL DEFAULT '{}',
  "storage_key" TEXT,
  "requested_by" UUID NOT NULL,
  "error" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ,
  CONSTRAINT "report_export_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "report_export_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "report_export_format_check"
    CHECK ("format" IN ('CSV', 'XLSX')),
  CONSTRAINT "report_export_status_check"
    CHECK ("status" IN ('PENDING', 'RUNNING', 'READY', 'FAILED'))
);

CREATE INDEX "idx_report_export_tenant_created"
  ON "report_export" ("tenant_id", "created_at" DESC);
CREATE INDEX "idx_report_export_tenant_status"
  ON "report_export" ("tenant_id", "status");

SELECT platform.enable_tenant_rls('report_export');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "report_export" TO app_user;
