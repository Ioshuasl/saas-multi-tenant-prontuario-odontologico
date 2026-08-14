-- Sprint 5 Bloco 1: orçamentos/planos + fatia billing (título/parcelas/produção)
-- docs/07 §6–§7 · S5 (number por tenant; treatment_item sem IN_PROGRESS)

ALTER TABLE "public_booking_token"
  DROP CONSTRAINT IF EXISTS "public_booking_token_purpose_check";

ALTER TABLE "public_booking_token"
  ADD CONSTRAINT "public_booking_token_purpose_check"
  CHECK ("purpose" IN ('BOOKING', 'CONFIRMATION', 'WAITLIST_OFFER', 'ANAMNESIS', 'QUOTE'));

ALTER TABLE "appointment"
  ADD COLUMN IF NOT EXISTS "treatment_item_id" UUID;

CREATE TABLE "quote_number_counter" (
  "tenant_id" UUID NOT NULL,
  "last_number" BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT "quote_number_counter_pkey" PRIMARY KEY ("tenant_id"),
  CONSTRAINT "quote_number_counter_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "quote" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "professional_id" UUID NOT NULL,
  "number" BIGINT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "subtotal_cents" BIGINT NOT NULL DEFAULT 0,
  "discount_cents" BIGINT NOT NULL DEFAULT 0,
  "total_cents" BIGINT NOT NULL DEFAULT 0,
  "valid_until" DATE,
  "notes" TEXT,
  "sent_at" TIMESTAMPTZ,
  "decided_at" TIMESTAMPTZ,
  "decided_by" TEXT,
  "reject_reason" TEXT,
  "pdf_storage_key" TEXT,
  "idempotency_key" TEXT,
  "duplicated_from_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "quote_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "quote_unit_id_fkey"
    FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "quote_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "quote_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "quote_duplicated_from_id_fkey"
    FOREIGN KEY ("duplicated_from_id") REFERENCES "quote"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "quote_status_check"
    CHECK ("status" IN (
      'DRAFT',
      'SENT',
      'APPROVED',
      'PARTIALLY_APPROVED',
      'REJECTED',
      'EXPIRED',
      'CANCELLED'
    )),
  CONSTRAINT "quote_decided_by_check"
    CHECK ("decided_by" IS NULL OR "decided_by" IN ('USER', 'PATIENT_LINK')),
  CONSTRAINT "quote_totals_check"
    CHECK ("subtotal_cents" >= 0 AND "discount_cents" >= 0 AND "total_cents" >= 0)
);

CREATE UNIQUE INDEX "uq_quote_tenant_number" ON "quote" ("tenant_id", "number");
CREATE UNIQUE INDEX "uq_quote_idempotency"
  ON "quote" ("tenant_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;
CREATE INDEX "idx_quote_patient"
  ON "quote" ("tenant_id", "patient_id", "created_at" DESC);

CREATE TABLE "quote_item" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "quote_id" UUID NOT NULL,
  "procedure_id" UUID NOT NULL,
  "tooth_code" TEXT,
  "face" TEXT,
  "quantity" SMALLINT NOT NULL DEFAULT 1,
  "unit_price_cents" BIGINT NOT NULL,
  "discount_cents" BIGINT NOT NULL DEFAULT 0,
  "total_cents" BIGINT NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT "quote_item_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "quote_item_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "quote_item_quote_id_fkey"
    FOREIGN KEY ("quote_id") REFERENCES "quote"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "quote_item_procedure_id_fkey"
    FOREIGN KEY ("procedure_id") REFERENCES "procedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "quote_item_quantity_check" CHECK ("quantity" >= 1),
  CONSTRAINT "quote_item_cents_check"
    CHECK ("unit_price_cents" >= 0 AND "discount_cents" >= 0 AND "total_cents" >= 0)
);

CREATE INDEX "idx_quote_item_quote" ON "quote_item" ("tenant_id", "quote_id", "sort_order");

