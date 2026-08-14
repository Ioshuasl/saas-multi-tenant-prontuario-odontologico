-- S6 Bloco 1: payment/splits, crédito, AP, caixa, counter de recibo, PARTIALLY_PAID, RLS.

ALTER TABLE "patient"
  ADD COLUMN "has_overdue" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "installment" DROP CONSTRAINT "installment_status_check";
ALTER TABLE "installment"
  ADD CONSTRAINT "installment_status_check"
  CHECK ("status" IN ('OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'));

DROP INDEX "idx_installment_due";
CREATE INDEX "idx_installment_due"
  ON "installment" ("tenant_id", "due_date")
  WHERE "status" IN ('OPEN', 'PARTIALLY_PAID', 'OVERDUE');

CREATE TABLE "receipt_number_counter" (
  "tenant_id" UUID NOT NULL,
  "last_number" BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT "receipt_number_counter_pkey" PRIMARY KEY ("tenant_id"),
  CONSTRAINT "receipt_number_counter_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "cash_session" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "opened_by" UUID NOT NULL,
  "opened_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "opening_cents" BIGINT NOT NULL DEFAULT 0,
  "opening_by_method" JSONB,
  "closed_by" UUID,
  "closed_at" TIMESTAMPTZ,
  "counted_cents" BIGINT,
  "expected_cents" BIGINT,
  "difference_cents" BIGINT,
  "counted_by_method" JSONB,
  "expected_by_method" JSONB,
  "difference_reason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  CONSTRAINT "cash_session_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cash_session_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "cash_session_unit_id_fkey"
    FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "cash_session_status_check" CHECK ("status" IN ('OPEN', 'CLOSED')),
  CONSTRAINT "cash_session_opening_check" CHECK ("opening_cents" >= 0)
);

CREATE UNIQUE INDEX "uq_cash_session_open"
  ON "cash_session" ("tenant_id", "unit_id", "opened_by")
  WHERE "status" = 'OPEN';

CREATE TABLE "payment" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "installment_id" UUID NOT NULL,
  "cash_session_id" UUID,
  "amount_cents" BIGINT NOT NULL,
  "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "received_by" UUID NOT NULL,
  "reversed_at" TIMESTAMPTZ,
  "reversal_reason" TEXT,
  "reversed_by" UUID,
  "receipt_number" BIGINT NOT NULL,
  "notes" TEXT,
  "idempotency_key" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payment_unit_id_fkey"
    FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payment_installment_id_fkey"
    FOREIGN KEY ("installment_id") REFERENCES "installment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payment_cash_session_id_fkey"
    FOREIGN KEY ("cash_session_id") REFERENCES "cash_session"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "payment_amount_check" CHECK ("amount_cents" > 0)
);

CREATE UNIQUE INDEX "uq_payment_receipt"
  ON "payment" ("tenant_id", "receipt_number");
CREATE UNIQUE INDEX "uq_payment_idempotency"
  ON "payment" ("tenant_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;
CREATE INDEX "idx_payment_period"
  ON "payment" ("tenant_id", "unit_id", "received_at");
CREATE INDEX "idx_payment_installment"
  ON "payment" ("tenant_id", "installment_id");

CREATE TABLE "payment_split" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "payment_id" UUID NOT NULL,
  "method" TEXT NOT NULL,
  "amount_cents" BIGINT NOT NULL,
  "card_brand" TEXT,
  "installments_qty" SMALLINT,
  CONSTRAINT "payment_split_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_split_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payment_split_payment_id_fkey"
    FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "payment_split_method_check"
    CHECK ("method" IN (
      'CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'PIX', 'BANK_TRANSFER', 'CHECK', 'INSURANCE', 'PATIENT_CREDIT'
    )),
  CONSTRAINT "payment_split_amount_check" CHECK ("amount_cents" > 0)
);

CREATE INDEX "idx_payment_split_payment"
  ON "payment_split" ("tenant_id", "payment_id");

CREATE TABLE "patient_credit_ledger" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "payment_id" UUID,
  "amount_cents" BIGINT NOT NULL,
  "kind" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "patient_credit_ledger_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "patient_credit_ledger_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "patient_credit_ledger_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "patient_credit_ledger_payment_id_fkey"
    FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "patient_credit_ledger_kind_check"
    CHECK ("kind" IN ('CREDIT', 'DEBIT', 'REVERSE')),
  CONSTRAINT "patient_credit_ledger_amount_check" CHECK ("amount_cents" <> 0)
);

CREATE INDEX "idx_patient_credit_ledger_patient"
  ON "patient_credit_ledger" ("tenant_id", "patient_id", "created_at");

CREATE TABLE "payable" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "category_id" UUID,
  "supplier" TEXT,
  "description" TEXT NOT NULL,
  "amount_cents" BIGINT NOT NULL,
  "due_date" DATE NOT NULL,
  "paid_at" TIMESTAMPTZ,
  "paid_cents" BIGINT,
  "method" TEXT,
  "recurrence" JSONB,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payable_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payable_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payable_unit_id_fkey"
    FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payable_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "financial_category"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "payable_status_check"
    CHECK ("status" IN ('OPEN', 'PAID', 'OVERDUE', 'CANCELLED')),
  CONSTRAINT "payable_amount_check" CHECK ("amount_cents" > 0),
  CONSTRAINT "payable_method_check"
    CHECK (
      "method" IS NULL OR "method" IN (
        'CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'PIX', 'BANK_TRANSFER', 'CHECK', 'INSURANCE', 'PATIENT_CREDIT'
      )
    )
);

CREATE INDEX "idx_payable_due"
  ON "payable" ("tenant_id", "due_date", "status");

CREATE TABLE "cash_movement" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "cash_session_id" UUID NOT NULL,
  "kind" TEXT NOT NULL,
  "amount_cents" BIGINT NOT NULL,
  "method" TEXT NOT NULL,
  "payment_id" UUID,
  "description" TEXT,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cash_movement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cash_movement_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "cash_movement_cash_session_id_fkey"
    FOREIGN KEY ("cash_session_id") REFERENCES "cash_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "cash_movement_payment_id_fkey"
    FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "cash_movement_kind_check"
    CHECK ("kind" IN ('SUPPLY', 'WITHDRAWAL', 'PAYMENT_IN', 'PAYMENT_OUT')),
  CONSTRAINT "cash_movement_method_check"
    CHECK ("method" IN (
      'CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'PIX', 'BANK_TRANSFER', 'CHECK', 'INSURANCE', 'PATIENT_CREDIT'
    )),
  CONSTRAINT "cash_movement_amount_check" CHECK ("amount_cents" > 0)
);

CREATE INDEX "idx_cash_movement_session"
  ON "cash_movement" ("tenant_id", "cash_session_id", "created_at");

SELECT platform.enable_tenant_rls('receipt_number_counter');
SELECT platform.enable_tenant_rls('cash_session');
SELECT platform.enable_tenant_rls('payment');
SELECT platform.enable_tenant_rls('payment_split');
SELECT platform.enable_tenant_rls('patient_credit_ledger');
SELECT platform.enable_tenant_rls('payable');
SELECT platform.enable_tenant_rls('cash_movement');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "receipt_number_counter",
  "cash_session",
  "payment",
  "payment_split",
  "patient_credit_ledger",
  "payable",
  "cash_movement"
TO app_user;
