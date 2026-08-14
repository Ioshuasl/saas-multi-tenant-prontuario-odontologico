ALTER TABLE "payable"
  ADD COLUMN "pay_idempotency_key" TEXT;

CREATE UNIQUE INDEX "uq_payable_pay_idempotency"
  ON "payable" ("tenant_id", "pay_idempotency_key")
  WHERE "pay_idempotency_key" IS NOT NULL;