CREATE TABLE "treatment_plan" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "quote_id" UUID,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ,
  CONSTRAINT "treatment_plan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "treatment_plan_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "treatment_plan_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "treatment_plan_quote_id_fkey"
    FOREIGN KEY ("quote_id") REFERENCES "quote"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "treatment_plan_status_check"
    CHECK ("status" IN ('ACTIVE', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX "idx_treatment_plan_patient"
  ON "treatment_plan" ("tenant_id", "patient_id", "status");

CREATE TABLE "treatment_item" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "treatment_plan_id" UUID NOT NULL,
  "procedure_id" UUID NOT NULL,
  "quote_item_id" UUID,
  "tooth_code" TEXT,
  "face" TEXT,
  "price_cents" BIGINT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "professional_id" UUID,
  "executed_at" TIMESTAMPTZ,
  "clinical_note_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "treatment_item_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "treatment_item_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "treatment_item_plan_id_fkey"
    FOREIGN KEY ("treatment_plan_id") REFERENCES "treatment_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "treatment_item_procedure_id_fkey"
    FOREIGN KEY ("procedure_id") REFERENCES "procedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "treatment_item_quote_item_id_fkey"
    FOREIGN KEY ("quote_item_id") REFERENCES "quote_item"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "treatment_item_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "treatment_item_clinical_note_id_fkey"
    FOREIGN KEY ("clinical_note_id") REFERENCES "clinical_note"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "treatment_item_status_check"
    CHECK ("status" IN ('PLANNED', 'SCHEDULED', 'EXECUTED', 'CANCELLED')),
  CONSTRAINT "treatment_item_price_check" CHECK ("price_cents" >= 0)
);

CREATE INDEX "idx_treatment_item_status"
  ON "treatment_item" ("tenant_id", "treatment_plan_id", "status");

CREATE TABLE "financial_category" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "parent_id" UUID,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "financial_category_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "financial_category_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "financial_category_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "financial_category"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "financial_category_kind_check" CHECK ("kind" IN ('REVENUE', 'EXPENSE'))
);

CREATE UNIQUE INDEX "financial_category_tenant_id_name_kind_key"
  ON "financial_category" ("tenant_id", "name", "kind");

CREATE TABLE "receivable" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "quote_id" UUID,
  "treatment_plan_id" UUID,
  "total_cents" BIGINT NOT NULL,
  "installments" SMALLINT NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "category_id" UUID,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "receivable_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "receivable_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "receivable_unit_id_fkey"
    FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "receivable_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "receivable_quote_id_fkey"
    FOREIGN KEY ("quote_id") REFERENCES "quote"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "receivable_treatment_plan_id_fkey"
    FOREIGN KEY ("treatment_plan_id") REFERENCES "treatment_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "receivable_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "financial_category"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "receivable_status_check"
    CHECK ("status" IN ('OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELLED')),
  CONSTRAINT "receivable_total_check" CHECK ("total_cents" >= 0),
  CONSTRAINT "receivable_installments_check" CHECK ("installments" >= 1)
);

CREATE INDEX "idx_receivable_patient"
  ON "receivable" ("tenant_id", "patient_id", "status");

CREATE TABLE "installment" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "receivable_id" UUID NOT NULL,
  "number" SMALLINT NOT NULL,
  "due_date" DATE NOT NULL,
  "amount_cents" BIGINT NOT NULL,
  "paid_cents" BIGINT NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "paid_at" TIMESTAMPTZ,
  CONSTRAINT "installment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "installment_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "installment_receivable_id_fkey"
    FOREIGN KEY ("receivable_id") REFERENCES "receivable"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "installment_status_check"
    CHECK ("status" IN ('OPEN', 'PAID', 'OVERDUE', 'CANCELLED')),
  CONSTRAINT "installment_amount_check" CHECK ("amount_cents" >= 0 AND "paid_cents" >= 0)
);

CREATE UNIQUE INDEX "installment_tenant_id_receivable_id_number_key"
  ON "installment" ("tenant_id", "receivable_id", "number");
CREATE INDEX "idx_installment_due"
  ON "installment" ("tenant_id", "due_date")
  WHERE "status" IN ('OPEN', 'OVERDUE');

CREATE TABLE "production_entry" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "professional_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "treatment_item_id" UUID,
  "procedure_id" UUID NOT NULL,
  "amount_cents" BIGINT NOT NULL,
  "executed_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "production_entry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "production_entry_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "production_entry_unit_id_fkey"
    FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "production_entry_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "production_entry_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "production_entry_treatment_item_id_fkey"
    FOREIGN KEY ("treatment_item_id") REFERENCES "treatment_item"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "production_entry_procedure_id_fkey"
    FOREIGN KEY ("procedure_id") REFERENCES "procedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "production_entry_amount_check" CHECK ("amount_cents" >= 0)
);

CREATE INDEX "idx_production_period"
  ON "production_entry" ("tenant_id", "professional_id", "executed_at");

SELECT platform.enable_tenant_rls('quote_number_counter');
SELECT platform.enable_tenant_rls('quote');
SELECT platform.enable_tenant_rls('quote_item');
SELECT platform.enable_tenant_rls('treatment_plan');
SELECT platform.enable_tenant_rls('treatment_item');
SELECT platform.enable_tenant_rls('financial_category');
SELECT platform.enable_tenant_rls('receivable');
SELECT platform.enable_tenant_rls('installment');
SELECT platform.enable_tenant_rls('production_entry');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "quote_number_counter",
  "quote",
  "quote_item",
  "treatment_plan",
  "treatment_item",
  "financial_category",
  "receivable",
  "installment",
  "production_entry"
TO app_user;
