-- S8 Bloco 2: exportação LGPD do tenant (RF-E11-05). Não reusa report_export.

CREATE TABLE "tenant_export" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "storage_key" TEXT,
  "requested_by" UUID NOT NULL,
  "idempotency_key" TEXT,
  "error" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_export_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tenant_export_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "tenant_export_status_check"
    CHECK ("status" IN ('PENDING', 'RUNNING', 'READY', 'FAILED'))
);

CREATE INDEX "idx_tenant_export_tenant_created"
  ON "tenant_export" ("tenant_id", "created_at" DESC);

CREATE UNIQUE INDEX "uq_tenant_export_idempotency"
  ON "tenant_export" ("tenant_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;

SELECT platform.enable_tenant_rls('tenant_export');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "tenant_export" TO app_user;
