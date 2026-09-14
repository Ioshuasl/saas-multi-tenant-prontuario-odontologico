-- S7 Bloco 5: plan (global) / subscription / usage_counter + RLS + seed + backfill

CREATE TABLE "plan" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price_cents" BIGINT NOT NULL,
  "interval" TEXT NOT NULL DEFAULT 'MONTHLY',
  "limits" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "plan_code_key" UNIQUE ("code"),
  CONSTRAINT "plan_interval_check" CHECK ("interval" IN ('MONTHLY', 'YEARLY'))
);

CREATE TABLE "subscription" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "status" TEXT NOT NULL,
  "trial_ends_at" TIMESTAMPTZ,
  "current_period_end" TIMESTAMPTZ,
  "external_customer_id" TEXT,
  "external_subscription_id" TEXT,
  "cancel_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscription_tenant_id_key" UNIQUE ("tenant_id"),
  CONSTRAINT "subscription_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "subscription_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "subscription_status_check"
    CHECK ("status" IN ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'EXPIRED', 'CANCELLED'))
);

CREATE INDEX "idx_subscription_status_trial"
  ON "subscription" ("status", "trial_ends_at")
  WHERE "status" = 'TRIAL';

CREATE TABLE "usage_counter" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "metric" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "value" BIGINT NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usage_counter_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "usage_counter_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "usage_counter_tenant_metric_period_key" UNIQUE ("tenant_id", "metric", "period")
);

CREATE INDEX "idx_usage_counter_tenant"
  ON "usage_counter" ("tenant_id", "metric");

SELECT platform.enable_tenant_rls('subscription');
SELECT platform.enable_tenant_rls('usage_counter');

GRANT SELECT ON TABLE "plan" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "subscription" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "usage_counter" TO app_user;

-- Seed planos Essencial / Clínica / Rede (docs/modulos/10-billing-saas.md §2)
INSERT INTO "plan" ("id", "code", "name", "price_cents", "interval", "limits", "active") VALUES
  (
    'a1000000-0000-4000-8000-000000000001',
    'ESSENCIAL',
    'Essencial',
    9900,
    'MONTHLY',
    '{"professionals":1,"adminUsers":2,"units":1,"storageGb":5,"messagesMonth":null}'::jsonb,
    true
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'CLINICA',
    'Clínica',
    19900,
    'MONTHLY',
    '{"professionals":5,"adminUsers":6,"units":1,"storageGb":25,"messagesMonth":null}'::jsonb,
    true
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'REDE',
    'Rede',
    39900,
    'MONTHLY',
    '{"professionals":null,"adminUsers":null,"units":5,"storageGb":100,"messagesMonth":null}'::jsonb,
    true
  );

-- Backfill: subscription TRIAL no plano Essencial para tenants existentes sem assinatura
INSERT INTO "subscription" (
  "id",
  "tenant_id",
  "plan_id",
  "status",
  "trial_ends_at",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  t."id",
  'a1000000-0000-4000-8000-000000000001',
  CASE
    WHEN t."status" IN ('ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED') THEN t."status"
    ELSE 'TRIAL'
  END,
  t."trial_ends_at",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "tenant" t
WHERE NOT EXISTS (
  SELECT 1 FROM "subscription" s WHERE s."tenant_id" = t."id"
);
